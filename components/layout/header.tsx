'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from './notification-bell'
import { CartButton } from './cart-button'
import { User, LogOut, Package, Settings, Scissors, ShieldCheck, Menu } from 'lucide-react'

export function Header() {
  const { user, loading } = useUser()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/pricing" className="text-sm hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/how-it-works" className="text-sm hover:text-primary transition-colors">
              How it Works
            </Link>
            {user && (
              <Link href="/orders" className="text-sm hover:text-primary transition-colors font-medium">
                My Orders
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle style={{ fontFamily: 'var(--font-dm-sans)' }}>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                <Link
                  href="/pricing"
                  className="text-lg hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  href="/how-it-works"
                  className="text-lg hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How it Works
                </Link>
                {user && (
                  <>
                    <Link
                      href="/orders"
                      className="text-lg hover:text-primary transition-colors py-2 font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Orders
                    </Link>
                    <Link
                      href="/settings"
                      className="text-lg hover:text-primary transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    {user.role === 'runner' && (
                      <Link
                        href="/runner"
                        className="text-lg hover:text-primary transition-colors py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Runner Dashboard
                      </Link>
                    )}
                    {user.role === 'tailor' && (
                      <Link
                        href="/tailor"
                        className="text-lg hover:text-primary transition-colors py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Tailor Dashboard
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="text-lg hover:text-primary transition-colors py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <div className="border-t pt-4 mt-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start text-lg"
                        onClick={() => {
                          handleLogout()
                          setMobileMenuOpen(false)
                        }}
                      >
                        <LogOut className="mr-2 h-5 w-5" />
                        Log Out
                      </Button>
                    </div>
                  </>
                )}
                {!user && !loading && (
                  <>
                    <div className="border-t pt-4 mt-2 space-y-3">
                      <Button
                        variant="outline"
                        asChild
                        className="w-full justify-center text-lg"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link href="/login">Sign In</Link>
                      </Button>
                      <Button
                        asChild
                        className="w-full justify-center text-lg"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link href="/book">Book Now</Link>
                      </Button>
                    </div>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          {loading ? (
            <div className="h-10 w-24 animate-pulse bg-muted rounded-md" />
          ) : user ? (
            <>
              <Button variant="default" asChild className="hidden sm:flex">
                <Link href="/book">Book Now</Link>
              </Button>

              <CartButton />
              <div className="hidden sm:block">
                <NotificationBell />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hidden md:flex">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.full_name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="cursor-pointer">
                      <Package className="mr-2 h-4 w-4" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'runner' && (
                    <DropdownMenuItem asChild>
                      <Link href="/runner" className="cursor-pointer">
                        <Scissors className="mr-2 h-4 w-4" />
                        Runner Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === 'tailor' && (
                    <DropdownMenuItem asChild>
                      <Link href="/tailor" className="cursor-pointer">
                        <Scissors className="mr-2 h-4 w-4" />
                        Tailor Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <CartButton />
              <Button variant="ghost" asChild className="hidden md:flex">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="hidden sm:flex">
                <Link href="/book">Book Now</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
