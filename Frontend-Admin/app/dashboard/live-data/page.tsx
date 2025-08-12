"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Thermometer, Droplets, Wind, Activity, Zap, Gauge, MapPin, Clock, Download, RefreshCw } from "lucide-react"

export default function LiveDataPage() {
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setLastUpdate(new Date())
      setIsRefreshing(false)
    }, 2000)
  }

  const weatherStations = [
    {
      id: "QC001",
      name: "PAGASA Station - Quezon City",
      location: "Quezon City, Metro Manila",
      status: "active",
      data: {
        temperature: 28.5,
        humidity: 78,
        rainfall: 12.3,
        windSpeed: 15.2,
        pressure: 1013.2,
        heatIndex: 32.1,
      },
    },
    {
      id: "MK002",
      name: "PAGASA Station - Marikina",
      location: "Marikina City, Metro Manila",
      status: "active",
      data: {
        temperature: 29.1,
        humidity: 82,
        rainfall: 18.7,
        windSpeed: 12.8,
        pressure: 1012.8,
        heatIndex: 34.2,
      },
    },
    {
      id: "BG003",
      name: "PAGASA Station - Baguio",
      location: "Baguio City, Benguet",
      status: "maintenance",
      data: {
        temperature: 22.3,
        humidity: 85,
        rainfall: 5.2,
        windSpeed: 8.5,
        pressure: 1015.1,
        heatIndex: 24.8,
      },
    },
  ]

  const seismicStations = [
    {
      id: "PHV001",
      name: "PHIVOLCS Station - Marikina Valley",
      location: "Marikina, Metro Manila",
      status: "active",
      data: {
        magnitude: 2.1,
        depth: 15.2,
        intensity: "II",
        groundMotion: 0.02,
        lastEvent: "2 hours ago",
      },
    },
    {
      id: "PHV002",
      name: "PHIVOLCS Station - West Valley Fault",
      location: "Quezon City, Metro Manila",
      status: "active",
      data: {
        magnitude: 1.8,
        depth: 8.7,
        intensity: "I",
        groundMotion: 0.01,
        lastEvent: "6 hours ago",
      },
    },
  ]

  const powerStations = [
    {
      id: "PWR001",
      name: "Luzon Grid - Metro Manila",
      location: "Metro Manila Distribution",
      status: "operational",
      data: {
        voltage: 230.5,
        current: 145.2,
        frequency: 60.0,
        loadFactor: 87.3,
        powerQuality: 98.5,
        outages: 2,
      },
    },
    {
      id: "PWR002",
      name: "Luzon Grid - North Sector",
      location: "Northern Luzon Distribution",
      status: "operational",
      data: {
        voltage: 228.9,
        current: 132.8,
        frequency: 59.9,
        loadFactor: 72.1,
        powerQuality: 97.2,
        outages: 1,
      },
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Live Data Feed</h1>
            <p className="text-blue-600 mt-1">Real-time monitoring from PAGASA, PHIVOLCS, and Power Grid networks</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
            <Button onClick={handleRefresh} disabled={isRefreshing} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" className="border-blue-200 text-blue-700 bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Data Tabs */}
        <Tabs defaultValue="weather" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-blue-50">
            <TabsTrigger value="weather" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Weather Monitoring
            </TabsTrigger>
            <TabsTrigger value="seismic" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Seismic Activity
            </TabsTrigger>
            <TabsTrigger value="power" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Power Systems
            </TabsTrigger>
          </TabsList>

          {/* Weather Data Tab */}
          <TabsContent value="weather" className="space-y-6">
            <div className="grid gap-6">
              {weatherStations.map((station) => (
                <Card key={station.id} className="border-blue-200">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <CardTitle className="text-blue-900 flex items-center">
                          <MapPin className="w-5 h-5 mr-2" />
                          {station.name}
                        </CardTitle>
                        <p className="text-blue-600 text-sm mt-1">{station.location}</p>
                      </div>
                      <Badge
                        className={
                          station.status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {station.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Thermometer className="w-5 h-5 text-red-500" />
                          <span className="text-xs text-gray-600">°C</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">{station.data.temperature}</div>
                        <div className="text-xs text-blue-600">Temperature</div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Droplets className="w-5 h-5 text-blue-500" />
                          <span className="text-xs text-gray-600">%</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">{station.data.humidity}</div>
                        <div className="text-xs text-blue-600">Humidity</div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Droplets className="w-5 h-5 text-cyan-500" />
                          <span className="text-xs text-gray-600">mm/hr</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">{station.data.rainfall}</div>
                        <div className="text-xs text-blue-600">Rainfall</div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Wind className="w-5 h-5 text-green-500" />
                          <span className="text-xs text-gray-600">km/h</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">{station.data.windSpeed}</div>
                        <div className="text-xs text-blue-600">Wind Speed</div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Gauge className="w-5 h-5 text-purple-500" />
                          <span className="text-xs text-gray-600">hPa</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">{station.data.pressure}</div>
                        <div className="text-xs text-blue-600">Pressure</div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Thermometer className="w-5 h-5 text-orange-500" />
                          <span className="text-xs text-gray-600">°C</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">{station.data.heatIndex}</div>
                        <div className="text-xs text-blue-600">Heat Index</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Seismic Data Tab */}
          <TabsContent value="seismic" className="space-y-6">
            <div className="grid gap-6">
              {seismicStations.map((station) => (
                <Card key={station.id} className="border-blue-200">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <CardTitle className="text-blue-900 flex items-center">
                          <Activity className="w-5 h-5 mr-2" />
                          {station.name}
                        </CardTitle>
                        <p className="text-blue-600 text-sm mt-1">{station.location}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">{station.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-900">{station.data.magnitude}</div>
                        <div className="text-xs text-blue-600">Magnitude</div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-900">{station.data.depth}</div>
                        <div className="text-xs text-blue-600">Depth (km)</div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-900">{station.data.intensity}</div>
                        <div className="text-xs text-blue-600">Intensity</div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-900">{station.data.groundMotion}</div>
                        <div className="text-xs text-blue-600">Ground Motion (gal)</div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-bold text-blue-900">{station.data.lastEvent}</div>
                        <div className="text-xs text-blue-600">Last Event</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Power Systems Tab */}
          <TabsContent value="power" className="space-y-6">
            <div className="grid gap-6">
              {powerStations.map((station) => (
                <Card key={station.id} className="border-blue-200">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <CardTitle className="text-blue-900 flex items-center">
                          <Zap className="w-5 h-5 mr-2" />
                          {station.name}
                        </CardTitle>
                        <p className="text-blue-600 text-sm mt-1">{station.location}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">{station.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-900">{station.data.voltage}V</div>
                        <div className="text-xs text-blue-600">Voltage</div>
                      </div>

                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-900">{station.data.current}A</div>
                        <div className="text-xs text-blue-600">Current</div>
                      </div>

                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-900">{station.data.frequency}Hz</div>
                        <div className="text-xs text-blue-600">Frequency</div>
                      </div>

                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-900">{station.data.loadFactor}%</div>
                        <div className="text-xs text-blue-600">Load Factor</div>
                      </div>

                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-900">{station.data.powerQuality}%</div>
                        <div className="text-xs text-blue-600">Power Quality</div>
                      </div>

                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{station.data.outages}</div>
                        <div className="text-xs text-blue-600">Active Outages</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Load Factor</span>
                          <span>{station.data.loadFactor}%</span>
                        </div>
                        <Progress value={station.data.loadFactor} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Power Quality</span>
                          <span>{station.data.powerQuality}%</span>
                        </div>
                        <Progress value={station.data.powerQuality} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
