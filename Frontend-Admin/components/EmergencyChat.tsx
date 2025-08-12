"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Send, Loader2, Mic, Square } from "lucide-react"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  time: string
}

export default function EmergencyChat() {
  const [hasMounted, setHasMounted] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'assistant-welcome',
    role: "assistant",
    content: "Hi, I’m your emergency assistant. Tell me your location or share coordinates, and I’ll guide you with the right protocol, contacts, and nearest evacuation center.",
    time: "" // set on mount to avoid SSR/client mismatch
  }])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  const scrollToBottom = () => {
    setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 50)
  }

  // Avoid hydration mismatch: set dynamic time after mount only
  useEffect(() => {
    setHasMounted(true)
    setMessages(prev => prev.map((m, i) => i === 0 ? { ...m, time: new Date().toLocaleTimeString() } : m))
    // Setup browser speech recognition if available (Chrome/Edge)
    try {
      if (typeof window !== 'undefined') {
        const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
        if (SR) {
          const recog = new SR()
          recog.lang = 'en-US'
          recog.continuous = true
          recog.interimResults = true
          recog.onresult = (e: any) => {
            let text = ''
            for (let i = e.resultIndex; i < e.results.length; i++) {
              text += e.results[i][0].transcript
            }
            setInput(text)
          }
          recog.onend = () => setListening(false)
          recognitionRef.current = recog
        }
      }
    } catch {}
  }, [])

  const startListening = () => {
    if (!recognitionRef.current) return
    try {
      setInput("")
      setListening(true)
      recognitionRef.current.start()
    } catch {}
  }

  const stopListening = () => {
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.stop()
      setListening(false)
    } catch {}
  }

  const send = async () => {
    if (!input.trim() || busy) return
    const outbound: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: input.trim(), time: new Date().toLocaleTimeString() }
    setMessages((m) => [...m, outbound])
    setInput("")
    setBusy(true)
    scrollToBottom()

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.concat(outbound).map(m => ({ role: m.role, content: m.content })),
        })
      })

      const data = await res.json().catch(() => ({}))
      const content = data?.reply || (res.ok ? 'OK' : 'No response available.')

      setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'assistant', content, time: new Date().toLocaleTimeString() }])
      scrollToBottom()
    } catch (e) {
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'assistant', content: 'Unable to reach assistant right now. Please try again shortly.', time: new Date().toLocaleTimeString() }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="border-blue-200 w-full h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-blue-900">C.L.I.M.A</CardTitle>
          <Badge variant="outline" className="text-xs">Conversational</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Chat box (messages + input in one bordered box) */}
        <div className="rounded-lg border bg-white/60 overflow-hidden flex flex-col min-h-full sm:h-[480px]"
        style={{ height: '690px' }}>
          <div ref={listRef} className="h-full flex-1 overflow-y-auto p-3">
            {messages.map(m => (
              <div key={m.id} className={`mb-3 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                  <div suppressHydrationWarning className={`mt-1 text-[10px] opacity-70 ${m.role === 'user' ? 'text-white' : 'text-gray-500'}`}>{hasMounted ? (m.time || new Date().toLocaleTimeString()) : ''}</div>
                </div>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="border-t p-3 bg-white/70"
          >
            <div className="flex items-center gap-2 border rounded-lg bg-white px-2 py-1">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder=""
                aria-label="Message to emergency assistant"
                className="flex-1 border-0 shadow-none outline-none focus-visible:ring-0 focus-visible:outline-none resize-none min-h-[40px] max-h-28 p-2"
              />
              <Button
                type="button"
                onClick={listening ? stopListening : startListening}
                variant="ghost"
                size="icon"
                className={`${listening ? 'text-red-600' : 'text-blue-700'} hover:bg-blue-50 h-9 w-9`}
                aria-label={listening ? 'Stop voice input' : 'Start voice input'}
              >
                {listening ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button type="submit" disabled={busy || !input.trim()} size="icon" className="h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}


