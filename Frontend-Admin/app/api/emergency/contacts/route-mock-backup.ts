import { NextRequest, NextResponse } from 'next/server'

export interface EmergencyContact {
  id: string
  name: string
  number: string
  type: string
  status: string
  description?: string
  agency?: string
  createdAt: string
  updatedAt: string
}

// Mock database - temporarily using mock data until MongoDB is installed
let contacts: EmergencyContact[] = [
  {
    id: "contact-1",
    name: "NDRRMC Operations Center",
    number: "911",
    type: "primary",
    status: "active",
    description: "National Disaster Risk Reduction and Management Council",
    agency: "NDRRMC",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "contact-2",
    name: "Bureau of Fire Protection",
    number: "116",
    type: "fire",
    status: "active",
    description: "Fire emergency response",
    agency: "BFP",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "contact-3",
    name: "Philippine Red Cross",
    number: "143",
    type: "medical",
    status: "active",
    description: "Medical emergency response",
    agency: "PRC",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  }
]

export async function GET() {
  try {
    return NextResponse.json({ contacts })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const contactData = await request.json()
    
    // Validate required fields
    if (!contactData.name || !contactData.number || !contactData.type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, number, type' },
        { status: 400 }
      )
    }

    const newContact: EmergencyContact = {
      id: `contact-${Date.now()}`,
      name: contactData.name,
      number: contactData.number,
      type: contactData.type,
      status: contactData.status || 'active',
      description: contactData.description || '',
      agency: contactData.agency || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    contacts.push(newContact)
    
    return NextResponse.json({ 
      message: 'Contact created successfully',
      contact: newContact 
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    )
  }
}

// PUT - Update existing contact
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const contactData = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      )
    }

    const contactIndex = contacts.findIndex(c => c.id === id)
    
    if (contactIndex === -1) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    contacts[contactIndex] = {
      ...contacts[contactIndex],
      ...contactData,
      updatedAt: new Date().toISOString()
    }
    
    return NextResponse.json({ 
      message: 'Contact updated successfully',
      contact: contacts[contactIndex] 
    })
    
  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    )
  }
}

// DELETE - Delete contact
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      )
    }

    const contactIndex = contacts.findIndex(c => c.id === id)
    
    if (contactIndex === -1) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    contacts.splice(contactIndex, 1)
    
    return NextResponse.json({ 
      message: 'Contact deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    )
  }
}
