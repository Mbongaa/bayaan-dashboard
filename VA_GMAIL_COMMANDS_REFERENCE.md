# 🎤 VA Gmail Voice Commands Quick Reference

## 📧 Email Discovery Commands

### Check What's Available
- **"What modules do you have?"** → Lists available modules
- **"What can the email module do?"** → Shows all email operations
- **"Check email status"** → Verifies Gmail connection

## 📥 Reading Emails

### Get Latest Emails
- **"Show me my latest email"** → Gets most recent email
- **"Get my inbox"** → Shows recent 20 emails
- **"Show me the last 5 emails"** → Gets specific number

### Search Emails
- **"Search for unread emails"** → Finds all unread
- **"Find emails from John"** → Search by sender name
- **"Find emails from john@example.com"** → Search by email address
- **"Show me emails about meeting"** → Search by topic
- **"Get emails from today"** → Time-based search
- **"Find important emails"** → Priority search
- **"Search for emails with attachments"** → Attachment search

### Advanced Searches
- **"Find unread emails from Sarah about project"** → Combined search
- **"Show me emails from last week"** → Date range search
- **"Get all promotional emails"** → Category search
- **"Find emails in spam"** → Folder search

## ✉️ Sending Emails

### Basic Send
- **"Send an email to john@example.com"** → Start email composition
- **"Send email to alice@company.com with subject Meeting Tomorrow"** → With subject
- **"Send an email to bob@firm.com saying I'll be there at 3pm"** → Quick message

### Complete Send
- **"Send an email to sarah@example.com with subject Project Update saying The project is on track and will be completed by Friday"** → Full email

### Reply (if threadId available)
- **"Reply to the last email saying Thanks for the update"** → Quick reply
- **"Reply to this thread with I agree with your proposal"** → Thread reply

## 📌 Email Management

### Mark Emails
- **"Mark the last email as read"** → Single email
- **"Mark the last 3 emails as read"** → Multiple emails
- **"Mark all unread emails as read"** → Bulk action
- **"Mark that email as unread"** → Undo read status
- **"Mark email [id] as unread"** → Specific email

### Archive Emails
- **"Archive the last email"** → Remove from inbox
- **"Archive these emails"** → Multiple archive
- **"Archive all read emails"** → Bulk archive
- **"Archive emails from [sender]"** → Sender-based archive

## 🧵 Thread Operations

### View Conversations
- **"Get the full thread"** → Current conversation
- **"Show me the entire conversation"** → Full thread
- **"Get thread [threadId]"** → Specific thread
- **"Show all messages in this thread"** → Thread messages

## 📊 Email Statistics

### Quick Stats
- **"How many unread emails do I have?"** → Unread count
- **"How many emails from today?"** → Daily count
- **"Count emails from [sender]"** → Sender count

## 🔧 Natural Language Variations

The VA understands many variations:

### Instead of "Show me my latest email":
- "What's my newest email?"
- "Read my latest message"
- "Get my most recent email"
- "Show the last email I received"
- "What did I just receive?"

### Instead of "Search for unread emails":
- "Find my unread messages"
- "What emails haven't I read?"
- "Show unread mail"
- "Get new emails"
- "Any new messages?"

### Instead of "Send an email":
- "Compose an email"
- "Write to [person]"
- "Email [person]"
- "Send a message to"
- "Create an email for"

## 💡 Pro Tips

### Efficient Commands
1. **Be specific**: "Show me unread emails from John about the budget"
2. **Use natural language**: The VA understands conversational requests
3. **Chain operations**: "Find my latest email and mark it as read"

### Gmail Search Operators
The VA supports Gmail's search syntax:
- **is:unread** - Unread emails
- **is:important** - Important emails
- **has:attachment** - With attachments
- **from:person@email.com** - From specific sender
- **to:me** - Sent directly to you
- **subject:meeting** - Subject contains word
- **newer_than:2d** - From last 2 days
- **larger:5M** - Larger than 5MB

### Complex Queries
- **"is:unread from:boss@company.com"** → Unread from boss
- **"has:attachment larger:10M"** → Large attachments
- **"subject:invoice newer_than:7d"** → Recent invoices

## 🚨 Troubleshooting Commands

### If Something's Not Working
1. **"Check email status"** → Verify connection
2. **"What modules are available?"** → Check registration
3. **"What can you do with email?"** → List capabilities

## 📈 Usage Examples

### Morning Email Check
1. "Show me my latest emails"
2. "Search for unread important emails"
3. "Mark all promotional emails as read"
4. "Archive yesterday's emails"

### Email Triage
1. "Find unread emails from my team"
2. "Show me emails about urgent"
3. "Mark project emails as important"
4. "Archive completed task emails"

### Quick Responses
1. "Reply to John's email saying I'll review it today"
2. "Send a quick email to team saying Meeting moved to 3pm"
3. "Forward this to my assistant"

## 🎯 Command Success Indicators

### ✅ Successful Command
- VA acknowledges the operation
- Describes the email content
- Confirms action taken
- UI updates reflect changes

### ❌ Failed Command
- Error message appears
- VA asks for clarification
- No UI changes occur
- Check console for errors

## 📝 Notes

- Commands are case-insensitive
- The VA understands context from previous commands
- You can refer to "the last email" or "that email" after viewing one
- Multiple commands can be combined naturally
- The VA will ask for clarification if a command is ambiguous

---

**Version**: 1.0.0
**Last Updated**: Current
**Powered by**: OpenAI Realtime API + Gmail API