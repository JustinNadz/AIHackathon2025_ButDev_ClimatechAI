export async function POST(request: Request) {
  try {
    const { messages, imageUrl, system, mode } = await request.json()

    const apiKey = process.env.OPENROUTER_API_KEY
    const siteUrl = process.env.OPENROUTER_SITE_URL || undefined
    const siteTitle = process.env.OPENROUTER_SITE_NAME || 'ClimaTech AI Frontend-Admin'

    // Fallback reply if no API key configured
    if (!apiKey) {
      const last = messages?.[messages.length - 1]?.content || ''
      return Response.json({
        reply:
          `OpenRouter key not configured. You said: "${last}". ` +
          `Add OPENROUTER_API_KEY in .env.local to enable C.L.I.M.A responses.`,
      })
    }

    // Map incoming messages to OpenRouter format. For text-only, use string content.
    const orMessages: any[] = (messages || []).map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || ''),
    }))

    // Optional system message
    const defaultSystem = `You are C.L.I.M.A (Climate Learning & Intelligent Monitoring Assistant), ClimaTech's helpful voice assistant. Be concise and helpful.
${mode === 'voice' ? 'When possible, also output a JSON object for actions the app can take. Use this JSON shape: {"say": string, "action": {"type": string, "params": object}|null}. If you are unsure, set action to null. Examples: Navigate to sections (type: "navigate", params: {"to": "/dashboard"}), Weather query (type: "weather.query", params: {"location": string}). Return plain JSON only.' : ''}`

    const systemText = system ? String(system) : defaultSystem
    orMessages.unshift({ role: 'system', content: systemText })

    // If an image URL is provided, use Gemma for image analysis via backend
    let imageAnalysisContext = ''
    if (imageUrl) {
      try {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000'
        const imageResponse = await fetch(`${backendUrl}/api/gemma/analyze-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            image_url: String(imageUrl),
            question: "Analyze this image in the context of climate monitoring, weather patterns, or environmental assessment. What relevant information can you extract?"
          }),
        })
        
        if (imageResponse.ok) {
          const imageData = await imageResponse.json()
          if (imageData.analysis) {
            imageAnalysisContext = `\n\nImage Analysis: ${imageData.analysis}`
            orMessages.push({
              role: 'system',
              content: `The user has shared an image. Here's the analysis: ${imageData.analysis}`
            })
          }
        }
      } catch (error) {
        console.error('Image analysis failed:', error)
        // Fallback to original OpenRouter multimodal
        orMessages.push({
          role: 'user',
          content: [
            { type: 'text', text: 'What is in this image?' },
            { type: 'image_url', image_url: { url: String(imageUrl) } },
          ] as any,
        })
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'X-Title': siteTitle,
    }
    if (siteUrl) headers['HTTP-Referer'] = siteUrl

    // Optional: fetch RAG context from Python backend
    let contextFromBackend = ''
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000'
      const rq = await fetch(`${backendUrl}/api/rag/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: String(messages?.[messages.length - 1]?.content || '') }),
      })
      if (rq.ok) {
        const j = await rq.json()
        contextFromBackend = j?.context || ''
      }
    } catch {}

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: contextFromBackend
          ? [
              { role: 'system', content: `Context:\n${contextFromBackend}` },
              ...orMessages,
            ]
          : orMessages,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return new Response(text || 'Upstream AI error', { status: 502 })
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content || ''

    // Try to parse structured JSON if present
    let say = content
    let action: any = null
    if (typeof content === 'string') {
      const stripped = content.trim().replace(/^```json\n?|```$/g, '').replace(/^```/g, '').replace(/```$/g, '')
      try {
        const parsed = JSON.parse(stripped)
        if (parsed && (parsed.say || parsed.action)) {
          say = parsed.say || say
          action = parsed.action || null
        }
      } catch {
        // leave as plain text
      }
    }

    const reply = say || 'Sorry, I could not generate a response.'

    // Optional: practice mode – ingest Q&A back into RAG for future grounding
    try {
      if ((process.env.ASSISTANT_AUTO_INGEST || '').toLowerCase() === 'true') {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000'
        const lastUser = messages?.[messages.length - 1]?.content || ''
        const qa = `Q: ${String(lastUser)}\nA: ${String(reply)}`
        await fetch(`${backendUrl}/api/rag/ingest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: [qa] }),
        })
      }
    } catch {}

    return Response.json({ reply, action })
  } catch {
    return new Response('Invalid request', { status: 400 })
  }
}


