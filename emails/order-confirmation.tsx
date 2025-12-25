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

interface OrderConfirmationEmailProps {
  customerName: string
  orderNumber: string
  orderTotal: string
  pickupDate?: string
  pickupTime?: string
  itemCount: number
}

export default function OrderConfirmationEmail({
  customerName = 'Customer',
  orderNumber = 'TS250101',
  orderTotal = '£45.00',
  pickupDate,
  pickupTime,
  itemCount = 3,
}: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your TailorSpace order {orderNumber} has been confirmed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Order Confirmed! 🎉</Heading>

          <Text style={text}>Hi {customerName},</Text>

          <Text style={text}>
            Thank you for choosing TailorSpace! Your order has been confirmed and we're getting everything ready.
          </Text>

          <Section style={orderDetails}>
            <Text style={orderLabel}>Order Number</Text>
            <Text style={orderValue}>{orderNumber}</Text>

            <Hr style={hr} />

            <Text style={orderLabel}>Items</Text>
            <Text style={orderValue}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</Text>

            <Hr style={hr} />

            <Text style={orderLabel}>Total</Text>
            <Text style={orderValue}>{orderTotal}</Text>

            {pickupDate && pickupTime && (
              <>
                <Hr style={hr} />
                <Text style={orderLabel}>Scheduled Pickup</Text>
                <Text style={orderValue}>{pickupDate} at {pickupTime}</Text>
              </>
            )}
          </Section>

          <Section style={nextSteps}>
            <Heading as="h2" style={h2}>What happens next?</Heading>
            <Text style={stepText}>1. A runner will be assigned to your order</Text>
            <Text style={stepText}>2. They'll collect your items at the scheduled time</Text>
            <Text style={stepText}>3. Your measurements will be taken (if needed)</Text>
            <Text style={stepText}>4. Our expert tailors will work their magic</Text>
            <Text style={stepText}>5. Your items will be delivered back to you</Text>
          </Section>

          <Button
            href={`${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderNumber}`}
            style={button}
          >
            Track Your Order
          </Button>

          <Hr style={hr} />

          <Text style={footer}>
            You can track your order anytime at tailorspace.com or reply to this email if you have any questions.
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

const h1 = {
  color: '#1a1a1a',
  fontSize: '32px',
  fontWeight: '700',
  margin: '0 0 20px',
  padding: '0',
  lineHeight: '1.3',
}

const h2 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  margin: '30px 0 15px',
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
  padding: '24px',
  margin: '32px 0',
}

const orderLabel = {
  color: '#737373',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 4px',
}

const orderValue = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 16px',
}

const nextSteps = {
  margin: '32px 0',
}

const stepText = {
  color: '#525252',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '8px 0',
  paddingLeft: '8px',
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
  margin: '16px 0',
}

const footer = {
  color: '#737373',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
}
