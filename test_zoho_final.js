require('dotenv').config();

async function testZohoFinal() {
    console.log('🧪 Final Zoho API Test');
    console.log('======================');
    
    try {
        const ZohoService = require('./services/zohoService');
        const zohoService = new ZohoService();
        console.log('✅ Zoho service initialized');
        
        // Test creating a single task
        console.log('📝 Creating test task...');
        const result = await zohoService.createTask(
            'Test Task - Automation Engine', 
            'Production'
        );
        
        console.log('📊 Result:');
        console.log('   Success:', result.success);
        console.log('   Task:', result.task);
        console.log('   Department:', result.department);
        
        if (result.success) {
            console.log('   Task ID:', result.taskId);
            console.log('🎉 ZOHO API IS WORKING!');
        } else {
            console.log('   Error:', result.error);
            console.log('   Details:', result.details);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testZohoFinal();
