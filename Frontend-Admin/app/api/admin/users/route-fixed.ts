import { NextRequest, NextResponse } from 'next/server'
import { getAllUsers, createUser } from '@/lib/mongodb'

// GET - Fetch all users (admin and citizen)
export async function GET() {
  try {
    // getAllUsers() already includes both admin and citizen users
    const allUsers = await getAllUsers()
    
    return NextResponse.json({ users: allUsers })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()
    
    // Validate required fields
    if (!userData.name || !userData.email || !userData.role || !userData.agency) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, role, agency' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(userData.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const newUser = await createUser(userData)
    
    if (!newUser) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'User created successfully',
      user: newUser 
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
