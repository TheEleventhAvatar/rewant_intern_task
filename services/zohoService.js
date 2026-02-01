const axios = require('axios');

class ZohoService {
    constructor() {
        this.bearerToken = process.env.ZOHO_BEARER_TOKEN;
        this.teamId = process.env.ZOHO_TEAM_ID;
        this.projectId = process.env.ZOHO_PROJECT_ID;
        this.sprintId = process.env.ZOHO_SPRINT_ID;
        
        if (!this.bearerToken || !this.teamId || !this.projectId || !this.sprintId) {
            throw new Error('Zoho configuration is incomplete. Please check environment variables.');
        }
        
        this.baseURL = 'https://api.zohosprints.com/zsapi';
        
        // Configure axios defaults
        this.axiosInstance = axios.create({
            timeout: 30000, // 30 seconds timeout
            headers: {
                'Authorization': `Bearer ${this.bearerToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Department priority configuration
        this.departmentConfig = {
            'Design': {
                priority: 'High',
                assignee: null // Can be configured based on department
            },
            'Procurement': {
                priority: 'Medium',
                assignee: null
            },
            'Production': {
                priority: 'High',
                assignee: null
            }
        };
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') {
            throw new Error('Input must be a string');
        }
        
        return input
            .trim()
            .replace(/[<>"'&]/g, '') // Remove HTML special chars
            .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
    }

    validateTaskData(task, department) {
        if (!task || typeof task !== 'string') {
            throw new Error('Task must be a non-empty string');
        }
        
        if (!department || typeof department !== 'string') {
            throw new Error('Department must be a non-empty string');
        }
        
        const sanitizedTask = this.sanitizeInput(task);
        const sanitizedDepartment = this.sanitizeInput(department);
        
        if (sanitizedTask.length < 3) {
            throw new Error('Task must be at least 3 characters long');
        }
        
        if (sanitizedTask.length > 200) {
            throw new Error('Task must not exceed 200 characters');
        }
        
        return {
            task: sanitizedTask,
            department: sanitizedDepartment
        };
    }

    getPriorityByDepartment(department) {
        const config = this.departmentConfig[department];
        return config ? config.priority : 'Medium';
    }

    getAssigneeByDepartment(department) {
        const config = this.departmentConfig[department];
        return config ? config.assignee : null;
    }

    async createTask(task, department) {
        try {
            // Validate input
            const { task: sanitizedTask, department: sanitizedDepartment } = this.validateTaskData(task, department);
            
            const taskData = {
                name: sanitizedTask,
                description: `Automated task from meeting action items. Department: ${sanitizedDepartment}`,
                priority: this.getPriorityByDepartment(sanitizedDepartment),
                assignee: this.getAssigneeByDepartment(sanitizedDepartment),
                status: 'To Do'
            };

            const url = `${this.baseURL}/team/${this.teamId}/projects/${this.projectId}/sprints/${this.sprintId}/item/`;
            
            const response = await this.axiosInstance.post(url, taskData);

            console.log(`Task created successfully in Zoho Sprints: ${sanitizedTask}`);
            
            // Extract task ID from response (handle different response formats)
            const taskId = response.data.id || response.data.itemId || response.data.taskId;
            
            if (!taskId) {
                console.warn('No task ID found in Zoho response:', response.data);
            }
            
            return {
                success: true,
                taskId: taskId,
                task: sanitizedTask,
                department: sanitizedDepartment,
                response: response.data
            };
            
        } catch (error) {
            console.error(`Error creating task in Zoho Sprints: ${task}`, error.response?.data || error.message);
            
            // Preserve detailed error information
            const errorDetails = {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                code: error.code
            };
            
            // Provide specific error messages based on status code
            let errorMessage = 'Zoho task creation failed';
            
            if (error.response) {
                switch (error.response.status) {
                    case 401:
                        errorMessage = 'Zoho authentication failed - invalid or expired token';
                        break;
                    case 403:
                        errorMessage = 'Zoho authorization failed - insufficient permissions';
                        break;
                    case 404:
                        errorMessage = 'Zoho resource not found - check team/project/sprint IDs';
                        break;
                    case 429:
                        errorMessage = 'Zoho rate limit exceeded - please try again later';
                        break;
                    case 500:
                        errorMessage = 'Zoho internal server error';
                        break;
                    case 502:
                    case 503:
                    case 504:
                        errorMessage = 'Zoho service temporarily unavailable';
                        break;
                    default:
                        errorMessage = `Zoho API error (${error.response.status}): ${error.response.statusText}`;
                }
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Zoho request timeout - service may be slow or unavailable';
            } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                errorMessage = 'Network error connecting to Zoho service';
            }
            
            return {
                success: false,
                task: task,
                department: department,
                error: errorMessage,
                details: errorDetails
            };
        }
    }

    async createMultipleTasks(categorizedItems) {
        if (!Array.isArray(categorizedItems)) {
            throw new Error('categorizedItems must be an array');
        }
        
        if (categorizedItems.length === 0) {
            return [];
        }
        
        const results = [];
        
        // Process tasks sequentially to avoid overwhelming the API
        for (const item of categorizedItems) {
            try {
                const result = await this.createTask(item.task, item.department);
                results.push(result);
            } catch (error) {
                console.error(`Unexpected error creating task "${item.task}":`, error);
                results.push({
                    success: false,
                    task: item.task,
                    department: item.department,
                    error: 'Unexpected error during task creation',
                    details: { message: error.message }
                });
            }
            
            // Add a small delay between requests to avoid rate limiting
            if (results.length < categorizedItems.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        return results;
    }

    // Method to update department configuration
    updateDepartmentConfig(department, config) {
        if (this.departmentConfig[department]) {
            this.departmentConfig[department] = { ...this.departmentConfig[department], ...config };
        }
    }
}

module.exports = ZohoService;
