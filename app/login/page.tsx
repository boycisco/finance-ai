'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSignup, setIsSignup] = useState(false)

  const handleSignup = async () => {

    if (!fullName.trim()) {
      alert('Please enter your full name')
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
        },
      ])
      if (profileError) {
        alert('Profile creation error: ' + profileError.message)
      }
    }

    if (error) {
      alert(error.message)
    } else {
      alert('Account created successfully! Please log in.')
      setIsSignup(false)
      setFullName('')
      setEmail('')
      setPassword('')
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
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">

      <div className="w-full max-w-sm space-y-6">

        <div>
          <h1 className="text-4xl font-bold">
            Freelancer Finance AI
          </h1>
          <p className="text-zinc-400 mt-2">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        <div className="space-y-3">

          {isSignup && (
            <input
              type="text"
              placeholder="Full Name"
              className="w-full p-3 rounded-lg bg-zinc-900 border border-zinc-700 focus:outline-none focus:border-white transition"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-lg bg-zinc-900 border border-zinc-700 focus:outline-none focus:border-white transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-lg bg-zinc-900 border border-zinc-700 focus:outline-none focus:border-white transition"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

        </div>

        <button
          onClick={isSignup ? handleSignup : handleLogin}
          className="w-full bg-white text-black p-3 rounded-lg font-semibold hover:bg-zinc-100 transition"
        >
          {isSignup ? 'Create Account' : 'Login'}
        </button>

        <button
          onClick={() => setIsSignup(!isSignup)}
          className="w-full bg-zinc-800 text-white p-3 rounded-lg hover:bg-zinc-700 transition"
        >
          {isSignup ? 'Already have an account? Login' : 'Create new account'}
        </button>

      </div>

    </main>
  )
}
