"use client"

import { useState, useEffect } from "react"
import { Cloud, Sun, CloudRain, Wind, Droplets, Eye, Gauge, MapPin, RefreshCw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { WeatherCondition, generateWeatherData, weatherIcons } from "@/types/weather"
import { getFrontendCitiesWeather } from "@/lib/api"

interface CityWeatherData {
  id: number | null
  city_name: string
  station_name: string
  coordinates: {
    lat: number
    lng: number
  }
  temperature: number | null
  humidity: number | null
  rainfall: number | null
  wind_speed: number | null
  wind_direction: number | null
  pressure: number | null
  weather_condition: string
  filipino_condition: string
  recorded_at: string | null
  data_source: string
  status: string
}

interface BackendWeatherResponse {
  cities: CityWeatherData[]
  total_cities: number
  cities_with_data: number
  success_rate: number
  data_source: string
  timestamp: string
}

export default function WeatherSection() {
  const [searchLocation, setSearchLocation] = useState("")
  const [currentWeatherData, setCurrentWeatherData] = useState(() => generateWeatherData())
  const [citiesWeather, setCitiesWeather] = useState<CityWeatherData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const [error, setError] = useState<string>("")

  // Weather icon mapping function - defined first to avoid hoisting issues
  const getWeatherIconPath = (condition: string): string => {
    const iconMap: { [key: string]: string } = {
      "Clear Skies": "/Clear Skies.png",
      "Cloudy Skies with Rainshowers": "/Cloudy Skies with Rain showers.png",
      "Monsoon Rains": "/Monsoon Rains.png",
      "Partly Cloudy Skies": "/Partly Cloudy Skies.png",
      "Partly Cloudy Skies With Isolated Rainshowers": "/Partly Cloud Skies with isolated rainshowers.png",
      "Stormy": "/Stormy.png",
      "Cloudy Skies": "/Cloudy Skies.png",
      "Partly Cloudy Skies to at times cloudy with Rainshowers and Thunderstorms": "/Partly Cloudy Skies to at times cloudy with Rainshowers and Thunderstorms.png",
      "Light Rains": "/Light Rains.png",
      "Cloudy Skies with Rainshowers and Thunderstorms": "/Cloudy Skies with Rainshowers and Thunderstorms.png",
      "Occasional Rains": "/Occasional Rain.png",
      "Rains with Gusty Winds": "/Rains with Gusty Winds.png"
    }
    
    return iconMap[condition] || "/placeholder.svg"
  }

  const getWeatherIcon = (condition: WeatherCondition | string) => {
    // Return appropriate Lucide icon based on condition
    if (condition.includes("Clear")) return Sun
    if (condition.includes("Rain") || condition.includes("Monsoon")) return CloudRain
    if (condition.includes("Cloudy")) return Cloud
    return Cloud
  }

  // Fetch real weather data from backend
  const fetchCitiesWeather = async () => {
    setIsLoading(true)
    setError("")
    try {
      const response: BackendWeatherResponse = await getFrontendCitiesWeather()
      setCitiesWeather(response.cities)
      setLastUpdated(new Date().toLocaleTimeString())
      console.log(`✅ Fetched weather for ${response.cities_with_data}/${response.total_cities} cities`)
    } catch (err) {
      console.error("Failed to fetch cities weather:", err)
      setError("Failed to load weather data from backend")
      // Keep any existing data on error
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch and periodic updates
  useEffect(() => {
    fetchCitiesWeather()
    
    // Update every 5 minutes
    const interval = setInterval(fetchCitiesWeather, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  // Generate new weather data every 30 seconds for the demo current weather
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWeatherData(generateWeatherData())
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Find Manila weather for current display
  const manilaWeather = citiesWeather.find(city => city.city_name === "Manila")
  
  const currentWeather = {
    location: manilaWeather ? `${manilaWeather.city_name}, Philippines` : "Manila, Philippines",
    temperature: manilaWeather?.temperature || currentWeatherData.temperature,
    condition: manilaWeather?.filipino_condition || currentWeatherData.condition,
    humidity: manilaWeather?.humidity || currentWeatherData.humidity,
    windSpeed: manilaWeather?.wind_speed || currentWeatherData.windSpeed,
    visibility: Math.floor(Math.random() * 10) + 5, // 5-15 km
    pressure: manilaWeather?.pressure || (Math.floor(Math.random() * 50) + 990), // 990-1040 mb
    uvIndex: Math.floor(Math.random() * 8) + 1, // 1-8
    feelsLike: (manilaWeather?.temperature || currentWeatherData.temperature) + Math.floor(Math.random() * 6) - 3,
    icon: getWeatherIconPath(manilaWeather?.filipino_condition || currentWeatherData.condition),
    rainfall: manilaWeather?.rainfall || 0,
    source: manilaWeather ? "backend" : "generated"
  }

  // Generate weather data for other cities that might not be in backend
  const hourlyForecast = Array.from({ length: 6 }, (_, i) => {
    const cityIndex = i % citiesWeather.length
    const cityData = citiesWeather[cityIndex]
    
    if (cityData && cityData.status === "success") {
      return {
        time: `${12 + i} ${i < 6 ? "PM" : "AM"}`,
        temp: cityData.temperature || 0,
        condition: cityData.filipino_condition,
        icon: getWeatherIconPath(cityData.filipino_condition),
        city: cityData.city_name
      }
    } else {
      const weatherData = generateWeatherData()
      return {
        time: `${12 + i} ${i < 6 ? "PM" : "AM"}`,
        temp: weatherData.temperature,
        condition: weatherData.condition,
        icon: weatherData.icon,
        city: "Generated"
      }
    }
  })

  // Generate weekly forecast from available cities
  const weeklyForecast = [
    "Today", "Tomorrow", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ].map((day, i) => {
    const cityIndex = i % Math.max(citiesWeather.length, 1)
    const cityData = citiesWeather[cityIndex]
    
    if (cityData && cityData.status === "success") {
      // Create some variation for different days
      const tempVariation = Math.floor(Math.random() * 6) - 3
      const baseTemp = cityData.temperature || 28
      return {
        day,
        high: Math.max(baseTemp + tempVariation + 2, baseTemp),
        low: Math.min(baseTemp + tempVariation - 2, baseTemp),
        condition: cityData.filipino_condition,
        icon: getWeatherIconPath(cityData.filipino_condition),
        city: cityData.city_name
      }
    } else {
      const weatherData = generateWeatherData()
      const weatherData2 = generateWeatherData()
      return {
        day,
        high: Math.max(weatherData.temperature, weatherData2.temperature),
        low: Math.min(weatherData.temperature, weatherData2.temperature),
        condition: weatherData.condition,
        icon: weatherData.icon,
        city: "Generated"
      }
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent mb-4">
            Weather Forecast
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Get accurate weather information and forecasts for locations across the Philippines
          </p>
          
          {/* Status and refresh */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="h-4 w-4" />
              <span>{citiesWeather.length} cities loaded</span>
              {lastUpdated && <span>• Last updated: {lastUpdated}</span>}
            </div>
            <Button
              onClick={fetchCitiesWeather}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          {error && (
            <div className="text-red-600 text-sm mt-2 bg-red-50 px-4 py-2 rounded-lg inline-block">
              {error}
            </div>
          )}
        </div>

        {/* Search Bar */}
        <Card className="p-6 mb-6 bg-white/80 backdrop-blur-sm">
          <div className="flex gap-3">
            <Input
              placeholder="Search for a city..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="flex-1"
            />
            <Button className="bg-blue-600 hover:bg-blue-700">Search</Button>
          </div>
        </Card>

        {/* Current Weather */}
        <Card className="p-6 mb-6 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentWeather.location}</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <img 
                    src={currentWeather.icon} 
                    alt={currentWeather.condition}
                    className="w-16 h-16 object-contain mr-4"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      const fallbackIcon = e.currentTarget.nextElementSibling as HTMLElement
                      if (fallbackIcon) fallbackIcon.style.display = 'block'
                    }}
                  />
                  <Sun className="h-12 w-12 text-yellow-500 hidden" />
                  <div>
                    <p className="text-4xl font-bold text-gray-800">{currentWeather.temperature}°C</p>
                    <p className="text-gray-600">{currentWeather.condition}</p>
                    <p className="text-xs text-gray-500">
                      Source: {currentWeather.source === "backend" ? "Database" : "Generated"}
                      {currentWeather.rainfall !== undefined && currentWeather.rainfall > 0 && (
                        <span> • {currentWeather.rainfall}mm/h rainfall</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Weather details grid */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="flex flex-col items-center">
                <Droplets className="h-5 w-5 text-blue-500 mb-1" />
                <span className="text-sm text-gray-600">Humidity</span>
                <span className="font-semibold">{currentWeather.humidity}%</span>
              </div>
              <div className="flex flex-col items-center">
                <Wind className="h-5 w-5 text-green-500 mb-1" />
                <span className="text-sm text-gray-600">Wind</span>
                <span className="font-semibold">{currentWeather.windSpeed} km/h</span>
              </div>
              <div className="flex flex-col items-center">
                <Eye className="h-5 w-5 text-purple-500 mb-1" />
                <span className="text-sm text-gray-600">Visibility</span>
                <span className="font-semibold">{currentWeather.visibility} km</span>
              </div>
              <div className="flex flex-col items-center">
                <Gauge className="h-5 w-5 text-orange-500 mb-1" />
                <span className="text-sm text-gray-600">Pressure</span>
                <span className="font-semibold">{currentWeather.pressure} mb</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Philippine Cities Weather Grid */}
        {citiesWeather.length > 0 && (
          <Card className="p-6 mb-6 bg-white/80 backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Philippine Cities Weather</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {citiesWeather.map((city, index) => (
                <div
                  key={city.id || index}
                  className={`p-4 rounded-lg border transition-colors ${
                    city.status === "success" 
                      ? "bg-blue-50 border-blue-200 hover:bg-blue-100" 
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">{city.city_name}</h4>
                    <div className="flex items-center">
                      {city.status === "success" ? (
                        <>
                          <img 
                            src={getWeatherIconPath(city.filipino_condition)} 
                            alt={city.filipino_condition}
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </>
                      ) : (
                        <Cloud className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {city.status === "success" ? (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-2xl font-bold text-gray-800">
                          {city.temperature}°C
                        </span>
                        <span className="text-xs text-gray-500">
                          {city.data_source === "database" ? "Live" : "Mock"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {city.filipino_condition}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <span>💧 {city.humidity}%</span>
                        <span>💨 {city.wind_speed} km/h</span>
                        {city.rainfall !== null && city.rainfall > 0 && (
                          <span className="col-span-2">🌧️ {city.rainfall}mm/h</span>
                        )}
                      </div>
                      {city.recorded_at && (
                        <p className="text-xs text-gray-400 mt-1">
                          Updated: {new Date(city.recorded_at).toLocaleTimeString()}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-gray-500">
                      <p>No data available</p>
                      <p className="text-xs">Status: {city.status}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Hourly Forecast */}
        <Card className="p-6 mb-6 bg-white/80 backdrop-blur-sm">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Today's Forecast</h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {hourlyForecast.map((hour, index) => {
              const IconComponent = getWeatherIcon(hour.condition)
              return (
                <div key={index} className="flex-shrink-0 text-center p-3 rounded-lg hover:bg-blue-50 transition-colors min-w-[100px]">
                  <p className="text-sm text-gray-600 mb-2">{hour.time}</p>
                  <div className="flex justify-center mb-2">
                    <img 
                      src={hour.icon} 
                      alt={hour.condition}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        // Fallback to Lucide icon if image fails
                        e.currentTarget.style.display = 'none'
                        const fallbackIcon = e.currentTarget.nextElementSibling as HTMLElement
                        if (fallbackIcon) fallbackIcon.style.display = 'block'
                      }}
                    />
                    <IconComponent className="h-6 w-6 text-blue-600 hidden" />
                  </div>
                  <p className="font-semibold text-gray-800">{hour.temp}°</p>
                  <p className="text-xs text-gray-500 mt-1 truncate" title={hour.condition}>
                    {hour.condition.length > 15 ? hour.condition.substring(0, 15) + '...' : hour.condition}
                  </p>
                  {hour.city && hour.city !== "Generated" && (
                    <p className="text-xs text-blue-600 mt-1">{hour.city}</p>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        {/* Weekly Forecast */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">7-Day Forecast</h3>
          <div className="space-y-3">
            {weeklyForecast.map((day, index) => {
              const IconComponent = getWeatherIcon(day.condition)
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <span className="font-medium text-gray-800 w-20">{day.day}</span>
                    <div className="flex items-center space-x-2">
                      <img 
                        src={day.icon} 
                        alt={day.condition}
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          const fallbackIcon = e.currentTarget.nextElementSibling as HTMLElement
                          if (fallbackIcon) fallbackIcon.style.display = 'block'
                        }}
                      />
                      <IconComponent className="h-5 w-5 text-blue-600 hidden" />
                    </div>
                    <span className="text-gray-600 text-sm truncate max-w-[200px]" title={day.condition}>
                      {day.condition}
                    </span>
                    {day.city && day.city !== "Generated" && (
                      <span className="text-xs text-blue-600">({day.city})</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-600">L: {day.low}°</span>
                    <span className="font-semibold text-gray-800">H: {day.high}°</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
