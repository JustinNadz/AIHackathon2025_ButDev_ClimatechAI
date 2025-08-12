// Add default emergency contacts to database
const { MongoClient } = require('mongodb');

const defaultContacts = [
  {
    id: "contact-1",
    name: "NDRRMC Operations Center",
    number: "911",
    type: "primary",
    status: "active",
    description: "National Disaster Risk Reduction and Management Council",
    agency: "NDRRMC",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z")
  },
  {
    id: "contact-2", 
    name: "Bureau of Fire Protection",
    number: "116",
    type: "fire",
    status: "active",
    description: "Fire emergency response",
    agency: "BFP",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z")
  },
  {
    id: "contact-3",
    name: "Philippine Red Cross", 
    number: "143",
    type: "medical",
    status: "active",
    description: "Medical emergency response",
    agency: "PRC",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z")
  }
];

async function addDefaultContacts() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/climatech-ai';
  const client = new MongoClient(uri);
  
  try {
    console.log('🔄 Adding default emergency contacts to database...');
    await client.connect();
    
    const db = client.db('climatech-ai');
    const collection = db.collection('emergency_contacts');
    
    // Clear existing test data first
    await collection.deleteMany({ 
      $or: [
        { name: { $regex: /Test Emergency Contact/i } },
        { name: { $regex: /Direct Test Contact/i } },
        { name: { $regex: /kapitan/i } }  // Remove any "kapitan" contacts
      ]
    });
    console.log('🗑️ Cleared test contacts');
    
    // Check if default contacts already exist
    for (const contact of defaultContacts) {
      const existing = await collection.findOne({ 
        $or: [
          { id: contact.id },
          { name: contact.name }
        ]
      });
      
      if (!existing) {
        await collection.insertOne(contact);
        console.log(`✅ Added: ${contact.name} - ${contact.number}`);
      } else {
        console.log(`⏭️ Already exists: ${contact.name}`);
      }
    }
    
    // Verify final state
    const allContacts = await collection.find({}).toArray();
    console.log(`\n📊 Final database state: ${allContacts.length} contacts`);
    allContacts.forEach((contact, index) => {
      console.log(`${index + 1}. ${contact.name} - ${contact.number} (${contact.type})`);
    });
    
    console.log('\n✅ Default emergency contacts setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up default contacts:', error);
  } finally {
    await client.close();
  }
}

addDefaultContacts();
