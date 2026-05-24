'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '../providers'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import jsPDF from 'jspdf'

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

const [aiResponse, setAiResponse] = useState('')

const [loadingAI, setLoadingAI] = useState(false)
const [chatHistory, setChatHistory] = useState<any[]>([])
const [loading, setLoading] =
  useState(true)

  const fetchDashboardData = async () => {

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {

  setLoading(false)

  return
}

    // Fetch Income
    const { data: incomeData } = await supabase
      .from('income_entries')
      .select('*')
      .eq('user_id', user.id)

    // Fetch Expenses
    const { data: expenseData } = await supabase
      .from('expense_entries')
      .select('*')
      .eq('user_id', user.id)

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

const insights: string[] = []
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

  // High expense ratio penalty
  if (totalExpenses > totalIncome * 0.8) {
    financialScore -= 30
  }

  // Essential spending penalty
  if (essentialExpenses > totalIncome * 0.6) {
    financialScore -= 20
  }

  // Negative safe-to-spend penalty
  if (safeToSpend < 0) {
    financialScore -= 40
  }

  // Ensure score doesn't go below 0
  if (financialScore < 0) {
    financialScore = 0
  }

  const alerts = []
  if (
  totalExpenses > totalIncome
) {
  alerts.push({
    type: 'warning',

    message:
      'Your expenses are currently higher than your income.',
  })
}

if (
  safeToSpend < 0
) {
  alerts.push({
    type: 'danger',

    message:
      'Your safe-to-spend balance is negative.',
  })
}

if (
  recommendedSavings >
  totalIncome * 0.25
) {
  alerts.push({
    type: 'success',

    message:
      'You are in a strong position to increase savings.',
  })
}

if (
  essentialExpenses >
  totalIncome * 0.7
) {
  alerts.push({
    type: 'warning',

    message:
      'Essential expenses are consuming most of your income.',
  })
}

if (
  financialScore >= 80
) {
  alerts.push({
    type: 'success',

    message:
      'Your financial health score is excellent.',
  })
}

const weeklySummary = {
  income: totalIncome,
  expenses: totalExpenses,
  savings: recommendedSavings,
  score: financialScore,
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

      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">

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

 <main className="min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>

          <h1 className="text-2xl md:text-4xl font-bold">
            Dashboard
          </h1>

          <p className="text-zinc-400 mt-2">
            Your financial control center.
          </p>

        </div>

{/* Report Download */}

<section className="flex justify-end">

  <button
    onClick={downloadReport}
    className="bg-white text-black px-6 py-3 rounded-xl font-semibold"
  >
    Download Monthly Report
  </button>

</section>

        {/* Safe To Spend */}

        <section className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">

          <p className="text-zinc-400 text-sm mb-2">
            SAFE TO SPEND
          </p>

          <h2 className="text-3xl md:text-5xl font-bold">
            ₦{safeToSpend.toLocaleString()}
          </h2>

          <p className="text-zinc-500 mt-3">
            After essential expenses and emergency buffer.
          </p>

        </section>

        {/* Financial Score */}

        <section className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">

          <p className="text-zinc-400 text-sm mb-2">
            FINANCIAL HEALTH SCORE
          </p>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <h2 className="text-5xl font-bold">
              {financialScore}/100
            </h2>

            <div>

              {financialScore >= 80 && (
                <div className="bg-green-900 text-green-300 px-4 py-2 rounded-full">
                  Healthy
                </div>
              )}

              {financialScore >= 50 && financialScore < 80 && (
                <div className="bg-yellow-900 text-yellow-300 px-4 py-2 rounded-full">
                  Improving
                </div>
              )}

              {financialScore < 50 && (
                <div className="bg-red-900 text-red-300 px-4 py-2 rounded-full">
                  At Risk
                </div>
              )}

            </div>

          </div>

          <p className="text-zinc-500 mt-4">
            Your score reflects spending stability,
            expense control, and financial flexibility.
          </p>

        </section>

        {/* Smart Savings Recommendation */}

        <section className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">

          <p className="text-zinc-400 text-sm mb-2">
            SMART SAVINGS RECOMMENDATION
          </p>

          <h2 className="text-4xl font-bold">
            ₦{recommendedSavings.toLocaleString()}
          </h2>

          <p className="text-zinc-500 mt-3">
            Recommended safe savings contribution
            based on your current financial position.
          </p>

        </section>

        {/* Stats */}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">

            <p className="text-zinc-400 text-sm">
              Total Income
            </p>

            <h3 className="text-2xl font-bold mt-2">
              ₦{totalIncome.toLocaleString()}
            </h3>

          </div>

          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">

            <p className="text-zinc-400 text-sm">
              Total Expenses
            </p>

            <h3 className="text-2xl font-bold mt-2">
              ₦{totalExpenses.toLocaleString()}
            </h3>

          </div>

          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">

            <p className="text-zinc-400 text-sm">
              Essential Expenses
            </p>

            <h3 className="text-2xl font-bold mt-2">
              ₦{essentialExpenses.toLocaleString()}
            </h3>

          </div>

        </section>

        {/* Analytics */}

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Income vs Expenses */}

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

            <h2 className="text-2xl font-bold mb-6">
              Income vs Expenses
            </h2>

            <div className="h-72 overflow-x-auto">

              <ResponsiveContainer width="100%" height="100%">

                <BarChart data={analyticsData}>

                  <XAxis dataKey="name" />

                  <YAxis />

                  <Tooltip />

                  <Bar dataKey="amount" />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>

          {/* Spending Breakdown */}

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

            <h2 className="text-2xl font-bold mb-6">
              Spending Breakdown
            </h2>

            <div className="h-72 overflow-x-auto">

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
                        fill={
                          index === 0
                            ? '#ffffff'
                            : '#525252'
                        }
                      />

                    ))}

                  </Pie>

                  <Tooltip />

                </PieChart>

              </ResponsiveContainer>

            </div>

          </div>

        </section>

