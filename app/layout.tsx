import type { Metadata } from "next"
import { Inter, DM_Sans } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { RecaptchaProvider } from "@/components/providers/recaptcha-provider"

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800']
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: '--font-dm-sans',
  weight: ['500', '600', '700']
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml', sizes: '512x512' }
    ],
    apple: { url: '/icon.svg', type: 'image/svg+xml' }
  },
  title: {
    default: "TailorSpace - Expert Alterations Delivered to Your Door | Nottingham",
    template: "%s | TailorSpace"
  },
  description: "Book clothing alterations online in Nottingham. Expert collection, professional tailoring, and delivery to your door. Fixed prices from £2. Just £7 pickup & delivery.",
  keywords: ["alterations", "tailoring", "Nottingham", "clothing repair", "hemming", "alterations near me", "suit alterations", "dress alterations", "trouser hemming"],
  authors: [{ name: "TailorSpace" }],
  creator: "TailorSpace",
  publisher: "TailorSpace",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: '/',
    title: "TailorSpace - Expert Alterations Delivered to Your Door",
    description: "Book clothing alterations online in Nottingham. Expert collection, professional tailoring, and delivery to your door. Fixed prices from £2.",
    siteName: 'TailorSpace',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TailorSpace - Expert Alterations Delivered to Your Door',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "TailorSpace - Expert Alterations Delivered",
    description: "Book clothing alterations online in Nottingham. Fixed prices from £2. Just £7 pickup & delivery.",
    images: ['/og-image.png'],
    creator: '@tailorspace',
  },
  alternates: {
    canonical: '/',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-HKL33SH9YP"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-HKL33SH9YP');`}
        </Script>
      </head>
      <body className={`${inter.variable} ${dmSans.variable} ${inter.className}`}>
        <RecaptchaProvider>
          {children}
          <Toaster />
        </RecaptchaProvider>
        <Script id="zoho-salesiq-init" strategy="lazyOnload">
          {`window.$zoho=window.$zoho || {};$zoho.salesiq=$zoho.salesiq||{ready:function(){
            $zoho.salesiq.floatbutton.color("#4F46E5");
            $zoho.salesiq.floatbutton.text("Chat with TailorSpace");
          }}`}
        </Script>
        <Script
          id="zsiqscript"
          src="https://salesiq.zohopublic.eu/widget?wc=siqf72c9b9b7997dab2e076bfe193a5ce12832353ce230f41ecd80e81b3e88dc242"
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}
