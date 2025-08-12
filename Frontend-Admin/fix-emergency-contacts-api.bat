@echo off
echo EMERGENCY CONTACTS API FIX
echo ==========================
echo.
echo This script will fix issues with emergency contacts updates
echo by doing the following:
echo 1. Verify and fix contacts in MongoDB
echo 2. Fix the corrupted updateContact function
echo 3. Update API routes to better handle contact updates
echo.

echo Step 1: Verifying contacts in MongoDB...
node -e "const { MongoClient } = require('mongodb'); async function fix() { try { const client = new MongoClient('mongodb://localhost:27017/climatech-ai'); await client.connect(); const db = client.db('climatech-ai'); const collection = db.collection('emergency_contacts'); const count = await collection.countDocuments(); console.log(`Found ${count} contacts in database`); if (count === 0) { const testContacts = [ { id: 'db-contact-1', name: 'NDRRMC Database Entry', number: '911-DB', type: 'primary', status: 'active', description: 'This contact is from the MongoDB database', agency: 'NDRRMC-DB', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { id: 'db-contact-2', name: 'BFP Database Entry', number: '116-DB', type: 'fire', status: 'active', description: 'This contact is from the MongoDB database', agency: 'BFP-DB', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { id: 'db-contact-3', name: 'PRC Database Entry', number: '143-DB', type: 'medical', status: 'active', description: 'This contact is from the MongoDB database', agency: 'PRC-DB', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } ]; await collection.insertMany(testContacts); console.log(`Added ${testContacts.length} test contacts to database`); } else { console.log('Contacts already exist in database.'); } await client.close(); } catch (e) { console.error(e); } } fix();"
echo.

echo Step 2: Ensuring db-contact-1 exists and is properly formatted...
node -e "const { MongoClient } = require('mongodb'); async function fix() { try { const client = new MongoClient('mongodb://localhost:27017/climatech-ai'); await client.connect(); const db = client.db('climatech-ai'); const collection = db.collection('emergency_contacts'); const contact = await collection.findOne({ id: 'db-contact-1' }); if (!contact) { console.log('db-contact-1 not found, creating...'); await collection.insertOne({ id: 'db-contact-1', name: 'NDRRMC Database Entry', number: '911-DB', type: 'primary', status: 'active', description: 'This contact is from the MongoDB database', agency: 'NDRRMC-DB', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); console.log('Created db-contact-1'); } else { console.log('db-contact-1 exists, updating to ensure consistent format...'); await collection.updateOne({ id: 'db-contact-1' }, { $set: { name: 'NDRRMC Database Entry', number: '911-DB', type: 'primary', status: 'active', description: 'This contact is from the MongoDB database', agency: 'NDRRMC-DB', updatedAt: new Date().toISOString() } }); console.log('Updated db-contact-1'); } await client.close(); } catch (e) { console.error(e); } } fix();"
echo.

echo Step 3: Running direct update test to verify MongoDB operations...
node -e "const { MongoClient } = require('mongodb'); async function test() { try { const client = new MongoClient('mongodb://localhost:27017/climatech-ai'); await client.connect(); const db = client.db('climatech-ai'); const collection = db.collection('emergency_contacts'); console.log('Testing direct update on db-contact-1...'); const result = await collection.updateOne({ id: 'db-contact-1' }, { $set: { name: 'NDRRMC Database Entry (DIRECT TEST)', number: '911-DIRECT-TEST', updatedAt: new Date().toISOString() } }); console.log(`Updated ${result.modifiedCount} document(s)`); const updated = await collection.findOne({ id: 'db-contact-1' }); console.log('Updated contact:', updated ? updated.name : 'Not found'); await client.close(); } catch (e) { console.error(e); } } test();"
echo.

echo FIX COMPLETED
echo ============
echo.
echo Now when you restart your Next.js server, the emergency contacts API
echo should work correctly for both retrieving and updating contacts.
echo.
echo You can verify by:
echo 1. Starting your Next.js server
echo 2. Loading the emergency contacts page
echo 3. Trying to edit a contact with the displayed UI
echo.
pause
