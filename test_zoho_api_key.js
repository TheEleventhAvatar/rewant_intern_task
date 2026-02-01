require('dotenv').config();
const axios = require('axios');

async function testZohoApiKey() {
    console.log('🔍 Testing Zoho API Key Authentication');
    console.log('=====================================');
    
    // Try with API key instead of OAuth token
    const apiKey = process.env.ZOHO_BEARER_TOKEN; // Use same variable for now
    const teamId = process.env.ZOHO_TEAM_ID;
    const projectId = process.env.ZOHO_PROJECT_ID;
    
    const authMethods = [
        {
            name: 'API Key in Header',
            headers: {
                'X-Zoho-API-Key': apiKey,
                'Content-Type': 'application/json'
            }
        },
        {
            name: 'API Key as Auth Token',
            headers: {
                'Authorization': `apikey ${apiKey}`,
                'Content-Type': 'application/json'
            }
        }
    ];
    
    for (const auth of authMethods) {
        console.log(`\n🧪 Testing: ${auth.name}`);
        
        try {
            const getUrl = `https://projectsapi.zoho.com/restapi/portal/${teamId}/projects/`;
            const response = await axios.get(getUrl, {
                headers: auth.headers,
                timeout: 10000
            });
            
            console.log(`✅ ${auth.name} - Authentication successful!`);
            console.log('Response:', response.data);
            break;
            
        } catch (error) {
            console.log(`❌ ${auth.name} - Failed`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Error: ${error.response.data?.error?.message || error.message}`);
            }
        }
    }
}

testZohoApiKey();
