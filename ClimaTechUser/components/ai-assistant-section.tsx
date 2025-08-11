"use client"

import { useState } from "react"
import {
  Bot,
  MessageCircle,
  Zap,
  Globe,
  Brain,
  Sparkles,
  ArrowRight,
  Users,
  Star,
  BookOpen,
  Target,
  Play,
  CheckCircle,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AIAssistantSection() {
  const [selectedFeature, setSelectedFeature] = useState(0)
  const [activeTab, setActiveTab] = useState("overview")

  const features = [
    {
      icon: Globe,
      title: "Location Intelligence",
      description: "Get detailed information about any location including weather, attractions, and local insights.",
      color: "from-blue-500 to-blue-600",
      details:
        "Our AI can provide comprehensive information about any location worldwide, including historical data, cultural insights, tourist attractions, local customs, and real-time conditions.",
    },
    {
      icon: Brain,
      title: "Smart Recommendations",
      description: "Receive personalized travel suggestions based on your preferences and current location.",
      color: "from-green-500 to-green-600",
      details:
        "Using advanced machine learning algorithms, the AI analyzes your preferences, past interactions, and current context to provide highly personalized recommendations.",
    },
    {
      icon: Zap,
      title: "Real-time Assistance",
      description: "Get instant answers to your questions with our advanced AI-powered chat system.",
      color: "from-purple-500 to-purple-600",
      details:
        "Experience lightning-fast responses powered by state-of-the-art language models, capable of understanding context and providing accurate, helpful information.",
    },
    {
      icon: Sparkles,
      title: "Contextual Help",
      description: "Receive relevant information based on your map interactions and selected locations.",
      color: "from-yellow-500 to-yellow-600",
      details:
        "The AI understands your current context, including selected locations on the map, recent searches, and conversation history to provide more relevant assistance.",
    },
  ]

  const useCases = [
    {
      title: "Travel Planning",
      description: "Plan your next trip with AI-powered recommendations",
      example: "What are the best places to visit in Tokyo for a 3-day trip?",
      category: "Travel",
      difficulty: "Beginner",
    },
    {
      title: "Weather Insights",
      description: "Get detailed weather information and forecasts",
      example: "What's the weather like in Paris next week?",
      category: "Weather",
      difficulty: "Beginner",
    },
    {
      title: "Local Discovery",
      description: "Discover hidden gems and local attractions",
      example: "Find me the best local restaurants near Central Park",
      category: "Discovery",
      difficulty: "Intermediate",
    },
    {
      title: "Navigation Help",
      description: "Get directions and transportation advice",
      example: "How do I get from Times Square to Brooklyn Bridge?",
      category: "Navigation",
      difficulty: "Beginner",
    },
    {
      title: "Cultural Insights",
      description: "Learn about local customs and cultural information",
      example: "What should I know about Japanese etiquette before visiting?",
      category: "Culture",
      difficulty: "Intermediate",
    },
    {
      title: "Event Planning",
      description: "Plan events and activities based on location and weather",
      example: "Help me plan an outdoor wedding in California for next spring",
      category: "Planning",
      difficulty: "Advanced",
    },
  ]

  const capabilities = [
    {
      icon: MessageCircle,
      title: "Natural Language Processing",
      description: "Understands complex queries in natural language",
      examples: ["Conversational interactions", "Context understanding", "Multi-language support"],
    },
    {
      icon: Globe,
      title: "Global Knowledge Base",
      description: "Access to comprehensive worldwide location data",
      examples: ["Real-time information", "Historical data", "Cultural insights"],
    },
    {
      icon: Brain,
      title: "Machine Learning",
      description: "Learns from interactions to provide better responses",
      examples: ["Personalized recommendations", "Preference learning", "Adaptive responses"],
    },
    {
      icon: Zap,
      title: "Real-time Processing",
      description: "Instant responses with up-to-date information",
      examples: ["Live weather data", "Current events", "Real-time updates"],
    },
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Travel Blogger",
      content:
        "The AI assistant helped me discover amazing hidden gems in Tokyo that I never would have found otherwise. It's like having a local guide in your pocket!",
      rating: 5,
      avatar: "SJ",
    },
    {
      name: "Mike Chen",
      role: "Business Traveler",
      content:
        "Perfect for business trips. The weather forecasts and local recommendations have saved me so much time and helped me make better decisions.",
      rating: 5,
      avatar: "MC",
    },
    {
      name: "Emma Rodriguez",
      role: "Adventure Seeker",
      content:
        "I love how the AI understands my preferences and suggests activities that match my interests. It's made trip planning so much easier and more enjoyable.",
      rating: 5,
      avatar: "ER",
    },
    {
      name: "David Kim",
      role: "Family Traveler",
      content:
        "Great for family trips! The AI helps find kid-friendly activities and restaurants, and the weather alerts keep us prepared for any conditions.",
      rating: 4,
      avatar: "DK",
    },
  ]

  const tutorials = [
    {
      title: "Getting Started with AI Chat",
      duration: "3 min",
      difficulty: "Beginner",
      description: "Learn the basics of interacting with the AI assistant",
      steps: ["Open the chat panel", "Ask your first question", "Understand responses", "Use follow-up questions"],
    },
    {
      title: "Advanced Query Techniques",
      duration: "7 min",
      difficulty: "Intermediate",
      description: "Master advanced techniques for better AI interactions",
      steps: [
        "Structure complex queries",
        "Use context effectively",
        "Chain related questions",
        "Interpret detailed responses",
      ],
    },
    {
      title: "Location-Based Assistance",
      duration: "5 min",
      difficulty: "Beginner",
      description: "Use map selection for contextual AI help",
      steps: [
        "Select locations on map",
        "Ask location-specific questions",
        "Get local recommendations",
        "Save important information",
      ],
    },
    {
      title: "Travel Planning Mastery",
      duration: "10 min",
      difficulty: "Advanced",
      description: "Plan complete trips using AI assistance",
      steps: ["Define trip parameters", "Get destination recommendations", "Plan itineraries", "Handle logistics"],
    },
  ]

  const stats = [
    { label: "Questions Answered", value: "1M+", icon: MessageCircle },
    { label: "Locations Covered", value: "195", icon: Globe },
    { label: "User Satisfaction", value: "98%", icon: Star },
    { label: "Response Time", value: "<2s", icon: Zap },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-8">
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    selectedFeature === index ? "ring-2 ring-blue-300 bg-blue-50" : "bg-white/80 backdrop-blur-sm"
                  }`}
                  onClick={() => setSelectedFeature(index)}
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                  <p className="text-xs text-gray-500">{feature.details}</p>
                </Card>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <Card key={index} className="p-4 text-center bg-white/80 backdrop-blur-sm">
                  <stat.icon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </Card>
              ))}
            </div>
          </div>
        )

      case "capabilities":
        return (
          <div className="space-y-6">
            {capabilities.map((capability, index) => (
              <Card
                key={index}
                className="p-6 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <capability.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-2">{capability.title}</h3>
                    <p className="text-gray-600 mb-4">{capability.description}</p>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Key Features:</p>
                      {capability.examples.map((example, exampleIndex) => (
                        <div key={exampleIndex} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-600">{example}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )

      case "use-cases":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {useCases.map((useCase, index) => (
              <Card
                key={index}
                className="p-6 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-800">{useCase.title}</h3>
                  <div className="flex space-x-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{useCase.category}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        useCase.difficulty === "Beginner"
                          ? "bg-green-100 text-green-800"
                          : useCase.difficulty === "Intermediate"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {useCase.difficulty}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{useCase.description}</p>
                <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500 mb-4">
                  <p className="text-sm text-gray-700 italic">"{useCase.example}"</p>
                </div>
                <div className="flex items-center text-blue-600 group-hover:text-blue-700">
                  <span className="text-sm font-medium">Try this example</span>
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            ))}
          </div>
        )

      case "tutorials":
        return (
          <div className="space-y-6">
            {tutorials.map((tutorial, index) => (
              <Card
                key={index}
                className="p-6 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">{tutorial.title}</h3>
                    <p className="text-gray-600 mb-3">{tutorial.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-1">
                      {tutorial.duration}
                    </span>
                    <br />
                    <span
                      className={`inline-block text-xs px-2 py-1 rounded-full ${
                        tutorial.difficulty === "Beginner"
                          ? "bg-green-100 text-green-800"
                          : tutorial.difficulty === "Intermediate"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {tutorial.difficulty}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium text-gray-700">What you'll learn:</p>
                  {tutorial.steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="flex items-center space-x-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                        {stepIndex + 1}
                      </span>
                      <span className="text-sm text-gray-600">{step}</span>
                    </div>
                  ))}
                </div>
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                  Start Tutorial
                  <Play className="ml-2 h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        )

      case "testimonials":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="p-6 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    <div className="flex items-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < testimonial.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.content}"</p>
              </Card>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 via-white to-green-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-green-500 p-4 rounded-2xl shadow-lg">
              <Bot className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent mb-4">
            AI Assistant
          </h1>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Your intelligent companion for location-based queries, weather information, and travel assistance. Powered
            by advanced AI to provide accurate and helpful responses.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { id: "overview", label: "Overview", icon: Bot },
            { id: "capabilities", label: "Capabilities", icon: Brain },
            { id: "use-cases", label: "Use Cases", icon: Target },
            { id: "tutorials", label: "Tutorials", icon: BookOpen },
            { id: "testimonials", label: "Reviews", icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white/80 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mb-12">{renderTabContent()}</div>

        {/* Featured Content */}
        <Card className="mb-12 p-8 bg-gradient-to-r from-blue-500 to-green-500 text-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-lg opacity-90 mb-6">
                Click the chat button to start a conversation with our AI assistant. Ask questions about locations,
                weather, or get travel recommendations.
              </p>
              <div className="flex items-center space-x-4">
                <Button className="bg-white text-blue-600 hover:bg-gray-100 font-semibold">
                  Open Chat Assistant
                  <MessageCircle className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/20 p-6 rounded-2xl">
                <Bot className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Tips */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
            Pro Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-800 mb-2">Be Specific</h4>
              <p className="text-sm text-gray-600">
                Include location details and specific questions for better results
              </p>
            </div>
            <div className="text-center p-4">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Globe className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-800 mb-2">Use Map Selection</h4>
              <p className="text-sm text-gray-600">Click on the map to select locations for contextual assistance</p>
            </div>
            <div className="text-center p-4">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-800 mb-2">Follow Up</h4>
              <p className="text-sm text-gray-600">Ask follow-up questions to get more detailed information</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
