require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
const fsSync = require('fs');
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
const LOCK_FILE = path.join(__dirname, 'state.lock');
const STATE_TTL_DAYS = parseInt(process.env.STATE_TTL_DAYS) || 30;
const MAX_STATE_SIZE_MB = parseInt(process.env.MAX_STATE_SIZE_MB) || 10;

// File locking utility
async function acquireLock() {
    const maxWaitTime = 10000; // 10 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
        try {
            await fs.writeFile(LOCK_FILE, process.pid.toString(), { flag: 'wx' });
            return true;
        } catch (error) {
            if (error.code === 'EEXIST') {
                // Check if lock is stale (older than 30 seconds)
                try {
                    const stats = await fs.stat(LOCK_FILE);
                    if (Date.now() - stats.mtime.getTime() > 30000) {
                        await fs.unlink(LOCK_FILE);
                        continue;
                    }
                } catch (statError) {
                    // If we can't stat, try to remove the lock
                    try {
                        await fs.unlink(LOCK_FILE);
                        continue;
                    } catch (unlinkError) {
                        // Lock file exists and can't be removed
                    }
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            } else {
                throw error;
            }
        }
    }
    throw new Error('Could not acquire lock within timeout period');
}

async function releaseLock() {
    try {
        await fs.unlink(LOCK_FILE);
    } catch (error) {
        // Lock file might not exist, which is fine
    }
}

async function withLock(operation) {
    await acquireLock();
    try {
        return await operation();
    } finally {
        await releaseLock();
    }
}

// State cleanup function
function cleanupOldState(state) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - STATE_TTL_DAYS);
    const cutoffTimestamp = cutoffDate.toISOString();
    
    const cleanedState = {};
    let removedCount = 0;
    
    for (const [hash, data] of Object.entries(state)) {
        if (data.processedAt && data.processedAt > cutoffTimestamp) {
            cleanedState[hash] = data;
        } else {
            removedCount++;
        }
    }
    
    if (removedCount > 0) {
        console.log(`Cleaned up ${removedCount} old state entries`);
    }
    
    return cleanedState;
}

async function loadState() {
    return withLock(async () => {
        try {
            const data = await fs.readFile(STATE_FILE, 'utf8');
            const state = JSON.parse(data);
            
            // Clean up old entries
            const cleanedState = cleanupOldState(state);
            
            // Check state file size
            const stats = await fs.stat(STATE_FILE);
            const sizeInMB = stats.size / (1024 * 1024);
            if (sizeInMB > MAX_STATE_SIZE_MB) {
                console.warn(`State file size (${sizeInMB.toFixed(2)}MB) exceeds recommended limit (${MAX_STATE_SIZE_MB}MB)`);
            }
            
            return cleanedState;
        } catch (error) {
            if (error.code === 'ENOENT') {
                return {};
            } else if (error instanceof SyntaxError) {
                console.error('State file contains invalid JSON, starting with empty state');
                return {};
            } else if (error.code === 'EACCES' || error.code === 'EPERM') {
                throw new Error(`Permission denied accessing state file: ${error.message}`);
            } else {
                throw error;
            }
        }
    });
}

async function saveState(state) {
    return withLock(async () => {
        try {
            const cleanedState = cleanupOldState(state);
            const jsonString = JSON.stringify(cleanedState, null, 2);
            await fs.writeFile(STATE_FILE, jsonString, 'utf8');
        } catch (error) {
            if (error.code === 'EACCES' || error.code === 'EPERM') {
                throw new Error(`Permission denied writing to state file: ${error.message}`);
            } else if (error.code === 'ENOSPC') {
                throw new Error('No space left on device for state file');
            } else {
                throw error;
            }
        }
    });
}

