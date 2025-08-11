import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")

  if (!lat || !lng) {
    return Response.json({ error: "Missing coordinates" }, { status: 400 })
  }

  try {
    // Mock weather data - replace with actual weather API
    const mockWeatherData = {
      temperature: Math.round(Math.random() * 30 + 5), // Random temp between 5-35°C
      condition: ["Sunny", "Cloudy", "Rainy", "Partly Cloudy"][Math.floor(Math.random() * 4)],
      humidity: Math.round(Math.random() * 100),
      windSpeed: Math.round(Math.random() * 20),
      location: `${Number.parseFloat(lat).toFixed(2)}, ${Number.parseFloat(lng).toFixed(2)}`,
    }

    return Response.json(mockWeatherData)
  } catch (error) {
    console.error("Weather API error:", error)
    return Response.json({ error: "Failed to fetch weather data" }, { status: 500 })
  }
}
