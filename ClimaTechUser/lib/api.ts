// API service for connecting to ClimaTech backend

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000"

export interface LocationData {
  lat: number
  lng: number
}

export interface AssistantRequest {
  lat?: number
  lng?: number
  question: string
  hours_earthquake?: number
  eq_radius_km?: number
  weather_hours?: number
  weather_radius_km?: number
  use_rag_fallback?: boolean
}

export interface HazardData {
  flood_risk: number | null
  landslide_risk: number | null
  recent_earthquakes: number
  earthquake_details: any[]
  weather: any
}

export interface AssistantResponse {
  location: LocationData
  question: string
  hazards: HazardData
  response: string
  model_used: string
  context_provided: string[]
  timestamp: string
}

/**
 * Call the enhanced AI assistant endpoint
 * Uses google/gemma-3-27b-it:free as primary model with RAG backup
 */
export async function callEnhancedAssistant(request: AssistantRequest): Promise<AssistantResponse> {
  const response = await fetch(`${BACKEND_URL}/api/assistant/enhanced`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`Backend error: ${response.status} - ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Get climate data for a specific location
 */
export async function getLocationClimateData(lat: number, lng: number) {
  try {
    const response = await callEnhancedAssistant({
      lat,
      lng,
      question: "What are the main climate risks and hazards in this area? Please provide a comprehensive assessment.",
    })
    return response
  } catch (error) {
    console.error("Error fetching climate data:", error)
    throw error
  }
}

/**
 * Ask a specific question about climate preparedness
 */
export async function askClimateQuestion(question: string, location?: LocationData) {
  try {
    const request: AssistantRequest = { question }
    if (location) {
      request.lat = location.lat
      request.lng = location.lng
    }
    
    const response = await callEnhancedAssistant(request)
    return response
  } catch (error) {
    console.error("Error asking climate question:", error)
    throw error
  }
}

/**
 * Get weather data from backend
 */
export async function getWeatherData(hours: number = 1) {
  const response = await fetch(`${BACKEND_URL}/api/weather-data?hours=${hours}`)
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`)
  }
  return await response.json()
}

/**
 * Get flood data from backend
 */
export async function getFloodData(minRisk?: number, maxRisk?: number) {
  const params = new URLSearchParams()
  if (minRisk !== undefined) params.append('min_risk', minRisk.toString())
  if (maxRisk !== undefined) params.append('max_risk', maxRisk.toString())
  
  const response = await fetch(`${BACKEND_URL}/api/flood-data?${params}`)
  if (!response.ok) {
    throw new Error(`Flood API error: ${response.status}`)
  }
  return await response.json()
}

/**
 * Get landslide data from backend
 */
export async function getLandslideData(minRisk?: number, maxRisk?: number) {
  const params = new URLSearchParams()
  if (minRisk !== undefined) params.append('min_risk', minRisk.toString())
  if (maxRisk !== undefined) params.append('max_risk', maxRisk.toString())
  
  const response = await fetch(`${BACKEND_URL}/api/landslide-data?${params}`)
  if (!response.ok) {
    throw new Error(`Landslide API error: ${response.status}`)
  }
  return await response.json()
}

/**
 * Get seismic data from backend
 */
export async function getSeismicData(hours?: number, minMagnitude?: number, maxMagnitude?: number) {
  const params = new URLSearchParams()
  if (hours !== undefined) params.append('hours', hours.toString())
  if (minMagnitude !== undefined) params.append('min_magnitude', minMagnitude.toString())
  if (maxMagnitude !== undefined) params.append('max_magnitude', maxMagnitude.toString())
  
  const response = await fetch(`${BACKEND_URL}/api/seismic-data?${params}`)
  if (!response.ok) {
    throw new Error(`Seismic API error: ${response.status}`)
  }
  return await response.json()
} 