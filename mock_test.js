const axios = require('axios');

// Configuration
const WEBHOOK_URL = 'http://localhost:3000/webhook';

// Test data from the PDF - the 4 action items mentioned
const testData = {
    meetingName: 'Product Development Meeting',
    actionItems: [
        'Nutrition formulation',
        'Label design',
        'Commercial costing',
        'Final cost calculation'
    ]
};

async function runMockTest() {
    console.log('🚀 Starting mock test for automation engine...');
    console.log('📋 Test Data:');
    console.log(`   Meeting: ${testData.meetingName}`);
    console.log(`   Action Items: ${testData.actionItems.join(', ')}`);
    console.log('');

    try {
        console.log('📡 Sending request to webhook endpoint...');
        
        const response = await axios.post(WEBHOOK_URL, testData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 second timeout
        });

        console.log('✅ Webhook response received successfully!');
        console.log('📊 Response Summary:');
        console.log(`   Status: ${response.status}`);
        console.log(`   Total Items: ${response.data.totalItems}`);
        console.log(`   New Items: ${response.data.newItems}`);
        console.log(`   Skipped Items: ${response.data.skippedItems.length}`);
        
        if (response.data.categorizedItems && response.data.categorizedItems.length > 0) {
            console.log('');
            console.log('🏷️  Categorized Items:');
            response.data.categorizedItems.forEach((item, index) => {
                console.log(`   ${index + 1}. "${item.task}" → ${item.department}`);
            });
        }

        if (response.data.zohoResults && response.data.zohoResults.length > 0) {
            console.log('');
            console.log('📝 Zoho Results:');
            response.data.zohoResults.forEach((result, index) => {
                const status = result.success ? '✅ Created' : '❌ Failed';
                console.log(`   ${index + 1}. "${result.task}" → ${status}`);
                if (!result.success) {
                    console.log(`      Error: ${result.error}`);
                } else if (result.taskId) {
                    console.log(`      Task ID: ${result.taskId}`);
                }
            });
        }

        console.log('');
        console.log('🎉 Mock test completed successfully!');

    } catch (error) {
        console.error('❌ Mock test failed:');
        
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Error: ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
            if (error.response.data) {
                console.error('   Full Response:', JSON.stringify(error.response.data, null, 2));
            }
        } else if (error.request) {
            console.error('   No response received. Is the server running?');
            console.error(`   URL: ${WEBHOOK_URL}`);
        } else {
            console.error(`   Error: ${error.message}`);
        }
        
        process.exit(1);
    }
}

// Check if server is running before starting the test
async function checkServerHealth() {
    try {
        const healthResponse = await axios.get('http://localhost:3000/health', { timeout: 5000 });
        console.log('✅ Server is healthy');
        return true;
    } catch (error) {
        console.error('❌ Server is not running or not healthy');
        console.error('   Please start the server first: node index.js');
        return false;
    }
}

// Main execution
async function main() {
    console.log('🔧 Checking server health...');
    const serverHealthy = await checkServerHealth();
    
    if (!serverHealthy) {
        process.exit(1);
    }
    
    await runMockTest();
}

// Run the test
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { runMockTest, testData };
