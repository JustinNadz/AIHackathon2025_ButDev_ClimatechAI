// Verify MongoDB emergency contacts directly without API
const { MongoClient } = require('mongodb');

async function verifyEmergencyContactsDatabase() {
  console.log('🔎 VERIFYING EMERGENCY CONTACTS IN MONGODB DATABASE\n');
  
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/climatech-ai';
  const dbName = process.env.MONGODB_DATABASE || 'climatech-ai';
  
  console.log('MongoDB Connection Info:');
  console.log('URI:', uri);
  console.log('Database:', dbName);
  console.log('Collection: emergency_contacts\n');
  
  const client = new MongoClient(uri);
  
  try {
    // Connect to MongoDB directly
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('✓ Connected to MongoDB\n');
    
    const db = client.db(dbName);
    const collection = db.collection('emergency_contacts');
    
    // Count documents in the collection
    console.log('Checking for emergency contacts in database...');
    const count = await collection.countDocuments();
    console.log(`Found ${count} emergency contacts in database\n`);
    
    if (count === 0) {
      console.log('NO CONTACTS FOUND IN DATABASE - THIS IS THE ISSUE!');
      console.log('Adding test contacts to the database...\n');
      
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
      
      const result = await collection.insertMany(testContacts);
      console.log(`✓ Added ${result.insertedCount} test contacts to database\n`);
      
      // Verify contacts were added
      const newCount = await collection.countDocuments();
      console.log(`Now there are ${newCount} emergency contacts in database\n`);
    }
    
    // Show all contacts in the database
    console.log('Listing all contacts in database:');
    const contacts = await collection.find({}).toArray();
    contacts.forEach(contact => {
      console.log(`- ${contact.name} (${contact.id || contact._id}): ${contact.number}`);
    });
    
    console.log('\nFIX COMPLETED: Database now has emergency contacts that can be retrieved by the API.');
    console.log('Please restart your Next.js server to see the changes.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('\nClosing MongoDB connection...');
    await client.close();
    console.log('✓ MongoDB connection closed');
  }
}

// Run the verification
verifyEmergencyContactsDatabase().catch(console.error);
