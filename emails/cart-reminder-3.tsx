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
import type { CartReminderEmailProps } from '@/lib/types'

export default function CartReminder3({
  customerName = 'Customer',
  items = [],
  subtotal = '£0.00',
  total = '£0.00',
  recoveryUrl = '#',
  unsubscribeUrl = '#',
  reminderType = 'cart_abandonment',
  orderNumber,
}: CartReminderEmailProps) {
  const isPayment = reminderType === 'payment_abandonment'

  return (
    <Html>
      <Head />
      <Preview>
        {isPayment
          ? `Final reminder: complete your order ${orderNumber}`
          : 'Last chance: your TailorSpace cart expires soon'}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Last Chance to Book</Heading>

          <Text style={text}>Hi {customerName},</Text>

          <Text style={text}>
            {isPayment
              ? `This is a final reminder that your order ${orderNumber} is still waiting for payment. It will be automatically cancelled in a few days if left incomplete.`
              : 'Your saved cart will be cleared soon. If you still want these alterations, now is the time to complete your booking.'}
          </Text>

          <Section style={itemsSection}>
            <Text style={itemsHeader}>Your Items</Text>
            {items.map((item, i) => (
              <Text key={i} style={itemRow}>
                {item.serviceName} (x{item.quantity}) — £{item.price.toFixed(2)}
              </Text>
            ))}
            <Hr style={hr} />
            <Text style={totalRow}>Subtotal: {subtotal}</Text>
            <Text style={totalRow}>Delivery: £7.00</Text>
            <Text style={totalRowBold}>Total: {total}</Text>
          </Section>

          <Button href={recoveryUrl} style={button}>
            Complete Your Booking
          </Button>

          <Text style={softText}>
            If you've changed your mind, no worries at all. We'll be here whenever you need us.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            The TailorSpace Team
          </Text>

          <Text style={unsubscribe}>
            <a href={unsubscribeUrl} style={unsubscribeLink}>
              Unsubscribe from cart reminders
            </a>
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
  fontWeight: '700' as const,
  margin: '0 0 20px',
  padding: '0',
  lineHeight: '1.3',
}

const text = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const softText = {
  color: '#737373',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '24px 0',
  fontStyle: 'italic' as const,
}

const itemsSection = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
}

const itemsHeader = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600' as const,
  margin: '0 0 12px',
}

const itemRow = {
  color: '#525252',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '4px 0',
}

const totalRow = {
  color: '#525252',
  fontSize: '15px',
  margin: '4px 0',
}

const totalRowBold = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600' as const,
  margin: '4px 0',
}

const button = {
  backgroundColor: '#0070f3',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '14px 20px',
  margin: '24px 0',
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

const unsubscribe = {
  color: '#a3a3a3',
  fontSize: '12px',
  margin: '24px 0 0',
}

const unsubscribeLink = {
  color: '#a3a3a3',
  textDecoration: 'underline',
}
