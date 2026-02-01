require('dotenv').config();
const axios = require('axios');

async function testZohoAuth() {
    console.log('🔍 Testing Zoho Authentication');
    console.log('===============================');
    
    const bearerToken = process.env.ZOHO_BEARER_TOKEN;
    const teamId = process.env.ZOHO_TEAM_ID;
    const projectId = process.env.ZOHO_PROJECT_ID;
    
    // Test different auth methods
    const authMethods = [
        {
            name: 'Bearer Token',
            headers: {
                'Authorization': `Bearer ${bearerToken}`,
                'Content-Type': 'application/json'
            }
        },
        {
            name: 'Zoho-oauthtoken',
            headers: {
                'Authorization': `Zoho-oauthtoken ${bearerToken}`,
                'Content-Type': 'application/json'
            }
        },
        {
            name: 'OAuth2.0 Token',
            headers: {
                'Authorization': `OAuth2.0 ${bearerToken}`,
                'Content-Type': 'application/json'
            }
        }
    ];
    
    for (const auth of authMethods) {
        console.log(`\n🧪 Testing: ${auth.name}`);
        
        try {
            // Test with a simple GET request first
            const getUrl = `https://projectsapi.zoho.com/restapi/portal/${teamId}/projects/`;
            const response = await axios.get(getUrl, {
                headers: auth.headers,
                timeout: 10000
            });
            
            console.log(`✅ ${auth.name} - Authentication successful!`);
            console.log('Projects found:', response.data.projects?.length || 0);
            
            // If auth works, try creating a task
            console.log('🧪 Testing task creation with this auth...');
            const taskUrl = `https://projectsapi.zoho.com/restapi/portal/${teamId}/projects/${projectId}/tasks/`;
            
            const taskData = {
                name: 'Test Task - Auth Test',
                description: 'Testing authentication method'
            };
            
            const taskResponse = await axios.post(taskUrl, taskData, {
                headers: auth.headers,
                timeout: 10000
            });
            
            console.log('🎉 Task created successfully!');
            console.log('Task ID:', taskResponse.data.task?.id || taskResponse.data.id);
            break;
            
        } catch (error) {
            console.log(`❌ ${auth.name} - Failed`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Error: ${error.response.data?.error?.message || error.response.data?.message || error.message}`);
            } else {
                console.log(`   Error: ${error.message}`);
            }
        }
    }
}

testZohoAuth();
