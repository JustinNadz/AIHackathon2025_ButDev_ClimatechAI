"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Send, Mic as MicIcon, Plus } from "lucide-react"
import Image from "next/image"
import { Mic, X, ArrowLeft } from "lucide-react"

type Message = { role: "user" | "assistant"; content: string }

export default function AssistantPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I’m C.L.I.M.A, your voice assistant. Tap the orb and talk." },
  ])
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState("")
  const [showChat, setShowChat] = useState(true)
  const listRef = useRef<HTMLDivElement | null>(null)
  const [typedMessage, setTypedMessage] = useState("")
  const [sending, setSending] = useState(false)
  const recognitionRef = useRef<any>(null)
  const listeningRef = useRef(false)
  const orbRef = useRef<HTMLDivElement | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const SpeechRecognition: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event: any) => {
      let interimText = ""
      let finalText = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        if (res.isFinal) finalText += res[0].transcript
        else interimText += res[0].transcript
      }
      if (interimText) setInterim(interimText)
      if (finalText.trim()) {
        setInterim("")
        submit(finalText.trim())
      }
    }
    recognition.onend = () => {
      if (listeningRef.current) {
        try { recognition.start() } catch {}
      } else {
        setListening(false)
      }
    }
    recognitionRef.current = recognition
  }, [])

  const speak = (text: string) => {
    if (typeof window === "undefined") return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const submit = async (text: string) => {
    setSending(true)
    const user: Message = { role: "user", content: text }
    setMessages((prev) => [...prev, user])

    // Handle greetings locally with a fixed response
    const lower = text.trim().toLowerCase()
    if (/(^|\b)(hi|hello|hey|good\s*(morning|afternoon|evening))($|\b)/.test(lower)) {
      const greeting = "Hello, this is C.L.I.M.A – Climate Learning & Intelligent Monitoring Assistant. How can I help you today?"
      const assistant: Message = { role: "assistant", content: greeting }
      setMessages((prev) => [...prev, assistant])
      speak(greeting)
      return
    }
    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, user], mode: 'voice' }),
      })
      const data = await res.json()
      const replyText = data?.reply || friendlyReply(text)
      const assistant: Message = { role: "assistant", content: replyText }
      setMessages((prev) => [...prev, assistant])
      speak(replyText)

      // Optional action handling returned from backend
      const action = data?.action
      if (action && action.type) {
        try {
          await handleAssistantAction(action)
        } catch {}
      }
    } catch {
      const fallback = friendlyReply(text)
      const assistant: Message = { role: "assistant", content: fallback }
      setMessages((prev) => [...prev, assistant])
      speak(fallback)
    }
    setSending(false)
  }

  const handleAssistantAction = async (action: any) => {
    switch (action.type) {
      case 'navigate': {
        const to = action.params?.to || '/dashboard'
        router.push(String(to))
        return
      }
      case 'weather.query': {
        const location = String(action.params?.location || 'current location')
        const response = `Okay, fetching weather for ${location}.`
        setMessages((prev) => [...prev, { role: 'assistant', content: response }])
        speak(response)
        return
      }
      default:
        return
    }
  }

  const friendlyReply = (text: string): string => {
    const t = text.toLowerCase()
    if (t.includes("hello") || t.includes("hi")) return "Hello, this is C.L.I.M.A – Climate Learning & Intelligent Monitoring Assistant. How can I help you today?"
    if (t.includes("weather")) return "For weather, I can fetch the latest conditions and alerts. What city should I check?"
    if (t.includes("name")) return "I'm C.L.I.M.A – Climate Learning & Intelligent Monitoring Assistant. Nice to meet you!"
    return `You said: "${text}". I can help analyze weather, emergencies, and energy data.`
  }

  const startListening = () => {
    if (!recognitionRef.current) return
    setInterim("")
    setListening(true)
    listeningRef.current = true
    try { recognitionRef.current.start() } catch {}
    // Start volume visualization
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      mediaStreamRef.current = stream
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      source.connect(analyser)
      const data = new Uint8Array(analyser.fftSize)
      const tick = () => {
        analyser.getByteTimeDomainData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / data.length)
        const scale = 1 + Math.min(0.2, rms * 2)
        const opacity = Math.min(1, 0.5 + rms * 3)
        if (orbRef.current) {
          orbRef.current.style.setProperty("--orb-scale", String(scale))
          orbRef.current.style.setProperty("--wave-opacity", String(opacity))
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
    }).catch(() => {})
  }

  const stopListening = () => {
    if (!recognitionRef.current) return
    recognitionRef.current.stop()
    setListening(false)
    listeningRef.current = false
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop())
      mediaStreamRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  // Auto-scroll chat to the latest message
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  return (
    <main className="min-h-screen bg-transparent p-4 md:p-8 text-white">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="inline-block">
            <Button 
              variant="outline" 
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:border-white/40 transition-all duration-200 px-4 py-2 rounded-lg font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> 
              Back to Dashboard
            </Button>
          </Link>
          <div className="text-lg font-semibold text-white/80">
            C.L.I.M.A Assistant
          </div>
        </div>

        {/* Orb UI */}
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <div
            ref={orbRef}
            className={`ai-orb alive ${listening ? "listening" : "idle"}`}
            style={{ width: 360, height: 360 }}
            onClick={() => (listening ? stopListening() : startListening())}
            role="button"
            aria-label="Toggle listening"
          >
            <Image src="/assets/gpt-voice-orb.svg" alt="Voice orb" fill priority className="rounded-full object-cover" />
            {/* animated globe overlay (pure inline SVG – no global CSS) */}
            <svg
              className="absolute inset-0 rounded-full pointer-events-none"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* soft glow */}
              <defs>
                <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#8ae6ff" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#8ae6ff" stopOpacity="0" />
                </radialGradient>
                <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.2" />
                </filter>
              </defs>
              <circle cx="50" cy="50" r="49" fill="url(#glowGrad)" filter="url(#softBlur)" />
              
              {/* parallels */}
              <g stroke="#ffffff" strokeOpacity="0.55" strokeWidth="0.3" fill="none" opacity="0.8">
                <ellipse cx="50" cy="50" rx="36" ry="16" />
                <ellipse cx="50" cy="50" rx="28" ry="12" />
                <ellipse cx="50" cy="50" rx="20" ry="8" />
              </g>
              {/* meridians – slow spin */}
              <g stroke="#ffffff" strokeOpacity="0.45" strokeWidth="0.3" fill="none">
                <g>
                  <ellipse cx="50" cy="50" rx="36" ry="30" />
                  <ellipse cx="50" cy="50" rx="36" ry="30" transform="rotate(30 50 50)" />
                  <ellipse cx="50" cy="50" rx="36" ry="30" transform="rotate(60 50 50)" />
                  <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 50 50" to="360 50 50" dur="24s" repeatCount="indefinite" />
                </g>
                {/* counter rotation for depth */}
                <g opacity="0.6">
                  <ellipse cx="50" cy="50" rx="30" ry="26" />
                  <ellipse cx="50" cy="50" rx="30" ry="26" transform="rotate(45 50 50)" />
                  <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="360 50 50" to="0 50 50" dur="30s" repeatCount="indefinite" />
                </g>
              </g>
            </svg>
          </div>
          {/* Remove status text under orb to keep the UI clean */}
        </div>

        {/* Conversation area */}
        <div className="rounded-xl border border-white/10 bg-transparent p-4 md:p-6 shadow-sm flex flex-col mt-2">
          <div ref={listRef} className="max-h-[40vh] overflow-y-auto pr-1 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${m.role === 'user' ? 'ml-auto bg-blue-600 text-white' : 'bg-white/10 text-white'}`}>
                {m.content}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ChatGPT-style composer (always visible) */}
      <div className="fixed bottom-6 left-0 right-0 flex items-center justify-center px-4 z-50">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const t = typedMessage.trim()
            if (!t || sending) return
            setTypedMessage('')
            submit(t)
          }}
          className="w-full max-w-4xl"
        >
          <div className="flex items-center gap-3 rounded-2xl px-5 py-3 bg-white/95 backdrop-blur-sm shadow-lg ring-1 ring-black/5">
            <button 
              type="button" 
              className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors" 
              aria-label="Add attachment"
            >
              <Plus className="h-5 w-5" />
            </button>
            <Input
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              placeholder="Ask anything..."
              disabled={sending}
              className="border-0 focus-visible:ring-0 text-slate-800 placeholder:text-slate-500 bg-transparent text-base min-h-[24px] flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  const t = typedMessage.trim()
                  if (!t || sending) return
                  setTypedMessage('')
                  submit(t)
                }
              }}
            />
            {sending ? (
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                <div className="h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {typedMessage.trim() ? (
                  <button
                    type="submit"
                    className="h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label="Toggle microphone"
                    onClick={() => (listening ? stopListening() : startListening())}
                    className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                      listening 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <MicIcon className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </form>
      </div>

      {/* Floating mic and close buttons removed per request */}
    </main>
  )
}



