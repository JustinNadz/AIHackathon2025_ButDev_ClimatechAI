"use client"

import type React from "react"
import { useMemo } from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Shield, User, Lock, LogIn } from "lucide-react"

export default function LoginPage() {
  const ADMIN_USER = process.env.NEXT_PUBLIC_ADMIN_USER || "admin"
  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@gmail.com"
  const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASS || "admin123"

  const [credentials, setCredentials] = useState({ username: ADMIN_EMAIL, password: ADMIN_PASS })
  const [error, setError] = useState("")
  const router = useRouter()
  const GeoParticleOverlay = () => {
    const shapes = useMemo(() => {
      const count = 28
      const palette = [
        "rgba(255,255,255,0.55)",
        "rgba(173, 216, 230, 0.45)",
        "rgba(135, 206, 250, 0.45)",
        "rgba(176, 196, 222, 0.45)",
      ]
      const types = ["sq", "tri", "hex", "line"] as const
      const r = (seed: number) => {
        const x = Math.sin(seed * 9301 + 49297) * 233280
        return x - Math.floor(x)
      }
      return Array.from({ length: count }, (_, i) => {
        const seed = i + 1
        const x = Math.round(r(seed) * 100)
        const y = Math.round(r(seed * 2) * 100)
        const dx = Math.round((r(seed * 3) * 70 - 35)) // -35vw..35vw
        const dy = Math.round((r(seed * 4) * 50 - 25)) // -25vh..25vh
        const size = (r(seed * 5) * 16 + 12).toFixed(0) // 12..28px
        const opacity = (r(seed * 6) * 0.35 + 0.25).toFixed(2)
        const dur = Math.round(r(seed * 7) * 70 + 50) // 50..120s
        const delay = Math.round(r(seed * 8) * 20)
        const rotDur = Math.round(r(seed * 9) * 50 + 30) // 30..80s
        const color = palette[Math.floor(r(seed * 11) * palette.length)]
        const type = types[Math.floor(r(seed * 12) * types.length)]
        const thickness = (r(seed * 13) * 2 + 1).toFixed(1)
        const length = (r(seed * 14) * 80 + 30).toFixed(0) // 30..110px
        return { x, y, dx, dy, size, opacity, dur, delay, rotDur, color, type, thickness, length }
      })
    }, [])

    return (
      <div className="geo-particles pointer-events-none select-none" aria-hidden>
        {shapes.map((s, idx) => (
          <div
            key={idx}
            className="geo-drift"
            style={{
              left: `${s.x}vw`,
              top: `${s.y}vh`,
              ['--dx' as any]: `${s.dx}vw`,
              ['--dy' as any]: `${s.dy}vh`,
              ['--dur' as any]: `${s.dur}s`,
              ['--delay' as any]: `${s.delay}s`,
            }}
          >
            <div
              className={`geo ${s.type}`}
              style={{
                ['--size' as any]: `${s.size}px`,
                ['--opacity' as any]: s.opacity,
                ['--color' as any]: s.color,
                ['--rotDur' as any]: `${s.rotDur}s`,
                ['--thickness' as any]: `${s.thickness}px`,
                ['--length' as any]: `${s.length}px`,
              }}
            />
          </div>
        ))}
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const inputUser = credentials.username.trim().toLowerCase()
    const validUsernames = [ADMIN_USER.toLowerCase(), ADMIN_EMAIL.toLowerCase()]

    if (validUsernames.includes(inputUser) && credentials.password === ADMIN_PASS) {
      setError("")
      router.push("/dashboard")
    } else {
      setError("Invalid credentials")
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Static Background Layers (no motion) */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none select-none"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1719949516978-9e8317ca1eea?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxhdG1vc3BoZXJpYyUyMHBoZW5vbWVuYXxlbnwwfHx8fDE3NTQ5Mzk2NTF8MA&ixlib=rb-4.1.0&q=85')",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 pointer-events-none select-none"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1636565214233-6d1019dfbc36?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHw0fHxnbG9iYWwlMjB3ZWF0aGVyJTIwcGF0dGVybnN8ZW58MHx8fHwxNzU0OTM5NjM3fDA&ixlib=rb-4.1.0&q=85')",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/75 via-blue-900/80 to-slate-900/85 pointer-events-none select-none" aria-hidden />

      {/* Particle overlay (geometric shapes) */}
      <GeoParticleOverlay />

      {/* Foreground login content */}
      <div className="relative z-10 flex items-center justify-center p-6 min-h-screen">
        <div className="w-[460px] sm:w-[500px] mx-auto rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl overflow-hidden">
          <div className="px-8 py-7 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-yellow-400">
              <Shield className="h-6 w-6 text-blue-900" />
            </div>
            <h1 className="text-2xl sm:text-[26px] font-semibold text-blue-900 leading-tight">ClimaTech AI</h1>
            <p className="text-sm text-blue-700">Disaster Management</p>
          </div>

          <div className="p-8 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm text-gray-700">Username or Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    id="username"
                    type="text"
                    placeholder="johndoe@example.com"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    className="w-full rounded-md bg-slate-100 h-11 pl-9 pr-3 text-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-gray-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="w-full rounded-md bg-slate-100 h-11 pl-9 pr-3 text-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="mt-3 w-full h-11 rounded-md bg-blue-900 hover:bg-blue-800 text-white text-sm tracking-wide flex items-center justify-center gap-2">
                <LogIn className="h-4 w-4" /> Login
              </Button>
              {error && <p className="text-center text-xs text-red-600">{error}</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
