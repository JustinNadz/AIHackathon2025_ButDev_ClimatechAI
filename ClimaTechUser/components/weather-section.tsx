"use client"

import { useState } from "react"
import { Cloud, Sun, CloudRain, Wind, Droplets, Eye, Gauge } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function WeatherSection() {
  const [searchLocation, setSearchLocation] = useState("")

  const currentWeather = {
    location: "New York, NY",
    temperature: 22,
    condition: "Partly Cloudy",
    humidity: 65,
    windSpeed: 12,
    visibility: 10,
    pressure: 1013,
    uvIndex: 6,
    feelsLike: 25,
  }

  const hourlyForecast = [
    { time: "12 PM", temp: 22, icon: Sun, condition: "Sunny" },
    { time: "1 PM", temp: 24, icon: Sun, condition: "Sunny" },
    { time: "2 PM", temp: 26, icon: Cloud, condition: "Cloudy" },
    { time: "3 PM", temp: 25, icon: CloudRain, condition: "Light Rain" },
    { time: "4 PM", temp: 23, icon: CloudRain, condition: "Rain" },
    { time: "5 PM", temp: 21, icon: Cloud, condition: "Cloudy" },
  ]

  const weeklyForecast = [
    { day: "Today", high: 26, low: 18, icon: Sun, condition: "Sunny" },
    { day: "Tomorrow", high: 24, low: 16, icon: Cloud, condition: "Cloudy" },
    { day: "Wednesday", high: 22, low: 14, icon: CloudRain, condition: "Rainy" },
    { day: "Thursday", high: 25, low: 17, icon: Sun, condition: "Sunny" },
    { day: "Friday", high: 27, low: 19, icon: Sun, condition: "Sunny" },
    { day: "Saturday", high: 23, low: 15, icon: CloudRain, condition: "Showers" },
    { day: "Sunday", high: 21, low: 13, icon: Cloud, condition: "Overcast" },
  ]

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent mb-4">
            Weather Forecast
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Get accurate weather information and forecasts for any location worldwide
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search for a city or location..."
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
                <div>
                  <Cloud className="h-12 w-12 mb-2" />
                  <p className="text-lg">{currentWeather.condition}</p>
                  <p className="text-sm opacity-80">Feels like {currentWeather.feelsLike}°</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80 mb-1">Today</p>
              <p className="text-lg font-semibold">H: 26° L: 18°</p>
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
            {hourlyForecast.map((hour, index) => (
              <div key={index} className="flex-shrink-0 text-center p-3 rounded-lg hover:bg-blue-50 transition-colors">
                <p className="text-sm text-gray-600 mb-2">{hour.time}</p>
                <hour.icon className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="font-semibold text-gray-800">{hour.temp}°</p>
                <p className="text-xs text-gray-500 mt-1">{hour.condition}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Weekly Forecast */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">7-Day Forecast</h3>
          <div className="space-y-3">
            {weeklyForecast.map((day, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <span className="font-medium text-gray-800 w-20">{day.day}</span>
                  <day.icon className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-600">{day.condition}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-600">L: {day.low}°</span>
                  <span className="font-semibold text-gray-800">H: {day.high}°</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
