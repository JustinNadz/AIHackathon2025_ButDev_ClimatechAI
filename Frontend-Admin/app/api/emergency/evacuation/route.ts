import { NextRequest, NextResponse } from 'next/server'
import { getAllCenters, createCenter, updateCenter, deleteCenter, EvacuationCenter } from '@/lib/mongodb'

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

// PUT - Update existing evacuation center
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const centerData = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'Center ID is required' },
        { status: 400 }
      )
    }

    console.log('Updating center with id:', id, 'data:', centerData)

    const updatedCenter = await updateCenter(id, centerData)
    
    if (!updatedCenter) {
      return NextResponse.json(
        { error: 'Center not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      message: 'Center updated successfully',
      center: updatedCenter 
    })
    
  } catch (error) {
    console.error('Error updating center:', error)
    return NextResponse.json(
      { error: 'Failed to update center', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete evacuation center
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Center ID is required' },
        { status: 400 }
      )
    }

    console.log('Deleting center with id:', id)

    const deleted = await deleteCenter(id)
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Center not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      message: 'Center deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting center:', error)
    return NextResponse.json(
      { error: 'Failed to delete center', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
