"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { StatusCards } from "@/components/status-cards"
import { InteractiveMap } from "@/components/interactive-map"

import { useState } from "react"
import VoiceAssistant from "@/components/VoiceAssistant"
import { EmergencyAlerts } from "@/components/emergency-alerts"
import { Button } from "@/components/ui/button"
import { CloudUpload, Cpu } from "lucide-react"
import EmergencyChat from "@/components/EmergencyChat"

export default function DashboardPage() {
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [isSendingLive, setIsSendingLive] = useState(false)
  const [isSendingSim, setIsSendingSim] = useState(false)

  const sendLiveWeather = async () => {
    try {
      setIsSendingLive(true)
      // Hit a backend endpoint to ingest current weather (implement in backend)
      const resp = await fetch(`http://localhost:3000/api/assistant/chatLite`, { 
        method: 'POST',
        body: JSON.stringify({
          prompt: {
            latitude: 10.7302,
            longitude: 122.5591,
            category: "Severe Tropical Storm",
            sustainedWind_kmh: 89,
            gustWind_kmh: 115,
            humidity_pct: 85,
            temperature_c: 24,
            rainfallRate_mm_hr: 30
          },
          mode: "detect"
        })
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      alert('Live weather data sent successfully')
    } catch (err) {
      console.error('sendLiveWeather failed:', err)
      alert('Failed to send live weather data')
    } finally {
      setIsSendingLive(false)
    }
  }

  const sendSimulatedWeather = async () => {
    try {
      setIsSendingSim(true)
      // Example simulated payload; backend should accept scenario and values
      const payload = {
        scenario: 'heavy_rainfall_warning',
        location: { lat: 10.7202, lng: 122.5621, name: 'Iloilo City' },
        temperature_c: 25.5,
        humidity_pct: 92,
        rainfall_mm_hr: 35,
        wind_kmh: 60,
        issued_at: new Date().toISOString()
      }
      const resp = await fetch(`${BACKEND_BASE_URL}/api/weather/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      alert('Simulation data submitted successfully')
    } catch (err) {
      console.error('sendSimulatedWeather failed:', err)
      alert('Failed to submit simulation data')
    } finally {
      setIsSendingSim(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full overflow-x-visible">
        {/* Quick Actions */}
        <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <Button
            onClick={sendLiveWeather}
            disabled={isSendingLive}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 px-4 py-2 rounded-lg"
          >
            <CloudUpload className="w-4 h-4" />
            {isSendingLive ? 'Sending Live Weather…' : 'Send Live Weather to AI'}
          </Button>

          <Button
            onClick={sendSimulatedWeather}
            disabled={isSendingSim}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50 flex items-center gap-2 px-4 py-2 rounded-lg"
          >
            <Cpu className="w-4 h-4" />
            {isSendingSim ? 'Sending Simulation…' : 'Send Weather Simulation'}
          </Button>
        </div>

        {/* Status Cards Row */}
        <StatusCards />

        {/* Main Content Grid with proper responsive layout */}
        <div className="grid lg:grid-cols-3 gap-6 w-full min-w-0">
          {/* Interactive Map - Takes up 2 columns */}
          <div className="lg:col-span-2 min-w-0 w-full">
            <InteractiveMap />
          </div>

          {/* Right Panel */}
          <div className="space-y-6 min-w-0 w-full">
            <EmergencyChat />
          </div>
        </div>

        <VoiceAssistant open={assistantOpen} onOpenChange={setAssistantOpen} />
      </div>
    </DashboardLayout>
  )
}
