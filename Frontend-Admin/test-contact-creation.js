// Test script to verify contact creation works end-to-end
const { MongoClient } = require('mongodb');

// Simulate the same POST request that the frontend makes
async function testContactCreation() {
  console.log('🧪 Testing Contact Creation End-to-End...\n');

  // First, clear any existing test contacts
  const uri = 'mongodb://localhost:27017/climatech-ai';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('climatech-ai');
    const collection = db.collection('emergency_contacts');
    
    // Clear test contacts
    await collection.deleteMany({ name: { $regex: /^Test/ } });
    console.log('✅ Cleared existing test contacts\n');
    
    // Check initial count
    const initialCount = await collection.countDocuments();
    console.log(`📊 Initial contact count: ${initialCount}\n`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return;
  } finally {
    await client.close();
  }

  // Now simulate the exact frontend request
  console.log('🚀 Simulating Frontend Contact Creation...\n');
  
  // This is the exact data that would be sent from the frontend form
  const testContactData = {
    name: "Test Frontend Contact",
    number: "987-654-3210",
    type: "emergency",
    status: "active",
    description: "Test contact created to verify functionality",
    agency: "Test Emergency Agency"
  };

  console.log('📤 Contact data to be sent:');
  console.log(JSON.stringify(testContactData, null, 2));
  console.log('');

  // Test the API endpoint directly
  try {
    const response = await fetch('http://localhost:3000/api/emergency/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testContactData)
    });

    console.log(`📥 API Response Status: ${response.status}`);
    console.log(`📥 API Response OK: ${response.ok}`);

    if (response.ok) {
      const responseData = await response.json();
      console.log('📥 API Response Data:');
      console.log(JSON.stringify(responseData, null, 2));
      console.log('');

      // Verify the contact was saved by fetching all contacts
      console.log('🔍 Verifying contact was saved...\n');
      
      const getResponse = await fetch('http://localhost:3000/api/emergency/contacts');
      if (getResponse.ok) {
        const getData = await getResponse.json();
        console.log(`📊 Total contacts after creation: ${getData.contacts?.length || 0}`);
        
        // Find our test contact
        const testContact = getData.contacts?.find(c => c.name === testContactData.name);
        if (testContact) {
          console.log('✅ TEST PASSED: Contact successfully saved to MongoDB!');
          console.log('📝 Saved contact details:');
          console.log(JSON.stringify(testContact, null, 2));
        } else {
          console.log('❌ TEST FAILED: Contact was not found in database');
          console.log('📋 All contacts found:');
          console.log(JSON.stringify(getData.contacts, null, 2));
        }
      } else {
        console.log('❌ Failed to fetch contacts for verification');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API Request Failed:');
      console.log(errorText);
    }

  } catch (error) {
    console.log('❌ Network Error:');
    console.log(error.message);
    console.log('\n💡 Make sure Next.js development server is running on port 3000');
    console.log('Run: npm run dev');
  }
}

// Run the test
testContactCreation();
