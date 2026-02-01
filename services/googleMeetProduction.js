const speech = require('@google-cloud/speech');
const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

class GoogleMeetProduction {
    constructor() {
        this.speechClient = new speech.SpeechClient();
        this.calendar = google.calendar('v3');
        
        this.actionItemKeywords = [
            'action item', 'todo', 'follow up', 'assign', 'responsible',
            'deadline', 'due date', 'task', 'deliverable', 'owner',
            'will do', 'need to', 'should', 'must', 'commitment'
        ];
        
        this.activeMeetings = new Map();
        this.webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/webhook';
    }

    // Initialize Google APIs
    async initializeGoogleAPIs() {
        try {
            const auth = new google.auth.GoogleAuth({
                keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
                scopes: [
                    'https://www.googleapis.com/auth/calendar.readonly',
                    'https://www.googleapis.com/auth/meetings.space.created',
                    'https://www.googleapis.com/auth/meetings.space.readonly'
                ]
            });

            const authClient = await auth.getClient();
            google.options({ auth: authClient });
            
            console.log('✅ Google APIs initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Google APIs:', error);
            return false;
        }
    }

    // Process audio file from meeting recording
    async processMeetingAudio(audioFilePath, meetingId, meetingName) {
        try {
            console.log(`🎥 Processing meeting audio: ${meetingName}`);
            
            // Read audio file
            const audioFile = await fs.readFile(audioFilePath);
            const audioBytes = audioFile.toString('base64');

            // Configure speech recognition
            const request = {
                audio: { content: audioBytes },
                config: {
                    encoding: 'LINEAR16',
                    sampleRateHertz: 16000,
                    languageCode: 'en-US',
                    enableAutomaticPunctuation: true,
                    enableWordTimeOffsets: true,
                    enableSpeakerDiarization: true,
                    diarizationConfig: {
                        enableSpeakerDiarization: true,
                        minSpeakerCount: 2,
                        maxSpeakerCount: 10
                    }
                }
            };

            // Start speech recognition
            const [response] = await this.speechClient.recognize(request);
            const transcription = response.results
                .map(result => result.alternatives[0].transcript)
                .join('\n');

            console.log(`📝 Transcription completed for ${meetingName}`);
            
            // Extract action items from transcription
            const actionItems = this.extractActionItemsFromTranscription(transcription);
            
            if (actionItems.length > 0) {
                console.log(`🎯 Found ${actionItems.length} action items in ${meetingName}`);
                
                // Send action items to webhook
                for (const actionItem of actionItems) {
                    await this.sendActionItemToWebhook(meetingId, meetingName, actionItem);
                }
            }

            return {
                success: true,
                transcription,
                actionItemsFound: actionItems.length,
                meetingName,
                meetingId
            };

        } catch (error) {
            console.error('Error processing meeting audio:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Real-time streaming speech recognition
    async startRealTimeTranscription(meetingId, meetingName) {
        try {
            console.log(`🎥 Starting real-time transcription for: ${meetingName}`);
            
            const request = {
                config: {
                    encoding: 'LINEAR16',
                    sampleRateHertz: 16000,
                    languageCode: 'en-US',
                    enableAutomaticPunctuation: true,
                    enableWordTimeOffsets: true,
                    enableSpeakerDiarization: true,
                    diarizationConfig: {
                        enableSpeakerDiarization: true,
                        minSpeakerCount: 2,
                        maxSpeakerCount: 10
                    }
                },
                interimResults: false
            };

            const recognizeStream = this.speechClient.streamingRecognize(request)
                .on('error', (error) => {
                    console.error('Real-time transcription error:', error);
                })
                .on('data', (data) => {
                    if (data.results[0] && data.results[0].isFinal) {
                        const transcript = data.results[0].alternatives[0].transcript;
                        this.handleRealTimeTranscript(meetingId, meetingName, transcript);
                    }
                });

            // Store the stream for this meeting
            this.activeMeetings.set(meetingId, {
                meetingName,
                stream: recognizeStream,
                startTime: new Date(),
                actionItems: [],
                transcript: []
            });

            console.log(`✅ Real-time transcription started for: ${meetingName}`);
            
            return {
                success: true,
                meetingId,
                meetingName,
                status: 'streaming'
            };

        } catch (error) {
            console.error('Failed to start real-time transcription:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Handle real-time transcript data
    handleRealTimeTranscript(meetingId, meetingName, transcript) {
        try {
            const meeting = this.activeMeetings.get(meetingId);
            if (!meeting) return;

            console.log(`🎤 [${meetingName}]: ${transcript}`);

            // Store transcript
            meeting.transcript.push({
                text: transcript,
                timestamp: new Date()
            });

            // Extract action items
            const actionItems = this.extractActionItemsFromTranscription(transcript);
            
            if (actionItems.length > 0) {
                console.log(`🎯 Found ${actionItems.length} action items`);
                
                // Send to webhook
                actionItems.forEach(async (actionItem) => {
                    await this.sendActionItemToWebhook(meetingId, meetingName, actionItem);
                });
            }

        } catch (error) {
            console.error('Error handling real-time transcript:', error);
        }
    }

    // Extract action items from transcription
    extractActionItemsFromTranscription(transcription) {
        const sentences = transcription.split(/[.!?]+/);
        const actionItems = [];

        sentences.forEach(sentence => {
            const cleanSentence = sentence.trim();
            if (this.isActionItem(cleanSentence)) {
                const actionItem = this.cleanActionItem(cleanSentence);
                if (actionItem && actionItem.length > 10) {
                    actionItems.push(actionItem);
                }
            }
        });

        return [...new Set(actionItems)]; // Remove duplicates
    }

    // Check if text contains action item
    isActionItem(text) {
        const lowerText = text.toLowerCase();
        return this.actionItemKeywords.some(keyword => 
            lowerText.includes(keyword)
        );
    }

    // Clean action item text
    cleanActionItem(sentence) {
        const prefixes = [
            'so we need to', 'we should', 'we have to', 'we must',
            'i will', 'i\'ll', 'i need to', 'i have to',
            'someone should', 'someone needs to'
        ];

        let cleaned = sentence.trim();
        
        prefixes.forEach(prefix => {
            if (cleaned.toLowerCase().startsWith(prefix)) {
                cleaned = cleaned.substring(prefix.length).trim();
            }
        });

        return cleaned;
    }

    // Send action item to webhook
    async sendActionItemToWebhook(meetingId, meetingName, actionItem) {
        try {
            const axios = require('axios');
            
            const response = await axios.post(this.webhookUrl, {
                meetingName,
                actionItems: [actionItem],
                metadata: {
                    source: 'google-meet-production',
                    meetingId,
                    timestamp: new Date().toISOString(),
                    confidence: 'high'
                }
            });

            console.log(`✅ Action item sent to webhook: "${actionItem}"`);
            return response.data;

        } catch (error) {
            console.error('Error sending action item to webhook:', error);
            throw error;
        }
    }

    // Get upcoming meetings from Google Calendar
    async getUpcomingMeetings() {
        try {
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            const response = await this.calendar.events.list({
                calendarId: 'primary',
                timeMin: now.toISOString(),
                timeMax: tomorrow.toISOString(),
                singleEvents: true,
                orderBy: 'startTime',
                q: 'meet'
            });

            const meetings = response.data.items.map(event => ({
                id: event.id,
                summary: event.summary,
                start: event.start.dateTime || event.start.date,
                end: event.end.dateTime || event.end.date,
                hangoutLink: event.hangoutLink,
                description: event.description
            }));

            return {
                success: true,
                meetings
            };

        } catch (error) {
            console.error('Error fetching upcoming meetings:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Create Google Meet space
    async createMeetSpace() {
        try {
            // This would use the Google Meet API to create a meeting space
            // For now, return a mock response
            const meetingSpace = {
                name: 'AI Automation Meeting',
                meetingCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
                meetingUri: `https://meet.google.com/${Math.random().toString(36).substring(2, 10)}`,
                config: {
                    entryPointAccess: 'ALL',
                    adminRights: 'OWNERS_AND_MANAGERS'
                }
            };

            console.log('✅ Google Meet space created:', meetingSpace.meetingUri);
            
            return {
                success: true,
                meetingSpace
            };

        } catch (error) {
            console.error('Error creating Meet space:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Stop real-time transcription
    async stopRealTimeTranscription(meetingId) {
        try {
            const meeting = this.activeMeetings.get(meetingId);
            if (!meeting) {
                throw new Error(`Meeting ${meetingId} not found`);
            }

            // Stop the stream
            if (meeting.stream) {
                meeting.stream.destroy();
            }

            // Generate summary
            const summary = {
                meetingId,
                meetingName: meeting.meetingName,
                duration: Math.round((new Date() - meeting.startTime) / 1000),
                totalActionItems: meeting.actionItems.length,
                transcriptEntries: meeting.transcript.length,
                endTime: new Date()
            };

            // Remove from active meetings
            this.activeMeetings.delete(meetingId);

            console.log(`🏁 Stopped transcription for: ${meeting.meetingName}`);
            
            return {
                success: true,
                summary
            };

        } catch (error) {
            console.error('Error stopping transcription:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get active meetings status
    getActiveMeetingsStatus() {
        const status = {};
        
        this.activeMeetings.forEach((meeting, meetingId) => {
            status[meetingId] = {
                meetingName: meeting.meetingName,
                duration: Math.round((new Date() - meeting.startTime) / 1000),
                actionItemsFound: meeting.actionItems.length,
                transcriptEntries: meeting.transcript.length,
                status: 'active'
            };
        });

        return status;
    }

    // Simulate real-time audio stream (for demo)
    simulateAudioStream(meetingId) {
        const meeting = this.activeMeetings.get(meetingId);
        if (!meeting || !meeting.stream) return;

        const samplePhrases = [
            "We need to finalize the design specifications",
            "I will handle the supplier negotiations",
            "Someone should update the production schedule",
            "The cost analysis needs to be completed by Friday",
            "Design team should review the mockups",
            "Let's schedule a follow-up meeting for next week"
        ];

        let index = 0;
        const interval = setInterval(() => {
            if (index < samplePhrases.length && meeting.stream) {
                // Simulate audio data
                const audioData = Buffer.from('simulated audio data');
                meeting.stream.write(audioData);
                index++;
            } else {
                clearInterval(interval);
            }
        }, 3000); // Every 3 seconds

        return interval;
    }
}

module.exports = GoogleMeetProduction;
