import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ClimaTech AI - Disaster Management Solution",
  description:
    "AI-powered disaster management platform for the Philippines. Turning climate data into action.",
  generator: 'v0.dev',
  other: {
    'permissions-policy': 'clipboard-read=(self), clipboard-write=(self)'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Permissions-Policy" content="clipboard-read=(self), clipboard-write=(self)" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
