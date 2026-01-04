'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Settings,
  DollarSign,
  Users,
  Package2,
  Star,
  Briefcase,
  BarChart3
} from 'lucide-react'

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: Package2 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/services', label: 'Services', icon: Briefcase },
  { href: '/admin/content', label: 'Content', icon: FileText },
  { href: '/admin/settings', label: 'Site Settings', icon: Settings },
  { href: '/admin/payments', label: 'Payments', icon: DollarSign },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

export function AdminSubNav() {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-muted/30 mb-6">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex space-x-6 overflow-x-auto">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-4 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
