const axios = require('axios');

// Test data with pre-categorized items (bypass AI)
const testData = {
    meetingName: 'Product Development Meeting',
    actionItems: [
        { task: 'Nutrition formulation', department: 'Production' },
        { task: 'Label design', department: 'Design' },
        { task: 'Commercial costing', department: 'Procurement' },
        { task: 'Final cost calculation', department: 'Production' }
    ]
};

async function testFullFlowNoAI() {
    console.log('🧪 Testing Full Flow (AI Bypassed)');
    console.log('===================================');
    
    try {
        // Test Zoho service directly
        console.log('1. Testing Zoho service...');
        const ZohoService = require('./services/zohoService');
        const zohoService = new ZohoService();
        console.log('✅ Zoho service initialized');
        
        // Test creating tasks
        console.log('2. Creating tasks in Zoho...');
        const results = await zohoService.createMultipleTasks(testData.actionItems);
        
        console.log('📊 Results:');
        results.forEach((result, index) => {
            const status = result.success ? '✅ Created' : '❌ Failed';
            console.log(`   ${index + 1}. "${result.task}" → ${status}`);
            if (result.success) {
                console.log(`      Task ID: ${result.taskId}`);
            } else {
                console.log(`      Error: ${result.error}`);
            }
        });
        
        const successCount = results.filter(r => r.success).length;
        console.log(`\n🎯 Summary: ${successCount}/${results.length} tasks created successfully`);
        
        if (successCount > 0) {
            console.log('🎉 ZOHO INTEGRATION IS WORKING!');
            console.log('🚀 Your automation system is functional!');
        } else {
            console.log('❌ All Zoho tasks failed - check API credentials');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.message.includes('Zoho configuration is incomplete')) {
            console.log('💡 Check your .env file for missing Zoho variables');
        }
    }
}

testFullFlowNoAI();
