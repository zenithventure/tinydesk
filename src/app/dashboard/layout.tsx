"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Ticket, Settings, LayoutDashboard, LogOut, Menu, X, Package, PenSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/contexts/auth-context"

const ALL_NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/support", label: "Submit Ticket", icon: PenSquare },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading, isAuthenticated, isAdmin, isProductOwner, logout } = useAuth()

  const navItems = ALL_NAV_ITEMS.filter(
    (item) => !item.adminOrOwnerOnly || isAdmin || isProductOwner
  )
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  async function handleSignOut() {
    await logout()
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b h-14 flex items-center px-4 md:px-6 sticky top-0 z-50">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden mr-3 p-1 text-gray-600 hover:text-gray-900"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/dashboard" className="text-lg font-bold text-emerald-600">
          Tiny<span className="text-gray-900">Desk</span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm text-gray-600 hidden sm:inline">{user?.email}</span>
          <button onClick={handleSignOut} className="text-sm text-gray-500 hover:text-gray-700">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform duration-200 ease-in-out md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b">
          <span className="text-lg font-bold text-emerald-600">
            Tiny<span className="text-gray-900">Desk</span>
          </span>
          <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-gray-600 hover:text-gray-900" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition",
                  active ? "bg-emerald-50 text-emerald-700 font-medium" : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="flex">
        <aside className="w-56 bg-white border-r min-h-[calc(100vh-3.5rem)] p-4 hidden md:block">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition",
                    active ? "bg-emerald-50 text-emerald-700 font-medium" : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-5xl">
          {children}
        </main>
      </div>
    </div>
  )
}
