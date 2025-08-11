import React from 'react'
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'

const headerHeight = 64
const containerStyle = {
  width: '100%',
  height: `calc(100vh - ${headerHeight}px)`,
}

// Default center: Butuan City, Philippines
const center = { lat: 8.9475, lng: 125.5406 }

export default function MapView() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  })

  if (!isLoaded) {
    return <div className="map-loading">Loading map…</div>
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={11}
      options={{
        disableDefaultUI: false,
        clickableIcons: false,
        styles: mapStyles,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      }}
    >
      {/* Map children like markers can be added here */}
    </GoogleMap>
  )
}

// Blue/green subtle map style
const mapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#eaf1ff' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#2c3e50' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#a7cbff' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#cdeed6' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
] 