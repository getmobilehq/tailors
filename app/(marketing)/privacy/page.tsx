import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Privacy Policy | TailorSpace',
  description: 'Privacy Policy for TailorSpace clothing alterations marketplace in Nottingham.',
}

export default function PrivacyPage() {
  return (
    <div className="py-16 px-4">
      <div className="container max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Introduction</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                TailorSpace ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our clothing alterations marketplace service.
              </p>
              <p>
                Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site or use our services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p><strong>Personal Information:</strong></p>
              <ul>
                <li>Name and contact information (email, phone number)</li>
                <li>Delivery and collection addresses</li>
                <li>Payment information (processed securely through Stripe)</li>
                <li>Account credentials (email and encrypted password)</li>
              </ul>
              <p><strong>Order Information:</strong></p>
              <ul>
                <li>Details of alterations requested</li>
                <li>Photos of garments (if provided)</li>
                <li>Measurement information</li>
                <li>Order history and preferences</li>
              </ul>
              <p><strong>Technical Information:</strong></p>
              <ul>
                <li>IP address and browser type</li>
                <li>Device information</li>
                <li>Cookies and usage data</li>
                <li>Access times and referring website addresses</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>We use the information we collect to:</p>
              <ul>
                <li>Process and fulfill your orders</li>
                <li>Communicate with you about your orders and services</li>
                <li>Coordinate collection and delivery of garments</li>
                <li>Process payments and prevent fraud</li>
                <li>Improve our services and customer experience</li>
                <li>Send you marketing communications (with your consent)</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes and enforce our agreements</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. How We Share Your Information</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>We may share your information with:</p>
              <p><strong>Service Providers:</strong></p>
              <ul>
                <li>Runners who collect and deliver your garments</li>
                <li>Tailors who perform alteration services</li>
                <li>Payment processors (Stripe) for transaction processing</li>
                <li>Email service providers (Resend) for communications</li>
              </ul>
              <p><strong>Legal Requirements:</strong></p>
              <ul>
                <li>When required by law or legal process</li>
                <li>To protect our rights, privacy, safety, or property</li>
                <li>In connection with a business transfer or acquisition</li>
              </ul>
              <p>
                We do not sell your personal information to third parties.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Data Storage and Security</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                We implement appropriate technical and organizational security measures to protect your personal information:
              </p>
              <ul>
                <li>Data is stored securely using Supabase (hosted on AWS)</li>
                <li>All data transmissions are encrypted using SSL/TLS</li>
                <li>Passwords are encrypted and never stored in plain text</li>
                <li>Access to personal data is restricted to authorized personnel only</li>
                <li>Regular security audits and updates are performed</li>
              </ul>
              <p>
                However, no method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Your Data Rights (UK GDPR)</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>Under UK GDPR, you have the following rights:</p>
              <ul>
                <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
                <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                <li><strong>Right to Restriction:</strong> Request restriction of processing</li>
                <li><strong>Right to Data Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Right to Object:</strong> Object to processing of your data</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for marketing communications</li>
              </ul>
              <p>
                To exercise any of these rights, please contact us at privacy@tailorspace.com.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>We retain your personal information for as long as necessary to:</p>
              <ul>
                <li>Provide our services to you</li>
                <li>Comply with legal obligations (typically 6 years for financial records)</li>
                <li>Resolve disputes and enforce agreements</li>
              </ul>
              <p>
                Order history and communications are retained for 7 years. Account information is retained while your account is active and for 1 year after closure.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Cookies and Tracking</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>We use cookies and similar technologies to:</p>
              <ul>
                <li>Maintain your session when logged in</li>
                <li>Remember your preferences</li>
                <li>Analyze site usage and improve our services</li>
              </ul>
              <p>
                You can control cookies through your browser settings. However, disabling cookies may affect your ability to use certain features of our service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Third-Party Services</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>Our service integrates with third-party services:</p>
              <ul>
                <li><strong>Stripe:</strong> Payment processing (see Stripe's privacy policy)</li>
                <li><strong>Supabase:</strong> Database and authentication (see Supabase's privacy policy)</li>
                <li><strong>Resend:</strong> Email delivery (see Resend's privacy policy)</li>
              </ul>
              <p>
                These third parties have their own privacy policies. We are not responsible for their practices.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If we learn that we have collected information from a child under 18, we will delete it promptly.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Changes to This Policy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                We may update this privacy policy from time to time. We will notify you of significant changes by:
              </p>
              <ul>
                <li>Posting the new privacy policy on this page</li>
                <li>Updating the "Last updated" date</li>
                <li>Sending an email notification for material changes</li>
              </ul>
              <p>
                We encourage you to review this privacy policy periodically.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>12. Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                If you have questions or concerns about this privacy policy or our data practices, please contact us:
              </p>
              <p>
                <strong>Email:</strong> privacy@tailorspace.com<br />
                <strong>Data Protection Officer:</strong> dpo@tailorspace.com<br />
                <strong>Address:</strong> TailorSpace Ltd, Nottingham, UK
              </p>
              <p>
                You also have the right to lodge a complaint with the UK Information Commissioner's Office (ICO) if you believe we have not complied with data protection laws.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