// Input validation utilities
function sanitizeString(input, maxLength = 1000) {
    if (typeof input !== 'string') {
        throw new Error('Input must be a string');
    }
    
    // Remove potentially dangerous characters
    const sanitized = input
        .trim()
        .replace(/[<>"'&]/g, '') // Remove HTML special chars
        .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
    
    if (sanitized.length === 0) {
        throw new Error('Input cannot be empty after sanitization');
    }
    
    if (sanitized.length > maxLength) {
        throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
    }
    
    return sanitized;
}

function validateActionItem(item) {
    if (typeof item !== 'string') {
        throw new Error('Action item must be a string');
    }
    
    const sanitized = sanitizeString(item, 500);
    
    // Additional validation for action items
    if (sanitized.length < 3) {
        throw new Error('Action item must be at least 3 characters long');
    }
    
    return sanitized;
}

function validateWebhookRequest(req) {
    const { meetingName, actionItems } = req.body;
    
    // Validate meeting name
    if (!meetingName) {
        throw new Error('meetingName is required');
    }
    
    const sanitizedMeetingName = sanitizeString(meetingName, 200);
    
    // Validate action items
    if (!Array.isArray(actionItems)) {
        throw new Error('actionItems must be an array');
    }
    
    if (actionItems.length === 0) {
        throw new Error('actionItems array cannot be empty');
    }
    
    if (actionItems.length > 50) {
        throw new Error('Maximum 50 action items allowed per request');
    }
    
    // Validate and sanitize each action item
    const sanitizedActionItems = [];
    for (let i = 0; i < actionItems.length; i++) {
        try {
            const sanitizedItem = validateActionItem(actionItems[i]);
            sanitizedActionItems.push(sanitizedItem);
        } catch (error) {
            throw new Error(`Action item at index ${i}: ${error.message}`);
        }
    }
    
    // Check for duplicates
    const uniqueItems = [...new Set(sanitizedActionItems)];
    if (uniqueItems.length !== sanitizedActionItems.length) {
        throw new Error('Duplicate action items are not allowed');
    }
    
    return {
        meetingName: sanitizedMeetingName,
        actionItems: sanitizedActionItems
    };
}

// Standardized error response
function createErrorResponse(res, statusCode, message, details = null) {
    const errorResponse = {
        error: true,
        message: message,
        timestamp: new Date().toISOString()
    };
    
    if (details) {
        errorResponse.details = details;
    }
    
    return res.status(statusCode).json(errorResponse);
}

// Standardized success response
function createSuccessResponse(res, data, statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        timestamp: new Date().toISOString(),
        ...data
    });
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
        // Validate and sanitize input
        let validatedData;
        try {
            validatedData = validateWebhookRequest(req);
        } catch (validationError) {
            return createErrorResponse(res, 400, 'Invalid request data', validationError.message);
        }

        const { meetingName, actionItems } = validatedData;

        console.log(`Processing webhook for meeting: ${meetingName}`);
        console.log(`Action items: ${actionItems.join(', ')}`);

        // Check for already processed tasks (idempotency)
        const processingResults = [];
        
        for (const item of actionItems) {
            const taskHash = aiService.generateTaskHash(item);
            const isProcessed = await isTaskAlreadyProcessed(taskHash);
            
            processingResults.push({
                task: item,
                hash: taskHash,
                isProcessed: isProcessed
            });
        }

        const newItems = processingResults.filter(r => !r.isProcessed);
        const skippedItems = processingResults.filter(r => r.isProcessed).map(r => ({
            task: r.task,
            reason: 'Already processed'
        }));

        if (newItems.length === 0) {
            return createSuccessResponse(res, {
                message: 'All items have already been processed',
                meetingName: meetingName,
                totalItems: actionItems.length,
                newItems: [],
                skippedItems: skippedItems
            });
        }

        // Categorize new items using AI
        const tasksToCategorize = newItems.map(item => item.task);
        let categorizedItems;
        try {
            categorizedItems = await aiService.categorizeActionItems(tasksToCategorize);
        } catch (aiError) {
            return createErrorResponse(res, 503, 'AI service unavailable', aiError.message);
        }

        // Validate AI response format
        if (!Array.isArray(categorizedItems) || categorizedItems.length !== newItems.length) {
            return createErrorResponse(res, 503, 'Invalid AI response format', 'AI service returned unexpected data structure');
        }

        // Create tasks in Zoho Sprints
        let zohoResults;
        try {
            zohoResults = await zohoService.createMultipleTasks(categorizedItems);
        } catch (zohoError) {
            return createErrorResponse(res, 503, 'Zoho service unavailable', zohoError.message);
        }

        // Validate Zoho response format
        if (!Array.isArray(zohoResults) || zohoResults.length !== categorizedItems.length) {
            return createErrorResponse(res, 503, 'Invalid Zoho response format', 'Zoho service returned unexpected data structure');
        }

        // Mark successfully processed tasks
        for (let i = 0; i < newItems.length; i++) {
            const newItem = newItems[i];
            const categorizedItem = categorizedItems[i];
            const zohoResult = zohoResults[i];
            
            // Ensure data integrity
            if (newItem.task !== categorizedItem.task || categorizedItem.task !== zohoResult.task) {
                console.error('Data integrity error: task mismatch during processing', {
                    newItem: newItem.task,
                    categorizedItem: categorizedItem.task,
                    zohoResult: zohoResult.task
                });
                continue; // Skip this item to maintain data integrity
            }
            
            if (zohoResult.success) {
                try {
                    await markTaskAsProcessed(newItem.hash, {
                        task: newItem.task,
                        department: categorizedItem.department,
                        meetingName: meetingName,
                        zohoTaskId: zohoResult.taskId
                    });
                } catch (stateError) {
                    console.error('Failed to mark task as processed:', stateError);
                    // Continue processing other items even if state update fails
                }
            }
        }

        return createSuccessResponse(res, {
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
        return createErrorResponse(res, 500, 'Internal server error', error.message);
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    createSuccessResponse(res, {
        status: 'OK',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Automation engine server running on port ${PORT}`);
    console.log(`Webhook endpoint: http://localhost:${PORT}/webhook`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
