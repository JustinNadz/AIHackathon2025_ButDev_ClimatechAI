"use client"

import { useState } from "react"
import Header from "@/components/header"
import MapComponent from "@/components/map-component"
import DraggableChatPanel from "@/components/draggable-chat-panel"
import LearnSection from "@/components/learn-section"
import WeatherSection from "@/components/weather-section"
import AIAssistantSection from "@/components/ai-assistant-section"

export default function Home() {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [activeSection, setActiveSection] = useState("map")

  const handleTogglePanel = () => {
    setIsPanelOpen(!isPanelOpen)
  }

  const renderContent = () => {
    switch (activeSection) {
      case "learn":
        return <LearnSection />
      case "weather":
        return <WeatherSection />
      case "assistant":
        return <AIAssistantSection />
      default:
        return (
          <div className="w-full h-full">
            <MapComponent onLocationSelect={setSelectedLocation} selectedLocation={selectedLocation} />
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main Content Area */}
      <main className="relative h-[calc(100vh-80px)] overflow-hidden">
        {renderContent()}

        {/* Draggable Chat Panel - Only show on map section */}
        {activeSection === "map" && (
          <DraggableChatPanel isOpen={isPanelOpen} onToggle={handleTogglePanel} selectedLocation={selectedLocation} />
        )}

        {/* Floating Action Button - Only show on map section when panel is closed */}
        {activeSection === "map" && !isPanelOpen && (
          <div className="absolute bottom-8 right-8">
            <button
              onClick={handleTogglePanel}
              className="group relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full p-5 shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-3xl"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>

              {/* Pulsing ring animation */}
              <div className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20"></div>

              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                Open AI Assistant
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
