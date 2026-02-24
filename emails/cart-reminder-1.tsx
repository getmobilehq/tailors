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

export default function CartReminder1({
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
          ? `Complete your TailorSpace order ${orderNumber}`
          : 'Your TailorSpace cart is waiting for you'}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {isPayment ? 'Complete Your Order' : 'Forgot Something?'}
          </Heading>

          <Text style={text}>Hi {customerName},</Text>

          <Text style={text}>
            {isPayment
              ? `You started placing order ${orderNumber} but didn't finish checkout. Your items are still waiting for you.`
              : 'Looks like you left some items in your TailorSpace cart. No worries — they\'re still there waiting for you.'}
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
            {isPayment ? 'Complete Your Order' : 'Return to Your Cart'}
          </Button>

          <Section style={valueSection}>
            <Heading as="h2" style={h2}>Why TailorSpace?</Heading>
            <Text style={valueText}>Expert alterations from the comfort of your home</Text>
            <Text style={valueText}>Convenient pickup and delivery in Nottingham</Text>
            <Text style={valueText}>Track every step of your order</Text>
          </Section>

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

const h2 = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '600' as const,
  margin: '0 0 12px',
  padding: '0',
}

const text = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
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

const valueSection = {
  margin: '32px 0',
}

const valueText = {
  color: '#525252',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '6px 0',
  paddingLeft: '8px',
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
