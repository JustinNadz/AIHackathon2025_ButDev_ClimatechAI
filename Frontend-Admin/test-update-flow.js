// Test script to verify the entire contact update flow
const { updateContact } = require('./lib/mongodb');

async function testContactUpdateFlow() {
  console.log('🔍 TESTING EMERGENCY CONTACT UPDATE FLOW\n');
  
  // Test updating a contact with ID db-contact-1
  const contactId = 'db-contact-1';
  const updateData = {
    name: "NDRRMC Database Entry (TEST UPDATE)",
    number: "911-FLOW-TEST",
    description: "Updated via test flow",
    agency: "NDRRMC-FLOW-TEST"
  };
  
  console.log(`Updating contact with ID: ${contactId}`);
  console.log(`Update data:`, updateData);
  
  try {
    const updatedContact = await updateContact(contactId, updateData);
    
    if (!updatedContact) {
      console.error('❌ Update failed - returned null');
    } else {
      console.log('\n✅ Contact updated successfully!');
      console.log('Updated contact:', updatedContact);
    }
  } catch (error) {
    console.error('❌ Error during update:', error);
  }
}

// Run the test
testContactUpdateFlow().catch(console.error);
