import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import * as Sentry from '@sentry/nextjs'

const resend = new Resend(process.env.RESEND_API_KEY)

// Delivery problems worth an alert. A 'delivered' event only means the
// receiving server accepted the message, so these are the only signal that a
// customer never got their email (e.g. a signup code).
const ALERT_LEVELS: Record<string, 'error' | 'warning'> = {
  'email.bounced': 'error',
  'email.failed': 'error',
  'email.complained': 'warning',
  'email.delivery_delayed': 'warning',
}

type ResendWebhookEvent = {
  type: string
  created_at: string
  data: {
    email_id?: string
    to?: string[]
    subject?: string
    bounce?: { type?: string; subType?: string; message?: string }
    failed?: { reason?: string }
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    // 500 so Resend retries and the failures show up in its dashboard
    console.error('RESEND_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const body = await req.text()

  let event: ResendWebhookEvent
  try {
    event = resend.webhooks.verify({
      payload: body,
      headers: {
        id: req.headers.get('svix-id') ?? '',
        timestamp: req.headers.get('svix-timestamp') ?? '',
        signature: req.headers.get('svix-signature') ?? '',
      },
      webhookSecret: secret,
    }) as ResendWebhookEvent
  } catch (err: any) {
    console.error('Resend webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const level = ALERT_LEVELS[event.type]
  if (!level) {
    return NextResponse.json({ received: true })
  }

  const { email_id, to, subject, bounce, failed } = event.data
  const recipient = to?.[0] ?? 'unknown'
  const reason = bounce?.message || failed?.reason || 'no reason given'

  console.error(`Resend ${event.type} for ${recipient} ("${subject}"): ${reason}`, {
    email_id,
    bounce,
  })

  // The address stays in the function logs; Sentry gets the Resend email id,
  // which finds the full record in the Resend dashboard.
  Sentry.captureMessage(`Resend ${event.type}: ${subject ?? 'email'}`, {
    level,
    tags: {
      resend_event: event.type,
      recipient_domain: recipient.split('@')[1] ?? 'unknown',
      bounce_type: bounce?.type,
    },
    extra: { email_id, reason, bounce_sub_type: bounce?.subType },
  })
  // Serverless functions can exit before the event is sent
  await Sentry.flush(2000)

  return NextResponse.json({ received: true })
}
