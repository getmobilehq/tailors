import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container h-16 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">✂️</span>
            <span className="font-bold text-xl">TailorSpace</span>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4 bg-muted/30">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
    </div>
  )
}
