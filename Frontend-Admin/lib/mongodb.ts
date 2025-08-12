import { MongoClient, Db, ObjectId, Collection, Document } from 'mongodb';

// Connection caching for serverless/Next.js runtime
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) return { client: cachedClient, db: cachedDb };

  const uri = process.env.MONGODB_URI || process.env.MONGODB_CONNECTION;
  const dbName = process.env.MONGODB_DATABASE || 'climatech-ai';
  if (!uri) throw new Error('MONGODB_URI (or MONGODB_CONNECTION) is not set');

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
  await client.connect();
  const db = client.db(dbName);
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

function objId(id: string): ObjectId | null {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function generateStringId(): string {
  return new ObjectId().toHexString();
}

function idFilter(id: string): any {
  const oid = objId(id);
  return oid ? { $or: [{ id }, { _id: oid }] } : { id };
}

function normalize<T extends Document>(doc: any): T & { id: string } {
  if (!doc) return doc;
  return { id: doc.id ?? doc._id?.toString?.(), ...doc } as T & { id: string };
}

// ============ Users ============
export type AdminUser = {
  id?: string;
  name: string;
  email: string;
  role: string;
  agency: string;
  status?: string;
  userType?: 'admin' | 'citizen';
  permissions?: string[];
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function getAllUsers(): Promise<AdminUser[]> {
  const { db } = await connectToDatabase();
  const docs = await db.collection('users').find({}).sort({ createdAt: -1 }).toArray();
  return docs.map(d => normalize<AdminUser>(d));
}

export async function createUser(data: AdminUser): Promise<AdminUser | null> {
  const { db } = await connectToDatabase();
  const now = new Date().toISOString();
  const doc: AdminUser = {
    id: generateStringId(),
    name: data.name,
    email: data.email,
    role: data.role,
    agency: data.agency,
    status: data.status ?? 'active',
    userType: data.userType ?? 'admin',
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
    lastLogin: data.lastLogin ?? now,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection('users').insertOne({ ...doc });
  return doc;
}

export async function updateUser(id: string, updates: Partial<AdminUser>): Promise<AdminUser | null> {
  const { db } = await connectToDatabase();
  const filter: any = idFilter(id);
  const set: any = { ...updates, updatedAt: new Date().toISOString() };
  const res = await db.collection('users').findOneAndUpdate(filter, { $set: set }, { returnDocument: 'after' });
  return res ? normalize<AdminUser>(res) : null;
}

export async function deleteUser(id: string): Promise<boolean> {
  const { db } = await connectToDatabase();
  const res = await db.collection('users').deleteOne(idFilter(id));
  return res.deletedCount === 1;
}

// ============ Emergency Contacts ============
export type EmergencyContact = {
  id?: string;
  name: string;
  number: string;
  type: string;
  status?: string;
  description?: string;
  agency?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function getAllContacts(): Promise<EmergencyContact[]> {
  const { db } = await connectToDatabase();
  const col = db.collection('emergency_contacts');
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map(d => normalize<EmergencyContact>(d));
}

export async function createContact(data: EmergencyContact): Promise<EmergencyContact | null> {
  const { db } = await connectToDatabase();
  const now = new Date().toISOString();
  const doc: EmergencyContact = {
    id: generateStringId(),
    name: data.name,
    number: data.number,
    type: data.type,
    status: data.status ?? 'active',
    description: data.description ?? '',
    agency: data.agency ?? '',
    createdAt: now,
    updatedAt: now,
  };
  await db.collection('emergency_contacts').insertOne({ ...doc });
  return doc;
}

export async function updateContact(id: string, updates: Partial<EmergencyContact>): Promise<EmergencyContact | null> {
  const { db } = await connectToDatabase();
  const filter: any = idFilter(id);
  const set: any = { ...updates, updatedAt: new Date().toISOString() };
  const res = await db.collection('emergency_contacts').findOneAndUpdate(filter, { $set: set }, { returnDocument: 'after' });
  return res ? normalize<EmergencyContact>(res) : null;
}

export async function deleteContact(id: string): Promise<boolean> {
  const { db } = await connectToDatabase();
  const res = await db.collection('emergency_contacts').deleteOne(idFilter(id));
  return res.deletedCount === 1;
}

// ============ Evacuation Centers ============
export type EvacuationCenter = {
  id?: string;
  name: string;
  address: string;
  capacity: number;
  currentOccupancy?: number;
  status?: string;
  facilities?: string[];
  contactPerson?: string;
  contactNumber?: string;
  coordinates?: { latitude: number; longitude: number };
  createdAt?: string;
  updatedAt?: string;
};

export async function getAllCenters(): Promise<EvacuationCenter[]> {
  const { db } = await connectToDatabase();
  const docs = await db.collection('evacuation_centers').find({}).sort({ createdAt: -1 }).toArray();
  return docs.map(d => normalize<EvacuationCenter>(d));
}

export async function createCenter(data: EvacuationCenter): Promise<EvacuationCenter | null> {
  const { db } = await connectToDatabase();
  const now = new Date().toISOString();
  const doc: EvacuationCenter = {
    id: generateStringId(),
    name: data.name,
    address: data.address,
    capacity: data.capacity,
    currentOccupancy: data.currentOccupancy ?? 0,
    status: data.status ?? 'active',
    facilities: data.facilities ?? [],
    contactPerson: data.contactPerson ?? '',
    contactNumber: data.contactNumber ?? '',
    coordinates: data.coordinates ?? { latitude: 0, longitude: 0 },
    createdAt: now,
    updatedAt: now,
  };
  await db.collection('evacuation_centers').insertOne({ ...doc });
  return doc;
}

export async function updateCenter(id: string, updates: Partial<EvacuationCenter>): Promise<EvacuationCenter | null> {
  const { db } = await connectToDatabase();
  const filter: any = idFilter(id);
  const set: any = { ...updates, updatedAt: new Date().toISOString() };
  const res = await db.collection('evacuation_centers').findOneAndUpdate(filter, { $set: set }, { returnDocument: 'after' });
  return res ? normalize<EvacuationCenter>(res) : null;
}

export async function deleteCenter(id: string): Promise<boolean> {
  const { db } = await connectToDatabase();
  const res = await db.collection('evacuation_centers').deleteOne(idFilter(id));
  return res.deletedCount === 1;
}

// ============ Message Templates ============
export type MessageTemplate = {
  id?: string;
  name: string;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  template?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export async function getAllMessages(): Promise<MessageTemplate[]> {
  const { db } = await connectToDatabase();
  const docs = await db.collection('message_templates').find({}).sort({ createdAt: -1 }).toArray();
  return docs.map(d => normalize<MessageTemplate>(d));
}

export async function createMessage(data: MessageTemplate): Promise<MessageTemplate | null> {
  const { db } = await connectToDatabase();
  const now = new Date().toISOString();
  const doc: MessageTemplate = {
    id: generateStringId(),
    name: data.name,
    type: data.type,
    message: data.message,
    severity: data.severity,
    template: data.template ?? true,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection('message_templates').insertOne({ ...doc });
  return doc;
}

export async function updateMessage(id: string, updates: Partial<MessageTemplate>): Promise<MessageTemplate | null> {
  const { db } = await connectToDatabase();
  const filter: any = idFilter(id);
  const set: any = { ...updates, updatedAt: new Date().toISOString() };
  const res = await db.collection('message_templates').findOneAndUpdate(filter, { $set: set }, { returnDocument: 'after' });
  return res ? normalize<MessageTemplate>(res) : null;
}

export async function deleteMessage(id: string): Promise<boolean> {
  const { db } = await connectToDatabase();
  const res = await db.collection('message_templates').deleteOne(idFilter(id));
  return res.deletedCount === 1;
}

// ============ Emergency Protocols ============
export type EmergencyProtocol = {
  id?: string;
  name: string;
  type: string;
  description: string;
  steps: string[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function getAllProtocols(): Promise<EmergencyProtocol[]> {
  const { db } = await connectToDatabase();
  const docs = await db.collection('emergency_protocols').find({}).sort({ createdAt: -1 }).toArray();
  return docs.map(d => normalize<EmergencyProtocol>(d));
}

export async function createProtocol(data: EmergencyProtocol): Promise<EmergencyProtocol | null> {
  const { db } = await connectToDatabase();
  const now = new Date().toISOString();
  const doc: EmergencyProtocol = {
    id: generateStringId(),
    name: data.name,
    type: data.type,
    description: data.description,
    steps: Array.isArray(data.steps) ? data.steps : [],
    status: data.status ?? 'active',
    createdAt: now,
    updatedAt: now,
  };
  await db.collection('emergency_protocols').insertOne({ ...doc });
  return doc;
}

export async function updateProtocol(id: string, updates: Partial<EmergencyProtocol>): Promise<EmergencyProtocol | null> {
  const { db } = await connectToDatabase();
  const filter: any = idFilter(id);
  const set: any = { ...updates, updatedAt: new Date().toISOString() };
  const res = await db.collection('emergency_protocols').findOneAndUpdate(filter, { $set: set }, { returnDocument: 'after' });
  return res ? normalize<EmergencyProtocol>(res) : null;
}

export async function deleteProtocol(id: string): Promise<boolean> {
  const { db } = await connectToDatabase();
  const res = await db.collection('emergency_protocols').deleteOne(idFilter(id));
  return res.deletedCount === 1;
}

// ============ Response Teams ============
export type ResponseTeam = {
  id?: string;
  name: string;
  type: string;
  members?: number;
  leader?: string;
  contact?: string;
  equipment?: string[];
  status?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function getAllTeams(): Promise<ResponseTeam[]> {
  const { db } = await connectToDatabase();
  const docs = await db.collection('response_teams').find({}).sort({ createdAt: -1 }).toArray();
  return docs.map(d => normalize<ResponseTeam>(d));
}

export async function createTeam(data: ResponseTeam): Promise<ResponseTeam | null> {
  const { db } = await connectToDatabase();
  const now = new Date().toISOString();
  const doc: ResponseTeam = {
    id: generateStringId(),
    name: data.name,
    type: data.type,
    members: data.members ?? 0,
    leader: data.leader ?? 'TBD',
    contact: data.contact ?? '',
    equipment: Array.isArray(data.equipment) ? data.equipment : [],
    status: data.status ?? 'active',
    location: data.location ?? '',
    createdAt: now,
    updatedAt: now,
  };
  await db.collection('response_teams').insertOne({ ...doc });
  return doc;
}

export async function updateTeam(id: string, updates: Partial<ResponseTeam>): Promise<ResponseTeam | null> {
  const { db } = await connectToDatabase();
  const filter: any = idFilter(id);
  const set: any = { ...updates, updatedAt: new Date().toISOString() };
  const res = await db.collection('response_teams').findOneAndUpdate(filter, { $set: set }, { returnDocument: 'after' });
  return res ? normalize<ResponseTeam>(res) : null;
}

export async function deleteTeam(id: string): Promise<boolean> {
  const { db } = await connectToDatabase();
  const res = await db.collection('response_teams').deleteOne(idFilter(id));
  return res.deletedCount === 1;
}


