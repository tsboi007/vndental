'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const path = usePathname()
  const active = path === href || path.startsWith(href + '/')
  return (
    <Link
      href={href}
      className={`relative block rounded-md px-3 py-1.5 text-sm ${
        active ? 'bg-brand-50 font-semibold text-brand' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {active && <span className="absolute inset-y-1 left-0 w-0.5 rounded bg-brand" />}
      {children}
    </Link>
  )
}
