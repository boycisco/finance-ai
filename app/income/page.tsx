'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function IncomePage() {

  const [amount, setAmount] = useState('')
  const [source, setSource] = useState('')
  const [category, setCategory] = useState('')
  const [incomeEntries, setIncomeEntries] = useState<any[]>([])

  const fetchIncome = async () => {

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from('income_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setIncomeEntries(data)
    }
  }

  useEffect(() => {
    fetchIncome()
  }, [])

  const handleAddIncome = async () => {

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Please login first')
      return
    }

    const { error } = await supabase
      .from('income_entries')
      .insert([
        {
          user_id: user.id,
          amount: Number(amount),
          source,
          category,
          received_date: new Date(),
        },
      ])

    if (error) {
      alert(error.message)
    } else {

      alert('Income added successfully')

      setAmount('')
      setSource('')
      setCategory('')

      fetchIncome()
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">

      <div className="max-w-2xl mx-auto space-y-6">

        <div>
          <h1 className="text-xl md:text-2xl md:text-4xl font-bold">
            Income Tracker
          </h1>

          <p className="text-zinc-400 mt-2">
            Track all incoming revenue.
          </p>
        </div>

        {/* Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">

          <input
            type="number"
            placeholder="Amount"
            className="w-full p-3 rounded bg-zinc-800 border border-zinc-700"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <input
            type="text"
            placeholder="Income Source"
            className="w-full p-3 rounded bg-zinc-800 border border-zinc-700"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />

          <input
            type="text"
            placeholder="Category"
            className="w-full p-3 rounded bg-zinc-800 border border-zinc-700"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <button
            onClick={handleAddIncome}
            className="w-full bg-white text-black p-3 rounded font-semibold"
          >
            Save Income
          </button>

        </div>

        {/* Income List */}
        <div className="space-y-4">

          <h2 className="text-xl md:text-2xl font-bold">
            Recent Income
          </h2>

          {incomeEntries.map((entry) => (

            <div
              key={entry.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
            >

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                <div>
                  <p className="font-semibold">
                    {entry.source}
                  </p>

                  <p className="text-zinc-400 text-sm">
                    {entry.category}
                  </p>
                </div>

                <p className="text-xl font-bold">
                  ₦{entry.amount}
                </p>

              </div>

            </div>

          ))}

        </div>

      </div>

    </main>
  )
}