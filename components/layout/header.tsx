'use client'

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
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from './notification-bell'
import { CartButton } from './cart-button'
import { User, LogOut, Package, Settings, Scissors, ShieldCheck } from 'lucide-react'

export function Header() {
  const { user, loading } = useUser()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
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

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-10 w-24 animate-pulse bg-muted rounded-md" />
          ) : user ? (
            <>
              <Button variant="default" asChild>
                <Link href="/book">Book Now</Link>
              </Button>

              <CartButton />
              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
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
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/book">Book Now</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
