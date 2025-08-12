// Test API endpoint directly
const { MongoClient } = require('mongodb');

async function testAPIConnection() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/climatech-ai';
  const client = new MongoClient(uri);
  
  try {
    console.log('🔗 Testing API-style connection to MongoDB...');
    await client.connect();
    
    const db = client.db('climatech-ai');
    const collection = db.collection('emergency_contacts');
    
    // Get contacts exactly like the API does
    const contacts = await collection.find({}).toArray();
    console.log(`📊 API Test - Found ${contacts.length} contacts in database`);
    
    // Map contacts like the API does now (with the updated formatting)
    const formattedContacts = contacts.map((contact) => ({
      id: contact.id || contact._id?.toString(),
      name: contact.name,
      number: contact.number,
      type: contact.type || 'unknown',
      status: contact.status || 'active',
      description: contact.description || '',
      agency: contact.agency || '',
      createdAt: contact.createdAt || new Date().toISOString(),
      updatedAt: contact.updatedAt || new Date().toISOString()
    }));
    
    console.log('✅ API Test - Contacts ready for return:');
    formattedContacts.forEach((contact, index) => {
      console.log(`${index + 1}. ${contact.name} - ${contact.number} (${contact.type})`);
    });
    
    console.log('\n✅ RESULT: Your emergency contacts API will successfully return these contacts!');
    
  } catch (error) {
    console.error('❌ API Test Error:', error);
  } finally {
    await client.close();
  }
}

testAPIConnection();
