'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Package, Settings, Bell } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/settlements', label: 'Settlements', icon: Package },
  { href: '/dashboard/jobs', label: 'Jobs', icon: Settings },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-glow">
              <Package className="h-5 w-5 text-background" />
            </div>
            <span className="text-xl font-bold text-sidebar-foreground">
              Clever<span className="text-lime-glow">Books</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-lime-glow/10 text-lime-glow'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-lime-glow/20 flex items-center justify-center">
              <span className="text-xs font-medium text-lime-glow">CB</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">Admin User</p>
              <p className="text-xs text-muted-foreground truncate">admin@cleverbooks.com</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
