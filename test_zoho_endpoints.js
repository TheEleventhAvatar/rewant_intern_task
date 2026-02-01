const axios = require('axios');

// Common Zoho API endpoints to test
const endpoints = [
    'https://api.zohosprints.com/zsapi',
    'https://sprints.zoho.com/api',
    'https://api.zoho.com/sprints',
    'https://www.zohoapis.com/sprints'
];

async function testEndpoints() {
    console.log('🔍 Testing Zoho API Endpoints:');
    console.log('================================');
    
    for (const endpoint of endpoints) {
        try {
            console.log(`\nTesting: ${endpoint}`);
            
            // Just try to reach the endpoint (HEAD request)
            const response = await axios.head(endpoint, {
                timeout: 5000,
                validateStatus: () => true // Accept any status code
            });
            
            console.log(`✅ Status: ${response.status}`);
            console.log(`   Server: ${response.headers.server || 'Unknown'}`);
            
        } catch (error) {
            if (error.code === 'ENOTFOUND') {
                console.log(`❌ DNS Resolution Failed`);
            } else if (error.code === 'ECONNREFUSED') {
                console.log(`❌ Connection Refused`);
            } else if (error.code === 'ETIMEDOUT') {
                console.log(`❌ Timeout`);
            } else {
                console.log(`❌ Error: ${error.message}`);
            }
        }
    }
    
    console.log('\n📋 Zoho Sprints API Documentation:');
    console.log('Check the official docs for the correct endpoint:');
    console.log('https://www.zoho.com/sprints/api/v2/');
}

testEndpoints();
