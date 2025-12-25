import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Terms of Service | TailorSpace',
  description: 'Terms of Service for TailorSpace clothing alterations marketplace in Nottingham.',
}

export default function TermsPage() {
  return (
    <div className="py-16 px-4">
      <div className="container max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                By accessing and using TailorSpace ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Service Description</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                TailorSpace is a marketplace platform that connects customers with professional tailors and runners in Nottingham, UK. We facilitate:
              </p>
              <ul>
                <li>Collection of garments from customers' homes</li>
                <li>Professional alteration services</li>
                <li>Delivery of completed alterations</li>
              </ul>
              <p>
                TailorSpace acts as an intermediary and is not responsible for the actual alteration work performed by tailors.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. User Accounts</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                To use our Service, you must:
              </p>
              <ul>
                <li>Be at least 18 years of age</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Promptly update your account information if it changes</li>
              </ul>
              <p>
                You are responsible for all activities that occur under your account.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Booking and Payment</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <ul>
                <li>All prices are displayed in British Pounds (GBP) and are inclusive of VAT where applicable</li>
                <li>Payment is processed securely through Stripe</li>
                <li>A flat delivery fee of £7.00 applies to all orders</li>
                <li>Payment is required at the time of booking</li>
                <li>Prices are as quoted on the website at the time of booking</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Cancellation and Refunds</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p><strong>Cancellation Policy:</strong></p>
              <ul>
                <li>Orders can be cancelled free of charge before collection</li>
                <li>Once items are collected, cancellations may incur a fee</li>
                <li>After work has commenced, no refunds will be issued</li>
              </ul>
              <p><strong>Refund Policy:</strong></p>
              <ul>
                <li>Refunds are issued to the original payment method within 5-10 business days</li>
                <li>If you're unsatisfied with the alteration, please contact us within 48 hours of delivery</li>
                <li>We will review complaints and offer remediation on a case-by-case basis</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Liability and Warranty</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                While we take every care with your garments:
              </p>
              <ul>
                <li>We are not liable for pre-existing damage or wear to garments</li>
                <li>Maximum liability is limited to the value of the alteration service paid</li>
                <li>We recommend declaring high-value items (over £500) prior to collection</li>
                <li>Customers should check items immediately upon delivery</li>
              </ul>
              <p>
                The Service is provided "as is" without warranty of any kind, either express or implied.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Service Area</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Our collection and delivery services are available in the following Nottingham postcodes: NG1, NG2, NG3, NG5, NG7, and NG9.
              </p>
              <p>
                We reserve the right to decline service to addresses outside our coverage area.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                All content on TailorSpace, including text, graphics, logos, and software, is the property of TailorSpace or its content suppliers and is protected by UK and international copyright laws.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Privacy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Your use of the Service is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through a prominent notice on our website. Continued use of the Service after changes constitutes acceptance of the modified terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Governing Law</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                These Terms shall be governed by and construed in accordance with the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>12. Contact</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <p>
                <strong>Email:</strong> legal@tailorspace.uk<br />
                <strong>Address:</strong> TailorSpace Ltd, Nottingham, UK
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
