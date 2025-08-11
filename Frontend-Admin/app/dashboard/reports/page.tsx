"use client"

import React, { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  FileText,
  Download,
  Calendar,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Clock,
  Users,
  Activity,
  Filter,
  Search,
} from "lucide-react"

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("monthly")
  const [selectedType, setSelectedType] = useState("all")

  const recentReports = [
    {
      id: "RPT-2024-001",
      title: "Monthly Disaster Response Summary - January 2024",
      type: "summary",
      date: "2024-01-31",
      size: "2.4 MB",
      format: "PDF",
      status: "completed",
      downloads: 45
    },
    {
      id: "RPT-2024-002", 
      title: "Flood Risk Assessment - Metro Manila",
      type: "assessment",
      date: "2024-01-28",
      size: "5.1 MB",
      format: "PDF",
      status: "completed",
      downloads: 78
    },
    {
      id: "RPT-2024-003",
      title: "Clean Energy Performance Report - Q4 2023",
      type: "energy",
      date: "2024-01-25",
      size: "3.8 MB", 
      format: "PDF",
      status: "completed",
      downloads: 32
    },
    {
      id: "RPT-2024-004",
      title: "Emergency Response Time Analysis",
      type: "performance",
      date: "2024-01-22",
      size: "1.9 MB",
      format: "PDF",
      status: "processing",
      downloads: 0
    }
  ]

  const activityLogs = [
    {
      id: "LOG-001",
      timestamp: "2024-01-31 14:30:25",
      user: "Admin User",
      action: "Generated Monthly Report",
      details: "Monthly Disaster Response Summary for January 2024",
      type: "report_generation",
      status: "success"
    },
    {
      id: "LOG-002",
      timestamp: "2024-01-31 13:45:12",
      user: "Emergency Coordinator",
      action: "Activated Flood Protocol",
      details: "Flood warning issued for Marikina River Basin",
      type: "protocol_activation",
      status: "success"
    },
    {
      id: "LOG-003",
      timestamp: "2024-01-31 12:15:08",
      user: "System",
      action: "AI Prediction Update",
      details: "Updated flood risk assessment for Metro Manila",
      type: "ai_prediction",
      status: "success"
    },
    {
      id: "LOG-004",
      timestamp: "2024-01-31 11:30:45",
      user: "Energy Manager",
      action: "Microgrid Switch",
      details: "Switched hospital backup power to solar grid",
      type: "energy_management",
      status: "success"
    },
    {
      id: "LOG-005",
      timestamp: "2024-01-31 10:22:33",
      user: "Data Analyst",
      action: "Export Data",
      details: "Exported seismic monitoring data for analysis",
      type: "data_export",
      status: "success"
    }
  ]

  const responseMetrics = [
    {
      metric: "Average Response Time",
      value: "12.5 minutes",
      change: "-8%",
      trend: "down",
      period: "Last 30 days"
    },
    {
      metric: "Successful Evacuations",
      value: "2,847 people",
      change: "+15%",
      trend: "up",
      period: "Last 30 days"
    },
    {
      metric: "AI Prediction Accuracy",
      value: "94.2%",
      change: "+2.1%",
      trend: "up",
      period: "Last 30 days"
    },
    {
      metric: "Clean Energy Savings",
      value: "₱1.8M",
      change: "+22%",
      trend: "up",
      period: "Last 30 days"
    }
  ]

  const disasterEvents = [
    {
      id: "EVT-001",
      type: "Flood",
      location: "Marikina River Basin",
      date: "2024-01-28",
      severity: "High",
      affected: "15,000 residents",
      responseTime: "8 minutes",
      evacuated: "2,400 people",
      status: "resolved"
    },
    {
      id: "EVT-002",
      type: "Landslide",
      location: "Baguio Mountain Slopes",
      date: "2024-01-25",
      severity: "Medium",
      affected: "850 residents",
      responseTime: "15 minutes",
      evacuated: "320 people",
      status: "resolved"
    },
    {
      id: "EVT-003",
      type: "Power Outage",
      location: "Northern Luzon Grid",
      date: "2024-01-22",
      severity: "Low",
      affected: "45,000 customers",
      responseTime: "5 minutes",
      evacuated: "0 people",
      status: "resolved"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800"
      case "processing": return "bg-yellow-100 text-yellow-800"
      case "failed": return "bg-red-100 text-red-800"
      case "success": return "bg-green-100 text-green-800"
      case "resolved": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "summary": return "bg-blue-100 text-blue-800"
      case "assessment": return "bg-purple-100 text-purple-800"
      case "energy": return "bg-green-100 text-green-800"
      case "performance": return "bg-orange-100 text-orange-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High": return "bg-red-100 text-red-800"
      case "Medium": return "bg-yellow-100 text-yellow-800"
      case "Low": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <React.Fragment>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-900">Reports & Logs</h1>
              <p className="text-blue-600 mt-1">Comprehensive reporting and activity monitoring</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[180px] border-blue-200">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <BarChart3 className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>

          {/* Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {responseMetrics.map((metric, index) => (
              <Card key={index} className="border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">{metric.metric}</p>
                      <p className="text-2xl font-bold text-blue-900">{metric.value}</p>
                      <div className="flex items-center mt-1">
                        <span className={`text-xs ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {metric.change}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">{metric.period}</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      {metric.trend === 'up' ? (
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      ) : (
                        <TrendingUp className="w-6 h-6 text-red-600 transform rotate-180" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Reports Tabs */}
          <Tabs defaultValue="reports" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-blue-50">
              <TabsTrigger value="reports" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <FileText className="w-4 h-4 mr-2" />
                Recent Reports
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Activity className="w-4 h-4 mr-2" />
                Activity Logs
              </TabsTrigger>
              <TabsTrigger value="events" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Disaster Events
              </TabsTrigger>
            </TabsList>

            {/* Reports Tab Content */}
            <TabsContent value="reports" className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Search reports..."
                    className="pl-10 border-blue-200"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-[150px] border-blue-200">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="summary">Summary</SelectItem>
                      <SelectItem value="assessment">Assessment</SelectItem>
                      <SelectItem value="energy">Energy</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                {recentReports.map((report) => (
                  <Card key={report.id} className="border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-blue-900">{report.title}</h3>
                              <Badge className={getStatusColor(report.status)}>
                                {report.status}
                              </Badge>
                              <Badge className={getTypeColor(report.type)}>
                                {report.type}
                              </Badge>
                            </div>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span>{report.date}</span>
                              <span className="mx-2">•</span>
                              <span>{report.size}</span>
                              <span className="mx-2">•</span>
                              <span>{report.format}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                          <div className="text-sm text-gray-500 flex items-center">
                            <Download className="w-4 h-4 mr-1" />
                            <span>{report.downloads} downloads</span>
                          </div>
                          <Button variant="outline" size="sm" className="border-blue-200 text-blue-600">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Activity Logs Tab Content */}
            <TabsContent value="activity" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-blue-900">Recent System Activity</h3>
                <Button variant="outline" size="sm" className="border-blue-200 text-blue-600">
                  <Download className="w-4 h-4 mr-1" />
                  Export Logs
                </Button>
              </div>

              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <Card key={log.id} className="border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Activity className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className="font-medium text-blue-900">{log.action}</span>
                              <Badge className={`${getStatusColor(log.status)} ml-2`}>
                                {log.status}
                              </Badge>
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              <span>{log.timestamp}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Users className="w-3 h-3 mr-1" />
                            <span>{log.user}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Disaster Events Tab Content */}
            <TabsContent value="events" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-blue-900">Recent Disaster Events</h3>
                <Button variant="outline" size="sm" className="border-blue-200 text-blue-600">
                  <Download className="w-4 h-4 mr-1" />
                  Export Events
                </Button>
              </div>

              <div className="space-y-4">
                {disasterEvents.map((event) => (
                  <Card key={event.id} className="border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-blue-900">{event.type} - {event.location}</h3>
                              <Badge className={getSeverityColor(event.severity)}>
                                {event.severity} Severity
                              </Badge>
                              <Badge className={getStatusColor(event.status)}>
                                {event.status}
                              </Badge>
                            </div>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span>{event.date}</span>
                              <span className="mx-2">•</span>
                              <span>Affected: {event.affected}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>Response Time: {event.responseTime}</span>
                              <span className="mx-2">•</span>
                              <span>Evacuated: {event.evacuated}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                          <Button variant="outline" size="sm" className="border-blue-200 text-blue-600">
                            View Details
                          </Button>
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
    </React.Fragment>
  )
}
