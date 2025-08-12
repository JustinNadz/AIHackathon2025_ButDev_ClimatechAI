"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Zap,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Activity,
  TrendingUp,
  TrendingDown,
  Power,
  Gauge,
  Battery,
  Settings,
  Map,
} from "lucide-react"

export default function EnergyManagementPage() {
  const [autoSwitching, setAutoSwitching] = useState(true)
  const [emergencyMode, setEmergencyMode] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Grid monitoring data for Luzon Grid - Metro Manila
  const gridData = {
    luzonGrid: {
      name: "Luzon Grid - Metro Manila",
      status: "operational",
      voltage: "230.5V",
      current: "145.2A",
      frequency: "60Hz",
      loadFactor: 87.3,
      powerQuality: 98.5,
      activeOutages: 2
    },
    metroManilaDistribution: {
      name: "Metro Manila Distribution",
      status: "operational", 
      voltage: "230.5V",
      current: "145.2A",
      frequency: "60Hz",
      loadFactor: 87.3,
      powerQuality: 98.5,
      activeOutages: 2
    }
  }

  // Power stations with risk assessment
  const powerStations = [
    {
      id: 1,
      name: "Masinloc Power Station",
      location: "Zambales",
      coordinates: { lat: 15.5454, lng: 119.9519 },
      capacity: "2,700 MW",
      currentOutput: 2200,
      maxOutput: 2700,
      status: "operational",
      riskLevel: "low",
      weatherThreat: "none",
      lastMaintenance: "2024-01-15"
    },
    {
      id: 2,
      name: "Caliraya Power Station",
      location: "Laguna", 
      coordinates: { lat: 14.1306, lng: 121.4944 },
      capacity: "700 MW",
      currentOutput: 580,
      maxOutput: 700,
      status: "operational",
      riskLevel: "medium",
      weatherThreat: "typhoon",
      lastMaintenance: "2024-01-20"
    },
    {
      id: 3,
      name: "Malaya Power Station",
      location: "Rizal",
      coordinates: { lat: 14.7167, lng: 121.1417 },
      capacity: "650 MW", 
      currentOutput: 450,
      maxOutput: 650,
      status: "maintenance",
      riskLevel: "high",
      weatherThreat: "flood",
      lastMaintenance: "2024-02-01"
    },
    {
      id: 4,
      name: "Teresa Power Station",
      location: "Bataan",
      coordinates: { lat: 14.6194, lng: 120.6306 },
      capacity: "1,200 MW",
      currentOutput: 950,
      maxOutput: 1200,
      status: "operational", 
      riskLevel: "low",
      weatherThreat: "none",
      lastMaintenance: "2024-01-10"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-100 text-green-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      case "offline":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getWeatherThreatIcon = (threat: string) => {
    switch (threat) {
      case "typhoon":
        return "🌪️"
      case "flood":
        return "🌊"
      case "landslide":
        return "⛰️"
      default:
        return "☀️"
    }
  }

  // Initialize client-side state and update time every minute
  useEffect(() => {
    // Set initial time on client mount
    setIsClient(true)
    setLastUpdate(new Date())
    
    // Update time every minute
    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, 60000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Energy Management</h1>
            <p className="text-blue-600 mt-1">Real-time grid monitoring and climate preparedness for Metro Manila</p>
            {isClient && lastUpdate && (
              <p className="text-sm text-gray-500 mt-1">Last updated: {lastUpdate.toLocaleTimeString()}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch checked={autoSwitching} onCheckedChange={setAutoSwitching} id="auto-switching" />
              <label htmlFor="auto-switching" className="text-sm font-medium">
                Auto Grid Switching
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch checked={emergencyMode} onCheckedChange={setEmergencyMode} id="emergency-mode" />
              <label htmlFor="emergency-mode" className="text-sm font-medium text-red-600">
                Emergency Mode
              </label>
            </div>
          </div>
        </div>

        {/* Grid Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Luzon Grid - Metro Manila */}
          <Card className="border-blue-200">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-blue-900 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                    {gridData.luzonGrid.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getStatusColor(gridData.luzonGrid.status)}>
                      {gridData.luzonGrid.status.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-gray-500">Primary Grid</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{gridData.luzonGrid.activeOutages}</div>
                  <div className="text-xs text-blue-600">Active Outages</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-blue-900">{gridData.luzonGrid.voltage}</div>
                  <div className="text-xs text-blue-600">Voltage</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-blue-900">{gridData.luzonGrid.current}</div>
                  <div className="text-xs text-blue-600">Current</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-blue-900">{gridData.luzonGrid.frequency}</div>
                  <div className="text-xs text-blue-600">Frequency</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-blue-900">{gridData.luzonGrid.loadFactor}%</div>
                  <div className="text-xs text-blue-600">Load Factor</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Load Factor</span>
                    <span>{gridData.luzonGrid.loadFactor}%</span>
                  </div>
                  <Progress value={gridData.luzonGrid.loadFactor} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Power Quality</span>
                    <span>{gridData.luzonGrid.powerQuality}%</span>
                  </div>
                  <Progress value={gridData.luzonGrid.powerQuality} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metro Manila Distribution */}
          <Card className="border-blue-200">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-blue-900 flex items-center">
                    <Power className="w-5 h-5 mr-2 text-purple-500" />
                    {gridData.metroManilaDistribution.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getStatusColor(gridData.metroManilaDistribution.status)}>
                      {gridData.metroManilaDistribution.status.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-gray-500">Distribution Network</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{gridData.metroManilaDistribution.activeOutages}</div>
                  <div className="text-xs text-blue-600">Active Outages</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-blue-900">{gridData.metroManilaDistribution.voltage}</div>
                  <div className="text-xs text-blue-600">Voltage</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-blue-900">{gridData.metroManilaDistribution.current}</div>
                  <div className="text-xs text-blue-600">Current</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-blue-900">{gridData.metroManilaDistribution.frequency}</div>
                  <div className="text-xs text-blue-600">Frequency</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-blue-900">{gridData.metroManilaDistribution.loadFactor}%</div>
                  <div className="text-xs text-blue-600">Load Factor</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Load Factor</span>
                    <span>{gridData.metroManilaDistribution.loadFactor}%</span>
                  </div>
                  <Progress value={gridData.metroManilaDistribution.loadFactor} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Power Quality</span>
                    <span>{gridData.metroManilaDistribution.powerQuality}%</span>
                  </div>
                  <Progress value={gridData.metroManilaDistribution.powerQuality} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for detailed monitoring */}
        <Tabs defaultValue="stations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-blue-50">
            <TabsTrigger value="stations" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Power className="w-4 h-4 mr-2" />
              Power Stations
            </TabsTrigger>
            <TabsTrigger value="risk-map" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Map className="w-4 h-4 mr-2" />
              Risk Assessment Map
            </TabsTrigger>
            <TabsTrigger value="preparedness" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Climate Preparedness
            </TabsTrigger>
          </TabsList>

          {/* Power Stations Tab */}
          <TabsContent value="stations" className="space-y-6">
            <div className="grid gap-6">
              {powerStations.map((station) => (
                <Card key={station.id} className="border-blue-200">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div>
                        <CardTitle className="text-blue-900 flex items-center">
                          <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                          {station.name}
                        </CardTitle>
                        <p className="text-blue-600 text-sm mt-1">{station.location}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(station.status)}>{station.status.toUpperCase()}</Badge>
                        <Badge className={getRiskColor(station.riskLevel)}>Risk: {station.riskLevel.toUpperCase()}</Badge>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-900">{station.capacity}</div>
                          <div className="text-xs text-blue-600">Capacity</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-yellow-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-900">{station.currentOutput} MW</div>
                        <div className="text-xs text-blue-600">Current Output</div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-900">{Math.round((station.currentOutput / station.maxOutput) * 100)}%</div>
                        <div className="text-xs text-blue-600">Efficiency</div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg text-center">
                        <div className="text-2xl">{getWeatherThreatIcon(station.weatherThreat)}</div>
                        <div className="text-xs text-blue-600 capitalize">{station.weatherThreat || "Clear"}</div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg text-center">
                        <div className="text-lg font-bold text-blue-900">{new Date(station.lastMaintenance).toLocaleDateString()}</div>
                        <div className="text-xs text-blue-600">Last Maintenance</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Power Output</span>
                          <span>{station.currentOutput}/{station.maxOutput} MW</span>
                        </div>
                        <Progress value={(station.currentOutput / station.maxOutput) * 100} className="h-3" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-blue-900">Weather Threat Assessment</div>
                        <div className="text-lg font-bold text-blue-600 capitalize">{station.weatherThreat || "No immediate threats"}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 bg-transparent">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                        {station.status === "maintenance" ? (
                          <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            In Maintenance
                          </Button>
                        ) : (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Operational
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Risk Assessment Map Tab */}
          <TabsContent value="risk-map" className="space-y-6">
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center">
                  <Map className="w-5 h-5 mr-2 text-green-500" />
                  Climate Risk Assessment Map
                </CardTitle>
                <p className="text-blue-600 text-sm">Power station vulnerability to climate events</p>
              </CardHeader>
              <CardContent>
                <div className="relative h-96 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg border border-blue-200 overflow-hidden">
                  {/* Mock Map with Power Stations */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/90 p-6 rounded-lg shadow-lg text-center max-w-md">
                      <MapPin className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                      <h3 className="font-semibold text-lg mb-2 text-blue-900">Interactive Risk Map</h3>
                      <p className="text-sm text-blue-700 mb-4">
                        This map shows power stations and their vulnerability to climate threats including typhoons, floods, and landslides.
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="bg-green-100 p-2 rounded">
                          <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
                          <div>Low Risk</div>
                        </div>
                        <div className="bg-yellow-100 p-2 rounded">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-1"></div>
                          <div>Medium Risk</div>
                        </div>
                        <div className="bg-red-100 p-2 rounded">
                          <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1"></div>
                          <div>High Risk</div>
                        </div>
                        <div className="bg-gray-100 p-2 rounded">
                          <div className="w-3 h-3 bg-gray-500 rounded-full mx-auto mb-1"></div>
                          <div>Offline</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Station markers overlay */}
                  {powerStations.map((station, index) => (
                    <div 
                      key={station.id}
                      className={`absolute w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                        station.riskLevel === 'low' ? 'bg-green-500' :
                        station.riskLevel === 'medium' ? 'bg-yellow-500' :
                        station.riskLevel === 'high' ? 'bg-red-500' : 'bg-gray-500'
                      }`}
                      style={{
                        left: `${20 + index * 15}%`,
                        top: `${30 + index * 10}%`
                      }}
                      title={station.name}
                    />
                  ))}
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-red-800">High Risk Stations</div>
                        <div className="text-2xl font-bold text-red-900">1</div>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-yellow-800">Medium Risk Stations</div>
                        <div className="text-2xl font-bold text-yellow-900">1</div>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-yellow-600" />
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-green-800">Low Risk Stations</div>
                        <div className="text-2xl font-bold text-green-900">2</div>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Climate Preparedness Tab */}
          <TabsContent value="preparedness" className="space-y-6">
            <div className="grid gap-6">
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-900 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                    Climate Preparedness Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-900">85%</div>
                      <div className="text-xs text-blue-600">Emergency Readiness</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-900">92%</div>
                      <div className="text-xs text-green-600">Backup Systems</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-900">78%</div>
                      <div className="text-xs text-yellow-600">Maintenance Status</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-900">96%</div>
                      <div className="text-xs text-purple-600">Communication Systems</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-900">Emergency Response Protocols</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                      <div>
                        <div className="font-medium text-green-900">Typhoon Protocol</div>
                        <div className="text-sm text-green-700">Automated load balancing and backup activation</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">ACTIVE</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div>
                        <div className="font-medium text-blue-900">Flood Emergency</div>
                        <div className="text-sm text-blue-700">Station isolation and rerouting procedures</div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">STANDBY</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div>
                        <div className="font-medium text-yellow-900">Grid Failure Protocol</div>
                        <div className="text-sm text-yellow-700">Emergency backup power and load shedding</div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">READY</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
