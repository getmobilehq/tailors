import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container h-16 flex items-center">
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/logos/tailorspace-icon-final.svg"
              alt="TailorSpace"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="font-bold text-xl" style={{ fontFamily: 'var(--font-dm-sans)' }}>TailorSpace</span>
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
