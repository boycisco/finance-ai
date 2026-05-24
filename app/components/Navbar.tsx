'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {

  const pathname = usePathname()

  const links = [
    {
      href: '/dashboard',
      label: 'Dashboard',
    },
    {
      href: '/income',
      label: 'Income',
    },
    {
      href: '/expenses',
      label: 'Expenses',
    },
    {
  href: '/goals',
  label: 'Goals',
},
  ]

  return (

    <nav className="border-b border-zinc-800 bg-black sticky top-0 z-50">

      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        <h1 className="text-white font-bold text-xl">
          Freelancer Finance AI
        </h1>

        <div className="flex items-center gap-4">

          {links.map((link) => (

            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg transition ${
                pathname === link.href
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {link.label}
            </Link>

          ))}

        </div>

      </div>

    </nav>
  )
}