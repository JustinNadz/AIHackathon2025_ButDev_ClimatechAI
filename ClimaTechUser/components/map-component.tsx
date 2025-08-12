"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Loader } from "@googlemaps/js-api-loader"
import WeatherLegend from "./weather-legend"
import { generateWeatherData, WeatherData } from "@/types/weather"
import { MapPin, Navigation, Thermometer, Droplets, Wind, ChevronDown, ChevronUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface MapComponentProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void
  selectedLocation: { lat: number; lng: number } | null
}

type City = {
  name: string
  lat: number
  lng: number
}

interface UserLocationWeather {
  location: string
  weather: WeatherData
  forecast: WeatherData[]
}

const PHILIPPINE_CITIES: City[] = [
  { name: "Manila", lat: 14.5995, lng: 120.9842 },
  { name: "Quezon City", lat: 14.6760, lng: 121.0437 },
  { name: "Cebu City", lat: 10.3157, lng: 123.8854 },
  { name: "Davao City", lat: 7.1907, lng: 125.4553 },
  { name: "Iloilo City", lat: 10.7202, lng: 122.5621 },
  { name: "Baguio", lat: 16.4023, lng: 120.5960 },
  { name: "Zamboanga City", lat: 6.9214, lng: 122.0790 },
  { name: "Cagayan de Oro", lat: 8.4542, lng: 124.6319 },
  { name: "General Santos", lat: 6.1164, lng: 125.1716 },
]

