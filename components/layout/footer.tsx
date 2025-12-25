import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">✂️</span>
              <span className="font-bold text-lg">TailorSpace</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Expert alterations delivered to your door across Nottingham.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Services</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/pricing" className="hover:text-primary">All Services</Link></li>
              <li><Link href="/pricing#trousers" className="hover:text-primary">Trousers</Link></li>
              <li><Link href="/pricing#dresses" className="hover:text-primary">Dresses</Link></li>
              <li><Link href="/pricing#repairs" className="hover:text-primary">Repairs</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/how-it-works" className="hover:text-primary">How it Works</Link></li>
              <li><Link href="/about" className="hover:text-primary">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/terms" className="hover:text-primary">Terms</Link></li>
              <li><Link href="/privacy" className="hover:text-primary">Privacy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} TailorSpace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
