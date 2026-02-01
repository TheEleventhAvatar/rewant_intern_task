# Meeting Action Item Automation Engine

An automated system that processes meeting action items, categorizes them using AI, and creates tasks in Zoho Sprints.

## Features

- **Webhook Processing**: Receives meeting action items via HTTP webhook
- **AI-Powered Categorization**: Uses Google Gemini AI to categorize items into departments
- **Zoho Sprints Integration**: Automatically creates tasks in Zoho Sprints
- **Idempotency**: Prevents duplicate processing of the same tasks
- **Robust Error Handling**: Comprehensive error handling and validation
- **State Management**: Persistent state with automatic cleanup
- **Security**: Input sanitization and validation

## Prerequisites

- Node.js 14+ 
- Google Gemini AI API key
- Zoho Sprints API credentials

## Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd rewant_intern_task
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual API credentials:

```env
# Google Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Zoho Sprints API Configuration
ZOHO_BEARER_TOKEN=your_zoho_bearer_token_here
ZOHO_TEAM_ID=your_zoho_team_id_here
ZOHO_PROJECT_ID=your_zoho_project_id_here
ZOHO_SPRINT_ID=your_zoho_sprint_id_here

# Server Configuration
PORT=3000

# State Management Configuration
STATE_TTL_DAYS=30
MAX_STATE_SIZE_MB=10
```

### 4. Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### POST /webhook

Processes meeting action items and creates tasks in Zoho Sprints.

**Request Body:**
```json
{
  "meetingName": "Product Development Meeting",
  "actionItems": [
    "Nutrition formulation",
    "Label design", 
    "Commercial costing",
    "Final cost calculation"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "message": "Webhook processed successfully",
  "meetingName": "Product Development Meeting",
  "totalItems": 4,
  "newItems": 4,
  "skippedItems": [],
  "categorizedItems": [
    {
      "task": "Nutrition formulation",
      "department": "Production"
    },
    {
      "task": "Label design", 
      "department": "Design"
    }
  ],
  "zohoResults": [
    {
      "success": true,
      "taskId": "12345",
      "task": "Nutrition formulation",
      "department": "Production"
    }
  ]
}
```

### GET /health

Health check endpoint that returns server status and metrics.

**Response:**
```json
{
  "success": true,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "status": "OK",
  "uptime": 3600.5,
  "memory": {
    "rss": 50331648,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1048576
  },
  "version": "v18.17.0"
}
```

## Testing

### Mock Test

Run the included mock test to verify the system:

```bash
node mock_test.js
```

This will:
1. Check if the server is running
2. Send a test webhook request
3. Display the processing results

### Manual Testing

You can also test manually using curl:

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "meetingName": "Test Meeting",
    "actionItems": ["Test task 1", "Test task 2"]
  }'
```

## Security Features

- **Input Sanitization**: All inputs are sanitized to prevent injection attacks
- **Rate Limiting**: Built-in delays between API calls to prevent rate limiting
- **File Locking**: Prevents race conditions in state management
- **Error Handling**: Comprehensive error handling prevents information leakage
- **Environment Variables**: Sensitive data stored in environment variables only

## Error Handling

The system provides detailed error responses:

```json
{
  "error": true,
  "message": "Invalid request data",
  "details": "Action item at index 0: Action item must be at least 3 characters long",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

Common error scenarios:
- **400 Bad Request**: Invalid input data
- **503 Service Unavailable**: AI or Zoho service issues
- **500 Internal Server Error**: System errors

## Department Configuration

The system categorizes items into three departments:

- **Design**: High priority tasks related to design work
- **Procurement**: Medium priority tasks related to purchasing
- **Production**: High priority tasks related to production

You can modify department configurations by updating the `departmentConfig` in `services/zohoService.js`.

## State Management

The system maintains a persistent state to track processed tasks:

- **File**: `state.json` 
- **Locking**: Uses `state.lock` to prevent race conditions
- **Cleanup**: Automatically removes entries older than 30 days (configurable)
- **Size Monitoring**: Warns if state file exceeds size limits

## Monitoring

### Health Metrics

The `/health` endpoint provides:
- Server uptime
- Memory usage
- Node.js version
- Response timestamp

### Logging

The system logs:
- Successful task creations
- Processing errors
- State cleanup operations
- Performance warnings

## Troubleshooting

### Common Issues

1. **"AI service unavailable"**
   - Check GEMINI_API_KEY is valid
   - Verify network connectivity
   - Check API quota limits

2. **"Zoho service unavailable"**
   - Verify ZOHO_BEARER_TOKEN is valid
   - Check team/project/sprint IDs
   - Verify API permissions

3. **"Permission denied" errors**
   - Check file system permissions for state files
   - Ensure the application can write to the directory

4. **State file corruption**
   - Delete `state.json` and `state.lock`
   - Restart the application

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=* node index.js
```

## Development

### Project Structure

```
├── index.js                 # Main application file
├── services/
│   ├── aiService.js         # AI categorization service
│   └── zohoService.js       # Zoho Sprints integration
├── mock_test.js            # Test script
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

### Adding New Departments

1. Update `validDepartments` in `services/aiService.js`
2. Add department configuration in `services/zohoService.js`
3. Update the AI prompt if needed

### Custom Error Handling

The system uses standardized error responses. Add new error types by modifying the `createErrorResponse` function in `index.js`.

## License

[Add your license information here]
