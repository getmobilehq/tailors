'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Payment {
  id: string
  order_id: string
  amount: number
  status: string
  created_at: string
  order: {
    users: {
      full_name: string
      email: string
    }
  }
}

function RefundContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const paymentId = searchParams.get('id')

  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [reason, setReason] = useState('')
  const [isPartialRefund, setIsPartialRefund] = useState(false)

  useEffect(() => {
    if (paymentId) {
      loadPayment()
    }
  }, [paymentId])

  async function loadPayment() {
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          order:orders!inner(
            users!inner(
              full_name,
              email
            )
          )
        `)
        .eq('id', paymentId)
        .single()

      if (error) throw error

      setPayment(data)
      setRefundAmount((data.amount / 100).toFixed(2))
    } catch (error) {
      console.error('Error loading payment:', error)
      toast.error('Failed to load payment details')
    } finally {
      setLoading(false)
    }
  }

  async function handleRefund(e: React.FormEvent) {
    e.preventDefault()

    if (!payment) return

    const amountInPounds = parseFloat(refundAmount)
    if (isNaN(amountInPounds) || amountInPounds <= 0) {
      toast.error('Please enter a valid refund amount')
      return
    }

    if (amountInPounds > payment.amount / 100) {
      toast.error('Refund amount cannot exceed payment amount')
      return
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for the refund')
      return
    }

    setProcessing(true)

    try {
      const response = await fetch('/api/admin/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: payment.id,
          amount: isPartialRefund ? amountInPounds : null,
          reason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process refund')
      }

      toast.success('Refund processed successfully')
      router.push('/admin/payments')
    } catch (error: any) {
      console.error('Refund error:', error)
      toast.error(error.message || 'Failed to process refund')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <p className="text-center text-muted-foreground">Loading payment details...</p>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Payment not found</p>
            <div className="mt-4 text-center">
              <Link href="/admin/payments">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Payments
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (payment.status !== 'succeeded') {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-600 mb-4">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-medium">Cannot refund this payment</p>
            </div>
            <p className="text-muted-foreground mb-4">
              Only successful payments can be refunded. This payment has status: <strong>{payment.status}</strong>
            </p>
            <Link href="/admin/payments">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Payments
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-6">
        <Link href="/admin/payments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payments
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Process Refund</CardTitle>
          <CardDescription>Refund payment to customer via Stripe</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium mb-3">Payment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">{payment.order?.users?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span>{payment.order?.users?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Amount:</span>
                <span className="font-medium">£{(payment.amount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Date:</span>
                <span>{format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID:</span>
                <code className="text-xs bg-white px-2 py-1 rounded">
                  {payment.order_id.slice(0, 8)}...
                </code>
              </div>
            </div>
          </div>

          <form onSubmit={handleRefund} className="space-y-6">
            {/* Refund Type */}
            <div className="space-y-3">
              <Label>Refund Type</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={!isPartialRefund ? 'default' : 'outline'}
                  onClick={() => {
                    setIsPartialRefund(false)
                    setRefundAmount((payment.amount / 100).toFixed(2))
                  }}
                >
                  Full Refund
                </Button>
                <Button
                  type="button"
                  variant={isPartialRefund ? 'default' : 'outline'}
                  onClick={() => setIsPartialRefund(true)}
                >
                  Partial Refund
                </Button>
              </div>
            </div>

            {/* Refund Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Refund Amount (£)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={(payment.amount / 100).toFixed(2)}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                disabled={!isPartialRefund}
                required
              />
              <p className="text-xs text-muted-foreground">
                Maximum: £{(payment.amount / 100).toFixed(2)}
              </p>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Refund *</Label>
              <Textarea
                id="reason"
                placeholder="Explain why this refund is being processed..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                This will be recorded in the payment metadata
              </p>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 mb-1">Important</p>
                  <p className="text-yellow-700">
                    This action will immediately process a refund through Stripe.
                    {!isPartialRefund && ' The associated order will be marked as cancelled.'}
                    {' '}This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={processing}
                className="flex-1"
              >
                {processing ? 'Processing...' : `Refund £${refundAmount}`}
              </Button>
              <Link href="/admin/payments">
                <Button type="button" variant="outline" disabled={processing}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RefundPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto p-8">
        <p className="text-center text-muted-foreground">Loading...</p>
      </div>
    }>
      <RefundContent />
    </Suspense>
  )
}
