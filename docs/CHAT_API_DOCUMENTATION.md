# Chat API Documentation

## Overview

The ByHandle Chat API is a production-ready chat endpoint with OpenAI integration, designed for customer service inquiries, appointment booking assistance, and business information queries.

## Endpoint

**POST** `/api/chat`

## Features

### 1. OpenAI Integration
- Uses GPT-4o-mini for cost-effective responses
- Streaming support ready for future implementation
- Configured with business-specific system prompts

### 2. Security Measures

#### Rate Limiting
- **Limit**: 20 requests per minute per user
- **Window**: 60 seconds (rolling)
- **Storage**: In-memory (use Redis for production scaling)
- **Response**: HTTP 429 with `Retry-After` header when exceeded

#### Input Validation & Sanitization
- Message length limits (max 4000 characters per message)
- Conversation history limits (max 50 messages)
- Content trimming and validation
- Type checking for all inputs

#### Abuse Prevention
Detects and blocks suspicious patterns:
- "ignore previous instructions"
- "forget everything"
- "you are now"
- "new system prompt"

### 3. Business Context

The chatbot is configured with:
- **Business Name**: ByHandle Salon & Spa
- **Services**: Hair Styling, Spa Treatment, Manicure & Pedicure, Facial Treatment
- **Hours**: Monday-Saturday: 9 AM - 7 PM, Sunday: 10 AM - 5 PM
- **Location**: Sample location (customize in code)
- **Policies**: Cancellation, lateness, and payment policies

### 4. CORS Support
Configured allowed origins:
- `https://handle.gadget.app`
- `https://handle--development.gadget.app`
- `http://localhost:3000`
- `http://localhost:5173`

## Request Format

```json
{
  "messages": [
    {
      "role": "user",
      "content": "What services do you offer?"
    }
  ],
  "userId": "unique-user-id",
  "chatbotId": "chatbot-identifier"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| messages | Array | Yes | Array of message objects with role and content |
| userId | String | Yes | Unique identifier for the user (used for rate limiting) |
| chatbotId | String | Yes | Identifier for the chatbot instance |

### Message Object

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| role | String | "user", "assistant" | The role of the message sender |
| content | String | Any text | The message content (max 4000 chars) |

## Response Format

### Success Response (200 OK)

```json
{
  "message": {
    "role": "assistant",
    "content": "Hello! At ByHandle Salon & Spa, we offer..."
  },
  "userId": "unique-user-id",
  "chatbotId": "chatbot-identifier"
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "error": "Missing required fields: messages, userId, or chatbotId"
}
```

Possible error messages:
- "Missing required fields: messages, userId, or chatbotId"
- "Invalid userId or chatbotId format"
- "Messages must be an array"
- "Messages array cannot be empty"
- "Too many messages in conversation (max 50)"
- "Invalid message role"
- "Message content must be a string"
- "Message content cannot be empty"
- "Message too long (max 4000 characters)"
- "Message contains suspicious content"
- "Last message must be from user"

#### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45
}
```

Headers include:
- `Retry-After`: Seconds until rate limit resets

#### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

#### 503 Service Unavailable
```json
{
  "error": "Chat service not configured"
}
```

## Usage Examples

### Basic Query
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What are your hours?"}
    ],
    "userId": "user-123",
    "chatbotId": "bot-456"
  }'
```

### Conversation with History
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What services do you offer?"},
      {"role": "assistant", "content": "We offer Hair Styling, Spa Treatment..."},
      {"role": "user", "content": "How much is a spa treatment?"}
    ],
    "userId": "user-123",
    "chatbotId": "bot-456"
  }'
```

## Configuration

### Environment Variables

Required:
```env
OPENAI_API_KEY=your-openai-api-key-here
```

### Customizing Business Context

Edit the `BUSINESS_CONTEXT` object in [/app/api/chat/route.ts](app/api/chat/route.ts:137-153):

```typescript
const BUSINESS_CONTEXT = {
  name: 'Your Business Name',
  description: 'Your business description',
  services: [
    { name: 'Service Name', price: '$XX-XX', duration: 'X hours' },
  ],
  hours: 'Your hours',
  location: 'Your location',
  policies: {
    cancellation: 'Your policy',
    lateness: 'Your policy',
    payment: 'Your policy',
  },
}
```

### Adjusting Rate Limits

Edit constants in [/app/api/chat/route.ts](app/api/chat/route.ts:45-46):

```typescript
const RATE_LIMIT_WINDOW = 60 * 1000 // Time window in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 20  // Max requests per window
```

### Customizing System Prompt

The system prompt is automatically generated from `BUSINESS_CONTEXT`. To customize behavior, edit the `SYSTEM_PROMPT` template in [/app/api/chat/route.ts](app/api/chat/route.ts:156-187).

## Future Enhancements

### Recommended for Production

1. **Replace In-Memory Rate Limiting with Redis**
   - Current implementation uses Map (resets on server restart)
   - Use Redis for persistent, distributed rate limiting

2. **Add Database for Conversation History**
   - Store conversations for analytics
   - Enable conversation retrieval
   - Track user interactions

3. **Implement Streaming Responses**
   - Use OpenAI streaming API
   - Improve perceived response time
   - Better UX for long responses

4. **Add Authentication**
   - API key authentication for widget
   - JWT tokens for user sessions
   - Webhook verification

5. **Fetch Business Data from Database**
   - Currently uses hardcoded `BUSINESS_CONTEXT`
   - Connect to your business data source
   - Support multi-tenant architecture

6. **Add Booking Integration**
   - Connect to appointment scheduling system
   - Enable actual booking through chat
   - Payment processing integration

7. **Analytics & Monitoring**
   - Track conversation metrics
   - Monitor API usage
   - Error tracking (Sentry, etc.)

8. **Content Moderation**
   - Add more sophisticated abuse detection
   - Implement profanity filtering
   - User blocking/reporting

## Testing

The endpoint has been tested for:
- ✅ Basic conversation flow
- ✅ Business information queries
- ✅ Appointment booking guidance
- ✅ Rate limiting (20 req/min)
- ✅ Suspicious content detection
- ✅ Input validation
- ✅ Error handling
- ✅ CORS support

## Support

For issues or questions:
1. Check the error response messages
2. Verify OPENAI_API_KEY is set correctly
3. Ensure allowed origins are configured for your domain
4. Check rate limits haven't been exceeded
