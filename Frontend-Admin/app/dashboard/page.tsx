"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { StatusCards } from "@/components/status-cards"
import { InteractiveMap } from "@/components/interactive-map"

import { AIForecastingPanel } from "@/components/ai-forecasting-panel"
import { useState } from "react"
import VoiceAssistant from "@/components/VoiceAssistant"
import { EmergencyAlerts } from "@/components/emergency-alerts"

export default function DashboardPage() {
  const [assistantOpen, setAssistantOpen] = useState(false)

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full overflow-x-visible">
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
            <EmergencyAlerts />
          </div>
        </div>


        <VoiceAssistant open={assistantOpen} onOpenChange={setAssistantOpen} />
      </div>
    </DashboardLayout>
  )
}
