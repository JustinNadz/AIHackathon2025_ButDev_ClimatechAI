// Quick verification that contacts will be retrieved from MongoDB
const { MongoClient } = require('mongodb');

async function verifyContactsInDatabase() {
  console.log('🔍 Verifying Emergency Contacts in MongoDB...\n');
  
  const uri = 'mongodb://localhost:27017/climatech-ai';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ MongoDB Connection: SUCCESS');
    
    const db = client.db('climatech-ai');
    const collection = db.collection('emergency_contacts');
    
    const count = await collection.countDocuments();
    console.log(`📊 Total contacts in database: ${count}`);
    
    if (count > 0) {
      const contacts = await collection.find({}).toArray();
      console.log('\n📋 Emergency Contacts Found:');
      contacts.forEach((contact, index) => {
        console.log(`${index + 1}. ${contact.name} - ${contact.number} (${contact.type})`);
      });
      
      console.log('\n✅ RESULT: Your emergency contacts ARE in the database!');
      console.log('✅ The API should be able to retrieve them successfully.');
    } else {
      console.log('\n📭 No contacts found in database.');
      console.log('ℹ️  This means contacts need to be added through the frontend.');
    }
    
  } catch (error) {
    console.log('❌ MongoDB Connection: FAILED');
    console.log('Error:', error.message);
    console.log('\n💡 Make sure MongoDB is running on localhost:27017');
  } finally {
    await client.close();
  }
}

verifyContactsInDatabase();
