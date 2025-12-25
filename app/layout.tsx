import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
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
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
