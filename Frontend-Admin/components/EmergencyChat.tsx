"use client"

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Send, Loader2, Mic, Square } from "lucide-react"
import VoiceOrb from "@/components/VoiceOrb"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  time: string
}

export interface EmergencyChatRef {
  addAIResponse: (content: string) => void
}

const EmergencyChat = forwardRef<EmergencyChatRef, {}>((_, ref) => {
  const [hasMounted, setHasMounted] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'assistant-welcome',
    role: "assistant",
<<<<<<< HEAD
    content: "Hi, I'm your emergency assistant. Tell me your location or share coordinates, and I'll guide you with the right protocol, contacts, and nearest evacuation center.",
=======
    content: "Hi! I’m C.L.I.M.A — your ClimaTech assistant. Provide coordinates and I’ll check flood risk, then guide you to the right protocol, LGU contacts, and the nearest evacuation center.",
>>>>>>> kim
    time: "" // set on mount to avoid SSR/client mismatch
  }])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'responded' | 'error'>('idle')
  const listRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  const scrollToBottom = () => {
    setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 50)
  }

  // Clean text for voice synthesis - remove markdown and formatting
  const cleanTextForSpeech = (text: string): string => {
    return text
      // Remove markdown headers (##, ###, etc.)
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic asterisks and underscores
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove bullet points and list markers
      .replace(/^\s*[\*\-\+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // Remove horizontal rules
      .replace(/^---+$/gm, '')
      // Remove code blocks and inline code
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      // Clean up multiple spaces and newlines
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/\s+/g, ' ')
      // Remove special characters that don't add meaning for speech
      .replace(/[•◦▪▫]/g, '')
      // Clean up parentheses content that might be technical
      .replace(/\([^)]*%[^)]*\)/g, '')
      // Trim whitespace
      .trim()
  }

  // Speech synthesis function for AI responses
  const speakText = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    
    // Clean text for better speech synthesis
    const cleanedText = cleanTextForSpeech(text)
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(cleanedText)
    utterance.rate = 1
    utterance.pitch = 1
    utterance.volume = 1
    
    // Try to use a professional voice
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.name.includes('David') ||
      voice.name.includes('Alex')
    ) || voices[0]
    
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }
    
    window.speechSynthesis.speak(utterance)
  }

  // External method to add AI responses (called from dashboard)
  const addAIResponse = (content: string) => {
    const aiResponse: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content,
      time: new Date().toLocaleTimeString()
    }
    
    setMessages(prev => [...prev, aiResponse])
    setStatus('responded')
    setTimeout(() => setStatus('idle'), 1500)
    scrollToBottom()
    
    // Speak the AI response
    speakText(content)
  }

  // Expose methods to parent components via ref
  useImperativeHandle(ref, () => ({
    addAIResponse
  }))

  // Avoid hydration mismatch: set dynamic time after mount only
  useEffect(() => {
    setHasMounted(true)
    setMessages(prev => prev.map((m, i) => i === 0 ? { ...m, time: new Date().toLocaleTimeString() } : m))
    
    // Initialize speech synthesis
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis
      
      // Load voices
      const loadVoices = () => {
        window.speechSynthesis.getVoices()
      }
      loadVoices()
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices
      }
    }
    
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
      setStatus('listening')
      recognitionRef.current.start()
    } catch {}
  }

  const stopListening = () => {
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.stop()
      setListening(false)
      setStatus('idle')
      
      // Auto-send the message if there's input after voice recording
      setTimeout(() => {
        if (input.trim() && !busy) {
          send()
        }
      }, 500) // Small delay to ensure speech recognition has finished processing
      
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
      const res = await fetch('http://localhost:3000/api/assistant/chatLite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input.trim(),
          mode: "chat"
        })
      })

      const data = await res.json().catch(() => ({}))
      console.log('Chat API Response:', data) // Debug log
      
      // Extract response text from the API response
      let content = ''
      
      // Handle error responses first
      if (data.error) {
        content = `Error: ${data.error}`
      } 
      // Handle successful responses - the API returns the parsed JSON from Python
      else if (data.response) {
        content = data.response
      } else if (data.message) {
        content = data.message
      } else if (data.reply) {
        content = data.reply
      } else if (data.analysis) {
        content = data.analysis
      } else if (data.result) {
        content = data.result
      } else if (data.text) {
        content = data.text
      } else if (data.content) {
        content = data.content
      } else if (data.answer) {
        content = data.answer
      } else if (typeof data === 'string') {
        content = data
      } 
      // If data has any string properties, try to use the first one
      else if (typeof data === 'object' && data !== null) {
        const stringValues = Object.values(data).filter(val => typeof val === 'string' && val.trim().length > 0)
        if (stringValues.length > 0) {
          content = stringValues[0] as string
        } else {
          content = 'I processed your message but couldn\'t generate a readable response. Please try rephrasing your question.'
        }
      } 
      else if (res.ok) {
        content = 'I received your message but couldn\'t generate a proper response. Please try again.'
      } else {
        content = 'No response available.'
      }

      const assistantMessage: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content, time: new Date().toLocaleTimeString() }
      setMessages((m) => [...m, assistantMessage])
      setStatus('responded')
      setTimeout(() => setStatus('idle'), 1500)
      scrollToBottom()
      
      // Speak the assistant response
      speakText(content)
      
    } catch (e) {
      const errorContent = 'Unable to reach assistant right now. Please try again shortly.'
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'assistant', content: errorContent, time: new Date().toLocaleTimeString() }])
      setStatus('error')
      setTimeout(() => setStatus('idle'), 1500)
      
      // Speak the error message
      speakText(errorContent)
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
        {/* AI Globe (voice orb) */}
        <div className="flex items-center justify-center py-1">
          <VoiceOrb state={status} size={140} />
        </div>
        {/* Chat box (messages + input in one bordered box) */}
        <div className="rounded-lg border bg-white/60 overflow-hidden flex flex-col min-h-full sm:h-[480px]"
        style={{ height: '334px' }}>
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
              {/* Status circle */}
              <div className="relative h-3 w-3 mr-1" aria-live="polite" aria-label={`status-${status}`}>
                {status === 'listening' && (
                  <span className="absolute inset-0 rounded-full bg-blue-400/70 animate-ping" />
                )}
                {status === 'thinking' && (
                  <span className="absolute inset-0 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                )}
                {status === 'responded' && (
                  <span className="absolute inset-0 rounded-full bg-green-500" />
                )}
                {status === 'error' && (
                  <span className="absolute inset-0 rounded-full bg-red-500" />
                )}
                {status === 'idle' && (
                  <span className="absolute inset-0 rounded-full bg-gray-300" />
                )}
              </div>
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
              <Button type="submit" disabled={busy || !input.trim()} size="icon" className="h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setStatus('thinking')}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  )
})

EmergencyChat.displayName = "EmergencyChat"

export default EmergencyChat


