# 🔍 Web Search Testing Guide

## What Was Fixed

The web search was getting stuck at "Accessing external sources..." because:

1. **Gemini's OpenAI compatibility layer** doesn't fully support the `tool` role in conversation history
2. **Tool call loops** could occur if tools were passed in follow-up requests
3. **Insufficient error logging** made debugging difficult

## Changes Made

### ✅ Simplified Tool Response Format
- Changed from complex `tool` role to `system` role for search results
- More compatible with Gemini's OpenAI endpoint
- Clearer instruction to AI on how to use search results

### ✅ Prevented Infinite Loops
- Removed `tools` parameter from follow-up API calls
- Made `onToolCall` callback optional in follow-up handlers
- Added warnings if tool calls occur unexpectedly

### ✅ Enhanced Logging
- Added emoji indicators for easy log tracking
- Better error messages with HTTP status codes
- Clear console output for each step of the process

## Testing Instructions

### 1. Restart the Backend Server

```bash
cd nodejs-ai-assistant
npm run dev
```

**Watch for these logs:**
- ✅ Server should start without errors
- ✅ Check that `GEMINI_API_KEY` and `TAVILY_API_KEY` are loaded

### 2. Check Environment Variables

Make sure your `.env` file has:
```env
GEMINI_API_KEY=your_actual_key_here
TAVILY_API_KEY=your_actual_key_here
STREAM_API_KEY=your_stream_key_here
STREAM_API_SECRET=your_stream_secret_here
```

### 3. Test Web Search with These Queries

Start a new chat and try these queries that should trigger web search:

#### ✅ Current Events
```
What's the latest news about AI today?
```

#### ✅ Weather
```
What's the weather like in Tokyo right now?
```

#### ✅ Recent Tech News
```
What are the recent developments in quantum computing?
```

#### ✅ Stock Market
```
How is the stock market performing today?
```

#### ✅ Sports Scores
```
What are the latest NBA game results?
```

### 4. What to Look For

#### In the Chat UI:
1. **Status Indicator Changes:**
   - "AI is thinking..." → Initial processing
   - "Using external sources..." → Web search in progress
   - "AI is responding..." → Generating final answer
   - Status clears when complete

2. **Response Quality:**
   - Should include current, real-time information
   - Should mention sources or recent data
   - Should be comprehensive and well-formatted

#### In the Backend Console Logs:

**Successful Web Search Flow:**
```
🔧 Tool call received: web_search { query: 'latest news about AI' }
🔍 Searching Tavily for: "latest news about AI"
✓ Tavily returned 5 results
✓ Tool execution completed: web_search
🔧 Delegating tool call to parent handler: { query: 'latest news about AI' }
```

**Potential Issues:**

❌ **If you see:** `⚠️ TAVILY_API_KEY not configured`
- **Fix:** Add your Tavily API key to `.env`

❌ **If you see:** `❌ Tavily API error (401)`
- **Fix:** Your Tavily API key is invalid, get a new one from https://tavily.com

❌ **If stuck at "Using external sources..."**
- **Check:** Backend console for error messages
- **Try:** Restart the backend server
- **Verify:** Both API keys are correctly set

❌ **If you see:** `⚠️ Tool call received but no handler available`
- **Issue:** This indicates a potential infinite loop was prevented
- **Should:** Not happen with current fixes

## Example of Successful Response

**User Query:** "What's the latest news about AI?"

**Expected Flow:**
1. AI detects need for current information
2. Triggers web search with optimized query
3. Backend searches Tavily API
4. Returns 5 recent search results
5. AI synthesizes results into comprehensive answer
6. User sees well-formatted response with current information

**Response Should Include:**
- Recent events/developments (within days/weeks)
- Multiple sources of information
- Specific details, dates, or statistics
- Clear, well-organized formatting

## Troubleshooting

### Web Search Never Triggers

**Possible Causes:**
1. Query doesn't require current information
2. AI doesn't detect need for web search

**Try More Explicit Queries:**
- "Search the web for..."
- "What happened today in..."
- "Latest news about..."
- "Current status of..."

### Search Triggers But No Response

**Check Backend Logs For:**
1. Tavily API errors
2. JSON parsing errors
3. Network/timeout issues

**Common Fixes:**
1. Verify Tavily API key is valid
2. Check internet connectivity
3. Try a simpler query
4. Restart the backend server

### Performance Issues

If responses are slow:
1. Tavily search typically takes 2-3 seconds
2. AI processing adds another 2-5 seconds
3. Total time: 5-10 seconds is normal

**To optimize:**
- Use `search_depth: "basic"` (already configured)
- Limit `max_results` to 5 (already configured)
- Ensure good internet connection

## Success Criteria

✅ **Web search is working if:**
- Status indicators change properly
- Backend logs show tool calls and search execution
- Responses include current, real-time information
- No errors in console
- Processing completes within 10 seconds

## Need Help?

If web search still isn't working:

1. **Share backend console logs** from when you send a query
2. **Share frontend console** for any errors
3. **Verify API keys** are valid and have quota remaining
4. **Try a fresh start** - restart both frontend and backend

---

## Quick Start Command

```bash
# Terminal 1 - Backend
cd nodejs-ai-assistant
npm run dev

# Terminal 2 - Frontend
cd react-stream-ai-assistant
npm run dev
```

Then test with: **"What's the latest news about AI today?"**

Watch the backend console for the emoji indicators! 🎉

