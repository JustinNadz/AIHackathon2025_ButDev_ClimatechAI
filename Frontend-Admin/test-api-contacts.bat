@echo off
echo Testing Emergency Contacts API Endpoint
echo =======================================
echo.
echo This will make a direct request to the API endpoint
echo to confirm if it's retrieving contacts from MongoDB.
echo.

curl -s http://localhost:3000/api/emergency/contacts | json_pp
echo.
echo.

echo If you see contacts with "(db-contact-...)" IDs,
echo then the API is successfully retrieving from the database.
echo.
echo If you still see "contact-1", "contact-2", etc., then it's using mock data.
echo.
pause
