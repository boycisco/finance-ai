'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ExpensesPage() {

  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [necessityLevel, setNecessityLevel] = useState('')
  const detectExpenseCategory = (
  expenseTitle: string
) => {

  const title =
    expenseTitle.toLowerCase()

  // ESSENTIAL
  if (
    title.includes('rent') ||
    title.includes('food') ||
    title.includes('fuel') ||
    title.includes('transport') ||
    title.includes('electricity') ||
    title.includes('water') ||
    title.includes('hospital') ||
    title.includes('medication') ||
    title.includes('internet')
  ) {
    return 'essential'
  }

  // LUXURY
  if (
    title.includes('iphone') ||
    title.includes('vacation') ||
    title.includes('gucci') ||
    title.includes('designer') ||
    title.includes('ps5') ||
    title.includes('jewelry')
  ) {
    return 'luxury'
  }

  // FLEXIBLE
  return 'flexible'
}
  const [note, setNote] = useState('')

  const [expenses, setExpenses] = useState<any[]>([])

  const fetchExpenses = async () => {

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from('expense_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setExpenses(data)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  const handleAddExpense = async () => {

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Please login first')
      return
    }

    const { error } = await supabase
      .from('expense_entries')
      .insert([
        {
          user_id: user.id,
          amount: Number(amount),
          category,
          necessity_level: necessityLevel,
          note,
          spent_date: new Date(),
        },
      ])

    if (error) {
      alert(error.message)
    } else {

      alert('Expense added successfully')

      setAmount('')
      setCategory('')
      setNecessityLevel('')
      setNote('')

      fetchExpenses()
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">

      <div className="max-w-2xl mx-auto space-y-6">

        <div>
          <h1 className="text-2xl md:text-4xl font-bold">
            Expense Tracker
          </h1>

          <p className="text-zinc-400 mt-2">
            Track where your money goes.
          </p>
        </div>

        {/* Expense Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">

          <input
            type="number"
            placeholder="Amount"
            className="w-full p-3 rounded bg-zinc-800 border border-zinc-700"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <input
  type="text"
  placeholder="Category"
  className="w-full p-3 rounded bg-zinc-800 border border-zinc-700"
  value={category}
  onChange={(e) => {

    const value = e.target.value

    setCategory(value)

    const detectedCategory =
      detectExpenseCategory(value)

    setNecessityLevel(
      detectedCategory
    )
  }}
/>

          <select
            className="w-full p-3 rounded bg-zinc-800 border border-zinc-700"
            value={necessityLevel}
            onChange={(e) => setNecessityLevel(e.target.value)}
          >
            <option value="">
              Select Necessity Level
            </option>

            <option value="essential">
              Essential
            </option>

            <option value="flexible">
              Flexible
            </option>

            <option value="luxury">
              Luxury
            </option>
          </select>

          <input
            type="text"
            placeholder="Optional Note"
            className="w-full p-3 rounded bg-zinc-800 border border-zinc-700"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <button
            onClick={handleAddExpense}
            className="w-full bg-white text-black p-3 rounded font-semibold"
          >
            Save Expense
          </button>

        </div>

        {/* Expense List */}
        <div className="space-y-4">

          <h2 className="text-2xl font-bold">
            Recent Expenses
          </h2>

          {expenses.map((expense) => (

            <div
              key={expense.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
            >

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                <div>
                  <p className="font-semibold">
                    {expense.category}
                  </p>

                  <p className="text-zinc-400 text-sm">
                    {expense.necessity_level}
                  </p>
                </div>

                <p className="text-lg md:text-xl font-bold">
                  ₦{expense.amount}
                </p>

              </div>

              {expense.note && (
                <p className="text-zinc-500 text-sm mt-2">
                  {expense.note}
                </p>
              )}

            </div>

          ))}

        </div>

      </div>

    </main>
  )
}