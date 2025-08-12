"use client"

import { useState, useEffect } from "react"
import { Cloud, Sun, CloudRain, Wind, Droplets, Eye, Gauge } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { WeatherCondition, generateWeatherData, weatherIcons } from "@/types/weather"

export default function WeatherSection() {
  const [searchLocation, setSearchLocation] = useState("")
  const [currentWeatherData, setCurrentWeatherData] = useState(() => generateWeatherData())

  // Generate new weather data every 30 seconds for demo purposes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWeatherData(generateWeatherData())
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const currentWeather = {
    location: "Manila, Philippines",
    temperature: currentWeatherData.temperature,
    condition: currentWeatherData.condition,
    humidity: currentWeatherData.humidity,
    windSpeed: currentWeatherData.windSpeed,
    visibility: Math.floor(Math.random() * 10) + 5, // 5-15 km
    pressure: Math.floor(Math.random() * 50) + 990, // 990-1040 mb
    uvIndex: Math.floor(Math.random() * 8) + 1, // 1-8
    feelsLike: currentWeatherData.temperature + Math.floor(Math.random() * 6) - 3, // ±3°C
    icon: currentWeatherData.icon,
  }

  // Generate random hourly forecast with our weather conditions
  const hourlyForecast = Array.from({ length: 6 }, (_, i) => {
    const weatherData = generateWeatherData()
    return {
      time: `${12 + i} ${i < 0 ? "AM" : "PM"}`,
      temp: weatherData.temperature,
      condition: weatherData.condition,
      icon: weatherData.icon,
    }
  })

  // Generate random weekly forecast
  const weeklyForecast = [
    "Today", "Tomorrow", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ].map((day, i) => {
    const weatherData = generateWeatherData()
    const weatherData2 = generateWeatherData()
    return {
      day,
      high: Math.max(weatherData.temperature, weatherData2.temperature),
      low: Math.min(weatherData.temperature, weatherData2.temperature),
      condition: weatherData.condition,
      icon: weatherData.icon,
    }
  })

  const getWeatherIcon = (condition: WeatherCondition) => {
    // Return appropriate Lucide icon based on condition
    if (condition.includes("Clear")) return Sun
    if (condition.includes("Rain") || condition.includes("Monsoon")) return CloudRain
    if (condition.includes("Cloudy")) return Cloud
    return Cloud
  }

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
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search for a Philippine city or location..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="pl-4 pr-20 py-4 text-lg rounded-2xl border-2 border-blue-100 focus:border-blue-300 bg-white/80 backdrop-blur-sm"
            />
            <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl">
              Search
            </Button>
          </div>
        </div>

        {/* Current Weather */}
        <Card className="mb-8 p-8 bg-gradient-to-r from-blue-500 to-green-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">{currentWeather.location}</h2>
              <div className="flex items-center space-x-4">
                <span className="text-6xl font-light">{currentWeather.temperature}°</span>
                <div className="flex items-center space-x-3">
                  <img 
                    src={currentWeather.icon} 
                    alt={currentWeather.condition}
                    className="w-16 h-16 object-contain bg-white/20 rounded-lg p-2"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <div>
                    <p className="text-lg font-medium">{currentWeather.condition}</p>
                    <p className="text-sm opacity-80">Feels like {currentWeather.feelsLike}°</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80 mb-1">Today</p>
              <p className="text-lg font-semibold">H: {weeklyForecast[0].high}° L: {weeklyForecast[0].low}°</p>
            </div>
          </div>
        </Card>

        {/* Weather Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Wind className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Wind Speed</p>
                <p className="font-semibold">{currentWeather.windSpeed} km/h</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Droplets className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Humidity</p>
                <p className="font-semibold">{currentWeather.humidity}%</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Eye className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Visibility</p>
                <p className="font-semibold">{currentWeather.visibility} km</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Gauge className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pressure</p>
                <p className="font-semibold">{currentWeather.pressure} mb</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Hourly Forecast */}
        <Card className="mb-8 p-6 bg-white/80 backdrop-blur-sm">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Hourly Forecast</h3>
          <div className="flex space-x-4 overflow-x-auto pb-2">
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
