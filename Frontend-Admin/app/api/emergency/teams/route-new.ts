import { NextRequest, NextResponse } from 'next/server'
import { getAllTeams, createTeam, ResponseTeam } from '@/lib/mongodb'

// GET - Fetch all response teams
export async function GET() {
  try {
    const teams = await getAllTeams()
    return NextResponse.json({ teams })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

// POST - Create new response team
export async function POST(request: NextRequest) {
  try {
    const teamData = await request.json()
    
    // Validate required fields
    if (!teamData.name || !teamData.type || !teamData.leader) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, leader' },
        { status: 400 }
      )
    }

    const newTeam = await createTeam({
      name: teamData.name,
      type: teamData.type,
      members: teamData.members || 0,
      leader: teamData.leader,
      contact: teamData.contact || '',
      equipment: teamData.equipment || [],
      status: teamData.status || 'active',
      location: teamData.location || ''
    })

    if (!newTeam) {
      return NextResponse.json(
        { error: 'Failed to create team' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      message: 'Team created successfully',
      team: newTeam 
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    )
  }
}
