"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
  const [showChat, setShowChat] = useState(false)
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
    const user: Message = { role: "user", content: text }
    setMessages((prev) => [...prev, user])
    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, user] }),
      })
      const data = await res.json()
      const replyText = data?.reply || friendlyReply(text)
      const assistant: Message = { role: "assistant", content: replyText }
      setMessages((prev) => [...prev, assistant])
      speak(replyText)
    } catch {
      const fallback = friendlyReply(text)
      const assistant: Message = { role: "assistant", content: fallback }
      setMessages((prev) => [...prev, assistant])
      speak(fallback)
    }
  }

  const friendlyReply = (text: string): string => {
    const t = text.toLowerCase()
    if (t.includes("hello") || t.includes("hi")) return "Hello! How can I help you today?"
    if (t.includes("weather")) return "For weather, I can fetch the latest conditions and alerts. What city should I check?"
    if (t.includes("name")) return "I'm your ClimaTech assistant. Nice to meet you!"
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

  return (
    <main className="min-h-screen bg-transparent p-4 md:p-8 text-white">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20" onClick={() => setShowChat((v) => !v)}>
              {showChat ? 'Hide Chat' : 'Show Chat'}
            </Button>
            {listening ? (
              <Button onClick={stopListening} variant="destructive"><X className="h-4 w-4 mr-2" /> Stop</Button>
            ) : null}
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

        {/* Conversation below orb (no typing UI) */}
        {showChat && (
          <div className="rounded-xl border border-white/10 bg-transparent p-4 md:p-6 shadow-sm min-h-[260px] flex flex-col">
            <div className="flex-1 space-y-3 overflow-auto pr-1">
              {messages.map((m, i) => (
                <div key={i} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "ml-auto bg-blue-600 text-white" : "bg-white/10 text-white"}`}>
                  {m.content}
                </div>
              ))}
            </div>
            {/* No text composer per request */}
          </div>
        )}
      </div>

      {/* Bottom controls like GPT Voice */}
      <div className="fixed bottom-6 left-0 right-0 flex items-center justify-center gap-6 pointer-events-none">
        {/* Main mic button */}
        <button
          onClick={() => (listening ? stopListening() : startListening())}
          className={`pointer-events-auto h-16 w-16 rounded-full shadow-lg flex items-center justify-center transition-colors ${listening ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          aria-label={listening ? 'Stop microphone' : 'Start microphone'}
        >
          <Mic className="h-6 w-6 text-white" />
        </button>
        {/* Secondary icon (close) */}
        <button
          onClick={() => { try { stopListening() } catch {} ; router.push('/dashboard') }}
          className="pointer-events-auto h-16 w-16 rounded-full bg-white/10 border border-white/30 hover:bg-white/20 shadow-lg flex items-center justify-center"
          aria-label="Close assistant"
        >
          <X className="h-6 w-6 text-slate-900 dark:text-white" />
        </button>
      </div>
    </main>
  )
}



