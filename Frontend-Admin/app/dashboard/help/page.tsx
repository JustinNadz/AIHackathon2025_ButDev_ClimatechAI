"use client"

import React, { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Book,
  MessageCircle,
  Phone,
  Mail,
  FileText,
  Video,
  Download,
  ExternalLink,
  ChevronRight,
  Clock,
  CheckCircle,
} from "lucide-react"

export default function HelpSupportPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [ticketSubject, setTicketSubject] = useState("")
  const [ticketMessage, setTicketMessage] = useState("")
  const [faqVotes, setFaqVotes] = useState<Record<number, { helpful: number; notHelpful: number; userVote?: 'helpful' | 'not-helpful' }>>({})
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const faqCategories = [
    { id: "all", label: "All Categories" },
    { id: "getting-started", label: "Getting Started" },
    { id: "weather-monitoring", label: "Weather Monitoring" },
    { id: "emergency-protocols", label: "Emergency Protocols" },
    { id: "energy-management", label: "Energy Management" },
    { id: "troubleshooting", label: "Troubleshooting" },
  ]

  // Initialize FAQ votes from localStorage on component mount
  React.useEffect(() => {
    const savedVotes = localStorage.getItem('climatech-faq-votes')
    if (savedVotes) {
      setFaqVotes(JSON.parse(savedVotes))
    }
  }, [])

  // Save votes to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('climatech-faq-votes', JSON.stringify(faqVotes))
  }, [faqVotes])

  const handleVote = (faqId: number, voteType: 'helpful' | 'not-helpful') => {
    setFaqVotes(prev => {
      const current = prev[faqId] || { helpful: 0, notHelpful: 0 }
      const userVote = current.userVote
      
      // Remove previous vote if exists
      let newHelpful = current.helpful
      let newNotHelpful = current.notHelpful
      
      if (userVote === 'helpful') newHelpful--
      if (userVote === 'not-helpful') newNotHelpful--
      
      // Add new vote if different from previous
      if (userVote !== voteType) {
        if (voteType === 'helpful') newHelpful++
        if (voteType === 'not-helpful') newNotHelpful++
        
        return {
          ...prev,
          [faqId]: {
            helpful: newHelpful,
            notHelpful: newNotHelpful,
            userVote: voteType
          }
        }
      } else {
        // Remove vote if clicking same button
        return {
          ...prev,
          [faqId]: {
            helpful: newHelpful,
            notHelpful: newNotHelpful,
            userVote: undefined
          }
        }
      }
    })
  }

  const faqs = [
    {
      id: 1,
      category: "getting-started",
      question: "How do I access the ClimaTech AI dashboard?",
      answer:
        "To access the dashboard, log in with your credentials provided by your agency administrator. Navigate to the dashboard section to view real-time weather data, emergency alerts, and system status.",
      baseHelpful: 45,
    },
    {
      id: 2,
      category: "weather-monitoring",
      question: "How often is weather data updated?",
      answer:
        "Weather data is updated every 10 minutes from PAGASA stations and every 5 minutes for critical parameters during severe weather events. Real-time alerts are issued immediately when thresholds are exceeded.",
      baseHelpful: 38,
    },
    {
      id: 3,
      category: "emergency-protocols",
      question: "How do I issue an emergency alert?",
      answer:
        "Navigate to Emergency Protocols > Alert Messaging. Select the alert type, affected area, and severity level. Review the message template and click 'Send Emergency Alert' to broadcast to all relevant agencies.",
      baseHelpful: 52,
    },
    {
      id: 4,
      category: "energy-management",
      question: "How do I switch to backup power during emergencies?",
      answer:
        "Go to Clean Energy Management > Microgrids tab. Select the affected grid and click 'Switch to Backup'. The system will automatically activate renewable energy sources and battery storage.",
      baseHelpful: 29,
    },
    {
      id: 5,
      category: "troubleshooting",
      question: "What should I do if the system shows offline status?",
      answer:
        "Check your internet connection first. If the problem persists, contact your system administrator or submit a support ticket. For critical emergencies, use the backup communication channels provided in your emergency manual.",
      baseHelpful: 41,
    },
    {
      id: 6,
      category: "weather-monitoring",
      question: "How do I interpret AI prediction confidence levels?",
      answer:
        "Confidence levels above 90% indicate high reliability. 80-90% is good reliability, 70-80% is moderate, and below 70% requires additional verification. Always cross-reference with multiple data sources for critical decisions.",
      baseHelpful: 33,
    },
  ]

  const tutorials = [
    {
      id: 1,
      title: "Getting Started with ClimaTech AI",
      description: "Complete overview of the platform features and navigation",
      duration: "15 minutes",
      type: "video",
      difficulty: "Beginner",
    },
    {
      id: 2,
      title: "Setting Up Weather Monitoring Alerts",
      description: "Configure automated alerts for weather conditions",
      duration: "10 minutes",
      type: "video",
      difficulty: "Intermediate",
    },
    {
      id: 3,
      title: "Emergency Response Protocol Guide",
      description: "Step-by-step guide for emergency response procedures",
      duration: "20 minutes",
      type: "document",
      difficulty: "Advanced",
    },
    {
      id: 4,
      title: "Clean Energy System Management",
      description: "Managing renewable energy systems and microgrids",
      duration: "12 minutes",
      type: "video",
      difficulty: "Intermediate",
    },
  ]

  const supportTickets = [
    {
      id: "TKT-001",
      subject: "Weather data not updating",
      status: "open",
      priority: "high",
      created: "2024-01-31 14:30:25",
      lastUpdate: "2024-01-31 15:45:12",
      assignedTo: "Technical Support Team",
    },
    {
      id: "TKT-002",
      subject: "Unable to send emergency alerts",
      status: "in-progress",
      priority: "critical",
      created: "2024-01-31 13:15:08",
      lastUpdate: "2024-01-31 16:22:33",
      assignedTo: "Emergency Systems Team",
    },
    {
      id: "TKT-003",
      subject: "Solar panel monitoring offline",
      status: "resolved",
      priority: "medium",
      created: "2024-01-30 09:45:15",
      lastUpdate: "2024-01-31 11:30:45",
      assignedTo: "Energy Management Team",
    },
  ]

  const contactInfo = [
    {
      type: "Emergency Hotline",
      contact: "911",
      description: "24/7 emergency response coordination",
      icon: Phone,
    },
    {
      type: "Technical Support",
      contact: "support@climatech.gov.ph",
      description: "System issues and technical assistance",
      icon: Mail,
    },
    {
      type: "Training Department",
      contact: "training@climatech.gov.ph",
      description: "User training and documentation requests",
      icon: Book,
    },
    {
      type: "System Administrator",
      contact: "admin@climatech.gov.ph",
      description: "Account management and permissions",
      icon: MessageCircle,
    },
  ]

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800"
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "Advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Help & Support</h1>
            <p className="text-blue-600 mt-1">Get assistance and learn how to use ClimaTech AI effectively</p>
          </div>
          <div className="flex gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <MessageCircle className="w-4 h-4 mr-2" />
              Live Chat
            </Button>
            <Button variant="outline" className="border-blue-200 text-blue-700 bg-transparent">
              <Phone className="w-4 h-4 mr-2" />
              Call Support
            </Button>
          </div>
        </div>

        {/* Help & Support Tabs */}
        <Tabs defaultValue="faq" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-blue-50">
            <TabsTrigger value="faq" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              FAQ
            </TabsTrigger>
            <TabsTrigger value="tutorials" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Tutorials
            </TabsTrigger>
            <TabsTrigger value="support" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Support Tickets
            </TabsTrigger>
            <TabsTrigger value="contact" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Contact Us
            </TabsTrigger>
          </TabsList>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search frequently asked questions..."
                    className="pl-10 border-blue-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px] border-blue-200">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {faqCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              {filteredFaqs.map((faq) => {
                const votes = faqVotes[faq.id] || { helpful: 0, notHelpful: 0 }
                const totalHelpful = faq.baseHelpful + votes.helpful
                const isExpanded = expandedFaq === faq.id
                
                return (
                  <Card key={faq.id} className="border-blue-200">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <button
                            onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                            className="text-left flex-1 group"
                          >
                            <h3 className="font-semibold text-blue-900 group-hover:text-blue-700 transition-colors">
                              {faq.question}
                            </h3>
                          </button>
                          <Badge variant="outline" className="border-blue-200 text-blue-700 shrink-0">
                            {faqCategories.find((cat) => cat.id === faq.category)?.label}
                          </Badge>
                        </div>
                        
                        {isExpanded && (
                          <>
                            <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>{totalHelpful} people found this helpful</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={votes.userVote === 'helpful' ? 'default' : 'outline'}
                                  className={votes.userVote === 'helpful' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'border-blue-200 text-blue-700 bg-transparent hover:bg-blue-50'
                                  }
                                  onClick={() => handleVote(faq.id, 'helpful')}
                                >
                                  👍 Helpful
                                </Button>
                                <Button
                                  size="sm"
                                  variant={votes.userVote === 'not-helpful' ? 'destructive' : 'outline'}
                                  className={votes.userVote === 'not-helpful'
                                    ? 'bg-red-600 text-white'
                                    : 'border-gray-200 text-gray-700 bg-transparent hover:bg-gray-50'
                                  }
                                  onClick={() => handleVote(faq.id, 'not-helpful')}
                                >
                                  👎 Not Helpful
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                        
                        {!isExpanded && (
                          <p className="text-gray-500 text-sm">Click to expand answer...</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Tutorials Tab */}
          <TabsContent value="tutorials" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {tutorials.map((tutorial) => (
                <Card key={tutorial.id} className="border-blue-200">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            {tutorial.type === "video" ? (
                              <Video className="w-5 h-5 text-blue-600" />
                            ) : (
                              <FileText className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-blue-900">{tutorial.title}</h3>
                            <p className="text-sm text-blue-600">{tutorial.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{tutorial.duration}</span>
                        </div>
                        <Badge className={getDifficultyColor(tutorial.difficulty)}>{tutorial.difficulty}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white flex-1">
                          {tutorial.type === "video" ? "Watch Video" : "Read Guide"}
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                        <Button variant="outline" className="border-blue-200 text-blue-700 bg-transparent">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Support Tickets Tab */}
          <TabsContent value="support" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold text-blue-900">Your Support Tickets</h2>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <MessageCircle className="w-4 h-4 mr-2" />
                Create New Ticket
              </Button>
            </div>

            {/* Create New Ticket Form */}
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Submit a Support Request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority Level</label>
                    <Select>
                      <SelectTrigger className="border-blue-200">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - General inquiry</SelectItem>
                        <SelectItem value="medium">Medium - System issue</SelectItem>
                        <SelectItem value="high">High - Urgent problem</SelectItem>
                        <SelectItem value="critical">Critical - Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select>
                      <SelectTrigger className="border-blue-200">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="account">Account Management</SelectItem>
                        <SelectItem value="training">Training Request</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    placeholder="Brief description of your issue"
                    className="border-blue-200"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Provide detailed information about your issue..."
                    className="border-blue-200 min-h-[120px]"
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                  />
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Submit Ticket</Button>
              </CardContent>
            </Card>

            {/* Existing Tickets */}
            <div className="space-y-4">
              {supportTickets.map((ticket) => (
                <Card key={ticket.id} className="border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-blue-900">{ticket.subject}</h3>
                            <p className="text-sm text-blue-600">Ticket ID: {ticket.id}</p>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-600">
                              <span>Created: {ticket.created}</span>
                              <span>Last Update: {ticket.lastUpdate}</span>
                              <span>Assigned to: {ticket.assignedTo}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority.toUpperCase()}</Badge>
                        <Badge className={getStatusColor(ticket.status)}>{ticket.status.toUpperCase()}</Badge>
                        <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 bg-transparent">
                          View Details
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Contact Us Tab */}
          <TabsContent value="contact" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {contactInfo.map((contact, index) => (
                <Card key={index} className="border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <contact.icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 mb-1">{contact.type}</h3>
                        <p className="text-lg font-bold text-blue-600 mb-2">{contact.contact}</p>
                        <p className="text-sm text-gray-600">{contact.description}</p>
                        <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700 text-white">
                          Contact Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Office Hours & Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">Business Hours</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Monday - Friday:</span>
                        <span>8:00 AM - 6:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saturday:</span>
                        <span>9:00 AM - 1:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sunday:</span>
                        <span>Emergency Only</span>
                      </div>
                      <div className="flex justify-between font-semibold text-red-600">
                        <span>Emergency Hotline:</span>
                        <span>24/7 Available</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">Office Location</h4>
                    <div className="text-sm space-y-1">
                      <p>ClimaTech AI Operations Center</p>
                      <p>Department of Science and Technology</p>
                      <p>Magsaysay Village</p>
                      <p>La Paz, Iloilo City, Iloilo 5000</p>
                      <p>Philippines</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
