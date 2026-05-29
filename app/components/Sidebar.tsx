'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'

import {
  usePathname,
} from 'next/navigation'

import {
  useState,
} from 'react'

import {
  Menu,
  X,
} from 'lucide-react'

import {
  supabase,
} from '@/lib/supabase'

export default function Sidebar() {

  const pathname =
    usePathname()

  const [open, setOpen] =
    useState(false)
    const {
  theme,
  setTheme,
} = useTheme()

  const links = [
    {
      name: 'Dashboard',
      href: '/dashboard',
    },

    {
      name: 'Income',
      href: '/income',
    },

    {
      name: 'Expenses',
      href: '/expenses',
    },

    {
      name: 'Goals',
      href: '/goals',
    },
  ]

  const handleLogout =
    async () => {

      await supabase.auth.signOut()

      window.location.href =
        '/login'
    }

  return (

    <>

      {/* Mobile Top Bar */}

      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between p-4">

        <h1 className="text-xl font-bold text-white">
          Finance AI
        </h1>

        <button
          onClick={() =>
            setOpen(!open)
          }
        >

          {open ? (
            <X size={28} />
          ) : (
            <Menu size={28} />
          )}

        </button>

      </div>

      {/* Sidebar */}

      <aside
        className={`
          fixed md:static top-0 left-0 z-40
          h-screen w-64 bg-zinc-950
          border-r border-zinc-800
          p-6 flex flex-col justify-between
          transition-transform duration-300

          ${
            open
              ? 'translate-x-0'
              : '-translate-x-full'
          }

          md:translate-x-0
        `}
      >

        <div>

          <div className="mb-10 mt-12 md:mt-0">

            <h1 className="text-2xl font-bold text-white">
              Finance AI
            </h1>

            <p className="text-zinc-500 text-sm mt-1">
              Freelancer OS
            </p>

          </div>

          <nav className="space-y-2">

            {links.map((link) => (

              <Link
                key={link.href}
                href={link.href}
                onClick={() =>
                  setOpen(false)
                }
                className={`
                  block px-4 py-3 rounded-xl transition

                  ${
                    pathname ===
                    link.href
                      ? 'bg-white text-black font-semibold'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }
                `}
              >

                {link.name}

              </Link>

            ))}

          </nav>

        </div>

<button
  onClick={() =>
    setTheme(
      theme === 'dark'
        ? 'light'
        : 'dark'
    )
  }
  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-xl mb-3 transition"
>

  {theme === 'dark'
    ? 'Light Mode'
    : 'Dark Mode'}

</button>

        <button
          onClick={handleLogout}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-xl"
        >
          Logout
        </button>

      </aside>

    </>
  )
}