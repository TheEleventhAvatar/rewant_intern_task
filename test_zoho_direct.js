require('dotenv').config();

console.log('🔍 Direct Zoho Test:');
console.log('===================');

// Manual check like the service does
const bearerToken = process.env.ZOHO_BEARER_TOKEN;
const teamId = process.env.ZOHO_TEAM_ID;
const projectId = process.env.ZOHO_PROJECT_ID;
const sprintId = process.env.ZOHO_SPRINT_ID;

console.log('Manual variable check:');
console.log('bearerToken:', bearerToken ? '✅' : '❌');
console.log('teamId:', teamId ? '✅' : '❌'); 
console.log('projectId:', projectId ? '✅' : '❌');
console.log('sprintId:', sprintId ? '✅' : '❌');

// Check the exact condition from ZohoService constructor
if (!bearerToken || !teamId || !projectId || !sprintId) {
    console.log('❌ Configuration incomplete (manual check)');
} else {
    console.log('✅ Configuration complete (manual check)');
}

// Now try to create the service with fresh require
async function testZohoAPI() {
    try {
        // Clear require cache to force fresh load
        delete require.cache[require.resolve('./services/zohoService')];
        const ZohoService = require('./services/zohoService');
        const zohoService = new ZohoService();
        console.log('✅ Zoho service created successfully');
        
        // Test actual API call
        console.log('Testing API connection...');
        const axios = require('axios');
        
        const taskData = {
            name: 'Test Task - Delete Me',
            description: 'This is a test task',
            priority: 'Medium',
            assignee: null,
            status: 'To Do'
        };
        
        const url = `https://api.zohosprints.com/zsapi/team/${teamId}/projects/${projectId}/sprints/${sprintId}/item/`;
        
        const response = await axios.post(url, taskData, {
            headers: {
                'Authorization': `Bearer ${bearerToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log('✅ Zoho API call successful!');
        console.log('Status:', response.status);
        console.log('Data:', response.data);
        
    } catch (error) {
        console.log('❌ Error:', error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        }
    }
}

testZohoAPI();
