declare module '@/components/AlphaEarthMap' {
  import type { ComponentType } from 'react'
  const Component: ComponentType<{
    className?: string
    height?: string
    defaultCenter?: { lat: number; lng: number }
    defaultZoom?: number
  }>
  export default Component
} 