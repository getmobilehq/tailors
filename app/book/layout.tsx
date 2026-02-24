import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CartSyncProvider } from '@/components/providers/cart-sync-provider'

export default function BookLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />

      <main className="flex-1 container py-8">
        <CartSyncProvider>
          {children}
        </CartSyncProvider>
      </main>

      <Footer />
    </div>
  )
}
