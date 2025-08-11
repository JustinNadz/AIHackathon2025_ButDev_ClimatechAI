// Direct MongoDB test - simulating the exact operations from the Next.js app
const { MongoClient } = require('mongodb');

// Import the exact functions we're using (simulated)
async function testMongoDBOperations() {
  console.log('🧪 Testing MongoDB Contact Operations Directly...\n');

  // Test contact data (same as frontend would send)
  const testContactData = {
    name: "Direct Test Contact",
    number: "555-123-4567",
    type: "emergency",
    status: "active",
    description: "Testing direct MongoDB operations",
    agency: "Direct Test Agency"
  };

  console.log('📤 Test contact data:');
  console.log(JSON.stringify(testContactData, null, 2));
  console.log('');

  // Simulate the exact createContact function from mongodb.ts
  async function createContact(contactData) {
    let client = null;
    try {
      console.log('🔗 MongoDB createContact called with:', contactData);
      
      // Validate input data
      if (!contactData.name || !contactData.number || !contactData.type) {
        console.error('❌ Invalid contact data - missing required fields:', contactData);
        return null;
      }
      
      // Use a fresh connection with explicit write concern
      const uri = 'mongodb://localhost:27017/climatech-ai';
      client = new MongoClient(uri, {
        // Explicit write concern to ensure data is written
        writeConcern: { w: 'majority', j: true }
      });
      
      await client.connect();
      console.log('✅ Direct MongoDB connection established for contact creation');
      
      const db = client.db('climatech-ai');
      const collection = db.collection('emergency_contacts');
      
      const now = new Date().toISOString();
      const newContact = {
        ...contactData,
        id: `contact-${Date.now()}`,
        createdAt: now,
        updatedAt: now
      };
      
      console.log('📝 Inserting contact into database:', newContact);
      
      // Check count before insert
      const countBefore = await collection.countDocuments();
      console.log('📊 Contact count before insert:', countBefore);
      
      // Insert with explicit write concern
      const result = await collection.insertOne(newContact, { 
        writeConcern: { w: 'majority', j: true }
      });
      
      console.log('📥 Insert result:', result);
      console.log('✅ Insert acknowledged:', result.acknowledged);
      console.log('🆔 Inserted ID:', result.insertedId);
      
      if (!result.acknowledged || !result.insertedId) {
        console.error('❌ Insert operation failed - not acknowledged or no insertedId');
        return null;
      }
      
      // Force a wait to ensure write is committed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check count after insert
      const countAfter = await collection.countDocuments();
      console.log('📊 Contact count after insert:', countAfter);
      
      // Verify the contact was actually saved by reading it back
      const savedContact = await collection.findOne({ _id: result.insertedId });
      console.log('🔍 Verification - saved contact found:', savedContact ? 'YES' : 'NO');
      
      if (!savedContact) {
        console.error('❌ Contact was not found after insertion - write may have failed');
        return null;
      }
      
      console.log('📋 Saved contact full data:', JSON.stringify(savedContact, null, 2));
      
      // Return the contact with both _id and id fields properly mapped
      const finalContact = {
        ...savedContact,
        _id: savedContact._id.toString(),
        id: savedContact.id || savedContact._id.toString()
      };
      
      console.log('🎉 Successfully created and verified contact:', finalContact);
      
      // Test: Try to fetch all contacts to see if the new one shows up
      const allContactsCheck = await collection.find({}).toArray();
      console.log('📈 All contacts after creation (verification):', allContactsCheck.length);
      
      return finalContact;
      
    } catch (error) {
      console.error('❌ Error creating contact in MongoDB:', error);
      console.error('📋 Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      return null;
    } finally {
      // Always close the direct connection
      if (client) {
        try {
          await client.close();
          console.log('🔒 Direct MongoDB connection closed');
        } catch (closeError) {
          console.error('❌ Error closing MongoDB connection:', closeError);
        }
      }
    }
  }

  // Simulate the exact getAllContacts function from mongodb.ts
  async function getAllContacts() {
    let client = null;
    try {
      console.log('\n🔍 getAllContacts: Fetching all contacts from database...');
      
      // Use a fresh connection to ensure we read the latest data
      const uri = 'mongodb://localhost:27017/climatech-ai';
      client = new MongoClient(uri);
      
      await client.connect();
      console.log('✅ getAllContacts: Direct MongoDB connection established');
      
      const db = client.db('climatech-ai');
      const collection = db.collection('emergency_contacts');
      
      // Get count first for debugging
      const count = await collection.countDocuments();
      console.log('📊 getAllContacts: Total contacts in database:', count);
      
      if (count === 0) {
        console.log('📭 getAllContacts: No contacts found in database');
        return [];
      }
      
      const contacts = await collection.find({}).toArray();
      console.log('📥 getAllContacts: Retrieved contacts from database:', contacts.length);
      console.log('📋 getAllContacts: Raw contacts data:', JSON.stringify(contacts, null, 2));
      
      const mappedContacts = contacts.map((contact) => ({
        ...contact,
        _id: contact._id?.toString(),
        id: contact.id || contact._id?.toString()
      }));
      
      console.log('🗂️ getAllContacts: Mapped contacts for return:', mappedContacts.length);
      console.log('📝 getAllContacts: First mapped contact sample:', mappedContacts[0] || 'No contacts');
      
      return mappedContacts;
    } catch (error) {
      console.error('❌ getAllContacts: Error fetching contacts:', error);
      return [];
    } finally {
      // Always close the direct connection
      if (client) {
        try {
          await client.close();
          console.log('🔒 getAllContacts: Direct MongoDB connection closed');
        } catch (closeError) {
          console.error('❌ getAllContacts: Error closing MongoDB connection:', closeError);
        }
      }
    }
  }

  // Run the tests
  console.log('🚀 Starting MongoDB Operations Test...\n');

  // Test 1: Create a contact
  console.log('=== TEST 1: CREATE CONTACT ===');
  const createdContact = await createContact(testContactData);
  
  if (createdContact) {
    console.log('✅ TEST 1 PASSED: Contact creation successful');
  } else {
    console.log('❌ TEST 1 FAILED: Contact creation failed');
    return;
  }

  // Wait a moment for database consistency
  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 2: Fetch all contacts
  console.log('\n=== TEST 2: FETCH ALL CONTACTS ===');
  const allContacts = await getAllContacts();
  
  // Test 3: Verify our contact exists
  console.log('\n=== TEST 3: VERIFY CONTACT EXISTS ===');
  const ourContact = allContacts.find(c => c.name === testContactData.name);
  
  if (ourContact) {
    console.log('✅ TEST 3 PASSED: Our test contact was found in the database');
    console.log('📝 Found contact:', JSON.stringify(ourContact, null, 2));
  } else {
    console.log('❌ TEST 3 FAILED: Our test contact was NOT found in the database');
    console.log('📋 All contacts found:', allContacts.map(c => c.name));
  }

  // Final summary
  console.log('\n🏁 TEST SUMMARY:');
  console.log('📊 Total contacts in database:', allContacts.length);
  console.log('✅ Contact creation:', createdContact ? 'SUCCESS' : 'FAILED');
  console.log('✅ Contact retrieval:', allContacts.length > 0 ? 'SUCCESS' : 'FAILED');
  console.log('✅ Contact persistence:', ourContact ? 'SUCCESS' : 'FAILED');
  
  if (createdContact && ourContact) {
    console.log('\n🎉 ALL TESTS PASSED! Contact saving to MongoDB is working correctly.');
  } else {
    console.log('\n❌ SOME TESTS FAILED! There may be an issue with the MongoDB operations.');
  }
}

// Run the test
testMongoDBOperations().catch(console.error);
