import { NextRequest, NextResponse } from 'next/server'
import { getAllMessages, createMessage, updateMessage, deleteMessage, MessageTemplate } from '@/lib/mongodb'

// GET - Fetch all message templates
export async function GET() {
  try {
    const messages = await getAllMessages()
    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST - Create new message template
export async function POST(request: NextRequest) {
  let messageData: any
  try {
    try {
      messageData = await request.json()
      console.log('Raw message request data:', JSON.stringify(messageData, null, 2))
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    // Check if request body is empty or null
    if (!messageData || typeof messageData !== 'object') {
      console.error('Invalid request body:', messageData)
      return NextResponse.json(
        { error: 'Invalid request body. Please provide message data.' },
        { status: 400 }
      )
    }
    
    // Validate required fields
    if (!messageData.type || !messageData.message) {
      console.error('Missing required fields. Received:', Object.keys(messageData))
      return NextResponse.json(
        { error: 'Missing required fields: type, message' },
        { status: 400 }
      )
    }

    // Use name if provided, otherwise generate from type
    const name = messageData.name && typeof messageData.name === 'string' && messageData.name.trim() 
      ? messageData.name.trim() 
      : `${messageData.type.charAt(0).toUpperCase() + messageData.type.slice(1)} Alert Template`

    // Validate field types and lengths
    if (typeof messageData.type !== 'string' || messageData.type.trim().length === 0) {
      console.error('Invalid message type:', messageData.type)
      return NextResponse.json(
        { error: 'Message type must be a non-empty string' },
        { status: 400 }
      )
    }

    if (typeof messageData.message !== 'string' || messageData.message.trim().length === 0) {
      console.error('Invalid message content:', messageData.message)
      return NextResponse.json(
        { error: 'Message content must be a non-empty string' },
        { status: 400 }
      )
    }

    // Validate severity value
    const validSeverities = ['low', 'medium', 'high', 'critical']
    const severity = messageData.severity ? messageData.severity.toString().toLowerCase() : 'medium'
    if (!validSeverities.includes(severity)) {
      console.error('Invalid severity:', messageData.severity)
      return NextResponse.json(
        { error: 'Severity must be one of: low, medium, high, critical' },
        { status: 400 }
      )
    }

    // Validate template boolean
    const template = messageData.template !== undefined ? Boolean(messageData.template) : true

    console.log('Creating message with data:', {
      name: name,
      type: messageData.type,
      message: messageData.message.substring(0, 50) + '...',
      severity: severity,
      template: template
    })

    const newMessage = await createMessage({
      name: name,
      type: messageData.type.toString().trim(),
      message: messageData.message.toString().trim(),
      severity: severity,
      template: template
    })

    if (!newMessage) {
      console.error('createMessage returned null/undefined')
      return NextResponse.json(
        { error: 'Failed to create message - database operation failed' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      message: 'Message template created successfully',
      messageTemplate: newMessage 
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating message:', error)
    console.error('Message data received:', messageData ? JSON.stringify(messageData, null, 2) : 'No data received')
    return NextResponse.json(
      { error: 'Failed to create message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT - Update existing message
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const messageData = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      )
    }

    console.log('Updating message with id:', id, 'data:', messageData)

    const updatedMessage = await updateMessage(id, messageData)
    
    if (!updatedMessage) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      message: 'Message updated successfully',
      messageTemplate: updatedMessage 
    })
    
  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json(
      { error: 'Failed to update message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete message
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      )
    }

    console.log('Deleting message with id:', id)

    const deleted = await deleteMessage(id)
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      message: 'Message deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json(
      { error: 'Failed to delete message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
