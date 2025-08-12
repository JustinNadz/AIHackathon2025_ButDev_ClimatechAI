export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000'
    const contentType = request.headers.get('content-type') || ''

    let upstreamResponse: Response
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      upstreamResponse = await fetch(`${backendUrl}/api/rag/ingest`, {
        method: 'POST',
        body: form as any,
      })
    } else {
      const body = await request.text()
      upstreamResponse = await fetch(`${backendUrl}/api/rag/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
    }

    const text = await upstreamResponse.text()
    return new Response(text, { status: upstreamResponse.status, headers: { 'Content-Type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Proxy error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}


