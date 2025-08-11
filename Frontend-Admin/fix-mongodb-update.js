// Quick fix script for MongoDB updateContact function
const fs = require('fs');
const path = require('path');

// Path to the mongodb.ts file
const filePath = path.join(__dirname, 'lib', 'mongodb.ts');

// Read the file
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Find and replace the corrupted function
  const updatedContent = data.replace(
    /export async function updateContact[\s\S]*?}\s*}\s*if\s*\(result[\s\S]*?return null\s*}\s*}/,
    `export async function updateContact(id: string, contactData: Partial<EmergencyContact>): Promise<EmergencyContact | null> {
  let client: MongoClient | null = null;
  try {
    console.log('updateContact: Starting update for contact with ID:', id);
    console.log('updateContact: Contact data to update:', contactData);
    
    // Use a direct connection for this critical operation
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/climatech-ai';
    client = new MongoClient(uri);
    await client.connect();
    console.log('updateContact: Connected to MongoDB directly');
    
    const db = client.db(process.env.MONGODB_DATABASE || 'climatech-ai');
    const collection = db.collection('emergency_contacts');
    
    // First verify contact exists
    console.log('updateContact: Verifying contact exists with id:', id);
    const existingContact = await collection.findOne({ id: id });
    
    if (!existingContact) {
      console.error('updateContact: Contact not found with id:', id);
      return null;
    }
    
    console.log('updateContact: Found contact:', {
      _id: existingContact._id.toString(),
      id: existingContact.id,
      name: existingContact.name
    });
    
    // Prepare update data with timestamp
    const updateData = {
      ...contactData,
      updatedAt: new Date().toISOString()
    };
    
    // Using updateOne for simplicity and reliability
    console.log('updateContact: Performing update with filter:', { id });
    const updateResult = await collection.updateOne(
      { id: id },
      { $set: updateData }
    );
    
    console.log('updateContact: Update result:', {
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount
    });
    
    if (updateResult.matchedCount === 0) {
      console.error('updateContact: No document matched the filter');
      return null;
    }
    
    // Get the updated document
    const updatedContact = await collection.findOne({ id: id });
    
    if (!updatedContact) {
      console.error('updateContact: Could not retrieve updated contact');
      return null;
    }
    
    console.log('updateContact: Retrieved updated contact');
    
    // Format the result in a consistent way
    const result = {
      ...updatedContact,
      _id: updatedContact._id.toString(),
      id: updatedContact.id || updatedContact._id.toString(),
      name: updatedContact.name,
      number: updatedContact.number,
      type: updatedContact.type || 'unknown',
      status: updatedContact.status || 'active',
      description: updatedContact.description || '',
      agency: updatedContact.agency || '',
      createdAt: updatedContact.createdAt || new Date().toISOString(),
      updatedAt: updatedContact.updatedAt || new Date().toISOString()
    } as EmergencyContact;
    
    console.log('updateContact: Returning updated contact:', { 
      id: result.id, 
      name: result.name
    });
    
    return result;
  } catch (error) {
    console.error('updateContact: Error updating contact:', error);
    return null;
  } finally {
    if (client) {
      try {
        await client.close();
        console.log('updateContact: MongoDB connection closed');
      } catch (closeError) {
        console.error('updateContact: Error closing MongoDB connection:', closeError);
      }
    }
  }
}`
  );

  // Write the updated content back to the file
  fs.writeFile(filePath, updatedContent, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error('Error writing file:', writeErr);
      return;
    }
    console.log('✅ Successfully fixed the updateContact function in mongodb.ts');
  });
});
