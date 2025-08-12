"use client"

import React, { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  MessageSquare, 
  Image as ImageIcon, 
  Loader2, 
  Send,
  Eye,
  Brain
} from "lucide-react"

export default function GemmaTestPage() {
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [chatResponse, setChatResponse] = useState("")

  const [imageUrl, setImageUrl] = useState("https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg")
  const [imageQuestion, setImageQuestion] = useState("What is in this image?")
  const [imageAnalysis, setImageAnalysis] = useState("")
  const [imageLoading, setImageLoading] = useState(false)

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return

    setChatLoading(true)
    const newMessages = [...chatMessages, { role: "user", content: chatInput }]
    setChatMessages(newMessages)
    setChatInput("")

    try {
      const response = await fetch('/api/gemma/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          system_prompt: "You are a climate and weather expert assistant for ClimaTech AI. Provide helpful, accurate information about climate monitoring, weather patterns, and environmental analysis."
        })
      })

      const data = await response.json()
      
      if (data.error) {
        setChatResponse(`Error: ${data.error}`)
      } else {
        setChatResponse(data.reply)
        setChatMessages([...newMessages, { role: "assistant", content: data.reply }])
      }
    } catch (error) {
      setChatResponse(`Error: ${error}`)
    } finally {
      setChatLoading(false)
    }
  }

  const handleImageAnalysis = async () => {
    if (!imageUrl.trim()) return

    setImageLoading(true)

    try {
      const response = await fetch('/api/gemma/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          question: imageQuestion
        })
      })

      const data = await response.json()
      
      if (data.error) {
        setImageAnalysis(`Error: ${data.error}`)
      } else {
        setImageAnalysis(data.analysis)
      }
    } catch (error) {
      setImageAnalysis(`Error: ${error}`)
    } finally {
      setImageLoading(false)
    }
  }

  const presetImages = [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg",
      name: "Nature Boardwalk"
    },
    {
      url: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b",
      name: "Satellite Weather"
    },
    {
      url: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2",
      name: "Storm Clouds"
    },
    {
      url: "https://images.unsplash.com/photo-1592210454359-9043f067919b",
      name: "Forest Monitoring"
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Gemma AI Testing
            </h1>
            <p className="text-gray-600">
              Test Google Gemma 2 model capabilities for text and image analysis
            </p>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Brain className="w-4 h-4 mr-1" />
            Gemma 2-27B
          </Badge>
        </div>

        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Text Chat
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Image Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Chat with Gemma
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-blue-100 text-blue-900 ml-8'
                          : 'bg-gray-100 text-gray-900 mr-8'
                      }`}
                    >
                      <div className="text-xs font-semibold mb-1 uppercase tracking-wide">
                        {msg.role === 'user' ? 'You' : 'Gemma'}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Ask Gemma about climate, weather, or environmental monitoring..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                    disabled={chatLoading}
                  />
                  <Button onClick={handleChatSubmit} disabled={chatLoading || !chatInput.trim()}>
                    {chatLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="image" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Image Analysis with Gemma
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Image URL
                    </label>
                    <Input
                      placeholder="Enter image URL..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Preset Images
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {presetImages.map((preset, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => setImageUrl(preset.url)}
                          className="h-auto p-2 text-xs"
                        >
                          {preset.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Question
                    </label>
                    <Input
                      placeholder="What do you want to know about this image?"
                      value={imageQuestion}
                      onChange={(e) => setImageQuestion(e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={handleImageAnalysis} 
                    disabled={imageLoading || !imageUrl.trim()}
                    className="w-full"
                  >
                    {imageLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Analyze Image
                      </>
                    )}
                  </Button>
                </div>

                {imageUrl && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Preview
                      </label>
                      <img
                        src={imageUrl}
                        alt="Analysis target"
                        className="w-full max-w-md h-48 object-cover rounded-lg border"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIGVycm9yPC90ZXh0Pjwvc3ZnPg=='
                        }}
                      />
                    </div>
                  </div>
                )}

                {imageAnalysis && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Analysis Result
                    </label>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <pre className="whitespace-pre-wrap text-sm text-gray-900">
                        {imageAnalysis}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
