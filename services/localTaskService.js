const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class LocalTaskService {
    constructor() {
        this.tasksFile = path.join(__dirname, '..', 'local_tasks.json');
        this.departmentConfig = {
            'Design': {
                priority: 'High',
                color: '#FF6B6B',
                assignee: 'Design Team'
            },
            'Procurement': {
                priority: 'Medium',
                color: '#4ECDC4',
                assignee: 'Procurement Team'
            },
            'Production': {
                priority: 'High',
                color: '#45B7D1',
                assignee: 'Production Team'
            }
        };
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') {
            throw new Error('Input must be a string');
        }
        
        return input
            .trim()
            .replace(/[<>"'&]/g, '')
            .replace(/[\x00-\x1F\x7F]/g, '');
    }

    validateTaskData(task, department) {
        if (!task || typeof task !== 'string') {
            throw new Error('Task must be a non-empty string');
        }

        if (task.length > 500) {
            throw new Error('Task description too long (max 500 characters)');
        }

        const sanitizedTask = this.sanitizeInput(task);
        const sanitizedDepartment = this.sanitizeInput(department);

        if (!this.departmentConfig[sanitizedDepartment]) {
            throw new Error(`Invalid department: ${sanitizedDepartment}`);
        }

        return {
            task: sanitizedTask,
            department: sanitizedDepartment
        };
    }

    getPriorityByDepartment(department) {
        return this.departmentConfig[department]?.priority || 'Medium';
    }

    getAssigneeByDepartment(department) {
        return this.departmentConfig[department]?.assignee || 'Unassigned';
    }

    generateTaskId() {
        return crypto.randomBytes(16).toString('hex');
    }

    async loadTasks() {
        try {
            const data = await fs.readFile(this.tasksFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return {
                    tasks: [],
                    metadata: {
                        created: new Date().toISOString(),
                        lastUpdated: new Date().toISOString(),
                        totalTasks: 0
                    }
                };
            }
            throw new Error(`Failed to load tasks: ${error.message}`);
        }
    }

    async saveTasks(tasksData) {
        try {
            tasksData.metadata.lastUpdated = new Date().toISOString();
            tasksData.metadata.totalTasks = tasksData.tasks.length;
            
            await fs.writeFile(this.tasksFile, JSON.stringify(tasksData, null, 2));
            console.log(`✅ Tasks saved to ${this.tasksFile}`);
        } catch (error) {
            throw new Error(`Failed to save tasks: ${error.message}`);
        }
    }

    async createTask(task, department) {
        try {
            const { task: sanitizedTask, department: sanitizedDepartment } = this.validateTaskData(task, department);
            
            const tasksData = await this.loadTasks();
            
            const newTask = {
                id: this.generateTaskId(),
                name: sanitizedTask,
                description: `Automated task from meeting action items. Department: ${sanitizedDepartment}`,
                department: sanitizedDepartment,
                priority: this.getPriorityByDepartment(sanitizedDepartment),
                assignee: this.getAssigneeByDepartment(sanitizedDepartment),
                status: 'To Do',
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                source: 'AI Automation Engine'
            };

            tasksData.tasks.push(newTask);
            await this.saveTasks(tasksData);

            console.log(`✅ Task created locally: ${sanitizedTask} (${sanitizedDepartment})`);
            
            return {
                success: true,
                taskId: newTask.id,
                task: sanitizedTask,
                department: sanitizedDepartment,
                status: newTask.status,
                created: newTask.created
            };

        } catch (error) {
            console.error('Error creating task:', error);
            return {
                success: false,
                task: task,
                department: department,
                error: error.message
            };
        }
    }

    async createMultipleTasks(taskList) {
        const results = [];
        
        for (const item of taskList) {
            const result = await this.createTask(item.task, item.department);
            results.push(result);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return results;
    }

    async getTasks(filter = {}) {
        try {
            const tasksData = await this.loadTasks();
            let tasks = tasksData.tasks;

            if (filter.department) {
                tasks = tasks.filter(task => task.department === filter.department);
            }
            
            if (filter.status) {
                tasks = tasks.filter(task => task.status === filter.status);
            }

            return {
                success: true,
                tasks: tasks,
                total: tasks.length,
                metadata: tasksData.metadata
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getTaskStatistics() {
        try {
            const tasksData = await this.loadTasks();
            const tasks = tasksData.tasks;

            const stats = {
                total: tasks.length,
                byDepartment: {},
                byStatus: {},
                byPriority: {},
                recentlyCreated: tasks.filter(task => {
                    const createdDate = new Date(task.created);
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    return createdDate > weekAgo;
                }).length
            };

            tasks.forEach(task => {
                stats.byDepartment[task.department] = (stats.byDepartment[task.department] || 0) + 1;
                stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;
                stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
            });

            return {
                success: true,
                statistics: stats,
                metadata: tasksData.metadata
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    updateDepartmentConfig(newConfig) {
        this.departmentConfig = { ...this.departmentConfig, ...newConfig };
        console.log('✅ Department configuration updated');
    }
}

module.exports = LocalTaskService;
