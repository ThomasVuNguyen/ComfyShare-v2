"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ReactNode } from "react"
import { useAuth } from "@/contexts/AuthContext"

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/papers/new", label: "New paper" },
  { href: "/papers/import", label: "Import from DOI" },
  { href: "/settings", label: "Settings" },
]

export const AppShell = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname()
  const { profile, signOutUser } = useAuth()

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-neutral-900">
            Writebook
          </Link>
          <nav className="hidden gap-4 md:flex">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    isActive ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="flex items-center gap-3">
            <div className="text-sm text-neutral-600">
              <p className="font-semibold">{profile?.name ?? "Researcher"}</p>
              <p className="text-xs">{profile?.emailAddress}</p>
            </div>
            <button
              type="button"
              onClick={signOutUser}
              className="rounded-full border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  )
}
