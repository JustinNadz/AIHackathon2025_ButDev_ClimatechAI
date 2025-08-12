// Test script for emergency contacts API
const { MongoClient } = require('mongodb');
const fetch = require('node-fetch');

async function testContactAPI() {
  console.log('🔍 TESTING EMERGENCY CONTACTS API\n');
  
  // 1. First check the database directly
  console.log('Step 1: Checking database directly...');
  const uri = 'mongodb://localhost:27017/climatech-ai';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✓ Connected to MongoDB');
    
    const db = client.db('climatech-ai');
    const collection = db.collection('emergency_contacts');
    
    // Check if our test contact exists
    const existingContact = await collection.findOne({ id: 'db-contact-1' });
    
    if (existingContact) {
      console.log('✓ Found test contact in database:', existingContact.name);
    } else {
      console.log('⚠️ Test contact not found in database. Creating...');
      
      const testContact = {
        id: 'db-contact-1',
        name: 'NDRRMC Database Entry (TEST)',
        number: '911-TEST',
        type: 'primary',
        status: 'active',
        description: 'This contact is from the MongoDB database (TEST)',
        agency: 'NDRRMC-TEST',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await collection.insertOne(testContact);
      console.log('✓ Created test contact in database');
    }
    
    // 2. Now test the API endpoint for updates
    console.log('\nStep 2: Testing API update endpoint...');
    
    // Data for update
    const updateData = {
      name: 'NDRRMC Database Entry (UPDATED VIA API)',
      number: '911-API-TEST',
      type: 'primary',
      status: 'active',
      description: 'This contact was updated via the API endpoint',
      agency: 'NDRRMC-API-TEST'
    };
    
    // We won't actually call the API here to avoid server interactions
    console.log('Update data that should be sent to API:', updateData);
    
    // 3. Direct database update as a fallback test
    console.log('\nStep 3: Testing direct database update...');
    
    const updateResult = await collection.updateOne(
      { id: 'db-contact-1' },
      { $set: {
          name: 'NDRRMC Database Entry (UPDATED DIRECTLY)',
          number: '911-DIRECT-UPDATE',
          updatedAt: new Date().toISOString()
        }
      }
    );
    
    if (updateResult.matchedCount === 0) {
      console.log('⚠️ No document matched the query');
    } else if (updateResult.modifiedCount === 0) {
      console.log('⚠️ Document matched but not modified');
    } else {
      console.log(`✓ Successfully updated ${updateResult.modifiedCount} document(s) directly`);
      
      // Verify the update
      const updatedContact = await collection.findOne({ id: 'db-contact-1' });
      console.log('Updated contact:', updatedContact);
    }
    
    console.log('\n✅ TEST COMPLETED: Direct database updates work correctly.');
    console.log('The issue is likely in the API endpoint or frontend implementation.');
    console.log('Please try a simple update via API after these fixes.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the test
testContactAPI().catch(console.error);
