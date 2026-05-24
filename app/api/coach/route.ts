import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!
)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {

  try {

    const body = await req.json()

    const {
      message,
      financialData,
      userId,
    } = body

    const model = genAI.getGenerativeModel({
     model: 'gemini-2.5-flash',
    })

    const prompt = `
You are an expert AI financial advisor for freelancers and small business owners.

The user has the following financial data:

Income: ₦${financialData.totalIncome}
Expenses: ₦${financialData.totalExpenses}
Essential Expenses: ₦${financialData.essentialExpenses}
Safe To Spend: ₦${financialData.safeToSpend}
Financial Score: ${financialData.financialScore}/100

User Question:
${message}

Provide:
- practical advice
- concise financial coaching
- savings recommendations
- motivational support

Keep responses simple and human.
`

    const result =
      await model.generateContent(prompt)

    const response =
      await result.response

    const reply = response.text()
    await supabase
  .from('ai_chats')
  .insert([
    {
      user_id: userId,
      question: message,
      response: reply,
    },
  ])

    return Response.json({
      reply,
    })

} catch (error: any) {

  console.log('GEMINI ERROR:', error)

  return Response.json(
    {
      error: error.message,
    },
    {
      status: 500,
    }
  )
}
}