import { NextRequest, NextResponse } from 'next/server'

// API route to fetch citizen users from ClimaTech-User database
export async function GET() {
  try {
    // Mock citizen users - in real implementation, this would fetch from ClimaTech-User database
    const citizenUsers = [
      {
        id: "CIT-001",
        name: "Mark Johnson",
        email: "mark.johnson@gmail.com",
        role: "Citizen",
        agency: "N/A",
        status: "active",
        lastLogin: "2024-01-31 10:15:30",
        permissions: ["view_alerts", "report_issues"],
        userType: "citizen" as const,
        location: "Manila",
        phone: "+63 917 123 4567",
        createdAt: "2024-01-15T08:00:00Z"
      },
      {
        id: "CIT-002", 
        name: "Sofia Cruz",
        email: "sofia.cruz@yahoo.com",
        role: "Citizen",
        agency: "N/A",
        status: "active",
        lastLogin: "2024-01-30 16:45:22",
        permissions: ["view_alerts", "report_issues"],
        userType: "citizen" as const,
        location: "Quezon City",
        phone: "+63 918 987 6543",
        createdAt: "2024-01-20T14:30:00Z"
      },
      {
        id: "CIT-003",
        name: "Carlos Rivera", 
        email: "carlos.rivera@outlook.com",
        role: "Citizen",
        agency: "N/A",
        status: "active",
        lastLogin: "2024-01-29 12:30:15",
        permissions: ["view_alerts", "report_issues"],
        userType: "citizen" as const,
        location: "Makati",
        phone: "+63 919 555 1234",
        createdAt: "2024-01-10T10:15:00Z"
      }
    ]

    return NextResponse.json({ users: citizenUsers })
    
  } catch (error) {
    console.error('Error fetching citizen users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch citizen users' },
      { status: 500 }
    )
  }
}
