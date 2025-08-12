import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware runs before any route handlers
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Log request for debugging
  console.log(`Middleware handling: ${request.method} ${pathname}`)
  
  // Check if it's an API route
  if (pathname.startsWith('/api/')) {
    // For API routes, add headers to prevent caching and redirection loops
    const response = NextResponse.next()
    
    // Add headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  }
  
  // For all other routes, just proceed
  return NextResponse.next()
}

// Specify which routes this middleware should run for
export const config = {
  matcher: [
    // Only run middleware for API routes
    '/api/:path*',
  ],
}
