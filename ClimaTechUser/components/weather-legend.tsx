"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Info } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { allWeatherConditions, weatherIcons, temperatureRanges, WeatherCondition } from "@/types/weather"

export default function WeatherLegend() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/90 text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-lg backdrop-blur-sm"
        size="sm"
      >
        <Info className="h-4 w-4 mr-2" />
        Legend
        {isOpen ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
      </Button>

      {isOpen && (
        <Card className="absolute top-full right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-md shadow-2xl border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 text-sm mb-1">Weather Conditions</h3>
            <p className="text-xs text-gray-600">Click on map markers to see weather details</p>
          </div>
          <div className="p-2 space-y-1">
            {allWeatherConditions.map((condition) => {
              const [minTemp, maxTemp] = temperatureRanges[condition]
              return (
                <div
                  key={condition}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <img
                      src={weatherIcons[condition]}
                      alt={condition}
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        // Fallback to a default icon if image fails to load
                        e.currentTarget.src = "/placeholder.svg"
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{condition}</p>
                    <p className="text-xs text-gray-600">{minTemp}°C - {maxTemp}°C</p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600 text-center">
              Weather icons show current conditions at each location
            </p>
          </div>
        </Card>
      )}

      {/* Backdrop to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
} 