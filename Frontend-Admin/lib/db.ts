// MongoDB connection utility for admin functions
// This will be used to connect to the same database as ClimaTech-User

import { MongoClient, Db, ObjectId } from 'mongodb'

interface User {
  _id?: string
  email: string
  password?: string
  name?: string
  phone?: string
  location?: string
  createdAt: Date
  promptCount: number
  isVerified: boolean
  role?: string
  agency?: string
  status?: string
  lastLogin?: string
  permissions?: string[]
}

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  agency: string
  status: string
  lastLogin: string
  permissions: string[]
  userType: 'admin' | 'citizen'
}

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/climatech-ai'
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  if (!(global as any)._mongoClientPromise) {
    client = new MongoClient(uri, options)
    ;(global as any)._mongoClientPromise = client.connect()
  }
  clientPromise = (global as any)._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export async function connectToDatabase() {
  try {
    console.log('Attempting to connect to MongoDB...')
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set')
    console.log('MongoDB Database:', process.env.MONGODB_DATABASE || 'climatech-ai')
    
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE || 'climatech-ai')
    
    // Test the connection by doing a simple operation
    await db.admin().ping()
    
    console.log('MongoDB connection successful')
    return { client, db }
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    throw error
  }
}

// Mock data for admin users (this simulates the existing users)
export const mockAdminUsers: AdminUser[] = [
  {
    id: "USR-001",
    name: "Juan Dela Cruz",
    email: "juan.delacruz@ndrrmc.gov.ph",
    role: "Emergency Coordinator",
    agency: "NDRRMC",
    status: "active",
    lastLogin: "2024-01-31 14:30:25",
    permissions: ["view_data", "create_alerts", "manage_protocols"],
    userType: "admin"
  },
  {
    id: "USR-002",
    name: "Maria Santos",
    email: "maria.santos@pagasa.dost.gov.ph",
    role: "Weather Analyst",
    agency: "PAGASA",
    status: "active",
    lastLogin: "2024-01-31 13:45:12",
    permissions: ["view_data", "update_weather"],
    userType: "admin"
  },
  {
    id: "USR-003",
    name: "Roberto Garcia",
    email: "roberto.garcia@phivolcs.dost.gov.ph",
    role: "Seismic Specialist",
    agency: "PHIVOLCS",
    status: "inactive",
    lastLogin: "2024-01-29 09:15:33",
    permissions: ["view_data", "update_seismic"],
    userType: "admin"
  },
  {
    id: "USR-004",
    name: "Ana Reyes",
    email: "ana.reyes@manila.gov.ph",
    role: "LGU Coordinator",
    agency: "Manila LGU",
    status: "active",
    lastLogin: "2024-01-31 11:22:18",
    permissions: ["view_data", "local_alerts"],
    userType: "admin"
  }
]

// This function would fetch users from both admin and citizen collections
export async function getAllUsers(): Promise<AdminUser[]> {
  try {
    const { db } = await connectToDatabase()
    
    // Fetch admin users
    const adminUsers = await db.collection('admin_users').find({}).toArray()
    const formattedAdminUsers = adminUsers.map((user: any) => ({
      id: user._id?.toString() || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      agency: user.agency,
      status: user.status,
      lastLogin: user.lastLogin,
      permissions: user.permissions || [],
      userType: 'admin' as const
    }))
    
    // Fetch citizen users from the users collection
    const citizenUsers = await db.collection('users').find({}).toArray()
    const formattedCitizenUsers = citizenUsers.map((user: any) => ({
      id: user._id?.toString() || user.id,
      name: user.name || 'Unknown',
      email: user.email,
      role: 'Citizen',
      agency: 'N/A',
      status: user.isVerified ? 'active' : 'inactive',
      lastLogin: user.lastLogin || 'Never',
      permissions: ['view_alerts', 'report_issues'],
      userType: 'citizen' as const
    }))
    
    return [...formattedAdminUsers, ...formattedCitizenUsers]
    
  } catch (error) {
    console.error('Error fetching users:', error)
    // Fallback to mock data if database connection fails
    return mockAdminUsers
  }
}

