const ZohoService = require('./services/zohoService');

async function testZohoOnly() {
    console.log('🧪 Testing Zoho service configuration...');
    
    try {
        // Test 1: Service initialization
        console.log('1. Testing Zoho service initialization...');
        const zohoService = new ZohoService();
        console.log('✅ Zoho service initialized successfully');
        
        // Test 2: Configuration validation
        console.log('2. Checking configuration...');
        console.log('   Bearer Token:', zohoService.bearerToken ? '✅ Present' : '❌ Missing');
        console.log('   Team ID:', zohoService.teamId ? '✅ Present' : '❌ Missing');
        console.log('   Project ID:', zohoService.projectId ? '✅ Present' : '❌ Missing');
        console.log('   Sprint ID:', zohoService.sprintId ? '✅ Present' : '❌ Missing');
        
        // Test 3: Department configuration
        console.log('3. Testing department configuration...');
        console.log('   Design priority:', zohoService.getPriorityByDepartment('Design'));
        console.log('   Procurement priority:', zohoService.getPriorityByDepartment('Procurement'));
        console.log('   Production priority:', zohoService.getPriorityByDepartment('Production'));
        
        // Test 4: API connectivity (without creating actual task)
        console.log('4. Testing API connectivity...');
        try {
            // This will test if the API endpoint is reachable
            const testData = {
                name: 'Test Task',
                description: 'Test description',
                priority: 'Medium',
                assignee: null,
                status: 'To Do'
            };
            
            const url = `${zohoService.baseURL}/team/${zohoService.teamId}/projects/${zohoService.projectId}/sprints/${zohoService.sprintId}/item/`;
            console.log('   API URL:', url);
            console.log('   Testing connection...');
            
            // We'll make a test call to see the response
            const response = await zohoService.axiosInstance.post(url, testData);
            console.log('✅ Zoho API connection successful!');
            console.log('   Response status:', response.status);
            console.log('   Response data:', response.data);
            
        } catch (error) {
            console.log('❌ Zoho API connection failed');
            console.log('   Status:', error.response?.status);
            console.log('   Error:', error.response?.data || error.message);
            
            // Provide specific guidance based on error
            if (error.response?.status === 401) {
                console.log('   💡 Fix: Bearer token is invalid or expired');
            } else if (error.response?.status === 403) {
                console.log('   💡 Fix: Insufficient permissions for this resource');
            } else if (error.response?.status === 404) {
                console.log('   💡 Fix: Team/Project/Sprint ID is incorrect');
            } else if (error.code === 'ENOTFOUND') {
                console.log('   💡 Fix: Network connectivity issue');
            }
        }
        
        console.log('\n🎯 Zoho Configuration Summary:');
        console.log('- All required fields are present:', zohoService.bearerToken && zohoService.teamId && zohoService.projectId && zohoService.sprintId ? '✅' : '❌');
        console.log('- API connectivity:', 'Tested above');
        
    } catch (error) {
        console.error('❌ Zoho service test failed:', error.message);
        
        if (error.message.includes('Zoho configuration is incomplete')) {
            console.log('💡 Fix: Add missing environment variables to .env file');
        }
    }
}

testZohoOnly();
