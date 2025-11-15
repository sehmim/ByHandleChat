# Chat Widget Integration Guide

## Overview

The ByHandle chat widget is now fully integrated with the OpenAI-powered chat API, providing real-time conversational assistance for customers.

## What's Been Integrated

### 1. API Connection ([MessageProvider.tsx](src/state/MessageProvider.tsx))

The `MessageProvider` has been enhanced to:
- Call the `/api/chat` endpoint with conversation history
- Handle API responses and update the chat UI
- Manage loading states during API calls
- Handle errors gracefully with user-friendly messages

**Key Changes:**
- Added `userId` and `chatbotId` props (required for API calls)
- Added `isLoading` and `error` states
- Implemented async `sendMessage` function with API integration
- Builds conversation history from messages
- Adds bot responses to the chat

### 2. Loading States ([Composer.tsx](src/components/widget/Composer.tsx))

The message composer now shows visual feedback:
- Disables input during API calls
- Changes placeholder to "Waiting for response..."
- Shows "Sending..." on the send button
- Prevents multiple concurrent requests

### 3. Error Handling

Comprehensive error handling includes:
- Rate limit detection (429 errors)
- Network error handling
- Invalid response handling
- User-friendly error messages displayed in chat
- Console logging for debugging

### 4. Conversation History Management

The integration maintains conversation context by:
- Filtering out the welcome message from history
- Converting message format from UI (`user`/`bot`) to API (`user`/`assistant`)
- Sending full conversation history with each request
- Preserving context across multiple messages

## How It Works

### Message Flow

1. **User sends message**
   - User types in composer and clicks "Send"
   - `sendMessage()` is called with message content

2. **Message added to UI**
   - User message immediately appears in chat
   - Loading state activates (composer disabled)

3. **API Request**
   - Conversation history is built from existing messages
   - POST request sent to `/api/chat` with:
     ```json
     {
       "messages": [
         {"role": "user", "content": "previous message"},
         {"role": "assistant", "content": "previous response"},
         {"role": "user", "content": "new message"}
       ],
       "userId": "user-id",
       "chatbotId": "bot-id"
     }
     ```

4. **API Response**
   - OpenAI processes with business context
   - Response returned with assistant message

5. **UI Update**
   - Bot message added to chat
   - Loading state deactivated
   - Composer re-enabled for next message

### Error Flow

If an error occurs:
1. Error is caught and logged
2. User-friendly error message generated
3. Error displayed as bot message in chat
4. Loading state cleared
5. User can try again

## Testing the Integration

### 1. Start the Development Server

```bash
npm run dev
```

Server runs at `http://localhost:3000`

### 2. Open the Widget

Navigate to `http://localhost:3000` in your browser. The chat widget appears in the bottom-right corner.

### 3. Test Scenarios

#### Basic Conversation
1. Click the chat launcher
2. Type "What services do you offer?"
3. Wait for AI response
4. Verify response includes business services

#### Conversation Context
1. Ask "What services do you offer?"
2. Follow up with "How much is a spa treatment?"
3. Verify AI remembers context from first message

#### Appointment Booking Flow
1. Ask "I want to book an appointment"
2. Verify AI encourages booking and asks for details
3. Continue conversation about specific services

#### Error Handling
Test error scenarios:
- **Network error**: Disconnect internet, send message
- **Rate limiting**: Send 21+ messages quickly
- **Invalid input**: The API validates automatically

#### Loading States
1. Send a message
2. Observe:
   - Input field disabled
   - Placeholder changes to "Waiting for response..."
   - Button shows "Sending..."
3. After response:
   - Input re-enabled
   - Button returns to "Send"

## Configuration

### Required Props

The widget requires these props (already configured in [main.tsx](src/main.tsx:15-17)):

```typescript
initHandleChat({
  userId: '14',           // Required for rate limiting
  calendarSettingId: '6', // For future booking integration
  chatbotId: '19',        // Required for API tracking
  // ... other optional props
})
```