export async function createUser(userData: Partial<AdminUser>): Promise<AdminUser | null> {
  try {
    const { db } = await connectToDatabase()
    
    const newUser = {
      name: userData.name || '',
      email: userData.email || '',
      role: userData.role || '',
      agency: userData.agency || '',
      status: userData.status || 'active',
      lastLogin: 'Never',
      permissions: userData.permissions || [],
      userType: userData.userType || 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await db.collection('admin_users').insertOne(newUser)
    
    return {
      id: result.insertedId.toString(),
      ...newUser
    }
    
  } catch (error) {
    console.error('Error creating user:', error)
    return null
  }
}

export async function updateUser(id: string, userData: Partial<AdminUser>): Promise<AdminUser | null> {
  try {
    const { db } = await connectToDatabase()
    
    const updateData = {
      ...userData,
      updatedAt: new Date()
    }
    
    const result = await db.collection('admin_users').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    )
    
    if (result) {
      return {
        id: result._id.toString(),
        name: result.name,
        email: result.email,
        role: result.role,
        agency: result.agency,
        status: result.status,
        lastLogin: result.lastLogin,
        permissions: result.permissions || [],
        userType: result.userType || 'admin'
      }
    }
    
    return null
    
  } catch (error) {
    console.error('Error updating user:', error)
    return null
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    const { db } = await connectToDatabase()
    
    const result = await db.collection('admin_users').deleteOne({ _id: new ObjectId(id) })
    
    return result.deletedCount > 0
    
  } catch (error) {
    console.error('Error deleting user:', error)
    return false
  }
}

export type { User, AdminUser }

