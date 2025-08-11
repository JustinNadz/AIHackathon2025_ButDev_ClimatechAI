// Test script for weather API functionality
const { MongoClient } = require('mongodb');

const API_BASE_URL = 'http://localhost:3000/api/weather';
const MONGODB_URI = 'mongodb://localhost:27017/climatech-ai';

async function testWeatherAPI() {
  console.log('🌤️  TESTING WEATHER API FUNCTIONALITY\n');
  
  // Test 1: Check MongoDB connection
  console.log('Test 1: MongoDB Connection...');
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ MongoDB connection successful');
    
    const db = client.db('climatech-ai');
    const collections = await db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections in database`);
    
    await client.close();
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    return;
  }
  
  // Test 2: Test current weather API endpoint
  console.log('\nTest 2: Current Weather API...');
  try {
    const response = await fetch(`${API_BASE_URL}/analysis/current`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Current weather API successful');
      console.log(`📍 Location: ${data.location}`);
      console.log(`🌡️  Temperature: ${data.temperature}`);
      console.log(`📝 Description: ${data.description}`);
      console.log(`⚠️  Alert Level: ${data.alert_level}`);
      console.log(`🕐 Last Updated: ${data.timestamp}`);
    } else {
      console.log(`❌ Current weather API failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log('❌ Current weather API error:', error.message);
  }
  
  // Wait for data to be saved
  console.log('\nWaiting 2 seconds for data to be saved...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 3: Test weather history API
  console.log('\nTest 3: Weather History API...');
  try {
    const response = await fetch(`${API_BASE_URL}/history?limit=5`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Weather history API successful');
      console.log(`📊 Retrieved ${data.count} historical records`);
      
      if (data.data.length > 0) {
        console.log('📋 Latest record:');
        const latest = data.data[0];
        console.log(`   Temperature: ${latest.temperature}`);
        console.log(`   Description: ${latest.description}`);
        console.log(`   Alert Level: ${latest.alert_level}`);
      }
    } else {
      console.log(`❌ Weather history API failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log('❌ Weather history API error:', error.message);
  }
  
  // Test 4: Test weather stats API
  console.log('\nTest 4: Weather Stats API...');
  try {
    const response = await fetch(`${API_BASE_URL}/stats?hours=24`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Weather stats API successful');
      
      if (data.stats) {
        console.log(`📊 Average Temperature: ${data.stats.averageTemp}°C`);
        console.log(`🔥 Max Temperature: ${data.stats.maxTemp}°C`);
        console.log(`❄️  Min Temperature: ${data.stats.minTemp}°C`);
        console.log(`☁️  Most Common Condition: ${data.stats.mostCommonCondition}`);
        console.log(`⚠️  Alert Distribution: L1:${data.stats.alertLevelDistribution.level1} L2:${data.stats.alertLevelDistribution.level2} L3:${data.stats.alertLevelDistribution.level3}`);
      }
      
      if (data.currentAlert) {
        console.log(`🚨 Current Alert Level: ${data.currentAlert.currentLevel} - ${data.currentAlert.levelDescription}`);
      }
    } else {
      console.log(`❌ Weather stats API failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log('❌ Weather stats API error:', error.message);
  }
  
  // Test 5: Check database directly
  console.log('\nTest 5: Direct Database Check...');
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('climatech-ai');
    const collection = db.collection('weather_data');
    
    const count = await collection.countDocuments();
    console.log(`✅ Weather data collection has ${count} records`);
    
    if (count > 0) {
      const latest = await collection.findOne({}, { sort: { createdAt: -1 } });
      console.log(`📅 Latest record created: ${latest.createdAt}`);
      console.log(`🌡️  Latest temperature: ${latest.temperature}`);
    }
    
    await client.close();
  } catch (error) {
    console.log('❌ Direct database check failed:', error.message);
  }
  
  console.log('\n🎉 Weather API testing completed!');
  console.log('\n💡 Next steps:');
  console.log('1. Make sure your Google Cloud project has the Weather API enabled');
  console.log('2. Verify your API key has the necessary permissions');
  console.log('3. Start your Next.js server: npm run dev');
  console.log('4. Check the status cards component in your application');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testWeatherAPI().catch(console.error);
}

module.exports = { testWeatherAPI };
