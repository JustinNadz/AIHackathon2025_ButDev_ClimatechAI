// Debug script to directly test updating a contact in MongoDB
const { MongoClient } = require('mongodb');

async function testContactUpdate() {
  console.log('🔧 Testing direct contact update in MongoDB\n');
  
  const uri = 'mongodb://localhost:27017/climatech-ai';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');
    
    const db = client.db('climatech-ai');
    const collection = db.collection('emergency_contacts');
    
    // The contact ID we're having trouble with
    const contactId = 'db-contact-1';
    
    // First check if it exists
    console.log(`Looking for contact with id: ${contactId}`);
    const existingContact = await collection.findOne({ id: contactId });
    
    if (!existingContact) {
      console.error(`❌ No contact found with id: ${contactId}`);
      return;
    }
    
    console.log(`✓ Found contact: ${existingContact.name} (${existingContact.id})`);
    console.log('Full contact object:');
    console.log(JSON.stringify(existingContact, null, 2));
    
    // Try direct update using the exact id field
    const updateData = {
      name: "NDRRMC Database Entry (Updated)",
      number: "911-UPDATED",
      updatedAt: new Date().toISOString()
    };
    
    console.log('\nAttempting to update contact...');
    const result = await collection.updateOne(
      { id: contactId },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      console.error('❌ Update failed - no matching document found');
    } else if (result.modifiedCount === 0) {
      console.log('⚠️ Document matched but not modified');
    } else {
      console.log(`✓ Successfully updated ${result.modifiedCount} document(s)`);
      
      // Verify the update
      const updatedContact = await collection.findOne({ id: contactId });
      console.log('\nUpdated contact:');
      console.log(JSON.stringify(updatedContact, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the test
testContactUpdate().catch(console.error);
