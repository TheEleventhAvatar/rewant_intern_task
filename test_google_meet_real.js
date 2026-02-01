require('dotenv').config();

async function testGoogleMeetRealSetup() {
    console.log('🧪 Testing Google Meet Real Service Setup');
    console.log('==========================================');
    
    try {
        // Test 1: Check if credentials are configured
        console.log('1. Checking Google Cloud credentials...');
        const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        
        if (!credentialsPath) {
            console.log('❌ GOOGLE_APPLICATION_CREDENTIALS not set');
            console.log('💡 Set environment variable: export GOOGLE_APPLICATION_CREDENTIALS="./google-credentials.json"');
            return;
        }
        
        console.log(`✅ Credentials path: ${credentialsPath}`);
        
        // Test 2: Try to load credentials file
        try {
            const fs = require('fs');
            const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
            console.log('✅ Credentials file loaded successfully');
            console.log(`   Project ID: ${credentials.project_id}`);
            console.log(`   Client Email: ${credentials.client_email}`);
        } catch (error) {
            console.log('❌ Failed to load credentials file:', error.message);
            return;
        }
        
        // Test 3: Initialize the service
        console.log('\n2. Initializing Google Meet Real Service...');
        const GoogleMeetRealService = require('./services/googleMeetRealService');
        const meetService = new GoogleMeetRealService();
        
        console.log('✅ Service initialized successfully');
        
        // Test 4: Check API initialization
        console.log('\n3. Testing Google Meet API initialization...');
        const initialized = await meetService.initializeGoogleMeet();
        
        if (initialized) {
            console.log('✅ Google Meet API initialized successfully');
        } else {
            console.log('❌ Failed to initialize Google Meet API');
            console.log('💡 Make sure you have enabled the Google Meet API in your Google Cloud project');
            return;
        }
        
        // Test 5: Test meeting ID extraction
        console.log('\n4. Testing meeting ID extraction...');
        const testUrls = [
            'https://meet.google.com/abc-def-ghi-jkl',
            'https://meet.google.com/xyz-123-456-789',
            'https://example.com/meeting'
        ];
        
        testUrls.forEach(url => {
            const meetingId = meetService.extractMeetingIdFromUrl(url);
            if (meetingId) {
                console.log(`✅ Extracted ID: ${meetingId} from ${url}`);
            } else {
                console.log(`❌ No meeting ID found in ${url}`);
            }
        });
        
        // Test 6: Test action item extraction
        console.log('\n5. Testing action item extraction...');
        const testTranscripts = [
            'We need to finalize the packaging design by next week',
            'I will handle the supplier negotiations',
            'Someone should update the production schedule',
            'This is just a regular conversation without action items'
        ];
        
        testTranscripts.forEach(transcript => {
            const actionItems = meetService.extractActionItems(transcript);
            if (actionItems.length > 0) {
                console.log(`✅ Found action item: "${actionItems[0]}"`);
            } else {
                console.log(`❌ No action items found in: "${transcript}"`);
            }
        });
        
        console.log('\n🎉 Google Meet Real Service setup test completed successfully!');
        console.log('\n📋 Next Steps:');
        console.log('1. Start the server: node index.js');
        console.log('2. Test with: curl -X POST http://localhost:3000/meet/real/start -H "Content-Type: application/json" -d \'{"meetingId":"abc-def-ghi","meetingName":"Test Meeting"}\'');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n💡 Troubleshooting:');
        console.log('1. Ensure you have google-credentials.json file');
        console.log('2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable');
        console.log('3. Enable Google Meet API in Google Cloud Console');
        console.log('4. Install required packages: npm install @google-cloud/meet @google-cloud/speech googleapis');
    }
}

testGoogleMeetRealSetup();
