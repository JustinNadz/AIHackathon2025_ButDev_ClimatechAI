import { NextRequest, NextResponse } from "next/server"
import { generateWeatherData, WeatherData } from "@/types/weather"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000"

// Weather condition mapping from backend Filipino conditions to icon files
const getWeatherIcon = (condition: string): string => {
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

// Philippine cities coordinates for matching
const PHILIPPINE_CITIES = [
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

// Find closest city to given coordinates
function findClosestCity(lat: number, lng: number) {
  let closestCity = null
  let minDistance = Infinity
  
  for (const city of PHILIPPINE_CITIES) {
    const distance = Math.sqrt(
      Math.pow(city.lat - lat, 2) + Math.pow(city.lng - lng, 2)
    )
    if (distance < minDistance) {
      minDistance = distance
      closestCity = city
    }
  }
  
  return closestCity
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get("lat") || "0")
    const lng = parseFloat(searchParams.get("lng") || "0")

    if (!lat || !lng) {
      return NextResponse.json({ error: "Missing coordinates" }, { status: 400 })
    }

    // Find the closest Philippine city
    const closestCity = findClosestCity(lat, lng)
    
    try {
      // Try to fetch real weather data from backend
      const backendResponse = await fetch(`${BACKEND_URL}/api/weather-data/frontend-cities`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (backendResponse.ok) {
        const backendData = await backendResponse.json()
        
        // Find weather data for the closest city
        const cityWeather = backendData.cities.find((city: any) => 
          city.city_name === closestCity?.name
        )

        if (cityWeather && cityWeather.status === "success") {
          // Use real backend weather data
          const weatherIcon = getWeatherIcon(cityWeather.filipino_condition || cityWeather.weather_condition)
          
          const weatherResponse = {
            temperatureC: cityWeather.temperature,
            description: cityWeather.filipino_condition || cityWeather.weather_condition,
            windSpeed: cityWeather.wind_speed,
            humidity: cityWeather.humidity,
            rainfall: cityWeather.rainfall,
            pressure: cityWeather.pressure,
            icon: weatherIcon,
            condition: cityWeather.filipino_condition || cityWeather.weather_condition,
            source: "backend_database",
            city_name: cityWeather.city_name,
            station_name: cityWeather.station_name,
            recorded_at: cityWeather.recorded_at
          }

          console.log(`✅ Served real weather data for ${cityWeather.city_name}:`, cityWeather.filipino_condition)
          return NextResponse.json(weatherResponse)
        }
      }
    } catch (backendError) {
      console.warn("Backend weather fetch failed:", backendError)
    }

    // Fallback to generated weather data
    console.log(`🔄 Using fallback weather data for coordinates (${lat}, ${lng})`)
    const weatherData: WeatherData = generateWeatherData()
    
    const fallbackResponse = {
      temperatureC: weatherData.temperature,
      description: weatherData.condition,
      windSpeed: weatherData.windSpeed,
      humidity: weatherData.humidity,
      rainfall: 0, // Add default rainfall for consistency
      pressure: 1013, // Add default pressure
      icon: weatherData.icon,
      condition: weatherData.condition,
      source: "fallback_generated",
      city_name: closestCity?.name || "Unknown Location",
      station_name: null,
      recorded_at: null
    }

    return NextResponse.json(fallbackResponse)
  } catch (error) {
    console.error("/api/google-weather error", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
} 