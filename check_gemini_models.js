require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function checkAvailableModels() {
    console.log('🔍 Checking Available Gemini Models');
    console.log('===================================');
    
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        console.log('✅ Gemini API client initialized');
        
        // Try to list models
        console.log('📋 Available models:');
        
        // Common model names to test
        const modelsToTest = [
            'gemini-1.5-flash',
            'gemini-1.5-flash-latest',
            'gemini-1.5-flash-8b',
            'gemini-1.5-pro',
            'gemini-1.5-pro-latest',
            'gemini-pro',
            'gemini-pro-vision',
            'text-bison-001',
            'chat-bison-001'
        ];
        
        for (const modelName of modelsToTest) {
            try {
                console.log(`Testing: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                
                // Try a simple generation to see if it works
                const result = await model.generateContent('Hello');
                const response = await result.response;
                console.log(`✅ ${modelName} - WORKS`);
                break; // Stop at the first working model
                
            } catch (error) {
                if (error.message.includes('404') || error.message.includes('not found')) {
                    console.log(`❌ ${modelName} - Not found`);
                } else if (error.message.includes('permission') || error.message.includes('403')) {
                    console.log(`❌ ${modelName} - No permission`);
                } else {
                    console.log(`❌ ${modelName} - ${error.message.substring(0, 50)}...`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkAvailableModels();