{/* Weekly Financial Report */}

<section className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">

  <div className="flex items-center justify-between mb-6">

    <div>

      <p className="text-zinc-400 text-sm">
        WEEKLY REPORT
      </p>

      <h2 className="text-3xl font-bold mt-1">
        Financial Summary
      </h2>

    </div>

    <div className="bg-white text-black px-4 py-2 rounded-full font-semibold">
      {weeklySummary.score}/100
    </div>

  </div>

  <div className="grid md:grid-cols-3 gap-4">

    <div className="bg-zinc-800 rounded-xl p-4">

      <p className="text-zinc-400 text-sm">
        Income
      </p>

      <h3 className="text-2xl font-bold mt-2">
        ₦{weeklySummary.income.toLocaleString()}
      </h3>

    </div>

    <div className="bg-zinc-800 rounded-xl p-4">

      <p className="text-zinc-400 text-sm">
        Expenses
      </p>

      <h3 className="text-2xl font-bold mt-2">
        ₦{weeklySummary.expenses.toLocaleString()}
      </h3>

    </div>

    <div className="bg-zinc-800 rounded-xl p-4">

      <p className="text-zinc-400 text-sm">
        Recommended Savings
      </p>

      <h3 className="text-2xl font-bold mt-2">
        ₦{weeklySummary.savings.toLocaleString()}
      </h3>

    </div>

  </div>

  <div className="mt-6 bg-zinc-800 rounded-xl p-5">

    {financialScore >= 80 && (
      <p>
        Excellent financial discipline this period. You are maintaining strong spending control and healthy flexibility.
      </p>
    )}

    {financialScore >= 50 && financialScore < 80 && (
      <p>
        Your finances are improving, but there is still room to optimize spending and savings behavior.
      </p>
    )}

    {financialScore < 50 && (
      <p>
        Your financial position may be under pressure. Focus on reducing unnecessary expenses and rebuilding flexibility.
      </p>
    )}

  </div>

</section>
{/* AI Financial Coach Chat */}

