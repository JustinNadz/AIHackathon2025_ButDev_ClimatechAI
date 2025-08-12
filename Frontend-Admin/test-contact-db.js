// Test script to verify contact database operations
const { MongoClient } = require('mongodb');

async function testContactDatabase() {
  const uri = 'mongodb://localhost:27017/climatech-ai';
  const client = new MongoClient(uri);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully');
    
    const db = client.db('climatech-ai');
    const collection = db.collection('emergency_contacts');
    
    // Test 1: Count existing contacts
    const count = await collection.countDocuments();
    console.log('Existing contacts count:', count);
    
    // Test 2: Insert a test contact
    const testContact = {
      id: `test-contact-${Date.now()}`,
      name: 'Test Contact',
      number: '123-456-7890',
      type: 'test',
      status: 'active',
      description: 'Test contact for debugging',
      agency: 'Test Agency',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Inserting test contact...');
    const insertResult = await collection.insertOne(testContact);
    console.log('Insert result:', {
      acknowledged: insertResult.acknowledged,
      insertedId: insertResult.insertedId
    });
    
    // Test 3: Verify the insert by reading it back
    const savedContact = await collection.findOne({ _id: insertResult.insertedId });
    console.log('Saved contact verification:', savedContact ? 'FOUND' : 'NOT FOUND');
    if (savedContact) {
      console.log('Saved contact data:', JSON.stringify(savedContact, null, 2));
    }
    
    // Test 4: Get all contacts
    const allContacts = await collection.find({}).toArray();
    console.log('Total contacts after insert:', allContacts.length);
    
    // Test 5: Clean up - delete the test contact
    const deleteResult = await collection.deleteOne({ _id: insertResult.insertedId });
    console.log('Delete result:', deleteResult);
    
  } catch (error) {
    console.error('Database test failed:', error);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

testContactDatabase();
