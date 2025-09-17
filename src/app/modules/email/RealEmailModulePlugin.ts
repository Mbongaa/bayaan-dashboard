import { 
  IModulePlugin, 
  ModuleDescriptor 
} from '@/app/foundation/types/ModuleTypes';
import { EventBus } from '@/app/foundation/services/EventBus';

/**
 * Real Email Module Plugin that connects to your existing Gmail API
 * This uses the same API routes that your GmailModule.tsx component uses
 */
export class RealEmailModulePlugin implements IModulePlugin {
  private eventBus: EventBus | null = null;
  private userId: string | null = null;
  
  // Email navigation state for VA
  private currentEmailId: string | null = null;
  private currentEmailList: any[] = [];
  private currentEmailIndex: number = 0;
  
  descriptor: ModuleDescriptor = {
    id: 'email',
    name: 'Gmail Module',
    version: '1.0.0',
    description: 'Real Gmail integration using your existing API routes',
    capabilities: [
      {
        name: 'search',
        description: 'Search emails in your Gmail inbox',
        parameters: [
          {
            name: 'query',
            type: 'string',
            description: 'Gmail search query (e.g., "is:unread", "from:john@example.com")',
            required: true
          },
          {
            name: 'maxResults',
            type: 'number',
            description: 'Maximum number of results (default: 20)',
            required: false
          }
        ],
        returns: {
          type: 'object',
          description: 'Search results from Gmail'
        },
        examples: [
          {
            description: 'Search for unread emails',
            input: { query: 'is:unread' },
            output: { success: true, messages: [] }
          }
        ]
      },
      {
        name: 'getInbox',
        description: 'Get emails from your Gmail inbox',
        parameters: [
          {
            name: 'maxResults',
            type: 'number',
            description: 'Maximum number of emails (default: 20)',
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
          description: 'Inbox messages with pagination'
        }
      },
      {
        name: 'send',
        description: 'Send an email through Gmail',
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
            description: 'Email body',
            required: true
          },
          {
            name: 'threadId',
            type: 'string',
            description: 'Thread ID for replies',
            required: false
          }
        ],
        returns: {
          type: 'object',
          description: 'Send confirmation'
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
          description: 'Update confirmation'
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
          description: 'Update confirmation'
        }
      },
      {
        name: 'archive',
        description: 'Archive emails',
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
          description: 'Archive confirmation'
        }
      },
      {
        name: 'getThread',
        description: 'Get full email thread',
        parameters: [
          {
            name: 'threadId',
            type: 'string',
            description: 'Thread ID',
            required: true
          }
        ],
        returns: {
          type: 'object',
          description: 'Thread messages'
        }
      },
      {
        name: 'checkStatus',
        description: 'Check Gmail connection status',
        parameters: [],
        returns: {
          type: 'object',
          description: 'Connection status'
        }
      },
      {
        name: 'selectEmail',
        description: 'Select and display a specific email in the UI without returning content',
        parameters: [
          {
            name: 'messageId',
            type: 'string',
            description: 'ID of the email to select in the UI',
            required: true
          }
        ],
        returns: {
          type: 'object',
          description: 'Selection confirmation'
        }
      },
      {
        name: 'viewEmail',
        description: 'Get simplified, voice-friendly content of a specific email',
        parameters: [
          {
            name: 'messageId',
            type: 'string',
            description: 'ID of the email to view',
            required: true
          }
        ],
        returns: {
          type: 'object',
          description: 'Simplified email content for voice'
        }
      },
      {
        name: 'getCurrentEmailState',
        description: 'Get the current email navigation state for VA context',
        parameters: [],
        returns: {
          type: 'object',
          description: 'Current navigation state including selected email'
        }
      },
      {
        name: 'getEmailSummary',
        description: 'Get a brief summary of emails without full content',
        parameters: [
          {
            name: 'maxResults',
            type: 'number',
            description: 'Maximum number of emails to summarize (default: 5)',
            required: false
          }
        ],
        returns: {
          type: 'object',
          description: 'Email summaries'
        }
      }
    ],
    events: {
      emits: [
        'email:sent',
        'email:marked',
        'email:archived',
        'email:search:completed',
        'email:thread:fetched',
        'email:status:checked',
        'email:select',
        'email:viewed'
      ],
      listens: [
        'email:refresh',
        'email:sync'
      ]
    }
  };

  async initialize(services: any): Promise<void> {
    console.log('[RealEmailModule] Initializing');
    
    this.eventBus = services.eventBus;
    
    // Get userId from services or use a default
    // In production, this should come from the authenticated user
    this.userId = services.userId || await this.getCurrentUserId();
    
    // Set up event listeners
    if (this.eventBus) {
      this.eventBus.on('email:refresh', this.handleRefresh.bind(this));
      this.eventBus.on('email:sync', this.handleSync.bind(this));
    }
    
    console.log('[RealEmailModule] Initialized with userId:', this.userId);
  }

  async executeOperation(operation: string, params: any): Promise<any> {
    console.log('[RealEmailModule] Executing operation:', operation, params);
    
    if (!this.userId) {
      // Try to get userId if not set
      this.userId = await this.getCurrentUserId();
      if (!this.userId) {
        throw new Error('User not authenticated');
      }
    }
    
    switch (operation) {
      case 'search':
        return this.searchEmails(params);
      
      case 'getInbox':
        return this.getInbox(params);
      
      case 'send':
        return this.sendEmail(params);
      
      case 'markAsRead':
        return this.markAsRead(params);
      
      case 'markAsUnread':
        return this.markAsUnread(params);
      
      case 'archive':
        return this.archiveEmails(params);
      
      case 'getThread':
        return this.getThread(params);
      
      case 'checkStatus':
        return this.checkStatus();
      
      case 'selectEmail':
        return this.selectEmail(params);
      
      case 'viewEmail':
        return this.viewEmail(params);
      
      case 'getCurrentEmailState':
        return this.getCurrentEmailState();
      
      case 'getEmailSummary':
        return this.getEmailSummary(params);
      
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  private async getCurrentUserId(): Promise<string | null> {
    try {
      // Import Supabase client
      const { createClient } = await import('@/app/utils/supabase/client');
      const supabase = createClient();
      
      // Get the current user
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('[RealEmailModule] Error getting user:', error);
        return null;
      }
      
      if (user) {
        console.log('[RealEmailModule] Got userId:', user.id);
        return user.id;
      }
    } catch (error) {
      console.error('[RealEmailModule] Failed to get userId:', error);
    }
    return null;
  }

  private async searchEmails(params: any): Promise<any> {
    const { query, maxResults = 20, includeHtml = false } = params;
    
    try {
      // Use the same API route your GmailModule uses
      const response = await fetch(
        `/api/gmail/inbox?userId=${this.userId}&query=${encodeURIComponent(query)}&maxResults=${maxResults}`
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to search emails');
      }
      
      const data = await response.json();
      let messages = data.inbox?.messages || [];
      
      // Strip HTML content for voice responses unless specifically requested
      if (!includeHtml) {
        messages = this.processMessagesForVoice(messages);
      }
      
      // Emit search completed event
      this.eventBus!.emit('email:search:completed', {
        query,
        resultCount: messages.length
      });
      
      return {
        success: true,
        messages,
        nextPageToken: data.inbox?.nextPageToken
      };
    } catch (error) {
      console.error('[RealEmailModule] Search failed:', error);
      throw error;
    }
  }

  private async getInbox(params: any): Promise<any> {
    const { maxResults = 20, pageToken, includeHtml = false } = params;
    
    try {
      let url = `/api/gmail/inbox?userId=${this.userId}&maxResults=${maxResults}`;
      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get inbox');
      }
      
      const data = await response.json();
      
      // Process messages to remove HTML unless specifically requested
      if (!includeHtml && data.inbox?.messages) {
        data.inbox.messages = this.processMessagesForVoice(data.inbox.messages);
      }
      
      // Update navigation state for VA
      if (data.inbox?.messages && data.inbox.messages.length > 0) {
        this.currentEmailList = data.inbox.messages;
        this.currentEmailIndex = 0;
        this.currentEmailId = data.inbox.messages[0].id;
        console.log('[RealEmailModule] Updated email list with', data.inbox.messages.length, 'emails');
      }
      
      return {
        success: true,
        inbox: data.inbox,
        gmail: data.gmail
      };
    } catch (error) {
      console.error('[RealEmailModule] Get inbox failed:', error);
      throw error;
    }
  }

  private async sendEmail(params: any): Promise<any> {
    const { to, subject, body, threadId } = params;
    
    try {
      const response = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          to,
          subject,
          body,
          threadId
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }
      
      const data = await response.json();
      
      // Emit sent event
      this.eventBus!.emit('email:sent', {
        to,
        subject,
        id: data.messageId
      });
      
      return {
        success: true,
        messageId: data.messageId,
        threadId: data.threadId
      };
    } catch (error) {
      console.error('[RealEmailModule] Send failed:', error);
      throw error;
    }
  }

  private async markAsRead(params: any): Promise<any> {
    const { messageIds } = params;
    
    try {
      // Call the mark API endpoint (we'll create this)
      const response = await fetch('/api/gmail/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          messageIds,
          markAsRead: true
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark as read');
      }
      
      const data = await response.json();
      
      // Emit marked event
      this.eventBus!.emit('email:marked', {
        messageIds,
        read: true,
        count: data.modifiedCount || messageIds.length
      });
      
      return {
        success: true,
        modifiedCount: data.modifiedCount || messageIds.length
      };
    } catch (error) {
      console.error('[RealEmailModule] Mark as read failed:', error);
      throw error;
    }
  }

  private async markAsUnread(params: any): Promise<any> {
    const { messageIds } = params;
    
    try {
      const response = await fetch('/api/gmail/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          messageIds,
          markAsRead: false
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark as unread');
      }
      
      const data = await response.json();
      
      // Emit marked event
      this.eventBus!.emit('email:marked', {
        messageIds,
        read: false,
        count: data.modifiedCount || messageIds.length
      });
      
      return {
        success: true,
        modifiedCount: data.modifiedCount || messageIds.length
      };
    } catch (error) {
      console.error('[RealEmailModule] Mark as unread failed:', error);
      throw error;
    }
  }

  private async archiveEmails(params: any): Promise<any> {
    const { messageIds } = params;
    
    try {
      const response = await fetch('/api/gmail/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          messageIds
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to archive');
      }
      
      const data = await response.json();
      
      // Emit archived event
      this.eventBus!.emit('email:archived', {
        messageIds,
        count: data.archivedCount || messageIds.length
      });
      
      return {
        success: true,
        archivedCount: data.archivedCount || messageIds.length
      };
    } catch (error) {
      console.error('[RealEmailModule] Archive failed:', error);
      throw error;
    }
  }

  private async getThread(params: any): Promise<any> {
    const { threadId } = params;
    
    try {
      const response = await fetch(
        `/api/gmail/thread?userId=${this.userId}&threadId=${threadId}`
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get thread');
      }
      
      const data = await response.json();
      
      // Emit thread fetched event
      this.eventBus!.emit('email:thread:fetched', {
        threadId,
        messageCount: data.messages?.length || 0
      });
      
      return {
        success: true,
        messages: data.messages || []
      };
    } catch (error) {
      console.error('[RealEmailModule] Get thread failed:', error);
      throw error;
    }
  }

  private async checkStatus(): Promise<any> {
    try {
      const response = await fetch(`/api/gmail/status?userId=${this.userId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to check status');
      }
      
      const data = await response.json();
      
      // Emit status checked event
      this.eventBus!.emit('email:status:checked', data);
      
      return {
        success: true,
        connected: data.connected,
        email: data.gmailEmail,
        isValid: data.isValid
      };
    } catch (error) {
      console.error('[RealEmailModule] Status check failed:', error);
      throw error;
    }
  }

  private async selectEmail(params: any): Promise<any> {
    const { messageId } = params;
    
    try {
      // Update navigation state
      this.currentEmailId = messageId;
      
      // Find the index of this email in our list
      const index = this.currentEmailList.findIndex(email => email.id === messageId);
      if (index !== -1) {
        this.currentEmailIndex = index;
        console.log('[RealEmailModule] Updated navigation - email', index + 1, 'of', this.currentEmailList.length);
      }
      
      // Emit select event to update UI via EventBus
      this.eventBus!.emit('email:select', { messageId });
      
      // CRITICAL: Also dispatch to window for UI components to actually open the email
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('email:select', {
          detail: { messageId },
          bubbles: true,
          cancelable: true
        }));
      }
      
      console.log('[RealEmailModule] Email selected and opened:', messageId);
      
      return {
        success: true,
        message: 'Email selected and opened in the interface',
        messageId,
        position: index !== -1 ? `${index + 1} of ${this.currentEmailList.length}` : null
      };
    } catch (error) {
      console.error('[RealEmailModule] Select email failed:', error);
      throw error;
    }
  }

  private async viewEmail(params: any): Promise<any> {
    const { messageId } = params;
    
    try {
      // First try to find the email in our cached list
      let email = this.currentEmailList.find(e => e.id === messageId);
      
      // If not in cache or we need full content, fetch it
      if (!email || !email.body) {
        const response = await fetch(
          `/api/gmail/inbox?userId=${this.userId}&messageId=${messageId}`
        );
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to get email');
        }
        
        const data = await response.json();
        email = data.inbox?.messages?.[0];
      }
      
      if (!email) {
        throw new Error('Email not found');
      }
      
      // Strip HTML and prepare voice-friendly content
      const textContent = email.body?.text || this.stripHtml(email.body?.html || '');
      const truncatedContent = this.truncateForVoice(textContent);
      
      // Emit viewed event
      this.eventBus!.emit('email:viewed', { messageId });
      
      return {
        success: true,
        email: {
          id: email.id,
          from: email.from,
          subject: email.subject,
          date: email.date,
          snippet: email.snippet,
          content: truncatedContent,
          isTruncated: textContent.length > 500
        }
      };
    } catch (error) {
      console.error('[RealEmailModule] View email failed:', error);
      throw error;
    }
  }

  private async getCurrentEmailState(): Promise<any> {
    return {
      success: true,
      currentEmailId: this.currentEmailId,
      currentEmailIndex: this.currentEmailIndex,
      totalEmails: this.currentEmailList.length,
      hasEmails: this.currentEmailList.length > 0,
      currentEmail: this.currentEmailId ? 
        this.currentEmailList.find(e => e.id === this.currentEmailId) : null,
      position: this.currentEmailList.length > 0 ? 
        `${this.currentEmailIndex + 1} of ${this.currentEmailList.length}` : 'No emails loaded'
    };
  }

  private async getEmailSummary(params: any): Promise<any> {
    const { maxResults = 5 } = params;
    
    try {
      // Get inbox without HTML content
      const response = await fetch(
        `/api/gmail/inbox?userId=${this.userId}&maxResults=${maxResults}`
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get inbox');
      }
      
      const data = await response.json();
      const messages = data.inbox?.messages || [];
      
      // Create summaries without HTML
      const summaries = messages.map((msg: any) => ({
        id: msg.id,
        from: msg.from?.split('<')[0]?.trim() || msg.from,
        subject: msg.subject,
        date: msg.date,
        snippet: msg.snippet,
        isRead: msg.isRead
      }));
      
      return {
        success: true,
        summaries,
        count: summaries.length
      };
    } catch (error) {
      console.error('[RealEmailModule] Get email summary failed:', error);
      throw error;
    }
  }

  /**
   * Strip HTML tags and return plain text
   * @param html HTML content to strip
   * @returns Plain text content
   */
  private stripHtml(html: string): string {
    if (!html) return '';
    
    // Remove style and script tags with their content
    let text = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    
    // Replace common HTML entities
    text = text
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'");
    
    // Replace line breaks with actual line breaks
    text = text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n');
    
    // Remove all remaining HTML tags
    text = text.replace(/<[^>]+>/g, '');
    
    // Clean up excessive whitespace
    text = text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
    
    return text;
  }

  /**
   * Truncate content for voice response
   * @param text Text to truncate
   * @param maxLength Maximum length (default 500)
   * @returns Truncated text
   */
  private truncateForVoice(text: string, maxLength: number = 500): string {
    if (!text || text.length <= maxLength) {
      return text;
    }
    
    // Try to cut at a sentence boundary
    const truncated = text.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastQuestion = truncated.lastIndexOf('?');
    const lastExclamation = truncated.lastIndexOf('!');
    
    const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);
    
    if (lastSentenceEnd > maxLength * 0.7) {
      return text.substring(0, lastSentenceEnd + 1);
    }
    
    // Otherwise cut at word boundary
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  /**
   * Process messages to remove HTML content for voice responses
   * @param messages Array of messages
   * @returns Messages with HTML stripped
   */
  private processMessagesForVoice(messages: any[]): any[] {
    return messages.map(msg => ({
      ...msg,
      body: {
        text: msg.body?.text || this.stripHtml(msg.body?.html || ''),
        // Don't include HTML in voice responses
        html: undefined
      }
    }));
  }

  private async handleRefresh(): Promise<void> {
    console.log('[RealEmailModule] Refreshing inbox');
    // Trigger a refresh of the inbox
    await this.getInbox({ maxResults: 20 });
  }

  private async handleSync(): Promise<void> {
    console.log('[RealEmailModule] Syncing with Gmail');
    // Could implement full sync logic here
  }

  async dispose(): Promise<void> {
    console.log('[RealEmailModule] Disposing');
    
    if (this.eventBus) {
      this.eventBus.off('email:refresh');
      this.eventBus.off('email:sync');
    }
    
    this.eventBus = null;
    this.userId = null;
  }
}