const crypto = require('crypto');

class AIService {
    constructor() {
        // Valid departments for categorization
        this.validDepartments = ['Design', 'Procurement', 'Production'];
        
        // Rule-based categorization keywords
        this.departmentKeywords = {
            'Design': [
                'design', 'label', 'packaging', 'brand', 'visual', 'creative',
                'artwork', 'graphics', 'layout', 'ui', 'ux', 'appearance'
            ],
            'Procurement': [
                'costing', 'cost', 'procurement', 'purchase', 'buying', 'sourcing',
                'supplier', 'vendor', 'price', 'budget', 'commercial', 'negotiation'
            ],
            'Production': [
                'production', 'manufacturing', 'formulation', 'processing',
                'quality', 'testing', 'assembly', 'operations', 'factory'
            ]
        };
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') {
            throw new Error('Input must be a string');
        }
        
        return input
            .trim()
            .replace(/[<>"'&]/g, '')
            .replace(/[\x00-\x1F\x7F]/g, '')
            .replace(/[{}\[\]\(\)]/g, '');
    }

    categorizeByRules(task) {
        const sanitizedTask = this.sanitizeInput(task).toLowerCase();
        
        // Count keyword matches for each department
        const scores = {};
        
        for (const [department, keywords] of Object.entries(this.departmentKeywords)) {
            scores[department] = 0;
            for (const keyword of keywords) {
                if (sanitizedTask.includes(keyword.toLowerCase())) {
                    scores[department] += 1;
                }
            }
        }
        
        // Find department with highest score
        let bestDepartment = 'Production'; // Default
        let highestScore = 0;
        
        for (const [department, score] of Object.entries(scores)) {
            if (score > highestScore) {
                highestScore = score;
                bestDepartment = department;
            }
        }
        
        // If no keywords matched, use heuristics
        if (highestScore === 0) {
            if (sanitizedTask.includes('design') || sanitizedTask.includes('label')) {
                bestDepartment = 'Design';
            } else if (sanitizedTask.includes('cost') || sanitizedTask.includes('commercial')) {
                bestDepartment = 'Procurement';
            } else {
                bestDepartment = 'Production';
            }
        }
        
        return bestDepartment;
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
            
            // Sanitize and categorize items
            const categorizedItems = [];
            
            for (const item of actionItems) {
                if (typeof item !== 'string') {
                    throw new Error('All action items must be strings');
                }
                
                const sanitizedItem = this.sanitizeInput(item);
                const department = this.categorizeByRules(sanitizedItem);
                
                categorizedItems.push({
                    task: sanitizedItem,
                    department: department
                });
            }
            
            console.log(`✅ Categorized ${categorizedItems.length} items using rule-based system`);
            
            return categorizedItems;
            
        } catch (error) {
            console.error('Error categorizing action items:', error);
            throw new Error(`Categorization failed: ${error.message}`);
        }
    }

    generateTaskHash(task) {
        if (!task || typeof task !== 'string') {
            throw new Error('Task must be a non-empty string');
        }
        
        const sanitizedTask = this.sanitizeInput(task);
        return crypto.createHash('sha256').update(sanitizedTask).digest('hex');
    }
}

module.exports = AIService;
