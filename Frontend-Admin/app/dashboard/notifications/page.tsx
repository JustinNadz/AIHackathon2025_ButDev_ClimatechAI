"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Info,
  Trash2,
  BookMarkedIcon as MarkAsUnreadIcon,
  Settings,
  Filter,
  Search,
} from "lucide-react"
import { Input } from "@/components/ui/input"

interface Notification {
  id: string
  title: string
  message: string
  type: "emergency" | "warning" | "info" | "success"
  timestamp: string
  read: boolean
  category: string
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Typhoon Alert - Signal #3",
    message: "Typhoon 'Paolo' is approaching Metro Manila. Expected landfall in 6 hours. Prepare emergency protocols.",
    type: "emergency",
    timestamp: "2024-01-19T14:30:00Z",
    read: false,
    category: "Weather",
  },

  {
    id: "3",
    title: "Earthquake Monitoring Update",
    message: "Magnitude 4.2 earthquake detected in Batangas. No tsunami threat. Monitoring aftershocks.",
    type: "info",
    timestamp: "2024-01-19T12:45:00Z",
    read: true,
    category: "Seismic",
  },
  {
    id: "4",
    title: "System Backup Completed",
    message: "Daily system backup completed successfully. All data secured and verified.",
    type: "success",
    timestamp: "2024-01-19T11:00:00Z",
    read: true,
    category: "System",
  },
  {
    id: "5",
    title: "Air Quality Alert",
    message: "PM2.5 levels in Manila exceeded safe limits. Health advisory issued for sensitive groups.",
    type: "warning",
    timestamp: "2024-01-19T10:30:00Z",
    read: false,
    category: "Environment",
  },

]

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "emergency":
      return <AlertTriangle className="w-5 h-5 text-red-500" />
    case "warning":
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    case "success":
      return <CheckCircle className="w-5 h-5 text-green-500" />
    default:
      return <Info className="w-5 h-5 text-blue-500" />
  }
}

const getNotificationBadgeColor = (type: string) => {
  switch (type) {
    case "emergency":
      return "bg-red-100 text-red-800 border-red-200"
    case "warning":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "success":
      return "bg-green-100 text-green-800 border-green-200"
    default:
      return "bg-blue-100 text-blue-800 border-blue-200"
  }
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    return `${diffInMinutes} minutes ago`
  } else if (diffInHours < 24) {
    return `${diffInHours} hours ago`
  } else {
    return date.toLocaleDateString()
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const unreadCount = notifications.filter((n) => !n.read).length
  const emergencyCount = notifications.filter((n) => n.type === "emergency" && !n.read).length

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "unread") return matchesSearch && !notification.read
    if (activeTab === "emergency") return matchesSearch && notification.type === "emergency"
    return matchesSearch
  })

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAsUnread = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: false } : notification)),
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Notifications</h1>
            <p className="text-blue-600 mt-1">
              {unreadCount} unread notifications
              {emergencyCount > 0 && (
                <span className="ml-2 text-red-600 font-semibold">({emergencyCount} emergency)</span>
              )}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={markAllAsRead}
              variant="outline"
              className="text-blue-700 border-blue-200 hover:bg-blue-50 bg-transparent"
              disabled={unreadCount === 0}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
            <Button variant="outline" className="text-blue-700 border-blue-200 hover:bg-blue-50 bg-transparent">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="text-blue-700 border-blue-200 hover:bg-blue-50 bg-transparent">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">All</span>
              <Badge variant="secondary" className="ml-1">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              <MarkAsUnreadIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Unread</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="emergency" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Emergency</span>
              {emergencyCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {emergencyCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No notifications found</h3>
                      <p className="text-gray-500">
                        {searchTerm ? "Try adjusting your search terms" : "You're all caught up!"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`transition-all hover:shadow-md ${
                        !notification.read ? "border-l-4 border-l-blue-500 bg-blue-50/30" : ""
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                              <div className="flex-1">
                                <h3 className={`font-semibold text-gray-900 ${!notification.read ? "font-bold" : ""}`}>
                                  {notification.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <Badge variant="outline" className={getNotificationBadgeColor(notification.type)}>
                                    {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {notification.category}
                                  </Badge>
                                  <div className="flex items-center text-xs text-gray-500">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {formatTimestamp(notification.timestamp)}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    notification.read ? markAsUnread(notification.id) : markAsRead(notification.id)
                                  }
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                >
                                  {notification.read ? (
                                    <MarkAsUnreadIcon className="w-4 h-4" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotification(notification.id)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            <p className="text-gray-700 text-sm leading-relaxed">{notification.message}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
