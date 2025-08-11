@echo off
echo Quick Emergency Contacts DB Verification
echo ======================================
echo.
echo This script checks what's in the database directly
echo to help with debugging without restarting the server.
echo.

node -e "const { MongoClient } = require('mongodb'); async function check() { try { const client = new MongoClient('mongodb://localhost:27017/climatech-ai'); await client.connect(); const db = client.db('climatech-ai'); const contacts = await db.collection('emergency_contacts').find({}).toArray(); console.log('Found', contacts.length, 'contacts:'); contacts.forEach(c => console.log(`- ${c.name} (ID: ${c.id || c._id})`)); await client.close(); } catch (e) { console.error(e); } } check();"
echo.
pause
