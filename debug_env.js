require('dotenv').config();

console.log('🔍 Debugging Environment Variables:');
console.log('=====================================');

// Check all Zoho-related environment variables
const zohoVars = [
    'ZOHO_BEARER_TOKEN',
    'ZOHO_TEAM_ID', 
    'ZOHO_PROJECT_ID',
    'ZOHO_SPRINT_ID'
];

zohoVars.forEach(varName => {
    const value = process.env[varName];
    console.log(`${varName}:`);
    console.log(`  Present: ${value ? '✅' : '❌'}`);
    console.log(`  Length: ${value ? value.length : 0}`);
    console.log(`  Value: ${value ? value.substring(0, 20) + '...' : 'EMPTY'}`);
    console.log(`  Type: ${typeof value}`);
    console.log('');
});

// Check Gemini API key
console.log('GEMINI_API_KEY:');
const geminiKey = process.env.GEMINI_API_KEY;
console.log(`  Present: ${geminiKey ? '✅' : '❌'}`);
console.log(`  Length: ${geminiKey ? geminiKey.length : 0}`);
console.log(`  Value: ${geminiKey ? geminiKey.substring(0, 20) + '...' : 'EMPTY'}`);
console.log(`  Type: ${typeof geminiKey}`);

// Test Zoho service initialization
console.log('\n🧪 Testing Zoho Service:');
try {
    const ZohoService = require('./services/zohoService');
    const zohoService = new ZohoService();
    console.log('✅ Zoho service initialized successfully');
} catch (error) {
    console.log('❌ Zoho service failed:', error.message);
}

// Test AI service initialization  
console.log('\n🧪 Testing AI Service:');
try {
    const AIService = require('./services/aiService');
    const aiService = new AIService();
    console.log('✅ AI service initialized successfully');
} catch (error) {
    console.log('❌ AI service failed:', error.message);
}
