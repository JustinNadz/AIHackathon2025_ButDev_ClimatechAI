import { NextRequest, NextResponse } from 'next/server'
import { getAllCenters, createCenter, EvacuationCenter } from '@/lib/mongodb'

// GET - Fetch all evacuation centers
export async function GET() {
  try {
    const centers = await getAllCenters()
    return NextResponse.json({ centers })
  } catch (error) {
    console.error('Error fetching centers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch centers' },
      { status: 500 }
    )
  }
}

// POST - Create new evacuation center
export async function POST(request: NextRequest) {
  try {
    const centerData = await request.json()
    
    // Validate required fields
    if (!centerData.name || !centerData.address || !centerData.capacity) {
      return NextResponse.json(
        { error: 'Missing required fields: name, address, capacity' },
        { status: 400 }
      )
    }

    const newCenter = await createCenter({
      name: centerData.name,
      address: centerData.address,
      capacity: centerData.capacity,
      currentOccupancy: centerData.currentOccupancy || 0,
      status: centerData.status || 'active',
      facilities: centerData.facilities || [],
      contactPerson: centerData.contactPerson || '',
      contactNumber: centerData.contactNumber || '',
      coordinates: centerData.coordinates || { latitude: 0, longitude: 0 }
    })

    if (!newCenter) {
      return NextResponse.json(
        { error: 'Failed to create center' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      message: 'Center created successfully',
      center: newCenter 
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating center:', error)
    return NextResponse.json(
      { error: 'Failed to create center' },
      { status: 500 }
    )
  }
}
