"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Mic, Square } from "lucide-react"

export default function VoiceAssistant({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [transcript, setTranscript] = useState<string>("")
  const [listening, setListening] = useState<boolean>(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const SpeechRecognition: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: any) => {
      let text = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript
      }
      setTranscript(text)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition
  }, [])

  const startListening = () => {
    if (!recognitionRef.current) return
    setTranscript("")
    setListening(true)
    try {
      recognitionRef.current.start()
    } catch {}
  }

  const stopListening = () => {
    if (!recognitionRef.current) return
    recognitionRef.current.stop()
    setListening(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Voice Assistant</h2>
            <p className="text-sm text-muted-foreground">Ask questions or give commands using your voice</p>
          </div>

          <div className="min-h-[120px] rounded-md border p-3 text-sm whitespace-pre-wrap">
            {transcript || "Listening transcript will appear here..."}
          </div>

          <div className="flex items-center justify-center gap-3">
            {!listening ? (
              <Button onClick={startListening} className="bg-blue-600 hover:bg-blue-700">
                <Mic className="h-4 w-4 mr-2" /> Start
              </Button>
            ) : (
              <Button onClick={stopListening} variant="destructive">
                <Square className="h-4 w-4 mr-2" /> Stop
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


