'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '../providers'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import jsPDF from 'jspdf'
import Link from 'next/link'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts'

export default function DashboardPage() {

  const router = useRouter()

  const { session } = useAuth()

  useEffect(() => {

    if (session === null) {
      router.push('/login')
    }

  }, [session, router])

  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [essentialExpenses, setEssentialExpenses] = useState(0)
  const [question, setQuestion] = useState('')
  const [userFullName, setUserFullName] = useState('')
  const [recentIncome, setRecentIncome] = useState<any[]>([])
  const [recentExpenses, setRecentExpenses] = useState<any[]>([])
  const [recentGoals, setRecentGoals] = useState<any[]>([])

  const [aiResponse, setAiResponse] = useState('')

  const [loadingAI, setLoadingAI] = useState(false)
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    // Fetch User Profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()

    if (profileData?.full_name) {
      setUserFullName(profileData.full_name)
    }

    // Fetch Income
    const { data: incomeData } = await supabase
      .from('income_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Fetch Expenses
    const { data: expenseData } = await supabase
      .from('expense_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Fetch Goals
    const { data: goalsData } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)

    const incomeTotal =
      incomeData?.reduce(
        (sum, item) => sum + Number(item.amount),
        0
      ) || 0

    const expenseTotal =
      expenseData?.reduce(
        (sum, item) => sum + Number(item.amount),
        0
      ) || 0

    const essentials =
      expenseData
        ?.filter(
          (expense) =>
            expense.necessity_level === 'essential'
        )
        .reduce(
          (sum, item) => sum + Number(item.amount),
          0
        ) || 0

    setTotalIncome(incomeTotal)
    setTotalExpenses(expenseTotal)
    setEssentialExpenses(essentials)
    setRecentIncome(incomeData?.slice(0, 3) || [])
    setRecentExpenses(expenseData?.slice(0, 3) || [])
    setRecentGoals(goalsData || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchDashboardData()
    fetchChatHistory()
  }, [])

  const fetchChatHistory = async () => {

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from('ai_chats')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', {
        ascending: false,
      })

    if (!error && data) {
      setChatHistory(data)
    }
  }

  const askAI = async () => {

    if (!question) return

    setLoadingAI(true)

    try {

      const response = await fetch(
        '/api/coach',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            message: question,

            financialData: {
              totalIncome,
              totalExpenses,
              essentialExpenses,
              safeToSpend,
              financialScore,
            },

            userId: session?.user?.id,
          }),
        }
      )

      const data = await response.json()

      setAiResponse(data.reply)
      setQuestion('')
      fetchChatHistory()

    } catch (error) {

      console.log(error)

      alert('AI request failed')

    } finally {

      setLoadingAI(false)
    }
  }

  // SAFE TO SPEND FORMULA

  const emergencyBuffer = totalIncome * 0.2

  const safeToSpend =
    totalIncome -
    essentialExpenses -
    emergencyBuffer

  // SMART SAVINGS

  const recommendedSavings =
    safeToSpend > 0
      ? safeToSpend * 0.3
      : 0

  // ANALYTICS DATA

  const analyticsData = [
    {
      name: 'Income',
      amount: totalIncome,
    },
    {
      name: 'Expenses',
      amount: totalExpenses,
    },
  ]

  const spendingData = [
    {
      name: 'Essential',
      value: essentialExpenses,
    },
    {
      name: 'Flexible/Luxury',
      value:
        totalExpenses - essentialExpenses,
    },
  ]

  // AI INSIGHTS

  const monthlyInsights: string[] = []

  const expenseGap = totalExpenses - essentialExpenses

  if (expenseGap > totalIncome * 0.4) {
    monthlyInsights.push(
      'Your flexible spending is consuming a large portion of your income.'
    )
  }

  if (recommendedSavings > totalIncome * 0.2) {
    monthlyInsights.push(
      'You are financially positioned to increase your savings rate.'
    )
  }

  if (totalExpenses > totalIncome) {
    monthlyInsights.push(
      'Your spending currently exceeds your income.'
    )
  }

  if (totalExpenses < totalIncome * 0.5) {
    monthlyInsights.push(
      'Your monthly spending habits are currently well managed.'
    )
  }

  // FINANCIAL SCORE

  let financialScore = 100

  if (totalExpenses > totalIncome * 0.8) {
    financialScore -= 30
  }

  if (essentialExpenses > totalIncome * 0.6) {
    financialScore -= 20
  }

  if (safeToSpend < 0) {
    financialScore -= 40
  }

  if (financialScore < 0) {
    financialScore = 0
  }

  const alerts = []
  if (totalExpenses > totalIncome) {
    alerts.push({
      type: 'warning',
      message: 'Your expenses are currently higher than your income.',
    })
  }

  if (safeToSpend < 0) {
    alerts.push({
      type: 'danger',
      message: 'Your safe-to-spend balance is negative.',
    })
  }

  if (recommendedSavings > totalIncome * 0.25) {
    alerts.push({
      type: 'success',
      message: 'You are in a strong position to increase savings.',
    })
  }

  if (essentialExpenses > totalIncome * 0.7) {
    alerts.push({
      type: 'warning',
      message: 'Essential expenses are consuming most of your income.',
    })
  }

  if (financialScore >= 80) {
    alerts.push({
      type: 'success',
      message: 'Your financial health score is excellent.',
    })
  }

  const downloadReport = () => {

    const doc = new jsPDF()

    doc.setFontSize(22)

    doc.text(
      'Freelancer Finance AI Report',
      20,
      20
    )

    doc.setFontSize(14)

    doc.text(
      `Total Income: ₦${totalIncome.toLocaleString()}`,
      20,
      40
    )

    doc.text(
      `Total Expenses: ₦${totalExpenses.toLocaleString()}`,
      20,
      50
    )

    doc.text(
      `Essential Expenses: ₦${essentialExpenses.toLocaleString()}`,
      20,
      60
    )

    doc.text(
      `Safe To Spend: ₦${safeToSpend.toLocaleString()}`,
      20,
      70
    )

    doc.text(
      `Financial Score: ${financialScore}/100`,
      20,
      80
    )

    doc.text(
      `Recommended Savings: ₦${recommendedSavings.toLocaleString()}`,
      20,
      90
    )

    doc.text(
      'Monthly Insights:',
      20,
      110
    )

    let y = 120

    monthlyInsights.forEach(
      (insight) => {

        doc.text(`- ${insight}`, 20, y)

        y += 10
      }
    )

    doc.save(
      'financial-report.pdf'
    )
  }

  if (loading) {

    return (

      <main className="min-h-screen">

        <div className="max-w-6xl mx-auto space-y-6 animate-pulse p-6">

          <div className="h-10 bg-zinc-800 rounded-xl w-48" />

          <div className="h-40 bg-zinc-900 rounded-2xl" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="h-32 bg-zinc-900 rounded-2xl" />

            <div className="h-32 bg-zinc-900 rounded-2xl" />

            <div className="h-32 bg-zinc-900 rounded-2xl" />

          </div>

          <div className="h-72 bg-zinc-900 rounded-2xl" />

        </div>

      </main>

    )
  }

  return (

    <main className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Welcome Section */}
        <section className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-bold">
            Welcome back, {userFullName || 'there'}!
          </h1>
          <p className="text-zinc-400 text-lg">
            Here's your financial snapshot for today.
          </p>
        </section>

        {/* Key Metrics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-400 text-sm mb-2">Total Income</p>
            <h2 className="text-3xl font-bold">
              ₦{totalIncome.toLocaleString()}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-400 text-sm mb-2">Total Expenses</p>
            <h2 className="text-3xl font-bold">
              ₦{totalExpenses.toLocaleString()}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-400 text-sm mb-2">Essential Expenses</p>
            <h2 className="text-3xl font-bold">
              ₦{essentialExpenses.toLocaleString()}
            </h2>
          </div>

        </section>

        {/* Primary Metrics */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Safe To Spend */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <p className="text-zinc-400 text-sm mb-3">SAFE TO SPEND</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              ₦{safeToSpend.toLocaleString()}
            </h2>
            <p className="text-zinc-500">
              After essential expenses and emergency buffer.
            </p>
          </div>

          {/* Financial Score */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <p className="text-zinc-400 text-sm mb-3">FINANCIAL HEALTH SCORE</p>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-5xl font-bold">
                {financialScore}/100
              </h2>
              <div>
                {financialScore >= 80 && (
                  <span className="bg-green-900 text-green-300 px-4 py-2 rounded-full text-sm font-semibold">
                    Healthy
                  </span>
                )}
                {financialScore >= 50 && financialScore < 80 && (
                  <span className="bg-yellow-900 text-yellow-300 px-4 py-2 rounded-full text-sm font-semibold">
                    Improving
                  </span>
                )}
                {financialScore < 50 && (
                  <span className="bg-red-900 text-red-300 px-4 py-2 rounded-full text-sm font-semibold">
                    At Risk
                  </span>
                )}
              </div>
            </div>
            <p className="text-zinc-500 text-sm">
              Your score reflects spending stability, expense control, and financial flexibility.
            </p>
          </div>

        </section>

        {/* Recent Sections */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Income */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Recent Income</h3>
              <Link href="/income" className="text-zinc-400 hover:text-white transition text-sm">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {recentIncome.length === 0 ? (
                <p className="text-zinc-500 text-sm">No income recorded yet.</p>
              ) : (
                recentIncome.map((item) => (
                  <div key={item.id} className="bg-zinc-800 rounded-lg p-3">
                    <p className="font-semibold text-sm">{item.source}</p>
                    <p className="text-zinc-400 text-xs">{item.category}</p>
                    <p className="text-white font-bold mt-2">₦{Number(item.amount).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
            <Link href="/income" className="w-full bg-white text-black p-3 rounded-lg font-semibold mt-4 inline-block text-center">
              Add Income
            </Link>
          </div>

          {/* Recent Expenses */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Recent Expenses</h3>
              <Link href="/expenses" className="text-zinc-400 hover:text-white transition text-sm">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {recentExpenses.length === 0 ? (
                <p className="text-zinc-500 text-sm">No expenses recorded yet.</p>
              ) : (
                recentExpenses.map((item) => (
                  <div key={item.id} className="bg-zinc-800 rounded-lg p-3">
                    <p className="font-semibold text-sm">{item.category}</p>
                    <p className="text-zinc-400 text-xs capitalize">{item.necessity_level}</p>
                    <p className="text-white font-bold mt-2">₦{Number(item.amount).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
            <Link href="/expenses" className="w-full bg-white text-black p-3 rounded-lg font-semibold mt-4 inline-block text-center">
              Add Expense
            </Link>
          </div>

          {/* Recent Goals */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Recent Goals</h3>
              <Link href="/goals" className="text-zinc-400 hover:text-white transition text-sm">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {recentGoals.length === 0 ? (
                <p className="text-zinc-500 text-sm">No goals set yet.</p>
              ) : (
                recentGoals.map((goal) => {
                  const progress = (goal.current_amount / goal.target_amount) * 100
                  return (
                    <div key={goal.id} className="bg-zinc-800 rounded-lg p-3">
                      <p className="font-semibold text-sm">{goal.title}</p>
                      <p className="text-zinc-400 text-xs capitalize">{goal.priority} priority</p>
                      <div className="bg-zinc-700 rounded-full h-2 mt-2 overflow-hidden">
                        <div className="bg-white h-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                      <p className="text-zinc-400 text-xs mt-1">{Math.round(progress)}% complete</p>
                    </div>
                  )
                })
              )}
            </div>
            <Link href="/goals" className="w-full bg-white text-black p-3 rounded-lg font-semibold mt-4 inline-block text-center">
              Add Goal
            </Link>
          </div>

        </section>

        {/* Analytics */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6">Income vs Expenses</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData}>
                  <XAxis dataKey="name" stroke="#71717a" />
                  <YAxis stroke="#71717a" />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#ffffff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6">Spending Breakdown</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendingData}
                    dataKey="value"
                    outerRadius={100}
                    label
                  >
                    {spendingData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={index === 0 ? '#ffffff' : '#525252'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </section>

        {/* AI Coach Section */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-4">
          <div>
            <p className="text-zinc-400 text-sm">AI FINANCIAL COACH</p>
            <h2 className="text-3xl font-bold mt-1">Ask Your AI Coach</h2>
          </div>

          <textarea
            placeholder="Can I afford a new laptop this month?"
            className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-xl p-4 resize-none text-white placeholder-zinc-500 focus:outline-none focus:border-white transition"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />

          <button
            onClick={askAI}
            disabled={loadingAI}
            className="bg-white text-black px-8 py-3 rounded-xl font-semibold hover:bg-zinc-100 transition disabled:opacity-50"
          >
            {loadingAI ? 'Thinking...' : 'Ask AI Coach'}
          </button>

          {aiResponse && (
            <div className="bg-zinc-800 rounded-xl p-5 whitespace-pre-wrap">
              <p className="text-zinc-200">{aiResponse}</p>
            </div>
          )}

        </section>

        {/* Financial Alerts */}
        {alerts.length > 0 && (
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <p className="text-zinc-400 text-sm mb-3">SMART ALERTS</p>
            <h2 className="text-2xl font-bold mb-6">Financial Alerts</h2>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-4 border ${
                    alert.type === 'danger'
                      ? 'bg-red-950 border-red-800 text-red-300'
                      : alert.type === 'warning'
                      ? 'bg-yellow-950 border-yellow-800 text-yellow-300'
                      : 'bg-green-950 border-green-800 text-green-300'
                  }`}
                >
                  <p>{alert.message}</p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>

  )
}
