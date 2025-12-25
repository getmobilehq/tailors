import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Button,
} from '@react-email/components'

interface OrderStatusUpdateEmailProps {
  customerName: string
  orderNumber: string
  status: string
  statusMessage: string
  statusEmoji: string
  nextStep?: string
}

const statusDetails: Record<string, { subject: string; message: string; emoji: string; nextStep?: string }> = {
  pickup_scheduled: {
    subject: 'Runner assigned to your order',
    message: 'Great news! A runner has been assigned and will collect your items soon.',
    emoji: '🏃',
    nextStep: 'Your runner will arrive at the scheduled time to collect your items and take measurements if needed.',
  },
  collected: {
    subject: 'Items collected successfully',
    message: 'Your items have been collected and are on their way to our tailors.',
    emoji: '📦',
    nextStep: 'Our expert tailors will now begin working on your alterations.',
  },
  in_progress: {
    subject: 'Work has started on your order',
    message: 'Our tailors have started working on your items!',
    emoji: '✂️',
    nextStep: 'Your items are being carefully altered to your specifications.',
  },
  ready: {
    subject: 'Your order is ready for delivery',
    message: 'Good news! Your items are ready and will be delivered soon.',
    emoji: '✅',
    nextStep: 'A runner will deliver your items back to you shortly.',
  },
  out_for_delivery: {
    subject: 'Your order is out for delivery',
    message: 'Your items are on the way back to you!',
    emoji: '🚗',
    nextStep: 'Your runner will arrive soon with your beautifully altered items.',
  },
  delivered: {
    subject: 'Order delivered successfully',
    message: 'Your order has been delivered!',
    emoji: '🎉',
    nextStep: 'We hope you love your items! Please let us know how we did by leaving a review.',
  },
  completed: {
    subject: 'Order complete - Thank you!',
    message: 'Your order is complete. Thank you for choosing TailorSpace!',
    emoji: '⭐',
    nextStep: 'We'd love to hear your feedback. Please take a moment to rate your experience.',
  },
}

export default function OrderStatusUpdateEmail({
  customerName = 'Customer',
  orderNumber = 'TS250101',
  status = 'in_progress',
  statusMessage,
  statusEmoji,
  nextStep,
}: OrderStatusUpdateEmailProps) {
  const details = statusDetails[status] || {
    subject: 'Order update',
    message: statusMessage || 'Your order has been updated.',
    emoji: statusEmoji || '📋',
    nextStep,
  }

  return (
    <Html>
      <Head />
      <Preview>{details.subject} - Order {orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <div style={emojiContainer}>
            <Text style={emoji}>{details.emoji}</Text>
          </div>

          <Heading style={h1}>{details.subject}</Heading>

          <Text style={text}>Hi {customerName},</Text>

          <Text style={text}>{details.message}</Text>

          <Section style={orderDetails}>
            <Text style={orderLabel}>Order Number</Text>
            <Text style={orderValue}>{orderNumber}</Text>
          </Section>

          {details.nextStep && (
            <Section style={nextStepSection}>
              <Heading as="h2" style={h2}>What's next?</Heading>
              <Text style={text}>{details.nextStep}</Text>
            </Section>
          )}

          <Button
            href={`${process.env.NEXT_PUBLIC_APP_URL}/orders`}
            style={button}
          >
            View Order Details
          </Button>

          <Hr style={hr} />

          <Text style={footer}>
            Questions? Just reply to this email or visit your dashboard.
          </Text>

          <Text style={footer}>
            The TailorSpace Team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const emojiContainer = {
  textAlign: 'center' as const,
  margin: '0 0 24px',
}

const emoji = {
  fontSize: '64px',
  lineHeight: '1',
  margin: '0',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 20px',
  padding: '0',
  lineHeight: '1.3',
  textAlign: 'center' as const,
}

const h2 = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 12px',
  padding: '0',
}

const text = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const orderDetails = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const orderLabel = {
  color: '#737373',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 4px',
}

const orderValue = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0',
}

const nextStepSection = {
  margin: '24px 0',
  padding: '20px',
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  borderLeft: '4px solid #0070f3',
}

const button = {
  backgroundColor: '#0070f3',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '14px 20px',
  margin: '32px 0',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
}

const footer = {
  color: '#737373',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '12px 0',
  textAlign: 'center' as const,
}
