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

  const openChatOnMap = () => {
    setActiveSection("map")
    setIsPanelOpen(true)
  }

  const goToMap = () => {
    setActiveSection("map")
  }

  const renderContent = () => {
    switch (activeSection) {
      case "learn":
        return <LearnSection onGoToMap={goToMap} onOpenChatOnMap={openChatOnMap} />
      case "weather":
        return <WeatherSection />
      case "assistant":
        return <AIAssistantSection onOpenChatOnMap={openChatOnMap} />
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
      <main
        className={`relative ${
          activeSection === "map"
            ? "h-[calc(100vh-80px)] overflow-hidden"
            : "min-h-[calc(100vh-80px)] overflow-y-auto"
        }`}
      >
        {renderContent()}

        {/* Draggable Chat Panel - Only show on map section */}
        {activeSection === "map" && (
          <DraggableChatPanel isOpen={isPanelOpen} onToggle={handleTogglePanel} selectedLocation={selectedLocation} />
        )}

        {/* Floating Action Button - Only show on map section when panel is closed */}
        {activeSection === "map" && !isPanelOpen && (
          <div className="absolute bottom-8 right-8">
            <div className="relative h-16 w-16">
              {/* Pulsing radar effect behind the button */}
              <div className="pointer-events-none absolute -inset-5 rounded-full bg-blue-500/20 animate-ping" style={{ animationDuration: "2.5s" }}></div>
              <div className="pointer-events-none absolute -inset-1 rounded-full bg-blue-500/20 blur-lg"></div>

              <button
                onClick={handleTogglePanel}
                className="group relative h-16 w-16 bg-white rounded-full border border-blue-100 shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-3xl flex items-center justify-center"
              >
                <img src="/climatech-logo.png" alt="ClimaTech Chat" className="w-12 h-12 object-contain" />

                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                  ClimaTech AI Assistant
                  <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
