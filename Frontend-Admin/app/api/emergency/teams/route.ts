import { NextRequest, NextResponse } from 'next/server'
import { getAllTeams, createTeam, updateTeam, deleteTeam, ResponseTeam } from '@/lib/mongodb'

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
  let teamData: any
  try {
    try {
      teamData = await request.json()
      console.log('Raw request data:', JSON.stringify(teamData, null, 2))
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    // Check if request body is empty or null
    if (!teamData || typeof teamData !== 'object') {
      console.error('Invalid request body:', teamData)
      return NextResponse.json(
        { error: 'Invalid request body. Please provide team data.' },
        { status: 400 }
      )
    }
    
    // Validate required fields
    if (!teamData.name || !teamData.type) {
      console.error('Missing required fields. Received:', Object.keys(teamData))
      return NextResponse.json(
        { error: 'Missing required fields: name, type' },
        { status: 400 }
      )
    }

    // Validate field types and lengths
    if (typeof teamData.name !== 'string' || teamData.name.trim().length === 0) {
      console.error('Invalid team name:', teamData.name)
      return NextResponse.json(
        { error: 'Team name must be a non-empty string' },
        { status: 400 }
      )
    }

    if (typeof teamData.type !== 'string' || teamData.type.trim().length === 0) {
      console.error('Invalid team type:', teamData.type)
      return NextResponse.json(
        { error: 'Team type must be a non-empty string' },
        { status: 400 }
      )
    }

    // Make leader optional with default value
    const leader = teamData.leader && typeof teamData.leader === 'string' 
      ? teamData.leader.trim() 
      : 'TBD'

    // Validate and convert members to number
    const membersCount = teamData.members ? parseInt(teamData.members.toString(), 10) : 0
    if (isNaN(membersCount) || membersCount < 0) {
      console.error('Invalid members value:', teamData.members)
      return NextResponse.json(
        { error: 'Members must be a valid non-negative number' },
        { status: 400 }
      )
    }

    console.log('Creating team with data:', {
      name: teamData.name,
      type: teamData.type,
      members: membersCount,
      leader: leader,
      contact: teamData.contact || '',
      location: teamData.location || '',
      status: teamData.status || 'active'
    })

    const newTeam = await createTeam({
      name: teamData.name.toString().trim(),
      type: teamData.type.toString().trim(),
      members: membersCount,
      leader: leader,
      contact: teamData.contact ? teamData.contact.toString().trim() : '',
      equipment: Array.isArray(teamData.equipment) ? teamData.equipment.filter((item: string) => item && item.trim()) : [],
      status: teamData.status ? teamData.status.toString().trim() : 'active',
      location: teamData.location ? teamData.location.toString().trim() : ''
    })

    if (!newTeam) {
      console.error('createTeam returned null/undefined')
      return NextResponse.json(
        { error: 'Failed to create team - database operation failed' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      message: 'Team created successfully',
      team: newTeam 
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating team:', error)
    console.error('Team data received:', teamData ? JSON.stringify(teamData, null, 2) : 'No data received')
    return NextResponse.json(
      { error: 'Failed to create team', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT - Update existing team
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const teamData = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      )
    }

    console.log('Updating team with id:', id, 'data:', teamData)

    const updatedTeam = await updateTeam(id, teamData)
    
    if (!updatedTeam) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      message: 'Team updated successfully',
      team: updatedTeam 
    })
    
  } catch (error) {
    console.error('Error updating team:', error)
    return NextResponse.json(
      { error: 'Failed to update team', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete team
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      )
    }

    console.log('Deleting team with id:', id)

    const deleted = await deleteTeam(id)
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      message: 'Team deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json(
      { error: 'Failed to delete team', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
