"use client"

import { useState, useEffect, useRef } from "react"
import { Menu, X, MapPin, Sparkles, User, Settings, HelpCircle, LogOut, LogIn, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export default function Header({ activeSection, onSectionChange }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(true) // Mock login state
  const [notificationCount, setNotificationCount] = useState(3) // Mock notification count

  const profileMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isProfileOpen) return

    const handleDocumentMouseDown = (event: PointerEvent) => {
      const targetNode = event.target as Node
      if (profileMenuRef.current && !profileMenuRef.current.contains(targetNode)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener("pointerdown", handleDocumentMouseDown)
    return () => document.removeEventListener("pointerdown", handleDocumentMouseDown)
  }, [isProfileOpen])

  const handleSectionClick = (section: string) => {
    onSectionChange(section)
    setIsMenuOpen(false)
  }

  const notifications = [
    { id: 1, title: "Weather Alert", message: "Heavy rain expected in your area", time: "2 min ago" },
    { id: 2, title: "Location Update", message: "New places discovered near you", time: "1 hour ago" },
    { id: 3, title: "AI Assistant", message: "Your travel recommendations are ready", time: "3 hours ago" },
  ]

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleSectionClick("map")}>
            <img
              src="/climatech-logo.png"
              alt="ClimaTech AI"
              className="h-10 w-10 rounded-lg shadow-lg object-contain bg-white"
            />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
                ClimaTech AI
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => handleSectionClick("learn")}
              className={`font-medium relative group transition-colors ${
                activeSection === "learn" ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Learn
              <span
                className={`absolute -bottom-1 left-0 h-0.5 bg-blue-600 transition-all ${
                  activeSection === "learn" ? "w-full" : "w-0 group-hover:w-full"
                }`}
              ></span>
            </button>
            <button
              onClick={() => handleSectionClick("weather")}
              className={`font-medium relative group transition-colors ${
                activeSection === "weather" ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Weather
              <span
                className={`absolute -bottom-1 left-0 h-0.5 bg-blue-600 transition-all ${
                  activeSection === "weather" ? "w-full" : "w-0 group-hover:w-full"
                }`}
              ></span>
            </button>
            <button
              onClick={() => handleSectionClick("assistant")}
              className={`font-medium relative group transition-colors ${
                activeSection === "assistant" ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
              }`}
            >
              AI Assistant
              <span
                className={`absolute -bottom-1 left-0 h-0.5 bg-blue-600 transition-all ${
                  activeSection === "assistant" ? "w-full" : "w-0 group-hover:w-full"
                }`}
              ></span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-blue-100 overflow-hidden animate-in slide-in-from-top-2 duration-300">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border-b border-blue-100">
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                    <p className="text-sm text-gray-600">{notificationCount} new notifications</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="p-4 border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <h4 className="font-medium text-gray-800 text-sm">{notification.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-gray-50 text-center">
                    <button
                      onClick={() => {
                        setNotificationCount(0)
                        setIsNotificationOpen(false)
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Mark all as read
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-blue-100 overflow-hidden animate-in slide-in-from-top-2 duration-300">
                  {/* User Info Section */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border-b border-blue-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-500 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">John Doe</h3>
                        <p className="text-sm text-gray-600">john.doe@example.com</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center space-x-3 text-gray-700 hover:text-blue-600">
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </button>
                    <button className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center space-x-3 text-gray-700 hover:text-blue-600">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </button>
                    <button className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center space-x-3 text-gray-700 hover:text-blue-600">
                      <HelpCircle className="h-4 w-4" />
                      <span>FAQ</span>
                    </button>
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={() => setIsLoggedIn(!isLoggedIn)}
                        className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center space-x-3 text-gray-700 hover:text-red-600"
                      >
                        {isLoggedIn ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                        <span>{isLoggedIn ? "Sign Out" : "Sign In"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-blue-100 bg-white/95 backdrop-blur-md">
            <nav className="flex flex-col space-y-4">
              <button
                onClick={() => handleSectionClick("learn")}
                className={`text-left font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors ${
                  activeSection === "learn" ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
                }`}
              >
                Learn
              </button>
              <button
                onClick={() => handleSectionClick("weather")}
                className={`text-left font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors ${
                  activeSection === "weather" ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
                }`}
              >
                Weather
              </button>
              <button
                onClick={() => handleSectionClick("assistant")}
                className={`text-left font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors ${
                  activeSection === "assistant" ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
                }`}
              >
                AI Assistant
              </button>

              {/* Mobile Profile Section */}
              <div className="pt-4 border-t border-blue-100">
                <div className="flex items-center space-x-3 px-2 py-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-500 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">John Doe</h3>
                    <p className="text-xs text-gray-600">john.doe@example.com</p>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <button className="w-full text-left px-2 py-1 rounded hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600">
                    Profile
                  </button>
                  <button className="w-full text-left px-2 py-1 rounded hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600">
                    Settings
                  </button>
                  <button className="w-full text-left px-2 py-1 rounded hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600">
                    FAQ
                  </button>
                  <button
                    onClick={() => setIsLoggedIn(!isLoggedIn)}
                    className="w-full text-left px-2 py-1 rounded hover:bg-red-50 transition-colors text-gray-700 hover:text-red-600"
                  >
                    {isLoggedIn ? "Sign Out" : "Sign In"}
                  </button>
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(isProfileOpen || isNotificationOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsProfileOpen(false)
            setIsNotificationOpen(false)
          }}
        />
      )}
    </header>
  )
}
