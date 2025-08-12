// Script to initialize the database with fresh emergency contacts
// This will help differentiate between mock data and actual DB data
const { MongoClient } = require('mongodb');

async function initializeEmergencyContacts() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/climatech-ai';
  const client = new MongoClient(uri);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully');
    
    const db = client.db(process.env.MONGODB_DATABASE || 'climatech-ai');
    const collection = db.collection('emergency_contacts');
    
    // Drop existing collection to start fresh
    console.log('Dropping existing emergency_contacts collection...');
    await collection.drop().catch(() => console.log('Collection did not exist, creating new one'));
    
    // Create new distinctive contacts
    const newContacts = [
      {
        id: "db-contact-1",
        name: "NDRRMC Database Entry",
        number: "911-DB",
        type: "primary",
        status: "active",
        description: "This contact is from the MongoDB database",
        agency: "NDRRMC-DB",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "db-contact-2",
        name: "BFP Database Entry",
        number: "116-DB",
        type: "fire",
        status: "active",
        description: "This contact is from the MongoDB database",
        agency: "BFP-DB",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "db-contact-3",
        name: "PRC Database Entry",
        number: "143-DB",
        type: "medical",
        status: "active",
        description: "This contact is from the MongoDB database",
        agency: "PRC-DB",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    console.log('Inserting new emergency contacts...');
    const result = await collection.insertMany(newContacts);
    console.log(`${result.insertedCount} emergency contacts inserted successfully`);
    
    // Verify the insertion
    const count = await collection.countDocuments();
    console.log(`Total documents in collection: ${count}`);
    
    const allContacts = await collection.find({}).toArray();
    console.log('All contacts in database:');
    allContacts.forEach(contact => {
      console.log(`- ${contact.name} (${contact.id}): ${contact.number}`);
    });
    
    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

// Run the initialization
initializeEmergencyContacts().catch(console.error);
