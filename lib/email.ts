import { Resend } from 'resend'
import { render } from '@react-email/render'
import OrderConfirmationEmail from '@/emails/order-confirmation'
import OrderStatusUpdateEmail from '@/emails/order-status-update'

// Initialize Resend (will use RESEND_API_KEY from env)
const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'TailorSpace <orders@send.tailorspace.uk>'
const REPLY_TO = 'support@send.tailorspace.uk'

interface OrderConfirmationData {
  to: string
  customerName: string
  orderNumber: string
  orderTotal: string
  pickupDate?: string
  pickupTime?: string
  itemCount: number
}

interface OrderStatusUpdateData {
  to: string
  customerName: string
  orderNumber: string
  status: string
  statusMessage?: string
  statusEmoji?: string
  nextStep?: string
}

export async function sendOrderConfirmation(data: OrderConfirmationData) {
  try {
    const emailHtml = await render(
      OrderConfirmationEmail({
        customerName: data.customerName,
        orderNumber: data.orderNumber,
        orderTotal: data.orderTotal,
        pickupDate: data.pickupDate,
        pickupTime: data.pickupTime,
        itemCount: data.itemCount,
      })
    )

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      replyTo: REPLY_TO,
      subject: `Order Confirmed - ${data.orderNumber}`,
      html: emailHtml,
    })

    console.log('Order confirmation email sent:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to send order confirmation email:', error)
    return { success: false, error }
  }
}

export async function sendOrderStatusUpdate(data: OrderStatusUpdateData) {
  try {
    const emailHtml = await render(
      OrderStatusUpdateEmail({
        customerName: data.customerName,
        orderNumber: data.orderNumber,
        status: data.status,
        statusMessage: data.statusMessage || '',
        statusEmoji: data.statusEmoji || '',
        nextStep: data.nextStep,
      })
    )

    // Get subject from email template based on status
    const statusSubjects: Record<string, string> = {
      pickup_scheduled: 'Runner Assigned',
      collected: 'Items Collected',
      in_progress: 'Work Started',
      ready: 'Ready for Delivery',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      completed: 'Order Complete',
    }

    const subject = statusSubjects[data.status] || 'Order Update'

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      replyTo: REPLY_TO,
      subject: `${subject} - ${data.orderNumber}`,
      html: emailHtml,
    })

    console.log('Order status update email sent:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to send order status update email:', error)
    return { success: false, error }
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      replyTo: REPLY_TO,
      subject: 'Welcome to TailorSpace!',
      html: `
        <h1>Welcome to TailorSpace, ${name}!</h1>
        <p>We're excited to have you on board. TailorSpace makes clothing alterations simple and convenient.</p>
        <p>Here's what you can do:</p>
        <ul>
          <li>Book alterations from the comfort of your home</li>
          <li>Get your items collected and delivered</li>
          <li>Track your order every step of the way</li>
        </ul>
        <p>Ready to get started? <a href="${process.env.NEXT_PUBLIC_APP_URL}/book">Book your first alteration</a></p>
      `,
    })

    console.log('Welcome email sent:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    return { success: false, error }
  }
}
