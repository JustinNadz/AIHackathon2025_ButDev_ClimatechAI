'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

interface AlphaEarthMapProps {
  className?: string
  height?: string
  defaultCenter?: { lat: number; lng: number }
  defaultZoom?: number
}

export default function AlphaEarthMap({
  className = '',
  height = '100vh',
  defaultCenter = { lat: 0, lng: 0 },
  defaultZoom = 3
}: AlphaEarthMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [embeddingData, setEmbeddingData] = useState<any>(null)
  const [analysisMode, setAnalysisMode] = useState<'embeddings' | 'classification' | 'change_detection'>('embeddings')
  const initializedRef = useRef(false)

  useEffect(() => {
    const initializeServices = async () => {
      if (initializedRef.current) return
      initializedRef.current = true
      try {
        const hasGoogle = typeof window !== 'undefined' && (window as any).google && (window as any).google.maps
        if (!hasGoogle) {
          const loader = new Loader({ apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '' } as any)
          await loader.load()
        }
        if (mapRef.current) {
          const mapInstance = new google.maps.Map(mapRef.current, {
            center: defaultCenter,
            zoom: defaultZoom,
            styles: [
              { featureType: 'all', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
              { featureType: 'water', elementType: 'all', stylers: [{ color: '#1e3a5f' }] },
              { featureType: 'landscape', elementType: 'all', stylers: [{ color: '#2d2d2d' }] }
            ]
          })
          setMap(mapInstance)
        }
      } catch (err: any) {
        setError(`Initialization failed: ${err?.message || err}`)
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    initializeServices()
  }, [defaultCenter, defaultZoom])

  const processAreaAnalysis = useCallback(async (bounds: google.maps.LatLngBounds) => {
    try {
      setIsLoading(true)
      const geometry = {
        type: 'Polygon',
        coordinates: [[
          [bounds.getSouthWest().lng(), bounds.getSouthWest().lat()],
          [bounds.getNorthEast().lng(), bounds.getSouthWest().lat()],
          [bounds.getNorthEast().lng(), bounds.getNorthEast().lat()],
          [bounds.getSouthWest().lng(), bounds.getNorthEast().lat()],
          [bounds.getSouthWest().lng(), bounds.getSouthWest().lat()]
        ]]
      }
      const resp = await fetch('/api/alphaearth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geometry, analysisType: analysisMode, startDate: '2023-01-01', endDate: '2023-12-31' })
      })
      const json = await resp.json()
      if (!json.success) throw new Error(json.error || 'AlphaEarth analysis failed')
      setEmbeddingData(json.data)
      visualizeEmbeddings(json.data)
    } catch (err: any) {
      setError(`Analysis failed: ${err?.message || err}`)
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [analysisMode])

  const visualizeEmbeddings = useCallback((data: any) => {
    if (!canvasRef.current || !map) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const mapDiv = map.getDiv() as HTMLElement
    canvas.width = mapDiv.offsetWidth
    canvas.height = mapDiv.offsetHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (data.embeddings && Array.isArray(data.embeddings)) {
      const imageData = ctx.createImageData(canvas.width, canvas.height)
      data.embeddings.forEach((embedding: number[], index: number) => {
        const x = index % canvas.width
        const y = Math.floor(index / canvas.width)
        if (y < canvas.height) {
          const pixelIndex = (y * canvas.width + x) * 4
          imageData.data[pixelIndex] = Math.max(0, Math.min(255, (embedding[0] + 1) * 127.5))
          imageData.data[pixelIndex + 1] = Math.max(0, Math.min(255, (embedding[1] + 1) * 127.5))
          imageData.data[pixelIndex + 2] = Math.max(0, Math.min(255, (embedding[2] + 1) * 127.5))
          imageData.data[pixelIndex + 3] = 128
        }
      })
      ctx.putImageData(imageData, 0, 0)
    }
  }, [map])

  useEffect(() => {
    if (!map) return
    const clickListener = map.addListener('click', (event: google.maps.MapMouseEvent) => {
      const lat = event.latLng?.lat() || 0
      const lng = event.latLng?.lng() || 0
      const bounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(lat - 0.1, lng - 0.1),
        new google.maps.LatLng(lat + 0.1, lng + 0.1)
      )
      processAreaAnalysis(bounds)
    })
    return () => { google.maps.event.removeListener(clickListener) }
  }, [map, processAreaAnalysis])

  useEffect(() => {
    if (!map || !canvasRef.current) return
    const canvas = canvasRef.current
    canvas.style.position = 'absolute'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = '1000'
    const mapDiv = map.getDiv() as HTMLElement
    mapDiv.appendChild(canvas)
    return () => { if (canvas.parentNode) canvas.parentNode.removeChild(canvas) }
  }, [map])

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-red-500 text-center p-8 bg-gray-900 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">AlphaEarth Setup Error</h3>
          <p className="mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white">Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 z-50">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4 mx-auto"></div>
            <p className="text-lg">Loading AlphaEarth Foundations...</p>
            <p className="text-sm text-gray-300">Initializing satellite embeddings</p>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 bg-gray-900 bg-opacity-90 text-white p-4 rounded-lg z-40">
        <h3 className="font-semibold mb-3">AlphaEarth Analysis</h3>
        <div className="space-y-2">
          <label className="block text-sm">
            Analysis Mode:
            <select value={analysisMode} onChange={(e) => setAnalysisMode(e.target.value as any)} className="w-full mt-1 p-2 bg-gray-800 rounded text-white">
              <option value="embeddings">Satellite Embeddings</option>
              <option value="classification">Land Cover Classification</option>
              <option value="change_detection">Change Detection</option>
            </select>
          </label>
        </div>
        <p className="text-xs text-gray-300 mt-3">Click on the map to analyze an area</p>
      </div>

      {embeddingData && (
        <div className="absolute top-4 right-4 bg-gray-900 bg-opacity-90 text-white p-4 rounded-lg z-40 max-w-sm">
          <h4 className="font-semibold mb-2">Analysis Results</h4>
          {analysisMode === 'embeddings' && (
            <div className="text-sm space-y-1">
              <p>Embedding Dimensions: {embeddingData.metadata?.bands?.length || 64}</p>
              <p>Spatial Resolution: {embeddingData.metadata?.scale || 30}m</p>
              <p>Data Points: {embeddingData.embeddings?.length || 0}</p>
            </div>
          )}
          {analysisMode === 'classification' && (
            <div className="text-sm space-y-1">
              <p>Confidence: {((embeddingData.confidence || 0) * 100).toFixed(1)}%</p>
              <p>Classes Detected:</p>
              <ul className="ml-4 list-disc">
                {embeddingData.classes?.slice(0, 3).map((cls: string, i: number) => (
                  <li key={i}>{cls}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div ref={mapRef} className="w-full h-full" />
      <canvas ref={canvasRef} />
    </div>
  )
} 