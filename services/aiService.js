const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');

class AIService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is required in environment variables');
        }
        
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    async categorizeActionItems(actionItems) {
        try {
            const prompt = `Please categorize each of the following action items into one of these departments: 'Design', 'Procurement', or 'Production'. 
            Return the result as a JSON array of objects with the format: [{ task: string, department: string }].
            
            Action items to categorize:
            ${actionItems.map(item => `- ${item}`).join('\n')}
            
            Only respond with the JSON array, no additional text or explanation.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            // Clean and parse the response
            const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
            const categorizedItems = JSON.parse(cleanText);
            
            return categorizedItems;
        } catch (error) {
            console.error('Error categorizing action items:', error);
            throw new Error(`AI categorization failed: ${error.message}`);
        }
    }

    generateTaskHash(task) {
        return crypto.createHash('sha256').update(task).digest('hex');
    }
}

module.exports = AIService;
