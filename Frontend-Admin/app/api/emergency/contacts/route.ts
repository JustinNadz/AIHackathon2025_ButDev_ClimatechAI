import { NextRequest, NextResponse } from 'next/server'
import { getAllContacts, createContact, updateContact, deleteContact, EmergencyContact } from '@/lib/mongodb'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET() {
  try {
    console.log('=== GET CONTACTS API CALLED ===')
    console.log('Attempting to connect to MongoDB and fetch contacts...')
    
    const contacts = await getAllContacts()
    
    // Make sure contacts are properly formatted
    const formattedContacts = contacts.map(contact => ({
      id: (contact as any).id || (contact as any)._id?.toString?.(),
      name: contact.name,
      number: contact.number,
      type: contact.type,
      status: contact.status || 'active',
      description: contact.description || '',
      agency: contact.agency || '',
      createdAt: contact.createdAt || new Date().toISOString(),
      updatedAt: contact.updatedAt || new Date().toISOString()
    }))
    
    console.log('GET API - Retrieved contacts count:', formattedContacts.length)
    console.log('GET API - Contact IDs:', formattedContacts.map(c => ({ id: c.id, name: c.name })))
    console.log('=== GET CONTACTS API COMPLETED ===')
    return NextResponse.json({ contacts: formattedContacts })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    console.error('Database connection failed - please check MongoDB is running')
    return NextResponse.json(
      { error: 'Failed to fetch contacts', details: 'Database connection error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const contactData = await request.json()
    console.log('=== POST CONTACTS API CALLED ===')
    console.log('Raw contact request data:', JSON.stringify(contactData, null, 2))
    
    // Validate required fields
    if (!contactData.name || !contactData.number || !contactData.type) {
      console.error('Missing required fields. Received:', Object.keys(contactData))
      console.error('contactData.name:', contactData.name)
      console.error('contactData.number:', contactData.number) 
      console.error('contactData.type:', contactData.type)
      return NextResponse.json(
        { error: 'Missing required fields: name, number, type' },
        { status: 400 }
      )
    }

    console.log('Creating contact with data:', {
      name: contactData.name,
      number: contactData.number,
      type: contactData.type,
      status: contactData.status || 'active',
      agency: contactData.agency || ''
    })

    const newContact = await createContact({
      name: contactData.name,
      number: contactData.number,
      type: contactData.type,
      status: contactData.status || 'active',
      description: contactData.description || '',
      agency: contactData.agency || ''
    })

    if (!newContact) {
      console.error('createContact returned null/undefined')
      return NextResponse.json(
        { error: 'Failed to create contact - database operation failed' },
        { status: 500 }
      )
    }
    
    console.log('Contact created successfully:', newContact)
    
    // Verification step: Try to fetch all contacts to see if the new one is there
    console.log('=== VERIFICATION: Fetching all contacts after creation ===')
    const allContactsVerification = await getAllContacts()
    console.log('Verification - Total contacts after creation:', allContactsVerification.length)
    console.log('Verification - Contact IDs found:', allContactsVerification.map(c => c.id))
    
    const response = NextResponse.json({ 
      message: 'Contact created successfully',
      contact: newContact 
    }, { status: 201 })
    
    console.log('=== POST CONTACTS API COMPLETED ===')
    return response
    
  } catch (error) {
    console.error('Error creating contact:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Failed to create contact', details: error instanceof Error ? error.message : 'Unknown error' },
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
    
    console.log('PUT API - Update contact request for ID:', id)
    console.log('PUT API - Contact data:', JSON.stringify(contactData, null, 2))
    
    if (!id) {
      console.error('PUT API - Error: Missing contact ID')
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      )
    }

    // Verification step - check if contact exists first
    console.log('PUT API - Verifying contact exists in database...')
    const { db } = await connectToDatabase()
    const existingContact = await db.collection('emergency_contacts').findOne({ id: id })
    
    if (!existingContact) {
      console.error('PUT API - Error: Contact not found with ID:', id)
      return NextResponse.json(
        { 
          error: 'Contact not found',
          details: `No contact found with ID: ${id}`,
          contactId: id
        },
        { status: 404 }
      )
    }
    
    console.log('PUT API - Contact found, proceeding with update')
    
    // Try to update the contact
    const updatedContact = await updateContact(id, contactData)
    
    if (!updatedContact) {
      console.error('PUT API - Error: Update failed for contact ID:', id)
      return NextResponse.json(
        { 
          error: 'Update failed',
          details: `Failed to update contact with ID: ${id}`,
          contactId: id
        },
        { status: 500 }
      )
    }
    
    console.log('PUT API - Contact updated successfully:', updatedContact.id)
    
    return NextResponse.json({ 
      message: 'Contact updated successfully',
      contact: updatedContact 
    })
    
  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update contact',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
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

    const deleted = await deleteContact(id)
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }
    
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
