"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, Send, Grip, Bot, User, ChevronUp, ChevronDown, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { callEnhancedAssistant, type AssistantRequest } from "@/lib/api"

interface DraggableChatPanelProps {
  isOpen: boolean
  onToggle: () => void
  selectedLocation: { lat: number; lng: number } | null
}

type PanelState = "minimized" | "half" | "full"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface FloatingMessage {
  id: string
  question: string
  response: string
  cityName?: string
  timestamp: number
}

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

  // Custom chat state management
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! 👋 I'm your ClimaTech AI assistant. I can help you with climate risks, weather information, natural disaster preparedness, and location-specific hazard assessments. Click on the map to select a location and I'll provide detailed risk analysis and safety recommendations for that area!",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // Floating chat state
  const [floatingMessage, setFloatingMessage] = useState<FloatingMessage | null>(null)
  const [showFloating, setShowFloating] = useState(false)

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

  // Custom chat submission to backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = input.trim()
    setInput("")
    setIsLoading(true)

    // Clear any existing floating message when starting new conversation
    if (showFloating) {
      setShowFloating(false)
      setFloatingMessage(null)
    }

    try {
      // Prepare request for enhanced assistant API
      const requestBody: AssistantRequest = {
        question: currentInput,
      }

      // Include location data if available
      if (selectedLocation) {
        requestBody.lat = selectedLocation.lat
        requestBody.lng = selectedLocation.lng
      }

      // Call the enhanced assistant API
      const data = await callEnhancedAssistant(requestBody)
      
      // Check if this is a floating response (city-specific weather)
      if (data.is_floating_response && data.detected_city) {
        // Create assistant message for main chat history
        let responseContent = data.response || "I'm sorry, I couldn't process your request at the moment. Please try again."
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: responseContent,
        }

        // Add to main chat history so conversation is preserved
        setMessages(prev => [...prev, assistantMessage])
        
        // Create floating message
        const floatingMsg: FloatingMessage = {
          id: Date.now().toString(),
          question: currentInput,
          response: data.response,
          cityName: data.detected_city.name,
          timestamp: Date.now()
        }
        
        // Set up floating message first, then close panel
        setFloatingMessage(floatingMsg)
        
        // Close main panel and show floating bubble after a small delay
        onToggle() // Close the main panel
        
        // Small delay to ensure panel closes first, then show floating
        setTimeout(() => {
          setShowFloating(true)
        }, 100)
        
        return
      }
      
      // Regular response handling
      let responseContent = data.response || "I'm sorry, I couldn't process your request at the moment. Please try again."
      
      // Add model information as a small note (optional)
      if (data.model_used && data.model_used !== "error_fallback") {
        const modelName = data.model_used === "google/gemma-3-27b-it:free" ? "🤖 Enhanced AI" : 
                         data.model_used === "rag_fallback" ? "📚 Knowledge Base" : "AI Assistant"
        responseContent += `\n\n*Powered by ${modelName}*`
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I'm having trouble connecting to the backend right now. Please make sure the backend server is running and try again.",
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
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

  const panelHeight = getCurrentHeight()

  return (
    <>
      {/* Single Round AI Assistant Button - Always visible in bottom right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-4">
        {/* Floating Chat Bubble - Shows above button when needed */}
        {showFloating && floatingMessage && (
          <div className="max-w-sm bg-gradient-to-br from-blue-600 to-green-500 text-white rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm font-medium">ClimatechAI</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFloating(false)}
                className="text-white hover:bg-white/20 h-6 w-6 p-0 rounded-full"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {floatingMessage.response}
            </div>
            
            <div className="mt-3 pt-2 border-t border-white/20">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowFloating(false)
                  if (!isOpen) {
                    onToggle() // Only reopen main chat if it's currently closed
                  }
                }}
                className="text-white hover:bg-white/20 text-xs w-full"
              >
                Continue conversation
              </Button>
            </div>
          </div>
        )}
        
        {/* Single Round AI Button - Handles all interactions */}
        <div className="relative">
          <Button
            onClick={() => {
              if (showFloating) {
                // If floating chat is open, close it
                setShowFloating(false)
              } else if (isOpen) {
                // If main panel is open, close it
                onToggle()
              } else {
                // If everything is closed, open main panel
                onToggle()
              }
            }}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 shadow-2xl border-2 border-white/20 transition-all duration-300 hover:scale-110"
          >
            <div className="relative">
              <Bot className="h-6 w-6 text-white" />
              {/* Thinking animation when loading */}
              {isLoading && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
              )}
              {/* Notification dot when floating message is available */}
              {floatingMessage && !showFloating && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white"></div>
              )}
            </div>
          </Button>
          
          {/* City name label - only show when floating message exists */}
          {floatingMessage && floatingMessage.cityName && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {floatingMessage.cityName}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Panel - Only show when opened */}
      {isOpen && (
        <>
          {/* Backdrop overlay when panel is open */}
          {(panelState === "half" || panelState === "full") && (
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
                  <span className="font-semibold text-white text-lg">ClimaTech AI Assistant</span>
                  <p className="text-sm text-white/80">Climate Risk & Disaster Preparedness AI</p>
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
            {(panelState === "half" || panelState === "full") && (
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
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
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
                      placeholder={selectedLocation 
                        ? "Ask about climate risks, weather, or safety recommendations for this location..." 
                        : "Ask about climate risks, disasters, preparedness, or select a location on the map..."}
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
                    💡 Try asking: "What are the climate risks here?" or "How should I prepare for disasters?"
                    {selectedLocation && (
                      <span className="block text-green-300">📍 Location selected: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}</span>
                    )}
                  </div>
                </form>
              </>
            )}
          </Card>
        </>
      )}
    </>
  )
}
