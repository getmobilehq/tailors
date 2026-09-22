import { describe, it, expect, vi, beforeEach } from 'vitest'

// The Resend SDK resolves with { data, error } instead of throwing, so these
// tests drive the mocked send() through both shapes.
const { send } = vi.hoisted(() => ({ send: vi.fn() }))
vi.mock('resend', () => ({
  Resend: class {
    emails = { send }
  },
}))

// The templates are JSX, which vitest can't parse under tsconfig's
// "jsx": "preserve". Rendered HTML doesn't matter to these tests.
vi.mock('@react-email/render', () => ({ render: async () => '<html></html>' }))
vi.mock('@/emails/order-confirmation', () => ({ default: () => null }))
vi.mock('@/emails/order-status-update', () => ({ default: () => null }))
vi.mock('@/emails/cart-reminder-1', () => ({ default: () => null }))
vi.mock('@/emails/cart-reminder-2', () => ({ default: () => null }))
vi.mock('@/emails/cart-reminder-3', () => ({ default: () => null }))

import { sendVerificationEmail, sendCartReminder } from '@/lib/email'

beforeEach(() => {
  send.mockReset()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('sendVerificationEmail', () => {
  it('reports success when Resend accepts the email', async () => {
    send.mockResolvedValue({ data: { id: 'email_123' }, error: null })

    const result = await sendVerificationEmail('a@example.com', 'Ada', '123456')

    expect(result).toEqual({ success: true, data: { id: 'email_123' } })
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'a@example.com', html: expect.stringContaining('123456') })
    )
  })

  it('reports failure when Resend resolves with an error instead of throwing', async () => {
    const error = { name: 'rate_limit_exceeded', statusCode: 429, message: 'Too many requests' }
    send.mockResolvedValue({ data: null, error })

    const result = await sendVerificationEmail('a@example.com', 'Ada', '123456')

    expect(result).toEqual({ success: false, error })
  })

  it('reports failure when the request itself throws', async () => {
    send.mockRejectedValue(new Error('network down'))

    const result = await sendVerificationEmail('a@example.com', 'Ada', '123456')

    expect(result.success).toBe(false)
  })
})

describe('sendCartReminder', () => {
  it('reports failure on a Resend error so the cron does not record the reminder as sent', async () => {
    send.mockResolvedValue({
      data: null,
      error: { name: 'validation_error', statusCode: 422, message: 'Recipient suppressed' },
    })

    const result = await sendCartReminder({
      to: 'a@example.com',
      customerName: 'Ada',
      items: [{ serviceName: 'Hem', quantity: 1, price: 12 }],
      subtotal: '£12.00',
      total: '£19.00',
      recoveryUrl: 'https://example.com/r',
      unsubscribeUrl: 'https://example.com/u',
      sequenceNumber: 1,
      reminderType: 'cart_abandonment',
    })

    expect(result.success).toBe(false)
  })
})
