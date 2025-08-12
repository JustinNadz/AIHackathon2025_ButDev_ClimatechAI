export async function POST(request: Request) {
  try {
    const { image_url, question } = await request.json()

    if (!image_url) {
      return Response.json({ error: 'image_url is required' }, { status: 400 })
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000'
    
    // Send request to Python backend Gemma image analysis endpoint
    const response = await fetch(`${backendUrl}/api/gemma/analyze-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: image_url,
        question: question || "What is in this image?"
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
      analysis: data.analysis || 'No analysis generated',
      model: data.model || 'google/gemma-2-27b-it:free'
    })
    
  } catch (error) {
    console.error('Gemma image analysis error:', error)
    return new Response('Invalid request', { status: 400 })
  }
}
