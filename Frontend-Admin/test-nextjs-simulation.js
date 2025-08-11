// Test script to simulate the exact same operations as the Next.js app
const { MongoClient } = require('mongodb');

async function testNextJSOperations() {
  const uri = 'mongodb://localhost:27017/climatech-ai';
  
  // Simulate the exact same operations as Next.js
  async function connectToDatabase() {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('climatech-ai');
    return { client, db };
  }
  
  async function createContact(contactData) {
    console.log('=== CREATE CONTACT OPERATION ===');
    try {
      console.log('MongoDB createContact called with:', contactData);
      
      if (!contactData.name || !contactData.number || !contactData.type) {
        console.error('Invalid contact data - missing required fields:', contactData);
        return null;
      }
      
      const { client, db } = await connectToDatabase();
      console.log('Database connection established successfully');
      
      const now = new Date().toISOString();
      const newContact = {
        ...contactData,
        id: `contact-${Date.now()}`,
        createdAt: now,
        updatedAt: now
      };
      
      console.log('Inserting contact into database:', newContact);
      
      const collection = db.collection('emergency_contacts');
      console.log('Collection reference obtained');
      
      const countBefore = await collection.countDocuments();
      console.log('Contact count before insert:', countBefore);
      
      const result = await collection.insertOne(newContact);
      console.log('Insert result:', result);
      console.log('Insert acknowledged:', result.acknowledged);
      console.log('Inserted ID:', result.insertedId);
      
      if (!result.acknowledged || !result.insertedId) {
        console.error('Insert operation failed');
        await client.close();
        return null;
      }
      
      const countAfter = await collection.countDocuments();
      console.log('Contact count after insert:', countAfter);
      
      const savedContact = await collection.findOne({ _id: result.insertedId });
      console.log('Verification - saved contact found:', savedContact ? 'YES' : 'NO');
      
      if (savedContact) {
        console.log('Saved contact full data:', JSON.stringify(savedContact, null, 2));
      }
      
      await client.close();
      
      const finalContact = {
        ...savedContact,
        _id: savedContact._id.toString(),
        id: savedContact.id || savedContact._id.toString()
      };
      
      console.log('Successfully created contact:', finalContact);
      return finalContact;
      
    } catch (error) {
      console.error('Error creating contact:', error);
      return null;
    }
  }
  
  async function getAllContacts() {
    console.log('=== GET ALL CONTACTS OPERATION ===');
    try {
      console.log('getAllContacts: Fetching all contacts from database...');
      const { client, db } = await connectToDatabase();
      const collection = db.collection('emergency_contacts');
      
      const count = await collection.countDocuments();
      console.log('getAllContacts: Total contacts in database:', count);
      
      if (count === 0) {
        console.log('getAllContacts: No contacts found in database');
        await client.close();
        return [];
      }
      
      const contacts = await collection.find({}).toArray();
      console.log('getAllContacts: Retrieved contacts from database:', contacts.length);
      console.log('getAllContacts: Raw contacts data:', JSON.stringify(contacts, null, 2));
      
      const mappedContacts = contacts.map((contact) => ({
        ...contact,
        _id: contact._id?.toString(),
        id: contact.id || contact._id?.toString()
      }));
      
      console.log('getAllContacts: Mapped contacts for return:', mappedContacts.length);
      
      await client.close();
      return mappedContacts;
      
    } catch (error) {
      console.error('getAllContacts: Error fetching contacts:', error);
      return [];
    }
  }
  
  // Test the operations
  console.log('Starting test simulation...\n');
  
  // Clear database first
  const { client, db } = await connectToDatabase();
  await db.collection('emergency_contacts').deleteMany({});
  await client.close();
  console.log('Database cleared\n');
  
  // Test 1: Create a contact
  const testContactData = {
    name: 'Test Emergency Contact',
    number: '911',
    type: 'emergency',
    status: 'active',
    description: 'Test contact created via simulation',
    agency: 'Test Agency'
  };
  
  const createdContact = await createContact(testContactData);
  console.log('\n--- CREATE RESULT ---');
  console.log('Created contact:', createdContact ? 'SUCCESS' : 'FAILED');
  
  // Small delay to ensure write is committed
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Test 2: Get all contacts
  const allContacts = await getAllContacts();
  console.log('\n--- GET ALL RESULT ---');
  console.log('Retrieved contacts count:', allContacts.length);
  console.log('Contacts found:', allContacts);
  
  console.log('\n=== TEST COMPLETE ===');
}

testNextJSOperations().catch(console.error);
