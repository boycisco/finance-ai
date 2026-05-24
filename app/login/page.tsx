'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSignup = async () => {

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (data.user) {
      await supabase.from('profiles').insert([
        {
          id: data.user.id,
          email: data.user.email,
        },
      ])
    }

    if (error) {
      alert(error.message)
    } else {
      alert('Check your email to confirm signup!')
    }
  }

  const handleLogin = async () => {

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
  router.push('/dashboard')
}
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">

      <div className="w-full max-w-sm space-y-4">

        <h1 className="text-3xl font-bold">
          Freelancer Finance AI
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 rounded bg-zinc-900 border border-zinc-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 rounded bg-zinc-900 border border-zinc-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleSignup}
          className="w-full bg-white text-black p-3 rounded font-semibold"
        >
          Sign Up
        </button>

        <button
          onClick={handleLogin}
          className="w-full bg-zinc-800 p-3 rounded"
        >
          Login
        </button>

      </div>

    </main>
  )
}