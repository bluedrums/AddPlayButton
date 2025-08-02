#!/usr/bin/env node

// Test script to verify public endpoints work without authentication
// Usage: node scripts/test-public-endpoints.mjs [base-url]

const baseUrl = process.argv[2] || 'https://addplaybutton.xyz';

console.log(`\n🧪 Testing public endpoints on: ${baseUrl}\n`);

async function testEndpoint(path, description) {
  try {
    console.log(`Testing ${path}...`);
    const response = await fetch(`${baseUrl}${path}`);
    
    if (response.ok) {
      console.log(`✅ ${description}: ${response.status} OK`);
      return true;
    } else {
      console.log(`❌ ${description}: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 100)}...`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description}: Network error - ${error.message}`);
    return false;
  }
}

async function runTests() {
  let allPassed = true;

  // Test public API endpoints
  console.log('\n📡 Testing API Endpoints:\n');
  
  // This should return 400 (missing params) but not 401
  const metadataTest = await testEndpoint('/api/metadata', 'Metadata API (should be 400, not 401)');
  if (metadataTest === false) allPassed = false;
  
  const oembedTest = await testEndpoint('/api/oembed', 'oEmbed API (should be 400, not 401)');
  if (oembedTest === false) allPassed = false;
  
  const playbuttonTest = await testEndpoint('/api/playbutton', 'PlayButton API (should be 400, not 401)');
  if (playbuttonTest === false) allPassed = false;

  // Test share page (needs a valid ID, so might 404 but shouldn't 401)
  console.log('\n📄 Testing Share Pages:\n');
  
  const shareTest = await testEndpoint('/share/test-id', 'Share page (might 404, but not 401)');
  if (shareTest === false) allPassed = false;

  // Test auth endpoints
  console.log('\n🔐 Testing Auth Endpoints:\n');
  
  const csrfTest = await testEndpoint('/api/auth/csrf', 'CSRF endpoint');
  if (csrfTest === false) allPassed = false;
  
  const statusTest = await testEndpoint('/api/auth/status', 'Auth status endpoint');
  if (statusTest === false) allPassed = false;

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ All public endpoints are accessible!');
  } else {
    console.log('❌ Some endpoints returned unexpected status codes.');
    console.log('   Check if they return 401 (authentication required) - they should not!');
  }
  console.log('='.repeat(50) + '\n');
}

runTests().catch(console.error);