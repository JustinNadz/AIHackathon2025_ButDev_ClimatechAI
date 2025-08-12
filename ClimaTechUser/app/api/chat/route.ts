export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    
    // Get the last user message
    const lastMessage = messages[messages.length - 1]
    const question = lastMessage?.content || "Hello"
    
    // Forward to backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"
    const response = await fetch(`${backendUrl}/api/assistant/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    })

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    
    return new Response(JSON.stringify({
      id: Date.now().toString(),
      role: "assistant", 
      content: data.advice || "I'm sorry, I couldn't process your request."
    }), {
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Chat proxy error:", error)
    return new Response(JSON.stringify({
      id: Date.now().toString(),
      role: "assistant",
      content: "I'm sorry, I'm having trouble connecting to the backend. Please make sure it's running."
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}
