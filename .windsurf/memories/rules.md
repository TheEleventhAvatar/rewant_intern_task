ROUND ONE TASK: Designing an Automated Action-Item Deployment System 
Workflow Automation & Systems Thinking Assignment 
In modern organizations, virtual meetings are a key part of daily operations. 
During these meetings: 
• Decisions are made 
• Tasks are discussed 
• Action items are identified 
Many teams today use AI-powered meeting transcription tools that automatically generate: 
• Meeting transcripts 
• Summaries 
• Actionable items 
However, execution does not automatically follow discussion. 
This assignment focuses on designing a generic, scalable automation system that ensures action items move directly from 
meetings into execution workflows, without relying on manual coordination. 
Problem Statement 
After a meeting ends: 
• Action items already exist 
• But they still need to be: 
o Categorized 
o Routed 
o Tracked 
In most setups, this step depends on human alignment: 
• Someone decides which department owns the task 
• Someone manually creates or assigns the task 
• Someone follows up if things slip 
As organizations scale, this approach becomes: 
• Slow 
• Error-prone 
• Dependent on individuals 
• Difficult to standardize 
The challenge 
Design a system where: 
Meeting action items are automatically converted into structured tasks and deployed to the appropriate Zoho Sprints Kanban 
Board — without any human intervention. 
Objective of This Assignment 
Your objective is to design an intelligent automation workflow that: 
1. 
2. 
3. 
4. 
Receives action items generated after a virtual meeting 
Structures those action items for execution 
Automatically routes them to the correct Zoho Sprints Kanban Board 
Ensures tasks are ready for ownership and execution immediately 
This is a thinking and design exercise, not a coding test. 
Assumptions (For Scope Control) 
To keep the problem focused, assume: 
• Meetings are conducted on Google Meet 
• An AI tool (e.g., Fireflies or equivalent) already generates: 
o Actionable items 
o Summaries 
• A Kanban-based project management system is used: 
o Zoho Sprints Kanban Boards 
Departments in Scope 
For this task, assume only three departments: 
1. 
2. 
3. 
Design 
Procurement 
Production 
Your system should clearly show how action items are routed to the Zoho Sprints Kanban Board of one of these departments. 
Automation Tools 
You may design your workflow using: 
• Zapier 
• Make.com 
• n8n 
• Any other automation/orchestration tool 
Tool choice is not the evaluation criteria. 
System intelligence, clarity, and robustness are. 
What Your Solution Should Demonstrate 
1. End-to-End Workflow 
Explain clearly: 
• What happens immediately after the meeting ends 
• How action items are picked up by automation 
• How they are processed and structured 
• How they finally appear in the appropriate Zoho Sprints Kanban Board (Backlog stage) 
2. Task Structuring 
Explain how your system ensures each task is execution-ready, including: 
• Clear task title 
• Contextual description 
• Reference to the meeting or transcript 
• Any metadata needed for tracking 
The goal is to avoid raw or ambiguous task entries. 
3. Department Routing Logic 
Explain how your system decides whether an action item belongs to: 
• Design 
• Procurement 
• Production 
This could be based on: 
• Keywords 
• Context analysis 
• Rule-based logic 
• AI classification 
• Hybrid approaches 
Your explanation should focus on logic, not buzzwords. 
4. Zero Human Intervention (Critical Requirement) 
A key requirement of this task: 
• No person manually assigns tasks to departments 
• No coordinator aligns responsibilities 
Instead: 
• Tasks are automatically deployed to the relevant Zoho Sprints Kanban Board 
• The Zoho Sprints Kanban Board owner decides how work is distributed within the team 
This separation is intentional and must be clearly explained. 
5. Handling Edge Cases (High Importance) 
Candidates who address more real-world scenarios will be evaluated more favorably. 
Explain how your system handles: 
• Action items with no clear department 
• Missing deadlines 
• Tasks involving multiple departments 
• Meetings with no actionable items 
• Discussion points that should not become tasks 
6. Smartness, Scalability & Reliability 
Beyond “making it work,” explain: 
• How your system behaves as meeting volume increases 
• What might break first 
• How reliability can be improved 
• How automation logic can be made more resilient over time 
Why This Assignment Exists 
This task is designed to evaluate: 
• How you think about workflows 
• How you remove dependency on individuals 
• How you design systems that scale 
• How intelligently you anticipate real-world ambiguity 
Candidates who: 
• Think deeply 
• Cover edge cases 
• Design robust, adaptable workflows 
will naturally stand out. 
What to Expect in the Interview 
During the interview, you will: 
• Present your proposed solution 
• Walk through your automation logic 
• Explain trade-offs and decisions 
• Discuss how your system improves execution without human alignment 
There is no single correct solution. 
What matters most is: 
How smart, resilient, and human-independent your automation design is. 