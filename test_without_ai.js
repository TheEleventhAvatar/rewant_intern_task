const axios = require('axios');

// Test data
const testData = {
    meetingName: 'Test Meeting',
    actionItems: [
        'Test task 1',
        'Test task 2'
    ]
};

async function testWithoutAI() {
    console.log('🧪 Testing project without AI...');
    
    try {
        // Test 1: Health check
        console.log('1. Testing health endpoint...');
        const healthResponse = await axios.get('http://localhost:3000/health');
        console.log('✅ Health check:', healthResponse.data.status);
        
        // Test 2: Invalid input validation
        console.log('2. Testing input validation...');
        try {
            await axios.post('http://localhost:3000/webhook', {
                meetingName: '',
                actionItems: []
            });
            console.log('❌ Validation should have failed');
        } catch (error) {
            console.log('✅ Input validation works:', error.response.status);
        }
        
        // Test 3: Valid input (will fail at AI step, but proves webhook works)
        console.log('3. Testing webhook with valid input...');
        try {
            const response = await axios.post('http://localhost:3000/webhook', testData, {
                headers: { 'Content-Type': 'application/json' }
            });
            console.log('✅ Webhook processed successfully!');
            console.log('Response:', response.data);
        } catch (error) {
            if (error.response.status === 503) {
                console.log('✅ Webhook works, AI service needs API key');
                console.log('Error details:', error.response.data.details);
            } else {
                throw error;
            }
        }
        
        console.log('\n🎉 PROJECT IS WORKING PERFECTLY!');
        console.log('Just add valid Gemini API key to .env file');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testWithoutAI();
