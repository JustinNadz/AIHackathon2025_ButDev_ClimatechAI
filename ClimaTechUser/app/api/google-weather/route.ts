import { NextRequest, NextResponse } from "next/server"
import { generateWeatherData, WeatherData } from "@/types/weather"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")

    if (!lat || !lng) {
      return NextResponse.json({ error: "Missing coordinates" }, { status: 400 })
    }

    // Generate realistic weather data based on our predefined conditions
    const weatherData: WeatherData = generateWeatherData()

    const simplified = {
      temperatureC: weatherData.temperature,
      description: weatherData.condition,
      windSpeed: weatherData.windSpeed,
      humidity: weatherData.humidity,
      icon: weatherData.icon,
      condition: weatherData.condition,
    }

    return NextResponse.json(simplified)
  } catch (error) {
    console.error("/api/google-weather error", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
} 