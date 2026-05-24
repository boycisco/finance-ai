'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function GoalsPage() {

  const [title, setTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [priority, setPriority] = useState('')

  const [goals, setGoals] = useState<any[]>([])

  const fetchGoals = async () => {

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setGoals(data)
    }
  }

  useEffect(() => {
    fetchGoals()
  }, [])

  const handleAddGoal = async () => {

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Please login first')
      return
    }

    const { error } = await supabase
      .from('financial_goals')
      .insert([
        {
          user_id: user.id,
          title,
          target_amount: Number(targetAmount),
          current_amount: Number(currentAmount),
          priority,
        },
      ])

    if (error) {

      alert(error.message)

    } else {

      alert('Goal created successfully')

      setTitle('')
      setTargetAmount('')
      setCurrentAmount('')
      setPriority('')

      fetchGoals()
    }
  }

  const handleUpdateSavings = async (
    goalId: string,
    currentAmount: number
  ) => {

    const amountToAdd = window.prompt(
      'How much do you want to add?'
    )

    if (!amountToAdd) return

    const parsedAmount = Number(amountToAdd)

    if (isNaN(parsedAmount)) {
      alert('Please enter a valid number')
      return
    }

    const newAmount =
      currentAmount + parsedAmount

    const { error } = await supabase
      .from('financial_goals')
      .update({
        current_amount: newAmount,
      })
      .eq('id', goalId)

    if (error) {

      console.log(error)

      alert(error.message)

    } else {

      alert('Savings updated successfully')

      fetchGoals()
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">

      <div className="max-w-3xl mx-auto space-y-6">

        <div>
          <h1 className="text-2xl md:text-4xl font-bold">
            Financial Goals
          </h1>

          <p className="text-zinc-400 mt-2">
            Track your savings and financial targets.
          </p>
        </div>

        {/* Goal Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">

          <input
            type="text"
            placeholder="Goal Title"
            className="w-full p-3 rounded bg-zinc-800 border border-zinc-700"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            type="number"
            placeholder="Target Amount"
            className="w-full p-3 rounded bg-zinc-800 border border-zinc-700"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
          />

          <input
            type="number"
            placeholder="Current Saved Amount"
            className="w-full p-3 rounded bg-zinc-800 border border-zinc-700"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(e.target.value)}
          />

          <select
            className="w-full p-3 rounded bg-zinc-800 border border-zinc-700"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="">
              Select Priority
            </option>

            <option value="high">
              High
            </option>

            <option value="medium">
              Medium
            </option>

            <option value="low">
              Low
            </option>
          </select>

          <button
            onClick={handleAddGoal}
            className="w-full bg-white text-black p-3 rounded font-semibold"
          >
            Create Goal
          </button>

        </div>

        {/* Goals List */}
        <div className="space-y-4">

          <h2 className="text-2xl font-bold">
            Active Goals
          </h2>

          {goals.map((goal) => {

            const progress =
              (goal.current_amount /
                goal.target_amount) * 100

            return (

              <div
                key={goal.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
              >

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                  <div>
                    <h3 className="text-lg md:text-xl font-bold">
                      {goal.title}
                    </h3>

                    <p className="text-zinc-400 text-sm mt-1">
                      Priority: {goal.priority}
                    </p>
                  </div>

                  <div className="text-right">

                    <p className="font-bold">
                      ₦{goal.current_amount.toLocaleString()}
                    </p>

                    <p className="text-zinc-400 text-sm">
                      of ₦{goal.target_amount.toLocaleString()}
                    </p>

                  </div>

                </div>

                {/* Progress Bar */}
                <div className="mt-5">

                  <div className="w-full bg-zinc-800 rounded-full h-4 overflow-hidden">

                    <div
                      className="bg-white h-full"
                      style={{
                        width: `${progress}%`,
                      }}
                    />

                  </div>

                  <p className="text-sm text-zinc-400 mt-2">
                    {progress.toFixed(1)}% completed
                  </p>

                  <button
                    onClick={() =>
                      handleUpdateSavings(
                        goal.id,
                        goal.current_amount
                      )
                    }
                    className="w-full bg-white text-black p-3 rounded font-semibold"
                  >
                    Add Savings
                  </button>

                </div>

              </div>

            )
          })}

        </div>

      </div>

    </main>
  )
}