import { useState, useCallback } from 'react'
import { 
  callEnhancedAssistant, 
  getLocationClimateData, 
  askClimateQuestion,
  type AssistantRequest,
  type AssistantResponse,
  type LocationData 
} from '@/lib/api'

interface UseClimateAPIReturn {
  // State
  isLoading: boolean
  error: string | null
  lastResponse: AssistantResponse | null
  
  // Actions
  askQuestion: (question: string, location?: LocationData) => Promise<AssistantResponse>
  getLocationData: (lat: number, lng: number) => Promise<AssistantResponse>
  callAssistant: (request: AssistantRequest) => Promise<AssistantResponse>
  clearError: () => void
}

/**
 * Custom hook for interacting with the ClimaTech backend API
 * Provides loading states, error handling, and easy-to-use methods
 */
export function useClimateAPI(): UseClimateAPIReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResponse, setLastResponse] = useState<AssistantResponse | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleAPICall = useCallback(async <T>(
    apiCall: () => Promise<T>
  ): Promise<T> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await apiCall()
      // Type guard to check if result is an AssistantResponse
      if (result && typeof result === 'object' && 'response' in result && 'model_used' in result) {
        setLastResponse(result as unknown as AssistantResponse)
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const askQuestion = useCallback(async (
    question: string, 
    location?: LocationData
  ): Promise<AssistantResponse> => {
    return handleAPICall(() => askClimateQuestion(question, location))
  }, [handleAPICall])

  const getLocationData = useCallback(async (
    lat: number, 
    lng: number
  ): Promise<AssistantResponse> => {
    return handleAPICall(() => getLocationClimateData(lat, lng))
  }, [handleAPICall])

  const callAssistant = useCallback(async (
    request: AssistantRequest
  ): Promise<AssistantResponse> => {
    return handleAPICall(() => callEnhancedAssistant(request))
  }, [handleAPICall])

  return {
    isLoading,
    error,
    lastResponse,
    askQuestion,
    getLocationData,
    callAssistant,
    clearError
  }
}

/**
 * Hook for quick climate questions without location context
 */
export function useQuickClimateQuestion() {
  const { askQuestion, isLoading, error } = useClimateAPI()
  
  const ask = useCallback(async (question: string) => {
    try {
      const response = await askQuestion(question)
      return response.response
    } catch (error) {
      console.error('Quick question failed:', error)
      return null
    }
  }, [askQuestion])

  return { ask, isLoading, error }
}

/**
 * Hook for location-based climate analysis
 */
export function useLocationClimate() {
  const { getLocationData, isLoading, error, lastResponse } = useClimateAPI()
  
  const analyzeLocation = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await getLocationData(lat, lng)
      return {
        climateAdvice: response.response,
        hazards: response.hazards,
        modelUsed: response.model_used
      }
    } catch (error) {
      console.error('Location analysis failed:', error)
      return null
    }
  }, [getLocationData])

  return { 
    analyzeLocation, 
    isLoading, 
    error, 
    lastAnalysis: lastResponse 
  }
} 