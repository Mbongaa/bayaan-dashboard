# 🧪 VA Gmail Integration Test Guide

## ✅ Pre-Test Checklist

Before testing, ensure:
1. **Development server is running**: `npm run dev`
2. **You're logged in** to the dashboard
3. **Gmail is connected** in your UI (check Gmail module shows your emails)
4. **Browser console is open** to monitor logs
5. **VA is active** and responding to voice commands

## 🎯 Test Sequence

Follow this exact sequence for comprehensive testing:

### Phase 1: Module Discovery (Basic)

#### Test 1.1: Module Availability
**Command**: "What modules do you have?"
**Expected Response**: "I have 1 module available: Gmail Module"
**Console Log**: `[FoundationServices] Real Gmail module registered successfully`
**Status**: ✅ Pass / ❌ Fail

#### Test 1.2: Module Capabilities
**Command**: "What can the email module do?"
**Expected Response**: Lists all 8 operations (search, getInbox, send, markAsRead, markAsUnread, archive, getThread, checkStatus)
**Console Log**: `[RealEmailModule] Module capabilities requested`
**Status**: ✅ Pass / ❌ Fail

### Phase 2: Status Verification

#### Test 2.1: Connection Status
**Command**: "Check email status"
**Expected Response**: "Your Gmail is connected with [your-email@gmail.com]"
**Console Log**: `[RealEmailModule] Executing operation: checkStatus`
**Network Tab**: GET request to `/api/gmail/status?userId=[your-id]`
**Status**: ✅ Pass / ❌ Fail

### Phase 3: Email Retrieval

#### Test 3.1: Get Latest Email
**Command**: "Show me my latest email"
**Expected Response**: Describes your most recent email with sender, subject, and preview
**Console Log**: 
```
[RealEmailModule] Executing operation: getInbox { maxResults: 1 }
[RealEmailModule] Got userId: [your-user-id]
```
**Network Tab**: GET request to `/api/gmail/inbox?userId=[id]&maxResults=1`
**Status**: ✅ Pass / ❌ Fail

#### Test 3.2: Get Multiple Emails
**Command**: "Get my inbox"
**Expected Response**: Lists your recent emails (up to 20)
**Console Log**: `[RealEmailModule] Executing operation: getInbox { maxResults: 20 }`
**Status**: ✅ Pass / ❌ Fail

### Phase 4: Email Search

#### Test 4.1: Search Unread
**Command**: "Search for unread emails"
**Expected Response**: "You have [N] unread emails" with list
**Console Log**: `[RealEmailModule] Executing operation: search { query: "is:unread" }`
**Network Tab**: GET request with `query=is%3Aunread`
**Status**: ✅ Pass / ❌ Fail

#### Test 4.2: Search by Sender
**Command**: "Find emails from [person's name or email]"
**Expected Response**: Lists emails from that sender
**Console Log**: `[RealEmailModule] Executing operation: search { query: "from:[person]" }`
**Status**: ✅ Pass / ❌ Fail

#### Test 4.3: Search by Topic
**Command**: "Show me emails about [topic]"
**Expected Response**: Lists relevant emails
**Console Log**: Search operation with topic query
**Status**: ✅ Pass / ❌ Fail

### Phase 5: Email Actions

#### Test 5.1: Mark as Read
**Command**: "Mark the last email as read"
**Expected Response**: "I've marked 1 email as read"
**Console Log**: `[RealEmailModule] Executing operation: markAsRead`
**Network Tab**: POST request to `/api/gmail/mark`
**UI Update**: Email should no longer appear as unread in your Gmail module
**Status**: ✅ Pass / ❌ Fail

#### Test 5.2: Mark as Unread
**Command**: "Mark that email as unread"
**Expected Response**: "I've marked the email as unread"
**Console Log**: `[RealEmailModule] Executing operation: markAsUnread`
**Status**: ✅ Pass / ❌ Fail

#### Test 5.3: Archive Email
**Command**: "Archive the last email"
**Expected Response**: "I've archived 1 email"
**Console Log**: `[RealEmailModule] Executing operation: archive`
**Network Tab**: POST request to `/api/gmail/archive`
**UI Update**: Email should disappear from inbox in your Gmail module
**Status**: ✅ Pass / ❌ Fail

### Phase 6: Send Email

#### Test 6.1: Simple Send
**Command**: "Send an email to test@example.com with subject Test Email saying This is a test"
**Expected Response**: "I've sent the email to test@example.com"
**Console Log**: `[RealEmailModule] Executing operation: send`
**Network Tab**: POST request to `/api/gmail/send`
**Status**: ✅ Pass / ❌ Fail

### Phase 7: Thread Operations

