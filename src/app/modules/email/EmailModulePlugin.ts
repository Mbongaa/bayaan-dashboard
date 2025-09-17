import { 
  IModulePlugin, 
  ModuleDescriptor 
} from '@/app/foundation/types/ModuleTypes';
import { EventBus } from '@/app/foundation/services/EventBus';

// Type imports only - won't cause build issues
import type { GmailService, ParsedMessage, SendEmailRequest } from '@/app/lib/gmail/GmailService';

export class EmailModulePlugin implements IModulePlugin {
  private gmailService: GmailService | null = null;
  private eventBus: EventBus | null = null;
  
  descriptor: ModuleDescriptor = {
    id: 'email',
    name: 'Email Module',
    version: '1.0.0',
    description: 'Gmail integration with search, send, and management capabilities',
    capabilities: [
      {
        name: 'search',
        description: 'Search emails by query',
        parameters: [
          {
            name: 'query',
            type: 'string',
            description: 'Search query (e.g., "from:john@example.com subject:invoice")',
            required: true
          },
          {
            name: 'maxResults',
            type: 'number',
            description: 'Maximum number of results (default: 10)',
            required: false
          }
        ],
        returns: {
          type: 'array',
          description: 'Array of email objects',
          schema: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                threadId: { type: 'string' },
                subject: { type: 'string' },
                from: { type: 'string' },
                to: { type: 'string' },
                date: { type: 'string' },
                snippet: { type: 'string' },
                isRead: { type: 'boolean' },
                isImportant: { type: 'boolean' }
              }
            }
          }
        },
        examples: [
          {
            description: 'Search for unread emails',
            input: { query: 'is:unread' },
            output: [{ id: '123', subject: 'Meeting tomorrow', from: 'boss@company.com' }]
          }
        ]
      },
      {
        name: 'getInbox',
        description: 'Get emails from inbox with optional filtering',
        parameters: [
          {
            name: 'maxResults',
            type: 'number',
            description: 'Maximum number of emails to retrieve (default: 20)',
            required: false
          },
          {
            name: 'query',
            type: 'string',
            description: 'Optional search query to filter inbox',
            required: false
          },
          {
            name: 'pageToken',
            type: 'string',
            description: 'Token for pagination',
            required: false
          }
        ],
        returns: {
          type: 'object',
          description: 'Inbox response with messages and pagination',
          schema: {
            type: 'object',
            properties: {
              messages: { type: 'array' },
              nextPageToken: { type: 'string' },
              resultSizeEstimate: { type: 'number' }
            }
          }
        }
      },
      {
        name: 'send',
        description: 'Send an email',
        parameters: [
          {
            name: 'to',
            type: 'string',
            description: 'Recipient email address',
            required: true
          },
          {
            name: 'subject',
            type: 'string',
            description: 'Email subject',
            required: true
          },
          {
            name: 'body',
            type: 'string',
            description: 'Email body (HTML or plain text)',
            required: true
          },
          {
            name: 'threadId',
            type: 'string',
            description: 'Optional thread ID for replies',
            required: false
          }
        ],
        returns: {
          type: 'object',
          description: 'Sent email confirmation',
          schema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              threadId: { type: 'string' },
              success: { type: 'boolean' }
            }
          }
        }
      },
      {
        name: 'reply',
        description: 'Reply to an email thread',
        parameters: [
          {
            name: 'threadId',
            type: 'string',
            description: 'Thread ID to reply to',
            required: true
          },
          {
            name: 'to',
            type: 'string',
            description: 'Recipient email address',
            required: true
          },
          {
            name: 'subject',
            type: 'string',
            description: 'Email subject',
            required: true
          },
          {
            name: 'body',
            type: 'string',
            description: 'Reply message body',
            required: true
          }
        ],
        returns: {
          type: 'object',
          description: 'Reply confirmation'
        }
      },
      {
        name: 'getThread',
        description: 'Get full email thread/conversation',
        parameters: [
          {
            name: 'threadId',
            type: 'string',
            description: 'Thread ID',
            required: true
          }
        ],
        returns: {
          type: 'array',
          description: 'Array of messages in the thread'
        }
      },
      {
        name: 'markAsRead',
        description: 'Mark emails as read',
        parameters: [
          {
            name: 'messageIds',
            type: 'array',
            description: 'Array of message IDs to mark as read',
            required: true
          }
        ],
        returns: {
          type: 'object',
          description: 'Update confirmation',
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              modifiedCount: { type: 'number' }
            }
          }
        }
      },
      {
        name: 'markAsUnread',
        description: 'Mark emails as unread',
        parameters: [
          {
            name: 'messageIds',
            type: 'array',
            description: 'Array of message IDs to mark as unread',
            required: true
          }
        ],
        returns: {
          type: 'object',
          description: 'Update confirmation',
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              modifiedCount: { type: 'number' }
            }
          }
        }
      },
      {
        name: 'archive',
        description: 'Archive emails (remove from inbox)',
        parameters: [
          {
            name: 'messageIds',
            type: 'array',
            description: 'Array of message IDs to archive',
            required: true
          }
        ],
        returns: {
          type: 'object',
          description: 'Archive confirmation',
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              archivedCount: { type: 'number' }
            }
          }
        }
      },
      {
        name: 'trash',
        description: 'Move emails to trash',
        parameters: [
          {
            name: 'messageIds',
            type: 'array',
            description: 'Array of message IDs to trash',
            required: true
          }
        ],
        returns: {
          type: 'object',
          description: 'Trash confirmation',
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              trashedCount: { type: 'number' }
            }
          }
        }
      },
      {
        name: 'getMessageDetails',
        description: 'Get detailed information about a specific message',
        parameters: [
          {
            name: 'messageId',
            type: 'string',
            description: 'Message ID',
            required: true
          }
        ],
        returns: {
          type: 'object',
          description: 'Detailed message information'
        }
      }
    ],
    events: {
      emits: [
        'email:sent',
        'email:archived',
        'email:marked',
        'email:trashed',
        'email:search:completed',
        'email:thread:fetched'
      ],
      listens: [
        'email:refresh',
        'email:sync'
      ]
    },
    permissions: ['gmail.readonly', 'gmail.send', 'gmail.modify']
  };

  async initialize(services: any): Promise<void> {
    console.log('[EmailModule] Initializing');
    
    this.eventBus = services.eventBus;
    
    // Don't initialize Gmail service here - do it lazily when needed
    // This avoids loading server-side dependencies at startup
    console.log('[EmailModule] Gmail service will be initialized on first use');
    
    // Set up event listeners
    if (this.eventBus) {
      this.eventBus.on('email:refresh', this.handleRefresh.bind(this));
      this.eventBus.on('email:sync', this.handleSync.bind(this));
    }
    
    console.log('[EmailModule] Initialized successfully');
  }

  async executeOperation(operation: string, params: any): Promise<any> {
    // Check if Gmail service is initialized
    if (!this.gmailService && operation !== 'getAuthStatus') {
      // Try to initialize lazily
      await this.initializeGmailService();
      if (!this.gmailService) {
        throw new Error('Gmail not authenticated. Please authenticate first.');
      }
    }

    switch (operation) {
      case 'search':
        return this.searchEmails(params);
      
      case 'getInbox':
        return this.getInboxMessages(params);
      
      case 'send':
        return this.sendEmail(params);
      
      case 'reply':
        return this.replyToThread(params);
      
      case 'getThread':
        return this.getEmailThread(params);
      
      case 'markAsRead':
        return this.markEmailsAsRead(params);
      
      case 'markAsUnread':
        return this.markEmailsAsUnread(params);
      
      case 'archive':
        return this.archiveEmails(params);
      
      case 'trash':
        return this.trashEmails(params);
      
      case 'getMessageDetails':
        return this.getMessageDetails(params);
      
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  private async getGmailTokens(): Promise<any> {
    // This would typically fetch from a secure storage
    // For now, return null to indicate no tokens
    // In a real implementation, this would check Supabase or local storage
    return null;
  }

  private async initializeGmailService(): Promise<void> {
    try {
      // Only load Gmail service when actually needed
      // This prevents loading server-side dependencies at build time
      if (typeof window === 'undefined') {
        console.warn('[EmailModule] Gmail service not available in server environment');
        return;
      }

      const tokens = await this.getGmailTokens();
      if (tokens) {
        // Dynamically import to avoid build issues
        const { GmailService } = await import('@/app/lib/gmail/GmailService');
        this.gmailService = new GmailService(tokens);
        console.log('[EmailModule] Gmail service initialized with existing tokens');
      } else {
        console.log('[EmailModule] No Gmail tokens found - user needs to authenticate');
      }
    } catch (error) {
      console.warn('[EmailModule] Could not initialize Gmail service:', error);
    }
  }

  private async searchEmails(params: any): Promise<ParsedMessage[]> {
    const { query, maxResults = 10 } = params;
    
    if (!this.gmailService) {
      throw new Error('Gmail service not initialized');
    }
    
    // Use getInboxMessages with a search query
    const results = await this.gmailService.getInboxMessages(maxResults, undefined, query);
    
    // Emit search completed event
    this.eventBus!.emit('email:search:completed', {
      query,
      resultCount: results.messages.length
    });
    
    return results.messages;
  }

  private async getInboxMessages(params: any): Promise<any> {
    const { maxResults = 20, query, pageToken } = params;
    
    if (!this.gmailService) {
      throw new Error('Gmail service not initialized');
    }
    
    return await this.gmailService.getInboxMessages(maxResults, pageToken, query);
  }

  private async sendEmail(params: any): Promise<any> {
    const { to, subject, body, threadId } = params;
    
    if (!this.gmailService) {
      throw new Error('Gmail service not initialized');
    }
    
    const request: SendEmailRequest = {
      to,
      subject,
      body,
      threadId
    };
    
    const result = await this.gmailService.sendReply(request);
    
    // Emit sent event
    this.eventBus!.emit('email:sent', {
      to,
      subject,
      id: result.id
    });
    
    return {
      ...result,
      success: true
    };
  }

  private async replyToThread(params: any): Promise<any> {
    const { threadId, to, subject, body } = params;
    
    if (!this.gmailService) {
      throw new Error('Gmail service not initialized');
    }
    
    const request: SendEmailRequest = {
      to,
      subject,
      body,
      threadId
    };
    
    return await this.gmailService.sendReply(request);
  }

  private async getEmailThread(params: any): Promise<ParsedMessage[]> {
    const { threadId } = params;
    
    if (!this.gmailService) {
      throw new Error('Gmail service not initialized');
    }
    
    const messages = await this.gmailService.getThreadMessages(threadId);
    
    this.eventBus!.emit('email:thread:fetched', {
      threadId,
      messageCount: messages.length
    });
    
    return messages;
  }

  private async getMessageDetails(params: any): Promise<ParsedMessage> {
    const { messageId } = params;
    
    if (!this.gmailService) {
      throw new Error('Gmail service not initialized');
    }
    
    return await this.gmailService.getMessageDetails(messageId);
  }

  private async markEmailsAsRead(params: any): Promise<any> {
    const { messageIds } = params;
    
    if (!this.gmailService) {
      throw new Error('Gmail service not initialized');
    }
    
    let successCount = 0;
    for (const messageId of messageIds) {
      try {
        await this.gmailService.markAsRead(messageId);
        successCount++;
      } catch (error) {
        console.error(`Failed to mark message ${messageId} as read:`, error);
      }
    }
    
    // Emit marked event
    this.eventBus!.emit('email:marked', {
      messageIds,
      read: true,
      count: successCount
    });
    
    return {
      success: true,
      modifiedCount: successCount
    };
  }

  private async markEmailsAsUnread(params: any): Promise<any> {
    const { messageIds } = params;
    
    if (!this.gmailService) {
      throw new Error('Gmail service not initialized');
    }
    
    let successCount = 0;
    for (const messageId of messageIds) {
      try {
        await this.gmailService.markAsUnread(messageId);
        successCount++;
      } catch (error) {
        console.error(`Failed to mark message ${messageId} as unread:`, error);
      }
    }
    
    // Emit marked event
    this.eventBus!.emit('email:marked', {
      messageIds,
      read: false,
      count: successCount
    });
    
    return {
      success: true,
      modifiedCount: successCount
    };
  }

  private async archiveEmails(params: any): Promise<any> {
    const { messageIds } = params;
    
    if (!this.gmailService) {
      throw new Error('Gmail service not initialized');
    }
    
    let successCount = 0;
    for (const messageId of messageIds) {
      try {
        await this.gmailService.archiveMessage(messageId);
        successCount++;
      } catch (error) {
        console.error(`Failed to archive message ${messageId}:`, error);
      }
    }
    
    // Emit archived event
    this.eventBus!.emit('email:archived', {
      messageIds,
      count: successCount
    });
    
    return {
      success: true,
      archivedCount: successCount
    };
  }

  private async trashEmails(params: any): Promise<any> {
    const { messageIds } = params;
    
    if (!this.gmailService) {
      throw new Error('Gmail service not initialized');
    }
    
    let successCount = 0;
    for (const messageId of messageIds) {
      try {
        await this.gmailService.deleteMessage(messageId);
        successCount++;
      } catch (error) {
        console.error(`Failed to trash message ${messageId}:`, error);
      }
    }
    
    // Emit trashed event
    this.eventBus!.emit('email:trashed', {
      messageIds,
      count: successCount
    });
    
    return {
      success: true,
      trashedCount: successCount
    };
  }

  private async handleRefresh(): Promise<void> {
    console.log('[EmailModule] Handling refresh request');
    // Refresh implementation - could re-fetch inbox, sync labels, etc.
  }

  private async handleSync(): Promise<void> {
    console.log('[EmailModule] Handling sync request');
    // Sync implementation - could sync with server, update cache, etc.
  }

  async dispose(): Promise<void> {
    console.log('[EmailModule] Disposing');
    
    // Clean up event listeners
    if (this.eventBus) {
      this.eventBus.off('email:refresh');
      this.eventBus.off('email:sync');
    }
    
    // Clean up services
    this.gmailService = null;
    this.eventBus = null;
  }
}