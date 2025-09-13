# 🔧 VA Email Debug & Fix

## The Problem
The VA was sending incorrect parameters:
```json
// ❌ WRONG - What VA was sending:
{
  "moduleId": "email",
  "operation": "getInbox",
  "maxResults": 1  // ← This is wrong!
}

// ✅ CORRECT - What it should send:
{
  "moduleId": "email",
  "operation": "getInbox",
  "params": {      // ← Parameters must be inside params object
    "maxResults": 1
  }
}
```

## The Fix Applied

### 1. Updated Tool Definition
Made it clearer that ALL parameters go inside `params`:
- Added explicit description: "All operation parameters must be inside the 'params' object"
- Added examples in the description
- Made `params` have a default empty object `{}`
- Removed `params` from required fields (so it defaults to `{}`)

### 2. Added VA Instructions
Added explicit instructions in the VA's prompt:
```
# Module Operations
When using moduleOperation tool, ALWAYS structure it like this:
- moduleId: "email"
- operation: "getInbox" or "search" etc.
- params: {maxResults: 1} or {query: "search term"} - ALWAYS an object, even if empty {}
```

### 3. Added Default Handling
In the execute function:
```javascript
const { moduleId, operation, params = {} } = input;
```
This ensures `params` is always an object even if not provided.

## Test Commands to Verify Fix

Try these commands now:

### Basic Operations
1. **"Show me my latest email"**
   - Should call: `{moduleId: "email", operation: "getInbox", params: {maxResults: 1}}`

2. **"Get my inbox"**
   - Should call: `{moduleId: "email", operation: "getInbox", params: {maxResults: 20}}`

3. **"Search for unread emails"**
   - Should call: `{moduleId: "email", operation: "search", params: {query: "is:unread"}}`

### Watch the Console
You should see:
```
[RealEmailModule] Executing operation: getInbox { maxResults: 1 }
[RealEmailModule] Got userId: [your-user-id]
```

## If It Still Doesn't Work

### Check 1: Module Registration
In console, you should see:
```
[FoundationServices] Real Gmail module registered successfully
```

### Check 2: User Authentication
Make sure you're logged in and have a userId:
- The module gets userId from Supabase
- Check Network tab for calls to `/api/gmail/inbox?userId=[your-id]`

### Check 3: Gmail Connection
Try: **"Check email status"**
- Should return your Gmail connection status
- If not connected, connect Gmail first in your UI

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Parameters must be an object" | VA not formatting params correctly - fix applied above |
| "User not authenticated" | Make sure you're logged in to the app |
| "Gmail account not connected" | Connect Gmail in your UI first |
| "Module not found" | Module didn't register - check console for registration |

## The Architecture Flow

```
1. You say: "Show me my latest email"
   ↓
2. VA calls: moduleOperation tool
   ↓
3. Tool format: {moduleId: "email", operation: "getInbox", params: {maxResults: 1}}
   ↓
4. RealEmailModulePlugin receives call
   ↓
5. Plugin gets userId from Supabase
   ↓
6. Plugin calls: fetch("/api/gmail/inbox?userId=[id]&maxResults=1")
   ↓
7. Your API returns real Gmail data
   ↓
8. VA responds with your actual email
```

## Quick Test Script

After reloading the page, try this exact sequence:

1. **User**: "What modules do you have?"
   - **Expected**: "I have 1 module available: Gmail Module"

2. **User**: "Show me my latest email"
   - **Expected**: VA fetches and describes your most recent email

3. **User**: "Search for unread emails"
   - **Expected**: VA searches and reports how many unread emails you have

## Success Indicators

✅ No more "Parameters must be an object" errors
✅ Console shows proper operation execution
✅ Network tab shows API calls to `/api/gmail/*`
✅ VA responds with actual email data
✅ Your Gmail module in UI updates when VA performs actions

## Summary

The fix ensures the VA always wraps operation parameters in a `params` object. The tool is now more forgiving and has clearer instructions. Your VA should now be able to control your real Gmail!