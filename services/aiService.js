const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');

class AIService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is required in environment variables');
        }
        
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        // Valid departments for categorization
        this.validDepartments = ['Design', 'Procurement', 'Production'];
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') {
            throw new Error('Input must be a string');
        }
        
        // Remove potentially dangerous characters for AI prompts
        return input
            .trim()
            .replace(/[<>"'&]/g, '') // Remove HTML special chars
            .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
            .replace(/[{}\[\]\(\)]/g, ''); // Remove brackets that could affect JSON parsing
    }

    validateCategorizedItems(items, originalItems) {
        if (!Array.isArray(items)) {
            throw new Error('AI response must be an array');
        }
        
        if (items.length !== originalItems.length) {
            throw new Error(`AI response length (${items.length}) does not match input length (${originalItems.length})`);
        }
        
        const validatedItems = [];
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const originalItem = originalItems[i];
            
            // Check if item has required structure
            if (!item || typeof item !== 'object') {
                throw new Error(`Item at index ${i} is not a valid object`);
            }
            
            if (!item.task || typeof item.task !== 'string') {
                throw new Error(`Item at index ${i} missing valid 'task' field`);
            }
            
            if (!item.department || typeof item.department !== 'string') {
                throw new Error(`Item at index ${i} missing valid 'department' field`);
            }
            
            // Validate department
            if (!this.validDepartments.includes(item.department)) {
                console.warn(`Invalid department "${item.department}" for task "${item.task}", defaulting to "Production"`);
                item.department = 'Production';
            }
            
            // Validate task matches original (after sanitization)
            const sanitizedOriginal = this.sanitizeInput(originalItem);
            const sanitizedTask = this.sanitizeInput(item.task);
            
            if (sanitizedTask !== sanitizedOriginal) {
                console.warn(`Task mismatch at index ${i}: original "${sanitizedOriginal}" vs AI response "${sanitizedTask}"`);
                // Use original task to maintain data integrity
                item.task = originalItem;
            }
            
            validatedItems.push({
                task: item.task,
                department: item.department
            });
        }
        
        return validatedItems;
    }

    async categorizeActionItems(actionItems) {
        try {
            // Validate input
            if (!Array.isArray(actionItems) || actionItems.length === 0) {
                throw new Error('actionItems must be a non-empty array');
            }
            
            if (actionItems.length > 50) {
                throw new Error('Maximum 50 action items allowed per request');
            }
            
            // Sanitize input items
            const sanitizedItems = actionItems.map(item => {
                if (typeof item !== 'string') {
                    throw new Error('All action items must be strings');
                }
                return this.sanitizeInput(item);
            });
            
            const prompt = `Please categorize each of the following action items into one of these departments: ${this.validDepartments.join(', ')}. 
            Return the result as a JSON array of objects with the format: [{ "task": string, "department": string }].
            
            Action items to categorize:
            ${sanitizedItems.map(item => `- ${item}`).join('\n')}
            
            Only respond with the JSON array, no additional text or explanation.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            // Clean and parse the response
            const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
            
            let categorizedItems;
            try {
                categorizedItems = JSON.parse(cleanText);
            } catch (parseError) {
                console.error('Failed to parse AI response as JSON:', cleanText);
                throw new Error('AI response is not valid JSON');
            }
            
            // Validate the response structure
            const validatedItems = this.validateCategorizedItems(categorizedItems, sanitizedItems);
            
            return validatedItems;
            
        } catch (error) {
            console.error('Error categorizing action items:', error);
            
            // Provide more specific error messages
            if (error.message.includes('API_KEY')) {
                throw new Error('Invalid or missing Gemini API key');
            } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
                throw new Error('AI service quota exceeded or rate limit reached');
            } else if (error.message.includes('network') || error.message.includes('timeout')) {
                throw new Error('Network error connecting to AI service');
            } else {
                throw new Error(`AI categorization failed: ${error.message}`);
            }
        }
    }

    generateTaskHash(task) {
        if (!task || typeof task !== 'string') {
            throw new Error('Task must be a non-empty string');
        }
        
        // Sanitize task before hashing
        const sanitizedTask = this.sanitizeInput(task);
        return crypto.createHash('sha256').update(sanitizedTask).digest('hex');
    }
}

module.exports = AIService;