#### Test 7.1: Get Thread
**Command**: "Get the full thread for [mention an email]"
**Expected Response**: Shows all messages in the conversation
**Console Log**: `[RealEmailModule] Executing operation: getThread`
**Status**: ✅ Pass / ❌ Fail

## 📊 Test Results Summary

| Test Category | Tests Passed | Tests Failed | Success Rate |
|---------------|--------------|--------------|--------------|
| Module Discovery | _/2 | _/2 | _% |
| Status Verification | _/1 | _/1 | _% |
| Email Retrieval | _/2 | _/2 | _% |
| Email Search | _/3 | _/3 | _% |
| Email Actions | _/3 | _/3 | _% |
| Send Email | _/1 | _/1 | _% |
| Thread Operations | _/1 | _/1 | _% |
| **TOTAL** | _/13 | _/13 | _% |

## 🔍 What to Monitor

### Console Logs
Watch for these key indicators:
- ✅ `[FoundationServices] Real Gmail module registered successfully`
- ✅ `[RealEmailModule] Executing operation: [operation] [params]`
- ✅ `[RealEmailModule] Got userId: [your-id]`
- ❌ `Parameters must be an object` - Parameter formatting issue
- ❌ `User not authenticated` - Auth issue
- ❌ `Gmail account not connected` - Connection issue

### Network Tab
Monitor API calls:
- ✅ `/api/gmail/inbox` - Should return 200 with email data
- ✅ `/api/gmail/send` - Should return 200 with message ID
- ✅ `/api/gmail/mark` - Should return 200 with success
- ✅ `/api/gmail/archive` - Should return 200 with success
- ❌ 401 - Authentication error
- ❌ 500 - Server error

### UI Updates
Your Gmail module should reflect changes:
- Emails marked as read/unread update immediately
- Archived emails disappear from inbox
- Sent emails appear in sent folder

## 🐛 Troubleshooting Guide

### Issue: "Parameters must be an object"
**Cause**: VA not formatting params correctly
**Fix**: Already fixed in latest version - ensure bayaanOptimized.ts has updated tool definition
**Verify**: Check that params are wrapped: `{moduleId, operation, params: {...}}`

### Issue: "User not authenticated"
**Cause**: Not logged in or session expired
**Fix**: 
1. Refresh the page
2. Log in again
3. Retry the command

### Issue: "Gmail account not connected"
**Cause**: Gmail not linked to your account
**Fix**:
1. Go to Gmail module in UI
2. Click "Connect Gmail"
3. Complete OAuth flow
4. Retry VA commands

### Issue: "Module not found"
**Cause**: Module didn't register properly
**Fix**:
1. Check console for registration errors
2. Restart dev server
3. Check FoundationServices.ts imports

### Issue: No response from VA
**Cause**: VA not receiving module data
**Fix**:
1. Check browser console for errors
2. Verify moduleOperation tool is present
3. Check network tab for failed requests

### Issue: Wrong email data
**Cause**: Using wrong userId or API error
**Fix**:
1. Verify you're logged in as correct user
2. Check Supabase auth is working
3. Verify Gmail tokens are valid

## 🚀 Performance Benchmarks

Expected response times:
- Module discovery: < 100ms
- Status check: < 500ms
- Get inbox: < 1s
- Search emails: < 2s
- Mark/Archive: < 1s
- Send email: < 2s

## 📝 Test Notes

### What's Working Well
- [Record successful operations]
- [Note particularly smooth workflows]

### Issues Found
- [Document any bugs or issues]
- [Note workarounds if any]

### Suggestions
- [Ideas for improvement]
- [Feature requests]

## ✨ Quick Commands Reference

### Essential Commands
1. "What modules do you have?"
2. "Check email status"
3. "Show me my latest email"
4. "Search for unread emails"
5. "Mark the last email as read"
6. "Archive this email"
7. "Send an email to [recipient]"

### Advanced Commands
1. "Find emails from [sender] about [topic]"
2. "Get emails from the last week"
3. "Show me important unread emails"
4. "Reply to the last email"
5. "Get the full conversation thread"

## 🎉 Success Criteria

The integration is considered fully functional when:
- ✅ All 13 tests pass consistently
- ✅ Response times meet benchmarks
- ✅ UI updates reflect VA actions
- ✅ No errors in console during operations
- ✅ Network requests succeed with 200 status
- ✅ VA responses are accurate and helpful

## 📅 Test Log

| Date | Tester | Tests Passed | Issues Found | Notes |
|------|--------|--------------|--------------|-------|
| | | /13 | | |
| | | /13 | | |
| | | /13 | | |

---

**Last Updated**: [Current Date]
**Version**: 1.0.0
**Status**: Ready for Testing