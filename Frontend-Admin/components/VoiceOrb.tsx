"use client"

import React from "react"

type VoiceOrbProps = {
  state?: "idle" | "listening" | "thinking" | "responded" | "error"
  size?: number
}

export default function VoiceOrb({ state = "idle", size = 180 }: VoiceOrbProps) {
  const base = `relative rounded-full shadow-inner transition-all duration-300`
  const stateGlow = {
    idle: "shadow-blue-100",
    listening: "shadow-blue-300",
    thinking: "shadow-blue-200",
    responded: "shadow-green-200",
    error: "shadow-red-200",
  }[state]

  return (
    <div
      className={`${base} ${stateGlow}`}
      style={{ width: size, height: size }}
      aria-label={`voice-orb-${state}`}
    >
      {/* Gradient sphere */}
      <div className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 35%, #dff4ff 0%, #bfe7ff 45%, #7cc1ff 70%, #4d9dff 100%)",
          filter: "blur(0.2px)",
        }}
      />
      {/* Waterline */}
      <div className="absolute inset-x-0 bottom-0 rounded-b-full"
        style={{ height: "52%", background: "linear-gradient(180deg,#7bbcff,#2a78ff)" }}
      />
      {/* Rings overlay */}
      <svg className="absolute inset-0" viewBox="0 0 100 100" fill="none">
        {[14, 20, 26, 32, 38].map((r, i) => (
          <ellipse key={i} cx="50" cy="50" rx={r} ry={r * 0.6} stroke="rgba(255,255,255,0.7)" strokeWidth="0.4" />
        ))}
      </svg>
      {/* Activity animations */}
      {state === "listening" && (
        <div className="absolute inset-0 rounded-full animate-ping bg-blue-200/30" />
      )}
      {state === "thinking" && (
        <div className="absolute inset-0 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
      )}
      {state === "responded" && (
        <div className="absolute inset-0 rounded-full ring-4 ring-green-300/40" />
      )}
      {state === "error" && (
        <div className="absolute inset-0 rounded-full ring-4 ring-red-300/40" />
      )}
    </div>
  )}