### Environment Variables

Ensure `.env` contains:

```env
OPENAI_API_KEY=your-key-here
```

## Widget Files Modified

### Core Changes

1. **[src/state/MessageProvider.tsx](src/state/MessageProvider.tsx)** ✅
   - Added API integration
   - Loading and error state management
   - Conversation history building

2. **[src/components/widget/Composer.tsx](src/components/widget/Composer.tsx)** ✅
   - Loading state UI
   - Disabled state during API calls

3. **[src/components/WidgetApp.tsx](src/components/WidgetApp.tsx:379-385)** ✅
   - Passed `userId` and `chatbotId` to MessageProvider

### API Endpoint

4. **[app/api/chat/route.ts](app/api/chat/route.ts)** ✅
   - Handles chat requests
   - OpenAI integration
   - Rate limiting
   - Input validation
   - Business context injection

## Features

### ✅ Implemented

- Real-time chat with OpenAI
- Conversation history context
- Business-specific responses
- Loading states
- Error handling
- Rate limiting (20 req/min)
- Input validation
- Abuse prevention
- CORS support

### 🚀 Future Enhancements

1. **Typing Indicator**
   - Show "..." while bot is responding
   - Animated typing indicator

2. **Message Streaming**
   - Stream responses word-by-word
   - Better UX for long responses

3. **Retry Mechanism**
   - Add retry button for failed messages
   - Auto-retry on network errors

4. **Conversation Persistence**
   - Save conversations to database
   - Resume conversations on return visits

5. **Rich Messages**
   - Support for buttons, cards, images
   - Action buttons for booking flow

6. **Analytics**
   - Track conversation metrics
   - Monitor response times
   - User satisfaction ratings

## Troubleshooting

### Widget Not Responding

**Check:**
1. Is `OPENAI_API_KEY` set in `.env`?
2. Is the dev server running?
3. Check browser console for errors
4. Check network tab for API calls

### Rate Limit Errors

If you see "Too many messages":
- Wait 60 seconds
- Rate limit is 20 messages per minute per user
- Adjust limits in [route.ts](app/api/chat/route.ts:45-46)

### API Errors

Check server logs for:
- OpenAI API errors
- Network connectivity
- Invalid API key

### Widget Won't Open

Verify:
- Script tag has required attributes: `data-user-id`, `data-calendar-setting-id`, `data-chatbot-id`
- No JavaScript errors in console

## Demo & Testing

### Quick Test Commands

```bash
# Start server
npm run dev

# In another terminal, test API directly
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello"}],
    "userId": "test-user",
    "chatbotId": "test-bot"
  }'
```

### Browser Testing

1. Open `http://localhost:3000`
2. Open browser DevTools (F12)
3. Click chat widget
4. Send messages
5. Monitor:
   - Console for any errors
   - Network tab for API calls
   - Chat UI for responses

## Architecture Diagram

```
User Message
     ↓
Composer.tsx (Captures input)
     ↓
MessageProvider.sendMessage() (Builds request)
     ↓
POST /api/chat (With conversation history)
     ↓
route.ts (Validates, rate limits)
     ↓
OpenAI API (Processes with business context)
     ↓
route.ts (Returns response)
     ↓
MessageProvider (Updates state)
     ↓
ChatTranscript.tsx (Displays response)
```

## Next Steps

1. **Test thoroughly** in dev environment
2. **Customize business context** in [route.ts](app/api/chat/route.ts:137-153)
3. **Update allowed origins** for production domains
4. **Set up Redis** for production rate limiting
5. **Add database** for conversation persistence
6. **Deploy** and monitor

## Support

For issues or questions, refer to:
- [CHAT_API_DOCUMENTATION.md](CHAT_API_DOCUMENTATION.md) - API reference
- Console logs - Check for errors
- Network tab - Verify API calls
- Server logs - Check backend errors
