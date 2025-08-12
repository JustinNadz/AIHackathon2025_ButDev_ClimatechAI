"use client"

import { useState } from "react"
import { Play, CheckCircle, MapPin, MessageCircle, Cloud, Navigation, Sparkles, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function LearnSection({ onGoToMap, onOpenChatOnMap }: { onGoToMap: () => void; onOpenChatOnMap: () => void }) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const toggleStep = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) {
      setCompletedSteps(completedSteps.filter((step) => step !== stepIndex))
    } else {
      setCompletedSteps([...completedSteps, stepIndex])
    }
  }

  const gettingStartedSteps = [
    {
      icon: MapPin,
      title: "Explore the Interactive Map",
      description: "Click anywhere on the map to select locations and discover new places.",
      details:
        "The map is your main interface for exploring locations. Simply click on any area to select it and get detailed information about that location.",
    },
    {
      icon: MessageCircle,
      title: "Chat with AI Assistant",
      description: "Open the chat panel to ask questions about locations, weather, and travel.",
      details:
        "Click the chat button in the bottom-right corner to start a conversation. The AI can help with weather forecasts, local attractions, and travel recommendations.",
    },
    {
      icon: Cloud,
      title: "Check Weather Information",
      description: "Get real-time weather data and forecasts for any location worldwide.",
      details:
        "Use the Weather section to get detailed weather information, or ask the AI assistant about weather conditions for specific locations.",
    },
    {
      icon: Navigation,
      title: "Navigate Between Sections",
      description: "Use the header navigation to access different features and tools.",
      details:
        "Switch between Learn, Weather, and AI Assistant sections using the navigation menu. Each section offers unique features and information.",
    },
  ]

  const features = [
    {
      icon: MapPin,
      title: "Interactive Map",
      description: "Click to explore locations worldwide",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: MessageCircle,
      title: "AI Chat Assistant",
      description: "Get instant answers to your questions",
      color: "from-green-500 to-green-600",
    },
    {
      icon: Cloud,
      title: "Weather Forecasts",
      description: "Real-time weather data and predictions",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: Sparkles,
      title: "Smart Recommendations",
      description: "Personalized travel and location suggestions",
      color: "from-yellow-500 to-yellow-600",
    },
  ]

  const tips = [
    {
      title: "Ask Specific Questions",
      description: "Be detailed in your questions for better AI responses",
      example: "Instead of 'weather', ask 'What's the weather like in Tokyo tomorrow?'",
    },
    {
      title: "Use Map Selection",
      description: "Click on the map to provide location context to the AI",
      example: "Select a location first, then ask about local attractions or weather",
    },
    {
      title: "Explore Different Sections",
      description: "Each section offers unique features and information",
      example: "Use Weather for detailed forecasts, AI Assistant for general help",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-green-500 p-4 rounded-2xl shadow-lg">
              <Play className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent mb-4">
            Learn How to Use ClimaTech AI
          </h1>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Master the features of ClimaTech AI with our comprehensive guide. Learn how to navigate, interact with the AI
            assistant, and make the most of our location-based tools.
          </p>
        </div>

        {/* Getting Started Steps */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
            Getting Started
          </h2>
          <div className="space-y-4">
            {gettingStartedSteps.map((step, index) => (
              <Card
                key={index}
                className={`p-6 cursor-pointer transition-all duration-300 ${
                  completedSteps.includes(index)
                    ? "bg-green-50 border-green-200 shadow-md"
                    : "bg-white/80 backdrop-blur-sm hover:shadow-lg"
                }`}
                onClick={() => toggleStep(index)}
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                      completedSteps.includes(index)
                        ? "bg-green-500 text-white"
                        : "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                    }`}
                  >
                    {completedSteps.includes(index) ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <step.icon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-2">{step.title}</h3>
                    <p className="text-gray-600 mb-3">{step.description}</p>
                    <p className="text-sm text-gray-500">{step.details}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <ArrowRight
                      className={`h-5 w-5 transition-transform ${
                        completedSteps.includes(index) ? "rotate-90 text-green-500" : "text-gray-400"
                      }`}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Pro Tips */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Sparkles className="h-6 w-6 text-yellow-500 mr-2" />
            Pro Tips
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tips.map((tip, index) => (
              <Card
                key={index}
                className="p-6 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
              >
                <h3 className="font-semibold text-gray-800 mb-3">{tip.title}</h3>
                <p className="text-gray-600 mb-4">{tip.description}</p>
                <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm text-blue-700 font-medium">💡 {tip.example}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Start Actions */}
        <Card className="p-8 bg-gradient-to-r from-blue-500 to-green-500 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg opacity-90 mb-6">
            Now that you know the basics, start exploring! Click on the map, chat with the AI, or check the weather.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-white text-blue-600 hover:bg-gray-100 font-semibold" onClick={onGoToMap}>
              Go to Map
              <MapPin className="ml-2 h-4 w-4" />
            </Button>
            <Button
              className="bg-white/20 text-white hover:bg-white/30 font-semibold border border-white/30"
              onClick={onOpenChatOnMap}
            >
              Open AI Chat
              <MessageCircle className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
