require('dotenv').config();
const axios = require('axios');

async function debugZohoAPI() {
    console.log('🔍 Debugging Zoho API');
    console.log('====================');
    
    const bearerToken = process.env.ZOHO_BEARER_TOKEN;
    const teamId = process.env.ZOHO_TEAM_ID;
    const projectId = process.env.ZOHO_PROJECT_ID;
    const sprintId = process.env.ZOHO_SPRINT_ID;
    
    console.log('Configuration:');
    console.log('Team ID:', teamId);
    console.log('Project ID:', projectId);
    console.log('Sprint ID:', sprintId);
    
    // Test different API endpoints and formats
    const endpoints = [
        {
            name: 'Zoho Sprints v2 API',
            url: `https://api.zoho.com/sprints/v2/projects/${projectId}/sprints/${sprintId}/items`,
            method: 'POST'
        },
        {
            name: 'Zoho Sprints v1 API (items)',
            url: `https://api.zoho.com/sprints/team/${teamId}/projects/${projectId}/sprints/${sprintId}/items`,
            method: 'POST'
        },
        {
            name: 'Zoho Sprints v1 API (item)',
            url: `https://api.zoho.com/sprints/team/${teamId}/projects/${projectId}/sprints/${sprintId}/item`,
            method: 'POST'
        },
        {
            name: 'Zoho Projects API',
            url: `https://projectsapi.zoho.com/restapi/portal/${teamId}/projects/${projectId}/tasks/`,
            method: 'POST'
        }
    ];
    
    const taskData = {
        name: 'Test Task - Debug',
        description: 'This is a test task for debugging',
        priority: 'Medium',
        status: 'To Do'
    };
    
    for (const endpoint of endpoints) {
        console.log(`\n🧪 Testing: ${endpoint.name}`);
        console.log(`URL: ${endpoint.url}`);
        
        try {
            const response = await axios({
                method: endpoint.method,
                url: endpoint.url,
                headers: {
                    'Authorization': `Bearer ${bearerToken}`,
                    'Content-Type': 'application/json'
                },
                data: taskData,
                timeout: 10000,
                validateStatus: () => true // Accept any status code
            });
            
            console.log(`✅ Status: ${response.status}`);
            console.log(`Response:`, JSON.stringify(response.data, null, 2));
            
            if (response.status >= 200 && response.status < 300) {
                console.log('🎉 SUCCESS! This endpoint works!');
                break;
            }
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            if (error.response) {
                console.log(`Status: ${error.response.status}`);
                console.log(`Data:`, JSON.stringify(error.response.data, null, 2));
            }
        }
    }
}

debugZohoAPI();
