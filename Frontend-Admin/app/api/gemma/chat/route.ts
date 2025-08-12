export async function POST(request: Request) {
  try {
    const { messages, system_prompt, model } = await request.json()

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000'
    
    // Send request to Python backend Gemma endpoint
    const response = await fetch(`${backendUrl}/api/gemma/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages || [],
        system_prompt: system_prompt || "You are C.L.I.M.A (Climate Learning & Intelligent Monitoring Assistant), ClimaTech's helpful AI assistant. Be concise and helpful."
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(errorText || 'Backend Gemma API error', { status: 502 })
    }

    const data = await response.json()
    
    if (data.error) {
      return Response.json({ error: data.error })
    }

    return Response.json({ 
      reply: data.response || 'No response generated',
      model: data.model || 'google/gemma-2-27b-it:free'
    })
    
  } catch (error) {
    console.error('Gemma chat error:', error)
    return new Response('Invalid request', { status: 400 })
  }
}
