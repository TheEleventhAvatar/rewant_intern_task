const fs = require('fs').promises;
const path = require('path');

class GoogleMeetService {
    constructor() {
        this.actionItemKeywords = [
            'action item', 'todo', 'follow up', 'assign', 'responsible',
            'deadline', 'due date', 'task', 'deliverable', 'owner',
            'will do', 'need to', 'should', 'must', 'commitment'
        ];
        
        this.meetingData = {
            currentMeeting: null,
            participants: [],
            actionItems: [],
            transcript: []
        };
    }

    // Extract action items from transcript
    extractActionItems(transcript) {
        const sentences = transcript.split(/[.!?]+/);
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

    // Check if sentence contains action item
    isActionItem(sentence) {
        const lowerSentence = sentence.toLowerCase();
        return this.actionItemKeywords.some(keyword => 
            lowerSentence.includes(keyword)
        );
    }

    // Clean and format action item
    cleanActionItem(sentence) {
        // Remove common prefixes
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

        // Remove speaker labels and timestamps
        cleaned = cleaned.replace(/^\d+:\d+\s*/, ''); // Remove timestamps
        cleaned = cleaned.replace(/^[^:]+:\s*/, ''); // Remove speaker names

        return cleaned;
    }

    // Process Google Meet transcript
    async processMeetTranscript(transcriptData) {
        try {
            const { meetingId, transcript, timestamp, speaker } = transcriptData;
            
            // Store transcript
            this.meetingData.transcript.push({
                timestamp,
                speaker,
                text: transcript
            });

            // Extract action items
            const actionItems = this.extractActionItems(transcript);
            
            if (actionItems.length > 0) {
                console.log(`🎯 Found ${actionItems.length} action items in transcript`);
                
                // Send to your webhook
                for (const actionItem of actionItems) {
                    await this.sendToWebhook({
                        meetingName: this.meetingData.currentMeeting || `Google Meet ${meetingId}`,
                        actionItems: [actionItem],
                        source: 'google-meet',
                        timestamp,
                        speaker
                    });
                }
            }

            return {
                success: true,
                actionItemsFound: actionItems.length,
                transcriptProcessed: true
            };

        } catch (error) {
            console.error('Error processing Meet transcript:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Send to your webhook
    async sendToWebhook(data) {
        try {
            const axios = require('axios');
            
            const response = await axios.post('http://localhost:3000/webhook', {
                meetingName: data.meetingName,
                actionItems: data.actionItems,
                metadata: {
                    source: data.source,
                    timestamp: data.timestamp,
                    speaker: data.speaker
                }
            });

            console.log(`✅ Action item sent to webhook: ${data.actionItems[0]}`);
            return response.data;

        } catch (error) {
            console.error('Error sending to webhook:', error);
            throw error;
        }
    }

    // Start meeting monitoring
    startMeeting(meetingId, meetingName) {
        this.meetingData.currentMeeting = meetingName;
        console.log(`🎥 Started monitoring Google Meet: ${meetingName}`);
        
        // In real implementation, this would connect to Google Meet API
        return {
            meetingId,
            status: 'monitoring',
            webhook: 'http://localhost:3000/webhook'
        };
    }

    // End meeting and generate summary
    endMeeting() {
        const summary = {
            meetingName: this.meetingData.currentMeeting,
            totalActionItems: this.meetingData.actionItems.length,
            transcriptLength: this.meetingData.transcript.length,
            duration: this.calculateMeetingDuration(),
            participants: this.meetingData.participants
        };

        // Reset for next meeting
        this.meetingData = {
            currentMeeting: null,
            participants: [],
            actionItems: [],
            transcript: []
        };

        console.log(`🏁 Meeting ended. Summary:`, summary);
        return summary;
    }

    // Calculate meeting duration
    calculateMeetingDuration() {
        if (this.meetingData.transcript.length < 2) return 0;
        
        const first = this.meetingData.transcript[0].timestamp;
        const last = this.meetingData.transcript[this.meetingData.transcript.length - 1].timestamp;
        
        return new Date(last) - new Date(first);
    }

    // Simulate real-time transcript processing (for demo)
    simulateRealTimeProcessing() {
        const sampleTranscripts = [
            "We need to finalize the packaging design by next week",
            "I will handle the supplier negotiations",
            "Someone should update the production schedule",
            "The cost analysis needs to be completed",
            "Design team should review the mockups"
        ];

        let index = 0;
        const interval = setInterval(() => {
            if (index < sampleTranscripts.length) {
                this.processMeetTranscript({
                    meetingId: 'demo-meeting',
                    transcript: sampleTranscripts[index],
                    timestamp: new Date().toISOString(),
                    speaker: `Speaker ${index + 1}`
                });
                index++;
            } else {
                clearInterval(interval);
                this.endMeeting();
            }
        }, 2000); // Process every 2 seconds

        return interval;
    }
}

module.exports = GoogleMeetService;
