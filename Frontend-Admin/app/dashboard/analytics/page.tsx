"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Brain, AlertTriangle, Droplets, Mountain, Zap, BarChart3, LineChart } from "lucide-react"

export default function PredictiveAnalyticsPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("24h")
  const [selectedRegion, setSelectedRegion] = useState("metro-manila")

  const floodPredictions = [
    {
      location: "Marikina River Basin",
      probability: 85,
      severity: "high",
      timeframe: "6-12 hours",
      confidence: 94,
      factors: ["Heavy rainfall", "River water level", "Soil saturation"],
      affectedPopulation: 45000,
      evacuationCenters: 12,
    },
    {
      location: "Pasig River Area",
      probability: 62,
      severity: "medium",
      timeframe: "12-24 hours",
      confidence: 87,
      factors: ["Moderate rainfall", "Tidal influence", "Urban drainage"],
      affectedPopulation: 28000,
      evacuationCenters: 8,
    },
    {
      location: "Laguna Lake Basin",
      probability: 35,
      severity: "low",
      timeframe: "24-48 hours",
      confidence: 78,
      factors: ["Light rainfall", "Lake water level", "Seasonal patterns"],
      affectedPopulation: 15000,
      evacuationCenters: 5,
    },
  ]

  const landslidePredictions = [
    {
      location: "Baguio Mountain Slopes",
      probability: 72,
      severity: "high",
      timeframe: "12-24 hours",
      confidence: 89,
      factors: ["Soil saturation", "Slope angle", "Recent seismic activity"],
      affectedPopulation: 8500,
      evacuationCenters: 4,
    },
    {
      location: "Antipolo Hills",
      probability: 48,
      severity: "medium",
      timeframe: "24-48 hours",
      confidence: 82,
      factors: ["Moderate rainfall", "Geological composition", "Deforestation"],
      affectedPopulation: 12000,
      evacuationCenters: 6,
    },
  ]

  const powerOutagePredictions = [
    {
      location: "Metro Manila Grid Sector A",
      probability: 25,
      severity: "low",
      timeframe: "6-12 hours",
      confidence: 91,
      factors: ["Weather conditions", "Grid load", "Equipment age"],
      affectedCustomers: 125000,
      backupSystems: 8,
    },
    {
      location: "Northern Luzon Grid",
      probability: 45,
      severity: "medium",
      timeframe: "12-24 hours",
      confidence: 85,
      factors: ["Storm approach", "Transmission lines", "Substation status"],
      affectedCustomers: 85000,
      backupSystems: 5,
    },
  ]

  const typhoonPredictions = [
    {
      name: "Tropical Depression Paolo",
      category: "TD",
      probability: 78,
      landfall: "48-72 hours",
      affectedAreas: ["Northern Luzon", "Central Luzon"],
      windSpeed: "45-60 km/h",
      rainfall: "100-200mm",
      stormSurge: "0.5-1.0m",
    },
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return "bg-red-500"
    if (probability >= 40) return "bg-yellow-500"
    return "bg-green-500"
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Predictive Analytics</h1>
            <p className="text-blue-600 mt-1">AI-powered disaster risk assessment and forecasting</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-[180px] border-blue-200">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6h">Next 6 hours</SelectItem>
                <SelectItem value="24h">Next 24 hours</SelectItem>
                <SelectItem value="48h">Next 48 hours</SelectItem>
                <SelectItem value="7d">Next 7 days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-[180px] border-blue-200">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metro-manila">Metro Manila</SelectItem>
                <SelectItem value="northern-luzon">Northern Luzon</SelectItem>
                <SelectItem value="central-luzon">Central Luzon</SelectItem>
                <SelectItem value="southern-luzon">Southern Luzon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* AI Model Performance */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              AI Model Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-900 mb-2">94.2%</div>
                <div className="text-sm text-blue-600">Overall Accuracy</div>
                <Progress value={94.2} className="mt-2 h-2" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">97.8%</div>
                <div className="text-sm text-blue-600">Flood Prediction</div>
                <Progress value={97.8} className="mt-2 h-2" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-2">89.5%</div>
                <div className="text-sm text-blue-600">Landslide Prediction</div>
                <Progress value={89.5} className="mt-2 h-2" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">92.1%</div>
                <div className="text-sm text-blue-600">Power Outage Prediction</div>
                <Progress value={92.1} className="mt-2 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prediction Tabs */}
        <Tabs defaultValue="flood" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-blue-50">
            <TabsTrigger value="flood" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Droplets className="w-4 h-4 mr-2" />
              Flood Risk
            </TabsTrigger>
            <TabsTrigger value="landslide" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Mountain className="w-4 h-4 mr-2" />
              Landslide Risk
            </TabsTrigger>
            <TabsTrigger value="power" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Zap className="w-4 h-4 mr-2" />
              Power Outage
            </TabsTrigger>
            <TabsTrigger value="typhoon" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Typhoon Track
            </TabsTrigger>
          </TabsList>

          {/* Flood Risk Predictions */}
          <TabsContent value="flood" className="space-y-6">
            <div className="grid gap-6">
              {floodPredictions.map((prediction, index) => (
                <Card key={index} className={`border-2 ${getSeverityColor(prediction.severity)}`}>
                  <CardHeader className="pb-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div>
                        <CardTitle className="text-blue-900 flex items-center">
                          <Droplets className="w-5 h-5 mr-2" />
                          {prediction.location}
                        </CardTitle>
                        <p className="text-blue-600 text-sm mt-1">Expected timeframe: {prediction.timeframe}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getSeverityColor(prediction.severity)}>
                          {prediction.severity.toUpperCase()} RISK
                        </Badge>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-900">{prediction.probability}%</div>
                          <div className="text-xs text-blue-600">Probability</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-900">{prediction.confidence}%</div>
                        <div className="text-xs text-blue-600">AI Confidence</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-900">
                          {prediction.affectedPopulation.toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-600">Affected Population</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-900">{prediction.evacuationCenters}</div>
                        <div className="text-xs text-blue-600">Evacuation Centers</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-900">{prediction.timeframe}</div>
                        <div className="text-xs text-blue-600">Time Window</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">Contributing Factors:</h4>
                      <div className="flex flex-wrap gap-2">
                        {prediction.factors.map((factor, factorIndex) => (
                          <Badge key={factorIndex} variant="outline" className="border-blue-200 text-blue-700">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Risk Probability</span>
                        <span className="font-bold">{prediction.probability}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${getProbabilityColor(prediction.probability)}`}
                          style={{ width: `${prediction.probability}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button className="bg-red-600 hover:bg-red-700 text-white flex-1">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Issue Alert
                      </Button>
                      <Button variant="outline" className="border-blue-200 text-blue-700 flex-1 bg-transparent">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Landslide Risk Predictions */}
          <TabsContent value="landslide" className="space-y-6">
            <div className="grid gap-6">
              {landslidePredictions.map((prediction, index) => (
                <Card key={index} className={`border-2 ${getSeverityColor(prediction.severity)}`}>
                  <CardHeader className="pb-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div>
                        <CardTitle className="text-blue-900 flex items-center">
                          <Mountain className="w-5 h-5 mr-2" />
                          {prediction.location}
                        </CardTitle>
                        <p className="text-blue-600 text-sm mt-1">Expected timeframe: {prediction.timeframe}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getSeverityColor(prediction.severity)}>
                          {prediction.severity.toUpperCase()} RISK
                        </Badge>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-900">{prediction.probability}%</div>
                          <div className="text-xs text-blue-600">Probability</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-900">{prediction.confidence}%</div>
                        <div className="text-xs text-blue-600">AI Confidence</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-900">
                          {prediction.affectedPopulation.toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-600">Affected Population</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-900">{prediction.evacuationCenters}</div>
                        <div className="text-xs text-blue-600">Evacuation Centers</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-900">{prediction.timeframe}</div>
                        <div className="text-xs text-blue-600">Time Window</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">Contributing Factors:</h4>
                      <div className="flex flex-wrap gap-2">
                        {prediction.factors.map((factor, factorIndex) => (
                          <Badge key={factorIndex} variant="outline" className="border-blue-200 text-blue-700">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Risk Probability</span>
                        <span className="font-bold">{prediction.probability}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${getProbabilityColor(prediction.probability)}`}
                          style={{ width: `${prediction.probability}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button className="bg-red-600 hover:bg-red-700 text-white flex-1">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Issue Alert
                      </Button>
                      <Button variant="outline" className="border-blue-200 text-blue-700 flex-1 bg-transparent">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Power Outage Predictions */}
          <TabsContent value="power" className="space-y-6">
            <div className="grid gap-6">
              {powerOutagePredictions.map((prediction, index) => (
                <Card key={index} className={`border-2 ${getSeverityColor(prediction.severity)}`}>
                  <CardHeader className="pb-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div>
                        <CardTitle className="text-blue-900 flex items-center">
                          <Zap className="w-5 h-5 mr-2" />
                          {prediction.location}
                        </CardTitle>
                        <p className="text-blue-600 text-sm mt-1">Expected timeframe: {prediction.timeframe}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getSeverityColor(prediction.severity)}>
                          {prediction.severity.toUpperCase()} RISK
                        </Badge>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-900">{prediction.probability}%</div>
                          <div className="text-xs text-blue-600">Probability</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-900">{prediction.confidence}%</div>
                        <div className="text-xs text-blue-600">AI Confidence</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-900">
                          {prediction.affectedCustomers.toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-600">Affected Customers</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-900">{prediction.backupSystems}</div>
                        <div className="text-xs text-blue-600">Backup Systems</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-900">{prediction.timeframe}</div>
                        <div className="text-xs text-blue-600">Time Window</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">Contributing Factors:</h4>
                      <div className="flex flex-wrap gap-2">
                        {prediction.factors.map((factor, factorIndex) => (
                          <Badge key={factorIndex} variant="outline" className="border-blue-200 text-blue-700">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Outage Probability</span>
                        <span className="font-bold">{prediction.probability}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${getProbabilityColor(prediction.probability)}`}
                          style={{ width: `${prediction.probability}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button className="bg-yellow-600 hover:bg-yellow-700 text-white flex-1">
                        <Zap className="w-4 h-4 mr-2" />
                        Activate Backup
                      </Button>
                      <Button variant="outline" className="border-blue-200 text-blue-700 flex-1 bg-transparent">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Grid Status
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Typhoon Tracking */}
          <TabsContent value="typhoon" className="space-y-6">
            <div className="grid gap-6">
              {typhoonPredictions.map((typhoon, index) => (
                <Card key={index} className="border-2 border-red-200 bg-red-50">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div>
                        <CardTitle className="text-blue-900 flex items-center">
                          <AlertTriangle className="w-5 h-5 mr-2" />
                          {typhoon.name}
                        </CardTitle>
                        <p className="text-blue-600 text-sm mt-1">
                          Category: {typhoon.category} | Expected landfall: {typhoon.landfall}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-red-100 text-red-800 border-red-200">ACTIVE TRACKING</Badge>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-900">{typhoon.probability}%</div>
                          <div className="text-xs text-blue-600">Landfall Probability</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-900">{typhoon.windSpeed}</div>
                        <div className="text-xs text-blue-600">Wind Speed</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-900">{typhoon.rainfall}</div>
                        <div className="text-xs text-blue-600">Expected Rainfall</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-900">{typhoon.stormSurge}</div>
                        <div className="text-xs text-blue-600">Storm Surge</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-900">{typhoon.landfall}</div>
                        <div className="text-xs text-blue-600">Expected Landfall</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">Affected Areas:</h4>
                      <div className="flex flex-wrap gap-2">
                        {typhoon.affectedAreas.map((area, areaIndex) => (
                          <Badge key={areaIndex} variant="outline" className="border-red-200 text-red-700">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Landfall Probability</span>
                        <span className="font-bold">{typhoon.probability}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="h-3 rounded-full bg-red-500" style={{ width: `${typhoon.probability}%` }}></div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button className="bg-red-600 hover:bg-red-700 text-white flex-1">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Issue Typhoon Alert
                      </Button>
                      <Button variant="outline" className="border-blue-200 text-blue-700 flex-1 bg-transparent">
                        <LineChart className="w-4 h-4 mr-2" />
                        Track Path
                      </Button>
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