// Emergency Contact interfaces and functions
export interface EmergencyContact {
  _id?: string
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

export interface EmergencyProtocol {
  _id?: string
  id: string
  name: string
  type: string
  description: string
  steps: string[]
  status: string
  createdAt: string
  updatedAt: string
}

export interface EvacuationCenter {
  _id?: string
  id: string
  name: string
  address: string
  capacity: number
  currentOccupancy: number
  status: string
  facilities: string[]
  contactPerson: string
  contactNumber: string
  coordinates: {
    latitude: number
    longitude: number
  }
  createdAt: string
  updatedAt: string
}

export interface ResponseTeam {
  _id?: string
  id: string
  name: string
  type: string
  members: number
  leader: string
  contact: string
  equipment: string[]
  status: string
  location: string
  createdAt: string
  updatedAt: string
}

export interface MessageTemplate {
  _id?: string
  id: string
  name: string
  type: string
  message: string
  severity: string
  template: boolean
  createdAt: string
  updatedAt: string
}

// Emergency Contacts CRUD operations
export async function getAllContacts(): Promise<EmergencyContact[]> {
  let client: MongoClient | null = null
  try {
    console.log('getAllContacts: Fetching all contacts from database...')
    console.log('DATABASE CONNECTION INFO:')
    console.log('URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/climatech-ai')
    console.log('Database:', process.env.MONGODB_DATABASE || 'climatech-ai')
    
    // Use a fresh connection to ensure we read the latest data
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/climatech-ai'
    client = new MongoClient(uri)
    
    await client.connect()
    console.log('getAllContacts: Direct MongoDB connection established')
    
    const db = client.db(process.env.MONGODB_DATABASE || 'climatech-ai')
    const collection = db.collection('emergency_contacts')
    
    // Get count first for debugging
    const count = await collection.countDocuments()
    console.log('getAllContacts: Total contacts in database:', count)
    
    if (count === 0) {
      console.log('getAllContacts: No contacts found in database')
      return []
    }
    
    const contacts = await collection.find({}).toArray()
    console.log('getAllContacts: Retrieved contacts from database:', contacts.length)
    console.log('getAllContacts: Raw contacts data IDs:', contacts.map(c => c._id.toString()))
    
    // Ensure consistent formatting of contacts
    const mappedContacts = contacts.map((contact: any) => {
      // This modification will help us verify the data is coming from MongoDB
      let name = contact.name;
      if (contact.name === "NDRRMC Operations Center") {
        name = "NDRRMC Operations Center (from MongoDB)";
      }
      
      return {
        ...contact,
        _id: contact._id?.toString(),
        id: contact.id || contact._id?.toString(),
        name: name, // Use the potentially modified name
        number: contact.number,
        type: contact.type || 'unknown',
        status: contact.status || 'active',
        description: contact.description || '',
        agency: contact.agency || '',
        createdAt: contact.createdAt || new Date().toISOString(),
        updatedAt: contact.updatedAt || new Date().toISOString()
      };
    }) as EmergencyContact[]
    
    console.log('getAllContacts: Mapped contacts for return:', mappedContacts.length)
    console.log('getAllContacts: First mapped contact sample:', mappedContacts[0] || 'No contacts')
    
    return mappedContacts
  } catch (error) {
    console.error('getAllContacts: Error fetching contacts:', error)
    return []
  } finally {
    // Always close the direct connection
    if (client) {
      try {
        await client.close()
        console.log('getAllContacts: Direct MongoDB connection closed')
      } catch (closeError) {
        console.error('getAllContacts: Error closing MongoDB connection:', closeError)
      }
    }
  }
}

export async function createContact(contactData: Omit<EmergencyContact, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<EmergencyContact | null> {
  let client: MongoClient | null = null
  try {
    console.log('MongoDB createContact called with:', contactData)
    
    // Validate input data
    if (!contactData.name || !contactData.number || !contactData.type) {
      console.error('Invalid contact data - missing required fields:', contactData)
      return null
    }
    
    // Use a fresh connection with explicit write concern
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/climatech-ai'
    client = new MongoClient(uri, {
      // Explicit write concern to ensure data is written
      writeConcern: { w: 'majority', j: true }
    })
    
    await client.connect()
    console.log('Direct MongoDB connection established for contact creation')
    
    const db = client.db(process.env.MONGODB_DATABASE || 'climatech-ai')
    const collection = db.collection('emergency_contacts')
    
    const now = new Date().toISOString()
    const newContact = {
      ...contactData,
      id: `contact-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    }
    
    console.log('Inserting contact into database:', newContact)
    
    // Check count before insert
    const countBefore = await collection.countDocuments()
    console.log('Contact count before insert:', countBefore)
    
    // Insert with explicit write concern
    const result = await collection.insertOne(newContact, { 
      writeConcern: { w: 'majority', j: true }
    })
    
    console.log('Insert result:', result)
    console.log('Insert acknowledged:', result.acknowledged)
    console.log('Inserted ID:', result.insertedId)
    
    if (!result.acknowledged || !result.insertedId) {
      console.error('Insert operation failed - not acknowledged or no insertedId')
      return null
    }
    
    // Force a wait to ensure write is committed
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Check count after insert
    const countAfter = await collection.countDocuments()
    console.log('Contact count after insert:', countAfter)
    
    // Verify the contact was actually saved by reading it back
    const savedContact = await collection.findOne({ _id: result.insertedId })
    console.log('Verification - saved contact found:', savedContact ? 'YES' : 'NO')
    
    if (!savedContact) {
      console.error('Contact was not found after insertion - write may have failed')
      return null
    }
    
    console.log('Saved contact full data:', JSON.stringify(savedContact, null, 2))
    
    // Return the contact with both _id and id fields properly mapped
    const finalContact = {
      ...savedContact,
      _id: savedContact._id.toString(),
      id: savedContact.id || savedContact._id.toString(),
      name: savedContact.name,
      number: savedContact.number,
      type: savedContact.type || 'unknown',
      status: savedContact.status || 'active',
      description: savedContact.description || '',
      agency: savedContact.agency || '',
      createdAt: savedContact.createdAt || now,
      updatedAt: savedContact.updatedAt || now
    } as EmergencyContact
    
    console.log('Successfully created and verified contact:', finalContact)
    
    // Test: Try to fetch all contacts to see if the new one shows up
    const allContactsCheck = await collection.find({}).toArray()
    console.log('All contacts after creation (verification):', allContactsCheck.length)
    
    return finalContact
    
  } catch (error) {
    console.error('Error creating contact in MongoDB:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return null
  } finally {
    // Always close the direct connection
    if (client) {
      try {
        await client.close()
        console.log('Direct MongoDB connection closed')
      } catch (closeError) {
        console.error('Error closing MongoDB connection:', closeError)
      }
    }
  }
}

export async function updateContact(id: string, contactData: Partial<EmergencyContact>): Promise<EmergencyContact | null> {
  let client: MongoClient | null = null;
  try {
    console.log('updateContact: Starting update for contact with ID:', id);
    console.log('updateContact: Contact data to update:', contactData);
    
    // Use a direct connection for this critical operation
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/climatech-ai';
    client = new MongoClient(uri);
    await client.connect();
    console.log('updateContact: Connected to MongoDB directly');
    
    const db = client.db(process.env.MONGODB_DATABASE || 'climatech-ai');
    const collection = db.collection('emergency_contacts');
    
    // First verify contact exists
    console.log('updateContact: Verifying contact exists with id:', id);
    const existingContact = await collection.findOne({ id: id });
    
    if (!existingContact) {
      console.error('updateContact: Contact not found with id:', id);
      return null;
    }
    
    console.log('updateContact: Found contact:', {
      _id: existingContact._id.toString(),
      id: existingContact.id,
      name: existingContact.name
    });
    
    // Prepare update data with timestamp
    const updateData = {
      ...contactData,
      updatedAt: new Date().toISOString()
    };
    
    // Using updateOne for simplicity and reliability
    console.log('updateContact: Performing update with filter:', { id });
    const updateResult = await collection.updateOne(
      { id: id },
      { $set: updateData }
    );
    
    console.log('updateContact: Update result:', {
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount
    });
    
    if (updateResult.matchedCount === 0) {
      console.error('updateContact: No document matched the filter');
      return null;
    }
    
    // Get the updated document
    const updatedContact = await collection.findOne({ id: id });
    
    if (!updatedContact) {
      console.error('updateContact: Could not retrieve updated contact');
      return null;
    }
    
    console.log('updateContact: Retrieved updated contact');
    
    // Format the result in a consistent way
    const result = {
      ...updatedContact,
      _id: updatedContact._id.toString(),
      id: updatedContact.id || updatedContact._id.toString(),
      name: updatedContact.name,
      number: updatedContact.number,
      type: updatedContact.type || 'unknown',
      status: updatedContact.status || 'active',
      description: updatedContact.description || '',
      agency: updatedContact.agency || '',
      createdAt: updatedContact.createdAt || new Date().toISOString(),
      updatedAt: updatedContact.updatedAt || new Date().toISOString()
    } as EmergencyContact;
    
    console.log('updateContact: Returning updated contact:', { 
      id: result.id, 
      name: result.name
    });
    
    return result;
  } catch (error) {
    console.error('updateContact: Error updating contact:', error);
    return null;
  } finally {
    if (client) {
      try {
        await client.close();
        console.log('updateContact: MongoDB connection closed');
      } catch (closeError) {
        console.error('updateContact: Error closing MongoDB connection:', closeError);
      }
    }
  }
}

export async function deleteContact(id: string): Promise<boolean> {
  try {
    const { db } = await connectToDatabase()
    
    // Try to find by ObjectId first, then by string id
    let filter: any
    try {
      filter = { _id: new ObjectId(id) }
    } catch {
      filter = { id: id }
    }
    
    const result = await db.collection('emergency_contacts').deleteOne(filter)
    return result.deletedCount > 0
  } catch (error) {
    console.error('Error deleting contact:', error)
    return false
  }
}

// Emergency Protocols CRUD operations
export async function getAllProtocols(): Promise<EmergencyProtocol[]> {
  try {
    const { db } = await connectToDatabase()
    const protocols = await db.collection('emergency_protocols').find({}).toArray()
    return protocols.map((protocol: any) => ({
      ...protocol,
      id: protocol._id?.toString() || protocol.id
    }))
  } catch (error) {
    console.error('Error fetching protocols:', error)
    return []
  }
}

export async function createProtocol(protocolData: Omit<EmergencyProtocol, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<EmergencyProtocol | null> {
  try {
    const { db } = await connectToDatabase()
    const now = new Date().toISOString()
    const newProtocol = {
      ...protocolData,
      id: `protocol-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    }
    
    const result = await db.collection('emergency_protocols').insertOne(newProtocol)
    return {
      ...newProtocol,
      _id: result.insertedId.toString()
    }
  } catch (error) {
    console.error('Error creating protocol:', error)
    return null
  }
}

// Update Protocol
export async function updateProtocol(id: string, protocolData: Partial<EmergencyProtocol>): Promise<EmergencyProtocol | null> {
  try {
    console.log('MongoDB updateProtocol called with id:', id, 'data:', protocolData)
    const { db } = await connectToDatabase()
    const now = new Date().toISOString()
    
    const updateData = {
      ...protocolData,
      updatedAt: now
    }
    
    // Try to find by MongoDB _id first, then by custom id
    let filter: any = { id: id }
    try {
      const objId = new ObjectId(id)
      filter = { _id: objId }
    } catch {
      // If id is not a valid ObjectId, use the custom id field
      filter = { id: id }
    }
    
    const result = await db.collection('emergency_protocols').findOneAndUpdate(
      filter,
      { $set: updateData },
      { returnDocument: 'after' }
    )
    
    if (result && result.value) {
      return {
        ...result.value,
        id: result.value._id?.toString() || result.value.id
      } as EmergencyProtocol
    }
    
    return null
  } catch (error) {
    console.error('Error updating protocol in MongoDB:', error)
    return null
  }
}

// Delete Protocol
export async function deleteProtocol(id: string): Promise<boolean> {
  try {
    console.log('MongoDB deleteProtocol called with id:', id)
    const { db } = await connectToDatabase()
    
    // Try to find by MongoDB _id first, then by custom id
    let filter: any = { id: id }
    try {
      const objId = new ObjectId(id)
      filter = { _id: objId }
    } catch {
      // If id is not a valid ObjectId, use the custom id field
      filter = { id: id }
    }
    
    const result = await db.collection('emergency_protocols').deleteOne(filter)
    
    console.log('Delete result:', result)
    return result.deletedCount > 0
  } catch (error) {
    console.error('Error deleting protocol in MongoDB:', error)
    return false
  }
}

// Evacuation Centers CRUD operations
export async function getAllCenters(): Promise<EvacuationCenter[]> {
  try {
    const { db } = await connectToDatabase()
    const centers = await db.collection('evacuation_centers').find({}).toArray()
    return centers.map((center: any) => ({
      ...center,
      id: center._id?.toString() || center.id
    }))
  } catch (error) {
    console.error('Error fetching centers:', error)
    return []
  }
}

export async function createCenter(centerData: Omit<EvacuationCenter, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<EvacuationCenter | null> {
  try {
    const { db } = await connectToDatabase()
    const now = new Date().toISOString()
    const newCenter = {
      ...centerData,
      id: `center-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    }
    
    const result = await db.collection('evacuation_centers').insertOne(newCenter)
    return {
      ...newCenter,
      _id: result.insertedId.toString()
    }
  } catch (error) {
    console.error('Error creating center:', error)
    return null
  }
}

// Update Center
export async function updateCenter(id: string, centerData: Partial<EvacuationCenter>): Promise<EvacuationCenter | null> {
  try {
    console.log('MongoDB updateCenter called with id:', id, 'data:', centerData)
    const { db } = await connectToDatabase()
    const now = new Date().toISOString()
    
    const updateData = {
      ...centerData,
      updatedAt: now
    }
    
    // Try to find by MongoDB _id first, then by custom id
    let filter: any = { id: id }
    try {
      const objId = new ObjectId(id)
      filter = { _id: objId }
    } catch {
      // If id is not a valid ObjectId, use the custom id field
      filter = { id: id }
    }
    
    const result = await db.collection('evacuation_centers').findOneAndUpdate(
      filter,
      { $set: updateData },
      { returnDocument: 'after' }
    )
    
    if (result && result.value) {
      return {
        ...result.value,
        id: result.value._id?.toString() || result.value.id
      } as EvacuationCenter
    }
    
    return null
  } catch (error) {
    console.error('Error updating center in MongoDB:', error)
    return null
  }
}

// Delete Center
export async function deleteCenter(id: string): Promise<boolean> {
  try {
    console.log('MongoDB deleteCenter called with id:', id)
    const { db } = await connectToDatabase()
    
    // Try to find by MongoDB _id first, then by custom id
    let filter: any = { id: id }
    try {
      const objId = new ObjectId(id)
      filter = { _id: objId }
    } catch {
      // If id is not a valid ObjectId, use the custom id field
      filter = { id: id }
    }
    
    const result = await db.collection('evacuation_centers').deleteOne(filter)
    
    console.log('Delete result:', result)
    return result.deletedCount > 0
  } catch (error) {
    console.error('Error deleting center in MongoDB:', error)
    return false
  }
}

// Response Teams CRUD operations
export async function getAllTeams(): Promise<ResponseTeam[]> {
  try {
    const { db } = await connectToDatabase()
    const teams = await db.collection('response_teams').find({}).toArray()
    return teams.map((team: any) => ({
      ...team,
      id: team._id?.toString() || team.id
    }))
  } catch (error) {
    console.error('Error fetching teams:', error)
    return []
  }
}

export async function createTeam(teamData: Omit<ResponseTeam, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<ResponseTeam | null> {
  try {
    console.log('MongoDB createTeam called with:', teamData)
    const { db } = await connectToDatabase()
    const now = new Date().toISOString()
    const newTeam = {
      ...teamData,
      id: `team-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    }
    
    console.log('Inserting team into database:', newTeam)
    const result = await db.collection('response_teams').insertOne(newTeam)
    console.log('Insert result:', result)
    
    return {
      ...newTeam,
      _id: result.insertedId.toString()
    }
  } catch (error) {
    console.error('Error creating team in MongoDB:', error)
    return null
  }
}

// Update Team
export async function updateTeam(id: string, teamData: Partial<ResponseTeam>): Promise<ResponseTeam | null> {
  try {
    console.log('MongoDB updateTeam called with id:', id, 'data:', teamData)
    const { db } = await connectToDatabase()
    const now = new Date().toISOString()
    
    const updateData = {
      ...teamData,
      updatedAt: now
    }
    
    // Try to find by MongoDB _id first, then by custom id
    let filter: any = { id: id }
    try {
      const objId = new ObjectId(id)
      filter = { _id: objId }
    } catch {
      // If id is not a valid ObjectId, use the custom id field
      filter = { id: id }
    }
    
    const result = await db.collection('response_teams').findOneAndUpdate(
      filter,
      { $set: updateData },
      { returnDocument: 'after' }
    )
    
    if (result && result.value) {
      return {
        ...result.value,
        id: result.value._id?.toString() || result.value.id
      } as ResponseTeam
    }
    
    return null
  } catch (error) {
    console.error('Error updating team in MongoDB:', error)
    return null
  }
}

// Delete Team
export async function deleteTeam(id: string): Promise<boolean> {
  try {
    console.log('MongoDB deleteTeam called with id:', id)
    const { db } = await connectToDatabase()
    
    // Try to find by MongoDB _id first, then by custom id
    let filter: any = { id: id }
    try {
      const objId = new ObjectId(id)
      filter = { _id: objId }
    } catch {
      // If id is not a valid ObjectId, use the custom id field
      filter = { id: id }
    }
    
    const result = await db.collection('response_teams').deleteOne(filter)
    
    console.log('Delete result:', result)
    return result.deletedCount > 0
  } catch (error) {
    console.error('Error deleting team in MongoDB:', error)
    return false
  }
}

// Message Templates CRUD operations
export async function getAllMessages(): Promise<MessageTemplate[]> {
  try {
    const { db } = await connectToDatabase()
    const messages = await db.collection('message_templates').find({}).toArray()
    return messages.map((message: any) => ({
      ...message,
      id: message._id?.toString() || message.id
    }))
  } catch (error) {
    console.error('Error fetching messages:', error)
    return []
  }
}

export async function createMessage(messageData: Omit<MessageTemplate, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<MessageTemplate | null> {
  try {
    console.log('MongoDB createMessage called with:', messageData)
    const { db } = await connectToDatabase()
    const now = new Date().toISOString()
    const newMessage = {
      ...messageData,
      id: `message-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    }
    
    console.log('Inserting message into database:', newMessage)
    const result = await db.collection('message_templates').insertOne(newMessage)
    console.log('Insert result:', result)
    
    return {
      ...newMessage,
      _id: result.insertedId.toString()
    }
  } catch (error) {
    console.error('Error creating message in MongoDB:', error)
    return null
  }
}

// Update Message
export async function updateMessage(id: string, messageData: Partial<MessageTemplate>): Promise<MessageTemplate | null> {
  try {
    console.log('MongoDB updateMessage called with id:', id, 'data:', messageData)
    const { db } = await connectToDatabase()
    const now = new Date().toISOString()
    
    const updateData = {
      ...messageData,
      updatedAt: now
    }
    
    // Try to find by MongoDB _id first, then by custom id
    let filter: any = { id: id }
    try {
      const objId = new ObjectId(id)
      filter = { _id: objId }
    } catch {
      // If id is not a valid ObjectId, use the custom id field
      filter = { id: id }
    }
    
    const result = await db.collection('message_templates').findOneAndUpdate(
      filter,
      { $set: updateData },
      { returnDocument: 'after' }
    )
    
    if (result && result.value) {
      return {
        ...result.value,
        id: result.value._id?.toString() || result.value.id
      } as MessageTemplate
    }
    
    return null
  } catch (error) {
    console.error('Error updating message in MongoDB:', error)
    return null
  }
}

// Delete Message
export async function deleteMessage(id: string): Promise<boolean> {
  try {
    console.log('MongoDB deleteMessage called with id:', id)
    const { db } = await connectToDatabase()
    
    // Try to find by MongoDB _id first, then by custom id
    let filter: any = { id: id }
    try {
      const objId = new ObjectId(id)
      filter = { _id: objId }
    } catch {
      // If id is not a valid ObjectId, use the custom id field
      filter = { id: id }
    }
    
    const result = await db.collection('message_templates').deleteOne(filter)
    
    console.log('Delete result:', result)
    return result.deletedCount > 0
  } catch (error) {
    console.error('Error deleting message in MongoDB:', error)
    return false
  }
}
