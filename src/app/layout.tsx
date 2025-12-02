import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TailorSpace - Expert Alterations Delivered to Your Door | Nottingham",
  description: "Book clothing alterations online in Nottingham. Expert collection, professional tailoring, and delivery to your door. Fixed prices from £2. Just £7 pickup & delivery.",
  keywords: ["alterations", "tailoring", "Nottingham", "clothing repair", "hemming", "alterations near me"],
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
