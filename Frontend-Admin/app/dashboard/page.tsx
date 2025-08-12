"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { StatusCards } from "@/components/status-cards"
import { InteractiveMap, InteractiveMapRef } from "@/components/interactive-map"

import { useState, useRef } from "react"
import VoiceAssistant from "@/components/VoiceAssistant"
import { EmergencyAlerts } from "@/components/emergency-alerts"
import { Button } from "@/components/ui/button"
import { CloudUpload, Cpu } from "lucide-react"
import EmergencyChat, { EmergencyChatRef } from "@/components/EmergencyChat"

// Fix the BACKEND_BASE_URL constant
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:5000'

export default function DashboardPage() {
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [isSendingLive, setIsSendingLive] = useState(false)
  const [isSendingSim, setIsSendingSim] = useState(false)
  const emergencyChatRef = useRef<EmergencyChatRef>(null)
  const interactiveMapRef = useRef<InteractiveMapRef>(null)

  const sendLiveWeather = async () => {
    try {
      setIsSendingLive(true)
      
      // Create environmental data object
      const environmentalData = {
        latitude: 10.7302,
        longitude: 122.5591,
        category: "Severe Tropical Storm",
        sustainedWind_kmh: 89,
        gustWind_kmh: 115,
        humidity_pct: 85,
        temperature_c: 24,
        rainfallRate_mm_hr: 30
      }
      
      console.log('🌤️ Sending environmental data to AI:', environmentalData);
      
      // Hit a backend endpoint to ingest current weather (implement in backend)
      const resp = await fetch(`http://localhost:3000/api/assistant/chatLite`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: JSON.stringify(environmentalData), // Convert object to JSON string
          mode: "detect"
        })
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const data = await resp.json()
      console.log('AI Response:', data)
      
      // Extract response text from the API response
      let responseText = ''
      
      // Handle error responses first
      if (data.error) {
        responseText = `Error: ${data.error}`
      } 
      // Handle successful responses - the API returns the parsed JSON from Python
      else if (data.response) {
        responseText = data.response
      } else if (data.message) {
        responseText = data.message
      } else if (data.reply) {
        responseText = data.reply
      } else if (data.analysis) {
        responseText = data.analysis
      } else if (data.result) {
        responseText = data.result
      } else if (data.text) {
        responseText = data.text
      } else if (data.content) {
        responseText = data.content
      } else if (data.answer) {
        responseText = data.answer
      } else if (typeof data === 'string') {
        responseText = data
      } 
      // If data has any string properties, try to use the first one
      else if (typeof data === 'object' && data !== null) {
        const stringValues = Object.values(data).filter(val => typeof val === 'string' && val.trim().length > 0)
        if (stringValues.length > 0) {
          responseText = stringValues[0] as string
        } else {
          responseText = `Weather data analysis complete. Detected: ${data.category || 'weather event'} with ${data.severity || 'unknown'} severity level.`
        }
      } else {
        // Fallback: try to extract meaningful content or stringify
        responseText = `Weather data analysis complete. Detected: ${data.category || 'weather event'} with ${data.severity || 'unknown'} severity level.`
      }
      
      // Send the response to the chat and trigger voice
      if (emergencyChatRef.current && responseText.trim()) {
        emergencyChatRef.current.addAIResponse(responseText)
      } else {
        console.warn('No valid response text found or chat ref not available')
      }
      
      // Check and display flood areas on map based on the environmental data sent
      if (interactiveMapRef.current) {
        interactiveMapRef.current.checkAndDisplayFloodAreas(environmentalData)
      }
      
    } catch (err) {
      console.error('sendLiveWeather failed:', err)
      
      // Also show error in chat if possible
      if (emergencyChatRef.current) {
        emergencyChatRef.current.addAIResponse('Sorry, I encountered an error while processing the weather data. Please try again.')
      } else {
        alert('Failed to send live weather data')
      }
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
        location: { lat: 8.951549, lng: 125.527725, name: 'btuuan City' },
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
            <InteractiveMap ref={interactiveMapRef} />
          </div>

          {/* Right Panel */}
          <div className="space-y-6 min-w-0 w-full">
            <EmergencyChat ref={emergencyChatRef} />
          </div>
        </div>

        <VoiceAssistant open={assistantOpen} onOpenChange={setAssistantOpen} />
      </div>
    </DashboardLayout>
  )
}