<section className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">

  <div>

    <p className="text-zinc-400 text-sm">
      AI FINANCIAL COACH
    </p>

    <h2 className="text-3xl font-bold mt-1">
      Ask Anything
    </h2>

  </div>

  <textarea
    placeholder="Can I afford a new laptop this month?"
    className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-xl p-4 resize-none"
    value={question}
    onChange={(e) =>
      setQuestion(e.target.value)
    }
  />

  <button
    onClick={askAI}
    disabled={loadingAI}
    className="bg-white text-black px-6 py-3 rounded-xl font-semibold"
  >
    {loadingAI
      ? 'Thinking...'
      : 'Ask AI Coach'}
  </button>

  {aiResponse && (

    <div className="bg-zinc-800 rounded-xl p-5 whitespace-pre-wrap">

      <p>
        {aiResponse}
      </p>

    </div>

  )}

</section>
{/* Chat History */}

<section className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">

  <h2 className="text-2xl font-bold mb-6">
    AI Conversation History
  </h2>

  <div className="space-y-4 max-h-[500px] overflow-y-auto">

    {chatHistory.map((chat) => (

      <div
        key={chat.id}
        className="bg-zinc-800 rounded-xl p-4 space-y-3"
      >

        <div>

          <p className="text-zinc-400 text-sm mb-1">
            You Asked
          </p>

          <p>
            {chat.question}
          </p>

        </div>

        <div>

          <p className="text-zinc-400 text-sm mb-1">
            AI Coach
          </p>

          <p className="whitespace-pre-wrap">
            {chat.response}
          </p>

        </div>

      </div>

    ))}

  </div>

</section>

{/* Financial Alerts */}

<section className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">

  <div className="mb-6">

    <p className="text-zinc-400 text-sm">
      SMART ALERTS
    </p>

    <h2 className="text-3xl font-bold mt-1">
      Financial Alerts
    </h2>

  </div>

  <div className="space-y-4">

    {alerts.length === 0 && (

      <div className="bg-zinc-800 rounded-xl p-4">

        <p>
          No financial alerts right now.
        </p>

      </div>

    )}

    {alerts.map((alert: any, index) => (

      <div
        key={index}
        className={`
          rounded-xl p-4 border

          ${
            alert.type === 'danger'
              ? 'bg-red-950 border-red-800 text-red-300'
              : ''
          }

          ${
            alert.type === 'warning'
              ? 'bg-yellow-950 border-yellow-800 text-yellow-300'
              : ''
          }

          ${
            alert.type === 'success'
              ? 'bg-green-950 border-green-800 text-green-300'
              : ''
          }
        `}
      >

        <p>
          {alert.message}
        </p>

      </div>

    ))}

  </div>

</section>

{/* Monthly Financial Intelligence */}

<section className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">

  <div className="mb-6">

    <p className="text-zinc-400 text-sm">
      MONTHLY INTELLIGENCE
    </p>

    <h2 className="text-3xl font-bold mt-1">
      Financial Insights
    </h2>

  </div>

  <div className="space-y-4">

    {monthlyInsights.length === 0 && (

      <div className="bg-zinc-800 rounded-xl p-4">

        <p>
          Your financial activity is currently stable.
        </p>

      </div>

    )}

    {monthlyInsights.map(
      (insight, index) => (

        <div
          key={index}
          className="bg-zinc-800 rounded-xl p-4"
        >

          <p>
            {insight}
          </p>

        </div>

      )
    )}

  </div>

</section>

        {/* AI Insights */}

        <section className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">

          <h2 className="text-2xl font-bold mb-4">
            AI Financial Coach
          </h2>

          <div className="space-y-4">

            {insights.length === 0 && (
              <div className="bg-zinc-800 rounded-xl p-4">
                <p>
                  Add more financial data to receive insights.
                </p>
              </div>
            )}

            {insights.map((insight, index) => (

              <div
                key={index}
                className="bg-zinc-800 rounded-xl p-4"
              >
                <p>
                  {insight}
                </p>
              </div>

            ))}

          </div>

        </section>

      </div>

    </main>
  )
}