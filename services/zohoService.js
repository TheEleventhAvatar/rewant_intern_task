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
    }

    async createTask(task, department) {
        try {
            const taskData = {
                name: task,
                description: `Automated task from meeting action items. Department: ${department}`,
                priority: this.getPriorityByDepartment(department),
                assignee: null, // Can be configured based on department
                status: 'To Do'
            };

            const url = `${this.baseURL}/team/${this.teamId}/projects/${this.projectId}/sprints/${this.sprintId}/item/`;
            
            const response = await axios.post(url, taskData, {
                headers: {
                    'Authorization': `Bearer ${this.bearerToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`Task created successfully in Zoho Sprints: ${task}`);
            return {
                success: true,
                taskId: response.data.id || response.data.itemId,
                task: task,
                department: department
            };
        } catch (error) {
            console.error(`Error creating task in Zoho Sprints: ${task}`, error.response?.data || error.message);
            throw new Error(`Zoho task creation failed: ${error.message}`);
        }
    }

    async createMultipleTasks(categorizedItems) {
        const results = [];
        
        for (const item of categorizedItems) {
            try {
                const result = await this.createTask(item.task, item.department);
                results.push(result);
            } catch (error) {
                results.push({
                    success: false,
                    task: item.task,
                    department: item.department,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    getPriorityByDepartment(department) {
        const priorityMap = {
            'Design': 'High',
            'Procurement': 'Medium',
            'Production': 'High'
        };
        return priorityMap[department] || 'Medium';
    }
}

module.exports = ZohoService;
