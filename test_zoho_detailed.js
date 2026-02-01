require('dotenv').config();
const axios = require('axios');

async function testZohoDetailed() {
    console.log('🔍 Detailed Zoho API Test');
    console.log('========================');
    
    const bearerToken = process.env.ZOHO_BEARER_TOKEN;
    const teamId = process.env.ZOHO_TEAM_ID;
    const projectId = process.env.ZOHO_PROJECT_ID;
    
    console.log('Team ID:', teamId);
    console.log('Project ID:', projectId);
    
    // Test with minimal required fields
    const taskDataMinimal = {
        name: 'Test Task - Minimal',
        description: 'Test description'
    };
    
    // Test with all fields
    const taskDataFull = {
        name: 'Test Task - Full',
        description: 'Test description with all fields',
        priority: 'Medium',
        percent_complete: 0,
        owners: [],
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    const url = `https://projectsapi.zoho.com/restapi/portal/${teamId}/projects/${projectId}/tasks/`;
    
    console.log('\n🧪 Testing minimal task data...');
    try {
        const response = await axios.post(url, taskDataMinimal, {
            headers: {
                'Authorization': `Bearer ${bearerToken}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Success with minimal data!');
        console.log('Response:', response.data);
    } catch (error) {
        console.log('❌ Failed with minimal data');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data);
    }
    
    console.log('\n🧪 Testing full task data...');
    try {
        const response = await axios.post(url, taskDataFull, {
            headers: {
                'Authorization': `Bearer ${bearerToken}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Success with full data!');
        console.log('Response:', response.data);
    } catch (error) {
        console.log('❌ Failed with full data');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data);
    }
    
    // Also try to list existing tasks to verify API access
    console.log('\n🧪 Testing task listing...');
    try {
        const listUrl = `https://projectsapi.zoho.com/restapi/portal/${teamId}/projects/${projectId}/tasks/`;
        const response = await axios.get(listUrl, {
            headers: {
                'Authorization': `Bearer ${bearerToken}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Task listing works!');
        console.log('Found tasks:', response.data.tasks?.length || 0);
    } catch (error) {
        console.log('❌ Task listing failed');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data);
    }
}

testZohoDetailed();