export default function MapComponent({ onLocationSelect, selectedLocation }: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const googleRef = useRef<typeof google | null>(null)
  const userMarkerRef = useRef<google.maps.Marker | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [userLocationWeather, setUserLocationWeather] = useState<UserLocationWeather | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isWeatherExpanded, setIsWeatherExpanded] = useState(false)

  const cityMarkersRef = useRef<Record<string, google.maps.Marker>>({})
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        setUserLocation(location)
        setLocationError(null)

        // Generate weather data for user location
        const currentWeather = generateWeatherData()
        const forecast = Array.from({ length: 5 }, () => generateWeatherData())
        
        // Reverse geocode to get location name
        let locationName = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
        
        setUserLocationWeather({
          location: locationName,
          weather: currentWeather,
          forecast
        })

        // Center map on user location
        if (mapRef.current) {
          mapRef.current.panTo(location)
          mapRef.current.setZoom(12)
        }

        // Add user location marker
        if (googleRef.current && mapRef.current) {
          if (userMarkerRef.current) {
            userMarkerRef.current.setMap(null)
          }
          
          userMarkerRef.current = new googleRef.current.maps.Marker({
            map: mapRef.current,
            position: location,
            icon: {
              url: currentWeather.icon,
              scaledSize: new googleRef.current.maps.Size(60, 60),
              anchor: new googleRef.current.maps.Point(30, 30),
            },
            title: "Your Location",
            animation: googleRef.current.maps.Animation.DROP,
          })

          // Add click listener for user marker
          userMarkerRef.current.addListener("click", () => {
            if (!infoWindowRef.current) return
            const content = `
              <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; min-width: 200px;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <img src="${currentWeather.icon}" alt="${currentWeather.condition}" 
                       style="width: 32px; height: 32px; margin-right: 8px; object-fit: contain;">
                  <div>
                    <div style="font-weight: 600; font-size: 16px; color: #1f2937;">Your Location</div>
                    <div style="font-size: 12px; color: #6b7280;">${currentWeather.condition}</div>
                  </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; color: #374151;">
                  <div style="display: flex; align-items: center;">
                    <span style="font-weight: 500;">Temperature:</span>
                    <span style="margin-left: 4px; font-weight: 600; color: #dc2626;">${currentWeather.temperature}°C</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="font-weight: 500;">Humidity:</span>
                    <span style="margin-left: 4px; color: #2563eb;">${currentWeather.humidity}%</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="font-weight: 500;">Wind:</span>
                    <span style="margin-left: 4px; color: #059669;">${currentWeather.windSpeed} km/h</span>
                  </div>
                </div>
              </div>
            `
            infoWindowRef.current.setContent(content)
            infoWindowRef.current.open({ anchor: userMarkerRef.current, map: mapRef.current })
          })
        }

        onLocationSelect(location)
      },
      (error) => {
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location access denied by user")
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information unavailable")
            break
          case error.TIMEOUT:
            setLocationError("Location request timed out")
            break
          default:
            setLocationError("An unknown error occurred")
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }

  // Initialize the Google Map once
  useEffect(() => {
    let isMounted = true
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || ""

    if (!apiKey) {
      setLoadError("Missing GOOGLE_MAPS_API_KEY")
      return
    }

    if (!mapContainerRef.current) return

    const loader = new Loader({
      apiKey,
      libraries: ["places"],
    })

    loader
      .load()
      .then((google) => {
        if (!isMounted || !mapContainerRef.current) return
        googleRef.current = google

        // Focus on the Philippines
        const philippinesCenter = { lat: 12.8797, lng: 121.7740 }

        mapRef.current = new google.maps.Map(mapContainerRef.current, {
          center: philippinesCenter,
          zoom: 6,
          mapId: "DEMO_MAP_ID",
          minZoom: 5,
          maxZoom: 16,
        })

        infoWindowRef.current = new google.maps.InfoWindow()

        // Add city markers with weather data
        addCityWeatherMarkers()

        // Automatically get user location on load
        getCurrentLocation()
      })
      .catch((err) => {
        console.error("Failed to load Google Maps:", err)
        setLoadError("Failed to load Google Maps")
      })

    async function addCityWeatherMarkers() {
      const g = googleRef.current
      const map = mapRef.current
      if (!g || !map) return

      for (const city of PHILIPPINE_CITIES) {
        try {
          const res = await fetch(`/api/google-weather?lat=${city.lat}&lng=${city.lng}`)
          const data = await res.json()

          // Create custom marker with weather icon
          const marker = new g.maps.Marker({
            map,
            position: { lat: city.lat, lng: city.lng },
            icon: {
              url: data.icon || "/placeholder.svg",
              scaledSize: new g.maps.Size(50, 50),
              anchor: new g.maps.Point(25, 25),
            },
            title: city.name,
          })

          const content = `
            <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; min-width: 200px;">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <img src="${data.icon || "/placeholder.svg"}" alt="${data.condition || data.description}" 
                     style="width: 32px; height: 32px; margin-right: 8px; object-fit: contain;">
                <div>
                  <div style="font-weight: 600; font-size: 16px; color: #1f2937;">${city.name}</div>
                  <div style="font-size: 12px; color: #6b7280;">${data.condition || data.description}</div>
                  ${data.source ? `<div style="font-size: 10px; color: #9ca3af;">Source: ${data.source === 'backend_database' ? 'Live Data' : 'Generated'}</div>` : ''}
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; color: #374151;">
                <div style="display: flex; align-items: center;">
                  <span style="font-weight: 500;">Temperature:</span>
                  <span style="margin-left: 4px; font-weight: 600; color: #dc2626;">${data.temperatureC != null ? `${data.temperatureC}°C` : "N/A"}</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="font-weight: 500;">Humidity:</span>
                  <span style="margin-left: 4px; color: #2563eb;">${data.humidity != null ? `${data.humidity}%` : "N/A"}</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="font-weight: 500;">Wind:</span>
                  <span style="margin-left: 4px; color: #059669;">${data.windSpeed != null ? `${data.windSpeed} km/h` : "N/A"}</span>
                </div>
                ${data.rainfall != null && data.rainfall > 0 ? `
                <div style="display: flex; align-items: center;">
                  <span style="font-weight: 500;">Rainfall:</span>
                  <span style="margin-left: 4px; color: #0ea5e9;">${data.rainfall}mm/h</span>
                </div>
                ` : ''}
                ${data.pressure != null ? `
                <div style="display: flex; align-items: center;">
                  <span style="font-weight: 500;">Pressure:</span>
                  <span style="margin-left: 4px; color: #8b5cf6;">${data.pressure}mb</span>
                </div>
                ` : ''}
                ${data.recorded_at ? `
                <div style="grid-column: 1 / -1; font-size: 10px; color: #9ca3af; margin-top: 4px;">
                  Updated: ${new Date(data.recorded_at).toLocaleString()}
                </div>
                ` : ''}
                ${data.station_name ? `
                <div style="grid-column: 1 / -1; font-size: 10px; color: #9ca3af;">
                  Station: ${data.station_name}
                </div>
                ` : ''}
              </div>
            </div>
          `

          marker.addListener("click", () => {
            if (!infoWindowRef.current) return
            infoWindowRef.current.setContent(content)
            infoWindowRef.current.open({ anchor: marker, map })
          })

          cityMarkersRef.current[city.name] = marker
        } catch (e) {
          console.warn("Failed to load weather for", city.name, e)
        }
      }
    }

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-red-600">
        {loadError}
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="absolute inset-0" />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        {/* Map Type Selector */}
        <div className="flex space-x-2">
          <button
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.setMapTypeId("roadmap")
              }
            }}
            className="bg-white/90 text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-lg backdrop-blur-sm px-3 py-1 text-sm rounded"
          >
            Map
          </button>
          <button
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.setMapTypeId("satellite")
              }
            }}
            className="bg-white/90 text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-lg backdrop-blur-sm px-3 py-1 text-sm rounded"
          >
            Satellite
          </button>
        </div>
        
        {/* Weather Legend */}
        <WeatherLegend />
      </div>

      {/* User Location Weather Container */}
      <div className="absolute top-2 left-2 flex flex-col space-y-3">
        {/* Location Access Button */}
        {!userLocation && (
          <Card className="p-3 bg-white/95 backdrop-blur-md shadow-lg border border-gray-200">
            <Button
              onClick={getCurrentLocation}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
              size="sm"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Get My Location
            </Button>
            {locationError && (
              <p className="text-xs text-red-600 mt-2">{locationError}</p>
            )}
          </Card>
        )}

        {/* Minimalist Weather Container with Dropdown */}
        {userLocationWeather && (
          <Card className="w-72 bg-white/95 backdrop-blur-md shadow-lg border border-gray-200 overflow-hidden">
            {/* Compact Header - Always Visible */}
            <div 
              className="p-3 bg-gradient-to-r from-blue-500 to-green-500 text-white cursor-pointer hover:from-blue-600 hover:to-green-600 transition-all"
              onClick={() => setIsWeatherExpanded(!isWeatherExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium truncate">{userLocationWeather.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <img
                      src={userLocationWeather.weather.icon}
                      alt={userLocationWeather.weather.condition}
                      className="w-6 h-6 object-contain"
                    />
                    <span className="text-sm font-semibold">
                      {userLocationWeather.weather.temperature}°C
                    </span>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      getCurrentLocation()
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 h-6 w-6 p-0"
                  >
                    <Navigation className="h-3 w-3" />
                  </Button>
                  {isWeatherExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>
            </div>

            {/* Expandable Weather Details */}
            {isWeatherExpanded && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                {/* Current Weather Details */}
                <div className="p-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={userLocationWeather.weather.icon}
                        alt={userLocationWeather.weather.condition}
                        className="w-12 h-12 object-contain"
                      />
                      <div>
                        <div className="text-2xl font-bold text-gray-800">
                          {userLocationWeather.weather.temperature}°C
                        </div>
                        <div className="text-xs text-gray-600 truncate max-w-[120px]">
                          {userLocationWeather.weather.condition}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-xs text-gray-600">
                        <Droplets className="h-3 w-3 mr-1" />
                        {userLocationWeather.weather.humidity}%
                      </div>
                      <div className="flex items-center text-xs text-gray-600 mt-1">
                        <Wind className="h-3 w-3 mr-1" />
                        {userLocationWeather.weather.windSpeed} km/h
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5-Day Forecast */}
                <div className="p-3">
                  <div className="text-xs font-medium text-gray-700 mb-2">5-Day Forecast</div>
                  <div className="grid grid-cols-5 gap-2">
                    {userLocationWeather.forecast.map((day, index) => (
                      <div key={index} className="text-center">
                        <div className="text-xs text-gray-600 mb-1">
                          {index === 0 ? 'Today' : `+${index}d`}
                        </div>
                        <img
                          src={day.icon}
                          alt={day.condition}
                          className="w-6 h-6 object-contain mx-auto mb-1"
                        />
                        <div className="text-xs font-medium text-gray-800">
                          {day.temperature}°
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
