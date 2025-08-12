// Quick debug script for checking contacts in MongoDB
const { MongoClient } = require('mongodb');

async function checkContacts() {
  console.log('Checking emergency contacts in MongoDB...');
  
  try {
    const uri = 'mongodb://localhost:27017/climatech-ai';
    const client = new MongoClient(uri);
    
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('climatech-ai');
    const collection = db.collection('emergency_contacts');
    
    const count = await collection.countDocuments();
    console.log(`Found ${count} contacts in database`);
    
    const contacts = await collection.find({}).toArray();
    
    console.log('\nContact details:');
    contacts.forEach((contact, index) => {
      console.log(`\nContact #${index + 1}:`);
      console.log(`  _id: ${contact._id}`);
      console.log(`  id: ${contact.id || 'undefined'}`);
      console.log(`  name: ${contact.name}`);
      console.log(`  number: ${contact.number}`);
      
      // Also print the entire contact object for reference
      console.log('\n  Full contact object:');
      console.log(JSON.stringify(contact, null, 2));
    });
    
    await client.close();
    console.log('\nMongoDB connection closed');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
checkContacts().catch(console.error);
