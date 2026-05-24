'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import {
  Session,
} from '@supabase/supabase-js'

import {
  supabase,
} from '@/lib/supabase'

import {
  ThemeProvider,
} from 'next-themes'

const AuthContext =
  createContext<any>(null)

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {

  const [session, setSession] =
    useState<Session | null>(null)

  useEffect(() => {

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session)
      })

    const {
      data: listener,
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session)
        }
      )

    return () => {
      listener.subscription.unsubscribe()
    }

  }, [])

  return (

    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
    >

      <AuthContext.Provider
        value={{ session }}
      >

        {children}

      </AuthContext.Provider>

    </ThemeProvider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}