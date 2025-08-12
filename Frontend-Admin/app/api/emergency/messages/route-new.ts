import { NextRequest, NextResponse } from 'next/server'
import { getAllMessages, createMessage, MessageTemplate } from '@/lib/mongodb'

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
  try {
    const messageData = await request.json()
    
    // Validate required fields
    if (!messageData.name || !messageData.type || !messageData.message) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, message' },
        { status: 400 }
      )
    }

    const newMessage = await createMessage({
      name: messageData.name,
      type: messageData.type,
      message: messageData.message,
      severity: messageData.severity || 'medium',
      template: messageData.template || true
    })

    if (!newMessage) {
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      message: 'Message template created successfully',
      messageTemplate: newMessage 
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}
