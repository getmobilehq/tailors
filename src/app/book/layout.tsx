import Link from 'next/link'

export default function BookLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="border-b bg-white">
        <div className="container h-16 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">✂️</span>
            <span className="font-bold text-xl">TailorSpace</span>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 container py-8">
        {children}
      </main>
    </div>
  )
}
