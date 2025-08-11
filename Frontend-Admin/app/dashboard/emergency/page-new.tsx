"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  AlertTriangle,
  Phone,
  MapPin,
  Users,
  Radio,
  Send,
  Shield,
  Siren,
  Navigation,
  Building,
  Heart,
  Flame,
  Droplets,
  Mountain,
  Plus,
  Edit,
  Trash2,
} from "lucide-react"

export default function EmergencyProtocolsPage() {
  const [selectedProtocol, setSelectedProtocol] = useState("")
  const [alertMessage, setAlertMessage] = useState("")

  // Data states
  const [protocolTemplates, setProtocolTemplates] = useState<any[]>([])
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([])
  const [evacuationCenters, setEvacuationCenters] = useState<any[]>([])
  const [responseTeams, setResponseTeams] = useState<any[]>([])
  const [messageTemplates, setMessageTemplates] = useState<any[]>([])

  // Dialog states
  const [isProtocolDialogOpen, setIsProtocolDialogOpen] = useState(false)
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const [isCenterDialogOpen, setIsCenterDialogOpen] = useState(false)
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false)
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)

  // Form states
  const [protocolForm, setProtocolForm] = useState({
    name: "",
    type: "",
    description: "",
    steps: [""]
  })

  const [contactForm, setContactForm] = useState({
    name: "",
    number: "",
    type: "",
    status: "active",
    description: "",
    agency: ""
  })

  // Load data on component mount
  useEffect(() => {
    fetchProtocols()
    fetchContacts()
    fetchCenters()
    fetchTeams()
    fetchMessages()
  }, [])

  // Fetch functions
  const fetchProtocols = async () => {
    try {
      const response = await fetch('/api/emergency/protocols')
      if (response.ok) {
        const data = await response.json()
        setProtocolTemplates(data.protocols)
      }
    } catch (error) {
      console.error('Error fetching protocols:', error)
    }
  }

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/emergency/contacts')
      if (response.ok) {
        const data = await response.json()
        setEmergencyContacts(data.contacts)
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    }
  }

  const fetchCenters = async () => {
    try {
      const response = await fetch('/api/emergency/evacuation')
      if (response.ok) {
        const data = await response.json()
        setEvacuationCenters(data.centers)
      }
    } catch (error) {
      console.error('Error fetching centers:', error)
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/emergency/teams')
      if (response.ok) {
        const data = await response.json()
        setResponseTeams(data.teams)
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/emergency/messages')
      if (response.ok) {
        const data = await response.json()
        setMessageTemplates(data.messages.filter((msg: any) => msg.template))
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  // Save functions
  const saveProtocol = async () => {
    try {
      const response = await fetch('/api/emergency/protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(protocolForm)
      })

      if (response.ok) {
        await fetchProtocols()
        setProtocolForm({ name: "", type: "", description: "", steps: [""] })
        setIsProtocolDialogOpen(false)
        alert('Protocol saved successfully!')
      }
    } catch (error) {
      console.error('Error saving protocol:', error)
      alert('Error saving protocol')
    }
  }

  const saveContact = async () => {
    try {
      const response = await fetch('/api/emergency/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      })

      if (response.ok) {
        await fetchContacts()
        setContactForm({ name: "", number: "", type: "", status: "active", description: "", agency: "" })
        setIsContactDialogOpen(false)
        alert('Contact saved successfully!')
      }
    } catch (error) {
      console.error('Error saving contact:', error)
      alert('Error saving contact')
    }
  }

  const deleteItem = async (type: string, id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const endpoints = {
        protocol: '/api/emergency/protocols',
        contact: '/api/emergency/contacts',
        center: '/api/emergency/evacuation',
        team: '/api/emergency/teams',
        message: '/api/emergency/messages'
      }

      const response = await fetch(`${endpoints[type as keyof typeof endpoints]}?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        switch (type) {
          case 'protocol': await fetchProtocols(); break
          case 'contact': await fetchContacts(); break
          case 'center': await fetchCenters(); break
          case 'team': await fetchTeams(); break
          case 'message': await fetchMessages(); break
        }
        alert(`${type} deleted successfully!`)
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error)
      alert(`Error deleting ${type}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "standby":
        return "bg-yellow-100 text-yellow-800"
      case "ready":
        return "bg-blue-100 text-blue-800"
      case "maintenance":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "flood":
        return <Droplets className="w-4 h-4" />
      case "fire":
        return <Flame className="w-4 h-4" />
      case "earthquake":
        return <Mountain className="w-4 h-4" />
      case "medical":
        return <Heart className="w-4 h-4" />
      case "power":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Shield className="w-4 h-4" />
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Emergency Protocols</h1>
            <p className="text-blue-600 mt-1">Coordinated emergency response and disaster management protocols</p>
          </div>
          <div className="flex gap-3">
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              <Siren className="w-4 h-4 mr-2" />
              Emergency Broadcast
            </Button>
            <Button variant="outline" className="border-blue-200 text-blue-700 bg-transparent">
              <Radio className="w-4 h-4 mr-2" />
              Communication Test
            </Button>
          </div>
        </div>

        {/* Emergency Protocols Tabs */}
        <Tabs defaultValue="protocols" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-blue-50">
            <TabsTrigger value="protocols" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Response Protocols
            </TabsTrigger>
            <TabsTrigger value="contacts" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Emergency Contacts
            </TabsTrigger>
            <TabsTrigger value="evacuation" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Evacuation Centers
            </TabsTrigger>
            <TabsTrigger value="teams" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Response Teams
            </TabsTrigger>
            <TabsTrigger value="messaging" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Alert Messaging
            </TabsTrigger>
          </TabsList>

          {/* Response Protocols Tab */}
          <TabsContent value="protocols" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-blue-900">Emergency Response Protocols</h2>
              <Dialog open={isProtocolDialogOpen} onOpenChange={setIsProtocolDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Protocol
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Protocol</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Protocol Name</Label>
                        <Input
                          value={protocolForm.name}
                          onChange={(e) => setProtocolForm({...protocolForm, name: e.target.value})}
                          placeholder="Enter protocol name"
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select value={protocolForm.type} onValueChange={(value: string) => setProtocolForm({...protocolForm, type: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="flood">Flood</SelectItem>
                            <SelectItem value="earthquake">Earthquake</SelectItem>
                            <SelectItem value="fire">Fire</SelectItem>
                            <SelectItem value="typhoon">Typhoon</SelectItem>
                            <SelectItem value="landslide">Landslide</SelectItem>
                            <SelectItem value="power">Power Outage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={protocolForm.description}
                        onChange={(e) => setProtocolForm({...protocolForm, description: e.target.value})}
                        placeholder="Enter protocol description"
                      />
                    </div>
                    <div>
                      <Label>Protocol Steps</Label>
                      {protocolForm.steps.map((step, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <Input
                            value={step}
                            onChange={(e) => {
                              const newSteps = [...protocolForm.steps]
                              newSteps[index] = e.target.value
                              setProtocolForm({...protocolForm, steps: newSteps})
                            }}
                            placeholder={`Step ${index + 1}`}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newSteps = protocolForm.steps.filter((_, i) => i !== index)
                              setProtocolForm({...protocolForm, steps: newSteps})
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => setProtocolForm({...protocolForm, steps: [...protocolForm.steps, ""]})}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Step
                      </Button>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={saveProtocol} className="flex-1">
                        Save Protocol
                      </Button>
                      <Button variant="outline" onClick={() => setIsProtocolDialogOpen(false)} className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="grid gap-6">
              {protocolTemplates.map((protocol) => (
                <Card key={protocol.id} className="border-blue-200">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div>
                        <CardTitle className="text-blue-900 flex items-center">
                          {getTypeIcon(protocol.type)}
                          <span className="ml-2">{protocol.name}</span>
                        </CardTitle>
                        <p className="text-blue-600 text-sm mt-1">{protocol.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setSelectedProtocol(protocol.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Activate Protocol
                        </Button>
                        <Button 
                          variant="outline" 
                          className="border-blue-200 text-blue-700 bg-transparent"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => deleteItem('protocol', protocol.id)}
                          className="border-red-200 text-red-700 bg-transparent"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-blue-900">Protocol Steps:</h4>
                      <div className="space-y-2">
                        {protocol.steps.map((step: string, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <span className="text-sm text-gray-700">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Emergency Contacts Tab */}
          <TabsContent value="contacts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-blue-900">Emergency Contacts</h2>
              <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Contact
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Contact</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Contact Name</Label>
                      <Input
                        value={contactForm.name}
                        onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                        placeholder="Enter contact name"
                      />
                    </div>
                    <div>
                      <Label>Phone Number</Label>
                      <Input
                        value={contactForm.number}
                        onChange={(e) => setContactForm({...contactForm, number: e.target.value})}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Type</Label>
                        <Select value={contactForm.type} onValueChange={(value: string) => setContactForm({...contactForm, type: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primary">Primary</SelectItem>
                            <SelectItem value="fire">Fire</SelectItem>
                            <SelectItem value="medical">Medical</SelectItem>
                            <SelectItem value="flood">Flood</SelectItem>
                            <SelectItem value="seismic">Seismic</SelectItem>
                            <SelectItem value="power">Power</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <Select value={contactForm.status} onValueChange={(value: string) => setContactForm({...contactForm, status: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Agency</Label>
                      <Input
                        value={contactForm.agency}
                        onChange={(e) => setContactForm({...contactForm, agency: e.target.value})}
                        placeholder="Enter agency name"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={contactForm.description}
                        onChange={(e) => setContactForm({...contactForm, description: e.target.value})}
                        placeholder="Enter description"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={saveContact} className="flex-1">
                        Save Contact
                      </Button>
                      <Button variant="outline" onClick={() => setIsContactDialogOpen(false)} className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {emergencyContacts.map((contact, index) => (
                <Card key={contact.id || index} className="border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Phone className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-900">{contact.name}</h3>
                          <p className="text-2xl font-bold text-blue-600">{contact.number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(contact.status)}>{contact.status}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-200 text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteItem('contact', contact.id)}
                          className="border-red-200 text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white flex-1">
                        <Phone className="w-4 h-4 mr-2" />
                        Call Now
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-200 text-blue-700 flex-1 bg-transparent"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Alert
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Evacuation Centers Tab */}
          <TabsContent value="evacuation" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-blue-900">Evacuation Centers</h2>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Center
              </Button>
            </div>
            
            <div className="grid gap-6">
              {evacuationCenters.map((center, index) => (
                <Card key={center.id || index} className="border-blue-200">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div>
                        <CardTitle className="text-blue-900 flex items-center">
                          <Building className="w-5 h-5 mr-2" />
                          {center.name}
                        </CardTitle>
                        <p className="text-blue-600 text-sm mt-1 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {center.address}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(center.status)}>{center.status.toUpperCase()}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-200 text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteItem('center', center.id)}
                          className="border-red-200 text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-900">{center.capacity}</div>
                        <div className="text-xs text-blue-600">Total Capacity</div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-900">{center.currentOccupancy}</div>
                        <div className="text-xs text-blue-600">Current Occupancy</div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-900">
                          {center.capacity - center.currentOccupancy}
                        </div>
                        <div className="text-xs text-blue-600">Available Space</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">Available Facilities:</h4>
                      <div className="flex flex-wrap gap-2">
                        {center.facilities.map((facility: string, facilityIndex: number) => (
                          <Badge key={facilityIndex} variant="outline" className="border-blue-200 text-blue-700">
                            {facility}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">Contact: {center.contact}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white flex-1">
                        <Users className="w-4 h-4 mr-2" />
                        Activate Center
                      </Button>
                      <Button variant="outline" className="border-blue-200 text-blue-700 flex-1 bg-transparent">
                        <Navigation className="w-4 h-4 mr-2" />
                        Get Directions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Response Teams Tab */}
          <TabsContent value="teams" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-blue-900">Response Teams</h2>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Team
              </Button>
            </div>
            
            <div className="grid gap-6">
              {responseTeams.map((team, index) => (
                <Card key={team.id || index} className="border-blue-200">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div>
                        <CardTitle className="text-blue-900 flex items-center">
                          <Shield className="w-5 h-5 mr-2" />
                          {team.name}
                        </CardTitle>
                        <p className="text-blue-600 text-sm mt-1">{team.type}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(team.status)}>{team.status.toUpperCase()}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-200 text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteItem('team', team.id)}
                          className="border-red-200 text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Location</span>
                        </div>
                        <div className="text-sm text-gray-700">{team.location}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Phone className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Contact</span>
                        </div>
                        <div className="text-sm text-gray-700">{team.contact}</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">Equipment & Resources:</h4>
                      <div className="flex flex-wrap gap-2">
                        {team.equipment.map((item: string, itemIndex: number) => (
                          <Badge key={itemIndex} variant="outline" className="border-blue-200 text-blue-700">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button className="bg-green-600 hover:bg-green-700 text-white flex-1">
                        <Radio className="w-4 h-4 mr-2" />
                        Deploy Team
                      </Button>
                      <Button variant="outline" className="border-blue-200 text-blue-700 flex-1 bg-transparent">
                        <Phone className="w-4 h-4 mr-2" />
                        Contact Team
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Alert Messaging Tab */}
          <TabsContent value="messaging" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-blue-900">Alert Messaging</h2>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Message Template
              </Button>
            </div>
            
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Emergency Alert System</CardTitle>
                <p className="text-blue-600 text-sm">Send coordinated alerts to multiple agencies and the public</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-blue-900 mb-2 block">Alert Type</label>
                      <Select>
                        <SelectTrigger className="border-blue-200">
                          <SelectValue placeholder="Select alert type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flood">Flood Warning</SelectItem>
                          <SelectItem value="earthquake">Earthquake Alert</SelectItem>
                          <SelectItem value="fire">Fire Emergency</SelectItem>
                          <SelectItem value="power">Power Outage</SelectItem>
                          <SelectItem value="typhoon">Typhoon Warning</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-blue-900 mb-2 block">Affected Area</label>
                      <Input placeholder="Enter location or area" className="border-blue-200" />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-blue-900 mb-2 block">Severity Level</label>
                      <Select>
                        <SelectTrigger className="border-blue-200">
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - Advisory</SelectItem>
                          <SelectItem value="medium">Medium - Watch</SelectItem>
                          <SelectItem value="high">High - Warning</SelectItem>
                          <SelectItem value="critical">Critical - Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-blue-900 mb-2 block">Recipients</label>
                      <div className="space-y-2 max-h-32 overflow-y-auto border border-blue-200 rounded-lg p-3">
                        {[
                          "NDRRMC",
                          "Local Government Units",
                          "Bureau of Fire Protection",
                          "Philippine Red Cross",
                          "MMDA",
                          "Power Companies",
                          "Public Broadcasting",
                        ].map((recipient) => (
                          <label key={recipient} className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded border-blue-300" />
                            <span className="text-sm">{recipient}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-blue-900 mb-2 block">Alert Message</label>
                  <Textarea
                    placeholder="Enter emergency alert message..."
                    className="border-blue-200 min-h-[120px]"
                    value={alertMessage}
                    onChange={(e) => setAlertMessage(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-900">Message Templates:</h4>
                  <div className="grid gap-3">
                    {messageTemplates.map((template, index) => (
                      <div key={index} className="p-3 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(template.type)}
                            <span className="font-medium text-blue-900 capitalize">{template.type} Alert</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setAlertMessage(template.message)}
                              className="border-blue-200 text-blue-700"
                            >
                              Use Template
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-200 text-blue-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteItem('message', template.id)}
                              className="border-red-200 text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{template.message}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-blue-200">
                  <Button className="bg-red-600 hover:bg-red-700 text-white flex-1">
                    <Siren className="w-4 h-4 mr-2" />
                    Send Emergency Alert
                  </Button>
                  <Button variant="outline" className="border-blue-200 text-blue-700 flex-1 bg-transparent">
                    <Send className="w-4 h-4 mr-2" />
                    Schedule Alert
                  </Button>
                  <Button variant="outline" className="border-blue-200 text-blue-700 flex-1 bg-transparent">
                    Preview Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
