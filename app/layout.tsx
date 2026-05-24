'use client'

import './globals.css'

import Sidebar from './components/Sidebar'

import Providers from './providers'

import { usePathname } from 'next/navigation'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const pathname = usePathname()

  const hideSidebar =
    pathname === '/login'

  return (

    <html
  lang="en"
  suppressHydrationWarning
>

      <body className="bg-black text-white">

        <Providers>

          {hideSidebar ? (

            children

          ) : (

            <div className="flex">

              <Sidebar />

             <main className="flex-1 min-h-screen p-6 pt-24 md:pt-6">

                {children}

              </main>

            </div>

          )}

        </Providers>

      </body>

    </html>
  )
}