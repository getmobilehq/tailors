import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl">✂️</span>
          <span className="font-bold text-xl">TailorSpace</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/pricing" className="text-sm hover:text-primary transition-colors">
            Pricing
          </Link>
          <Link href="/how-it-works" className="text-sm hover:text-primary transition-colors">
            How it Works
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/book">Book Now</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
