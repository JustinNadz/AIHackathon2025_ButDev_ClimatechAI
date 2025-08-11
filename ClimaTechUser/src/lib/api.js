export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export async function askQuestion(question) {
  const resp = await fetch(`${BACKEND_URL}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(text || 'Request failed')
  }
  return resp.json()
} 