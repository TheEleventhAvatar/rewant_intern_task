const { GoogleMeetTranscript } = require('@google-cloud/meet');
const speech = require('@google-cloud/speech');
const { google } = require('googleapis');

class GoogleMeetRealService {
    constructor() {
        this.meet = new GoogleMeetTranscript();
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

    // Initialize Google Meet API
    async initializeGoogleMeet() {
        try {
            const auth = new google.auth.GoogleAuth({
                keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
                scopes: [
                    'https://www.googleapis.com/auth/meetings.space.created',
                    'https://www.googleapis.com/auth/meetings.space.readonly',
                    'https://www.googleapis.com/auth/calendar.readonly'
                ]
            });

            const authClient = await auth.getClient();
            google.options({ auth: authClient });
            
            console.log('✅ Google Meet API initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Google Meet API:', error);
            return false;
        }
    }

    // Start monitoring a Google Meet meeting
    async startMeetingMonitoring(meetingId, meetingName) {
        try {
            console.log(`🎥 Starting Google Meet monitoring for: ${meetingName}`);
            
            // Create transcription session
            const transcriptionSession = await this.meet.createTranscriptionSession({
                meetingId: meetingId,
                languageCode: 'en-US',
                enableAutomaticPunctuation: true,
                enableWordTimeOffsets: true
            });

            // Store meeting session
            this.activeMeetings.set(meetingId, {
                meetingName,
                session: transcriptionSession,
                startTime: new Date(),
                actionItems: [],
                transcript: []
            });

            // Set up real-time transcription listener
            transcriptionSession.on('transcript', (transcriptData) => {
                this.handleTranscript(meetingId, transcriptData);
            });

            transcriptionSession.on('error', (error) => {
                console.error(`Transcription error for meeting ${meetingId}:`, error);
            });

            // Start the session
            await transcriptionSession.start();
            
            console.log(`✅ Started monitoring Google Meet: ${meetingName}`);
            
            return {
                success: true,
                meetingId,
                meetingName,
                status: 'monitoring',
                webhookUrl: this.webhookUrl
            };

        } catch (error) {
            console.error('Failed to start meeting monitoring:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Handle real-time transcript data
    async handleTranscript(meetingId, transcriptData) {
        try {
            const meeting = this.activeMeetings.get(meetingId);
            if (!meeting) return;

            const { text, speaker, timestamp, confidence } = transcriptData;
            
            // Store transcript
            meeting.transcript.push({
                text,
                speaker,
                timestamp,
                confidence
            });

            console.log(`🎤 [${speaker}]: ${text}`);

            // Extract action items from this transcript segment
            const actionItems = this.extractActionItems(text);
            
            if (actionItems.length > 0) {
                console.log(`🎯 Found ${actionItems.length} action items from ${speaker}`);
                
                // Send each action item to webhook
                for (const actionItem of actionItems) {
                    await this.sendActionItemToWebhook(meetingId, actionItem, speaker, timestamp);
                }
            }

        } catch (error) {
            console.error('Error handling transcript:', error);
        }
    }

    // Extract action items from transcript text
    extractActionItems(text) {
        const sentences = text.split(/[.!?]+/);
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

    // Check if text contains action item indicators
    isActionItem(text) {
        const lowerText = text.toLowerCase();
        return this.actionItemKeywords.some(keyword => 
            lowerText.includes(keyword)
        );
    }

    // Clean and format action item
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
    async sendActionItemToWebhook(meetingId, actionItem, speaker, timestamp) {
        try {
            const meeting = this.activeMeetings.get(meetingId);
            
            const axios = require('axios');
            
            const response = await axios.post(this.webhookUrl, {
                meetingName: meeting.meetingName,
                actionItems: [actionItem],
                metadata: {
                    source: 'google-meet-realtime',
                    meetingId,
                    speaker,
                    timestamp,
                    confidence: 'high'
                }
            });

            // Store action item
            meeting.actionItems.push({
                actionItem,
                speaker,
                timestamp,
                taskId: response.data.zohoResults?.[0]?.taskId
            });

            console.log(`✅ Action item sent to webhook: "${actionItem}"`);
            return response.data;

        } catch (error) {
            console.error('Error sending action item to webhook:', error);
            throw error;
        }
    }

    // Stop meeting monitoring
    async stopMeetingMonitoring(meetingId) {
        try {
            const meeting = this.activeMeetings.get(meetingId);
            if (!meeting) {
                throw new Error(`Meeting ${meetingId} not found`);
            }

            // Stop transcription session
            await meeting.session.stop();
            
            // Generate meeting summary
            const summary = this.generateMeetingSummary(meetingId);
            
            // Remove from active meetings
            this.activeMeetings.delete(meetingId);
            
            console.log(`🏁 Stopped monitoring meeting: ${meeting.meetingName}`);
            
            return {
                success: true,
                summary
            };

        } catch (error) {
            console.error('Error stopping meeting monitoring:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Generate meeting summary
    generateMeetingSummary(meetingId) {
        const meeting = this.activeMeetings.get(meetingId);
        if (!meeting) return null;

        const duration = new Date() - meeting.startTime;
        
        return {
            meetingName: meeting.meetingName,
            meetingId,
            duration: Math.round(duration / 1000), // seconds
            totalTranscriptEntries: meeting.transcript.length,
            totalActionItems: meeting.actionItems.length,
            actionItems: meeting.actionItems,
            speakers: [...new Set(meeting.transcript.map(t => t.speaker))],
            startTime: meeting.startTime,
            endTime: new Date()
        };
    }

    // Get list of upcoming meetings from Google Calendar
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
                q: 'meet' // Search for meetings
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

    // Auto-start monitoring for meetings with Google Meet links
    async autoStartMeetings() {
        try {
            const { success, meetings } = await this.getUpcomingMeetings();
            
            if (!success) {
                throw new Error('Failed to fetch meetings');
            }

            const meetMeetings = meetings.filter(meeting => meeting.hangoutLink);
            
            for (const meeting of meetMeetings) {
                const meetingId = this.extractMeetingIdFromUrl(meeting.hangoutLink);
                if (meetingId) {
                    console.log(`🔄 Auto-starting monitoring for: ${meeting.summary}`);
                    await this.startMeetingMonitoring(meetingId, meeting.summary);
                }
            }

            return {
                success: true,
                autoStartedMeetings: meetMeetings.length
            };

        } catch (error) {
            console.error('Error auto-starting meetings:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Extract meeting ID from Google Meet URL
    extractMeetingIdFromUrl(hangoutLink) {
        if (!hangoutLink) return null;
        
        const match = hangoutLink.match(/meet\.google\.com\/([a-z0-9-]+)/);
        return match ? match[1] : null;
    }

    // Get status of all active meetings
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
}

module.exports = GoogleMeetRealService;
