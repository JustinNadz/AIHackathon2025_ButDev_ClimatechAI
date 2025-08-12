// Simple test script to validate Google Maps API key
const API_KEY = 'AIzaSyBY_hhXD0QFsEwUhB2UzCG3PfhisWEa-Ls';

console.log('🔍 Testing Google Maps API Key:', API_KEY);
console.log('📝 Key format check:');
console.log('  - Length:', API_KEY.length, 'characters');
console.log('  - Starts with AIza:', API_KEY.startsWith('AIza'));
console.log('  - First 8 chars:', API_KEY.substring(0, 8));

// Test 1: Key format validation
if (API_KEY.startsWith('AIza') && API_KEY.length >= 30) {
  console.log('✅ API key format appears valid');
} else {
  console.log('❌ API key format appears invalid');
}

// Test 2: Try to make a simple request to Google Maps API (if in browser)
if (typeof window !== 'undefined') {
  // Browser environment - can test with actual requests
  console.log('🌐 Running in browser - attempting API test...');
  
  // Test with a simple Geocoding API request
  const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Iloilo+City,Philippines&key=${API_KEY}`;
  
  fetch(testUrl)
    .then(response => response.json())
    .then(data => {
      console.log('📍 Geocoding API test result:', data);
      if (data.status === 'OK') {
        console.log('✅ API key is working correctly!');
      } else if (data.status === 'REQUEST_DENIED') {
        if (data.error_message && data.error_message.includes('billing')) {
          console.log('💳 API key is valid but billing is not enabled');
        } else {
          console.log('❌ API key request denied:', data.error_message);
        }
      } else {
        console.log('⚠️ API request failed with status:', data.status);
        console.log('📄 Error details:', data.error_message);
      }
    })
    .catch(error => {
      console.error('🚫 API test failed:', error);
    });
} else {
  // Node.js environment
  console.log('🖥️ Running in Node.js - browser-specific tests skipped');
  console.log('💡 To fully test the API key, run this in a browser environment');
}

// Output test summary
console.log('\n📋 API Key Test Summary:');
console.log('🔑 Key:', API_KEY.substring(0, 8) + '...');
console.log('📏 Length:', API_KEY.length);
console.log('🎯 Format Valid:', API_KEY.startsWith('AIza') && API_KEY.length >= 30);
console.log('\n💡 Next steps:');
console.log('  1. Start your Next.js application: npm run dev');
console.log('  2. Check the browser console for Google Maps errors');
console.log('  3. Look for BillingNotEnabledMapError specifically');
