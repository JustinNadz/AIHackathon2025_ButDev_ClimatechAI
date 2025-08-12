export async function POST(request: Request) {
  try {
    const { messages } = await request.json()
    const apiKey = process.env.OPENAI_API_KEY

    // Fallback reply if no API key configured
    if (!apiKey) {
      const last = messages?.[messages.length - 1]?.content || ""
      return Response.json({
        reply:
          `I don't have an AI key configured yet. You said: "${last}". ` +
          `Add OPENAI_API_KEY in .env.local for real AI responses.`,
      })
    }

    // Build OpenAI chat-completions request
    const openAIMessages = (messages || []).map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || ''),
    }))

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openAIMessages,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return new Response(text || 'Upstream AI error', { status: 502 })
    }

    const data = await response.json()
    const reply = data?.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.'
    return Response.json({ reply })
  } catch (err: any) {
    return new Response('Invalid request', { status: 400 })
  }
}


