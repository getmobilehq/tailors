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

export async function sendVerificationEmail(to: string, name: string, otp: string) {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      replyTo: REPLY_TO,
      subject: 'Verify Your Email - TailorSpace',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Verify Your Email</h1>
          <p>Hi ${name},</p>
          <p>Thank you for signing up with TailorSpace! To complete your registration, please verify your email address using the code below:</p>

          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
            <h2 style="color: #333; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h2>
          </div>

          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't create an account with TailorSpace, please ignore this email.</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            This is an automated message from TailorSpace. Please do not reply to this email.
          </p>
        </div>
      `,
    })

    console.log('Verification email sent:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to send verification email:', error)
    return { success: false, error }
  }
}

export async function sendPasswordResetEmail(to: string, name: string, otp: string) {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      replyTo: REPLY_TO,
      subject: 'Reset Your Password - TailorSpace',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Reset Your Password</h1>
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Use the code below to reset your password:</p>

          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
            <h2 style="color: #333; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h2>
          </div>

          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            This is an automated message from TailorSpace. Please do not reply to this email.
          </p>
        </div>
      `,
    })

    console.log('Password reset email sent:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    return { success: false, error }
  }
}

export async function sendApplicationApprovalEmail(to: string, name: string, applicationType: 'runner' | 'tailor', tempPassword: string) {
  const roleTitle = applicationType === 'runner' ? 'Runner' : 'Tailor'

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      replyTo: REPLY_TO,
      subject: `Welcome to TailorSpace - ${roleTitle} Application Approved!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Congratulations, ${name}!</h1>
          <p>We're excited to inform you that your ${roleTitle.toLowerCase()} application has been approved!</p>

          <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 20px 0;">
            <h3 style="color: #15803d; margin-top: 0;">You're now part of the TailorSpace team!</h3>
            <p style="margin-bottom: 0;">Your account has been created and you can start accepting jobs right away.</p>
          </div>

          <h3 style="color: #333;">Your Account Details:</h3>
          <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Email:</strong> ${to}</p>
            <p style="margin: 8px 0;"><strong>Temporary Password:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
          </div>

          <p><strong>Next Steps:</strong></p>
          <ol style="line-height: 1.8;">
            <li>Log in to your account at <a href="${process.env.NEXT_PUBLIC_APP_URL}/login">${process.env.NEXT_PUBLIC_APP_URL}/login</a></li>
            <li>Change your password immediately after logging in</li>
            <li>${applicationType === 'runner' ? 'Start accepting pickup and delivery jobs' : 'Start receiving alteration jobs'}</li>
          </ol>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="background-color: #000; color: #fff; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Log In Now
            </a>
          </div>

          <p>If you have any questions, please don't hesitate to reach out to our team.</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            This is an automated message from TailorSpace. Please do not reply to this email.
          </p>
        </div>
      `,
    })

    console.log('Application approval email sent:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to send application approval email:', error)
    return { success: false, error }
  }
}

export async function sendApplicationRejectionEmail(to: string, name: string, applicationType: 'runner' | 'tailor', reason: string) {
  const roleTitle = applicationType === 'runner' ? 'Runner' : 'Tailor'

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      replyTo: REPLY_TO,
      subject: `Update on Your TailorSpace ${roleTitle} Application`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Thank You for Your Interest</h1>
          <p>Hi ${name},</p>
          <p>Thank you for applying to become a ${roleTitle.toLowerCase()} with TailorSpace. We appreciate the time and effort you put into your application.</p>

          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
            <p style="margin: 0;">Unfortunately, we're unable to approve your application at this time.</p>
          </div>

          <h3 style="color: #333;">Reason:</h3>
          <p style="background-color: #f5f5f5; padding: 16px; border-radius: 8px;">${reason}</p>

          <p>We encourage you to apply again in the future if circumstances change. We're always looking for talented individuals to join our network.</p>

          <p>If you have any questions about this decision, please feel free to contact us.</p>

          <p>Best wishes,<br/>The TailorSpace Team</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            This is an automated message from TailorSpace. Please do not reply to this email.
          </p>
        </div>
      `,
    })

    console.log('Application rejection email sent:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to send application rejection email:', error)
    return { success: false, error }
  }
}
