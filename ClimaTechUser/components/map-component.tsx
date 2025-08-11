"use client"

import type React from "react"

import { MapPin, Navigation, Compass } from "lucide-react"

interface MapComponentProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void
  selectedLocation: { lat: number; lng: number } | null
}

export default function MapComponent({ onLocationSelect, selectedLocation }: MapComponentProps) {
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convert click position to mock coordinates
    const lat = 40.7128 + (rect.height / 2 - y) * 0.0001
    const lng = -74.006 + (x - rect.width / 2) * 0.0001

    onLocationSelect({ lat, lng })
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-50 via-white to-green-50 overflow-hidden">
      {/* Map Placeholder */}
      <div
        className="w-full h-full cursor-crosshair relative flex items-center justify-center"
        onClick={handleMapClick}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
              radial-gradient(circle at 25% 25%, #3b82f6 2px, transparent 2px),
              radial-gradient(circle at 75% 75%, #10b981 2px, transparent 2px)
            `,
              backgroundSize: "50px 50px",
            }}
          ></div>
        </div>

        {/* Map Placeholder Content */}
        <div className="text-center z-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-blue-100">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-green-500 p-4 rounded-full">
                <Compass className="h-12 w-12 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Interactive Map Area</h3>
            <p className="text-gray-600 mb-4 max-w-md">
              This is where your Google Maps will be integrated. Click anywhere to simulate location selection.
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1 text-blue-600" />
                Click to select location
              </div>
              <div className="flex items-center">
                <Navigation className="h-4 w-4 mr-1 text-green-600" />
                AI-powered assistance
              </div>
            </div>
          </div>
        </div>

        {/* Selected Location Indicator */}
        {selectedLocation && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <MapPin className="h-8 w-8 text-red-500 drop-shadow-lg animate-bounce" />
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-lg px-3 py-1 shadow-lg text-xs font-medium">
                Selected Location
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map Controls Placeholder */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2">
        <div className="text-xs text-gray-600 font-medium">Map Controls</div>
        <div className="mt-2 space-y-1">
          <div className="w-8 h-8 bg-gray-100 rounded border"></div>
          <div className="w-8 h-8 bg-gray-100 rounded border"></div>
        </div>
      </div>

      {/* Coordinates Display */}
      {selectedLocation && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3">
          <div className="text-xs font-semibold text-gray-700 mb-1">Selected Coordinates</div>
          <div className="text-xs text-gray-600">Lat: {selectedLocation.lat.toFixed(6)}</div>
          <div className="text-xs text-gray-600">Lng: {selectedLocation.lng.toFixed(6)}</div>
        </div>
      )}
    </div>
  )
}
