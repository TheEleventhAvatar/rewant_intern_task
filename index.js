require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const AIService = require('./services/aiService');
const ZohoService = require('./services/zohoService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Initialize services
let aiService;
let zohoService;

try {
    aiService = new AIService();
    zohoService = new ZohoService();
    console.log('Services initialized successfully');
} catch (error) {
    console.error('Error initializing services:', error.message);
    process.exit(1);
}

// State management
const STATE_FILE = path.join(__dirname, 'state.json');

async function loadState() {
    try {
        const data = await fs.readFile(STATE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return {};
        }
        throw error;
    }
}

async function saveState(state) {
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

async function isTaskAlreadyProcessed(taskHash) {
    const state = await loadState();
    return state[taskHash] || false;
}

async function markTaskAsProcessed(taskHash, taskData) {
    const state = await loadState();
    state[taskHash] = {
        ...taskData,
        processedAt: new Date().toISOString()
    };
    await saveState(state);
}

// Webhook endpoint
app.post('/webhook', async (req, res) => {
    try {
        const { meetingName, actionItems } = req.body;

        // Validate input
        if (!meetingName || !Array.isArray(actionItems) || actionItems.length === 0) {
            return res.status(400).json({
                error: 'Invalid request body. Required: meetingName (string) and actionItems (array)'
            });
        }

        console.log(`Processing webhook for meeting: ${meetingName}`);
        console.log(`Action items: ${actionItems.join(', ')}`);

        // Check for already processed tasks (idempotency)
        const newItems = [];
        const skippedItems = [];
        
        for (const item of actionItems) {
            const taskHash = aiService.generateTaskHash(item);
            const isProcessed = await isTaskAlreadyProcessed(taskHash);
            
            if (isProcessed) {
                skippedItems.push({ task: item, reason: 'Already processed' });
            } else {
                newItems.push({ task: item, hash: taskHash });
            }
        }

        if (newItems.length === 0) {
            return res.json({
                message: 'All items have already been processed',
                skippedItems: skippedItems,
                newItems: []
            });
        }

        // Categorize new items using AI
        const tasksToCategorize = newItems.map(item => item.task);
        const categorizedItems = await aiService.categorizeActionItems(tasksToCategorize);

        // Create tasks in Zoho Sprints
        const zohoResults = await zohoService.createMultipleTasks(categorizedItems);

        // Mark successfully processed tasks
        for (let i = 0; i < newItems.length; i++) {
            const newItem = newItems[i];
            const categorizedItem = categorizedItems[i];
            const zohoResult = zohoResults[i];
            
            if (zohoResult.success) {
                await markTaskAsProcessed(newItem.hash, {
                    task: newItem.task,
                    department: categorizedItem.department,
                    meetingName: meetingName,
                    zohoTaskId: zohoResult.taskId
                });
            }
        }

        res.json({
            message: 'Webhook processed successfully',
            meetingName: meetingName,
            totalItems: actionItems.length,
            newItems: newItems.length,
            skippedItems: skippedItems,
            categorizedItems: categorizedItems,
            zohoResults: zohoResults
        });

    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`Automation engine server running on port ${PORT}`);
    console.log(`Webhook endpoint: http://localhost:${PORT}/webhook`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
