"use client"

import type React from "react"

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="w-[460px] sm:w-[500px] mx-auto rounded-2xl bg-white shadow-2xl overflow-hidden">
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
  )
}
