"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { X, Send, Grip, Bot, User, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface DraggableChatPanelProps {
  isOpen: boolean
  onToggle: () => void
  selectedLocation: { lat: number; lng: number } | null
}

type PanelState = "minimized" | "half" | "full"

export default function DraggableChatPanel({ isOpen, onToggle, selectedLocation }: DraggableChatPanelProps) {
  const [panelState, setPanelState] = useState<PanelState>("full")
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const dragRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [viewportHeight, setViewportHeight] = useState<number>(
    typeof window === "undefined" ? 800 : window.innerHeight
  )

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "1",
        role: "assistant",
        content:
          "Hello! 👋 I'm your AI assistant. I can help you with information about locations, weather forecasts, travel recommendations, and answer any questions you have. Click on the map to select a location and I'll provide detailed information about that area!",
      },
    ],
  })

  // Panel height configurations
  const panelHeights = {
    minimized: 80, // Just header visible
    half: 400, // Half screen
    full: Math.max(0, viewportHeight - 100), // Full screen minus header space
  }

  // Track viewport height on mount and resize (client-only)
  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight)
    // Initialize on mount
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Get current panel height based on state
  const getCurrentHeight = () => {
    if (!isOpen) return 0
    return panelHeights[panelState] + (isDragging ? currentY : 0)
  }

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStartY(e.clientY)
    setCurrentY(0)
  }

  // Handle drag and snap logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaY = dragStartY - e.clientY
        setCurrentY(deltaY)
      }
    }

    const handleMouseUp = () => {
      if (isDragging) {
        const finalY = currentY
        const currentHeight = panelHeights[panelState] + finalY

        // Determine new state based on final position
        if (currentHeight < 150) {
          setPanelState("minimized")
        } else if (currentHeight < 300) {
          setPanelState("half")
        } else {
          setPanelState("full")
        }

        setCurrentY(0)
        setIsDragging(false)
      }
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragStartY, currentY, panelState])

  if (!isOpen) {
    return null
  }

  const panelHeight = getCurrentHeight()

  return (
    <>
      {/* Backdrop overlay when panel is open */}
      {panelState !== "minimized" && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-30"
          onClick={() => setPanelState("minimized")}
        />
      )}

      {/* Main Panel */}
      <Card
        ref={panelRef}
        className="fixed bottom-0 left-0 right-0 bg-black/20 backdrop-blur-xl border-t border-white/30 shadow-2xl z-40 flex flex-col overflow-hidden transition-all duration-300 ease-out"
        style={{
          height: `${panelHeight}px`,
          maxHeight: `${Math.max(0, viewportHeight - 90)}px`, // Ensure it doesn't overlap header
        }}
      >
        {/* Draggable Header */}
        <div
          ref={dragRef}
          className="flex items-center justify-between p-4 border-b border-white/20 cursor-grab active:cursor-grabbing bg-gradient-to-r from-blue-600/90 to-green-500/90"
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center space-x-3">
            <Grip className="h-5 w-5 text-white/80" />
            <div className="bg-white/20 p-2 rounded-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-semibold text-white text-lg">AI Assistant</span>
              <p className="text-sm text-white/80">Intelligent Location & Weather Helper</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Panel State Controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPanelState(panelState === "full" ? "half" : "full")}
              className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-full"
            >
              {panelState === "full" ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content Area - Only show when not minimized */}
        {panelState !== "minimized" && (
          <>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-black/5">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] flex items-start space-x-3 ${message.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                        message.role === "user" ? "bg-blue-600" : "bg-gradient-to-r from-green-500 to-blue-500"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-2xl shadow-lg backdrop-blur-sm ${
                        message.role === "user"
                          ? "bg-blue-600/90 text-white rounded-br-md"
                          : "bg-white/95 text-gray-800 rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center shadow-lg">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-white/95 text-gray-800 p-3 rounded-2xl rounded-bl-md shadow-lg backdrop-blur-sm">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/20 bg-white/5">
              <div className="flex space-x-3">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask about weather, locations, attractions, or anything else..."
                  className="flex-1 bg-white/90 border-white/30 text-gray-800 placeholder-gray-500 rounded-xl h-12 px-4 text-sm"
                />
                <Button
                  type="submit"
                  disabled={!!isLoading || !(input?.trim())}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl px-6 h-12 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              <div className="mt-2 text-xs text-white/60 text-center">
                💡 Try asking: "What's the weather like here?" or "Tell me about this location"
              </div>
            </form>
          </>
        )}
      </Card>
    </>
  )
}
