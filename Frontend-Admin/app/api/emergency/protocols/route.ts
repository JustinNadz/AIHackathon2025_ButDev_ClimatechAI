import { NextRequest, NextResponse } from 'next/server'
import { getAllProtocols, createProtocol, updateProtocol, deleteProtocol, EmergencyProtocol } from '@/lib/mongodb'

// GET - Fetch all protocols
export async function GET() {
  try {
    const protocols = await getAllProtocols()
    return NextResponse.json({ protocols })
  } catch (error) {
    console.error('Error fetching protocols:', error)
    return NextResponse.json(
      { error: 'Failed to fetch protocols' },
      { status: 500 }
    )
  }
}

// POST - Create new protocol
export async function POST(request: NextRequest) {
  try {
    const protocolData = await request.json()
    
    // Validate required fields
    if (!protocolData.name || !protocolData.type || !protocolData.description) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, description' },
        { status: 400 }
      )
    }

    const newProtocol = await createProtocol({
      name: protocolData.name,
      type: protocolData.type,
      description: protocolData.description,
      steps: protocolData.steps || [],
      status: protocolData.status || 'active'
    })

    if (!newProtocol) {
      return NextResponse.json(
        { error: 'Failed to create protocol' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      message: 'Protocol created successfully',
      protocol: newProtocol 
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating protocol:', error)
    return NextResponse.json(
      { error: 'Failed to create protocol' },
      { status: 500 }
    )
  }
}

// PUT - Update existing protocol
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const protocolData = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'Protocol ID is required' },
        { status: 400 }
      )
    }

    console.log('Updating protocol with id:', id, 'data:', protocolData)

    const updatedProtocol = await updateProtocol(id, protocolData)
    
    if (!updatedProtocol) {
      return NextResponse.json(
        { error: 'Protocol not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      message: 'Protocol updated successfully',
      protocol: updatedProtocol 
    })
    
  } catch (error) {
    console.error('Error updating protocol:', error)
    return NextResponse.json(
      { error: 'Failed to update protocol', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete protocol
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Protocol ID is required' },
        { status: 400 }
      )
    }

    console.log('Deleting protocol with id:', id)

    const deleted = await deleteProtocol(id)
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Protocol not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      message: 'Protocol deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting protocol:', error)
    return NextResponse.json(
      { error: 'Failed to delete protocol', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
