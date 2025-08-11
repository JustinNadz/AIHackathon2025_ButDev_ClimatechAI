// Test script specifically for emergency contacts API
const { MongoClient } = require('mongodb');
const axios = require('axios').default;

async function testEmergencyContactsAPI() {
  console.log('🔍 TESTING EMERGENCY CONTACTS API ROUTE\n');
  
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/climatech-ai';
  const dbName = process.env.MONGODB_DATABASE || 'climatech-ai';
  
  console.log('MongoDB Connection Info:');
  console.log('URI:', uri);
  console.log('Database:', dbName);
  console.log('Collection: emergency_contacts\n');
  
  const client = new MongoClient(uri);
  
  try {
    // 1. Connect to MongoDB directly
    console.log('Step 1: Connecting to MongoDB...');
    await client.connect();
    console.log('✓ Connected to MongoDB\n');
    
    const db = client.db(dbName);
    const collection = db.collection('emergency_contacts');
    
    // 2. Count documents in the collection
    console.log('Step 2: Checking for emergency contacts in database...');
    const count = await collection.countDocuments();
    console.log(`✓ Found ${count} emergency contacts in database\n`);
    
    if (count === 0) {
      console.log('No contacts found in database. Adding test contacts...');
      
      // Add test contacts if none exist
      const testContacts = [
        {
          id: "db-contact-1",
          name: "NDRRMC Database Entry (TEST)",
          number: "911-TEST",
          type: "primary",
          status: "active",
          description: "This contact is from the MongoDB database (TEST)",
          agency: "NDRRMC-TEST",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "db-contact-2",
          name: "BFP Database Entry (TEST)",
          number: "116-TEST",
          type: "fire",
          status: "active",
          description: "This contact is from the MongoDB database (TEST)",
          agency: "BFP-TEST",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      await collection.insertMany(testContacts);
      console.log(`✓ Added ${testContacts.length} test contacts to database\n`);
    }
    
    // 3. Show all contacts in the database
    console.log('Step 3: Listing all contacts in database:');
    const contacts = await collection.find({}).toArray();
    contacts.forEach(contact => {
      console.log(`- ${contact.name} (${contact.id || contact._id}): ${contact.number}`);
    });
    console.log();
    
    // 4. Test API endpoint using axios
    console.log('Step 4: Testing API endpoint directly...');
    try {
      const response = await axios.get('http://localhost:3000/api/emergency/contacts');
      console.log(`✓ API Response Status: ${response.status}`);
      console.log(`✓ API Response Contacts Count: ${response.data.contacts?.length || 0}`);
      
      if (response.data.contacts?.length > 0) {
        console.log('\nContacts returned from API:');
        response.data.contacts.forEach(contact => {
          console.log(`- ${contact.name} (${contact.id}): ${contact.number}`);
        });
      } else {
        console.error('❌ No contacts returned from API');
      }
    } catch (error) {
      console.error('❌ API Request Failed:', error.message);
      if (error.response) {
        console.error('Response Status:', error.response.status);
        console.error('Response Data:', error.response.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('\nClosing MongoDB connection...');
    await client.close();
    console.log('✓ MongoDB connection closed');
  }
}

// Run the test
testEmergencyContactsAPI().catch(console.error);
