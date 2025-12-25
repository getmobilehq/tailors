import { NextRequest, NextResponse } from 'next/server'
import { sendOrderConfirmation, sendOrderStatusUpdate } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    // Security: Verify request is from authorized source
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.EMAIL_API_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, data } = body

    // Validate required fields
    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type, data' },
        { status: 400 }
      )
    }

    let result

    switch (type) {
      case 'order_confirmation':
        // Validate order confirmation data
        if (!data.to || !data.customerName || !data.orderNumber || !data.orderTotal || typeof data.itemCount !== 'number') {
          return NextResponse.json(
            { error: 'Missing required fields for order confirmation' },
            { status: 400 }
          )
        }
        result = await sendOrderConfirmation(data)
        break

      case 'order_status_update':
        // Validate status update data
        if (!data.to || !data.customerName || !data.orderNumber || !data.status) {
          return NextResponse.json(
            { error: 'Missing required fields for status update' },
            { status: 400 }
          )
        }
        result = await sendOrderStatusUpdate(data)
        break

      default:
        return NextResponse.json(
          { error: `Unknown email type: ${type}` },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      data: result.data,
    })

  } catch (error: any) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
