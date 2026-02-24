import { createHmac } from 'crypto'

export function generateRecoveryToken(): string {
  return crypto.randomUUID()
}

export function buildRecoveryUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/recover?token=${token}`
}

export function buildUnsubscribeUrl(userId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const secret = process.env.CRON_SECRET || 'default-secret'
  const signature = createHmac('sha256', secret).update(userId).digest('hex')
  return `${baseUrl}/api/unsubscribe?uid=${userId}&sig=${signature}`
}

export function verifyUnsubscribeSignature(userId: string, signature: string): boolean {
  const secret = process.env.CRON_SECRET || 'default-secret'
  const expected = createHmac('sha256', secret).update(userId).digest('hex')
  return signature === expected
}
