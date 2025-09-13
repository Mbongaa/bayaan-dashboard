import { 
  IModulePlugin, 
  ModuleDescriptor 
} from '@/app/foundation/types/ModuleTypes';
import { EventBus } from '@/app/foundation/services/EventBus';

/**
 * Mock Email Module Plugin for testing and development
 * This is a client-safe version that doesn't require server-side dependencies
 */
export class MockEmailModulePlugin implements IModulePlugin {
  private eventBus: EventBus | null = null;
  
  // Mock data storage
  private mockEmails: any[] = [
    {
      id: 'mock-1',
      threadId: 'thread-1',
      subject: 'Welcome to the Module System',
      from: 'system@example.com',
      to: 'user@example.com',
      date: new Date().toISOString(),
      snippet: 'This is a demonstration of the new module system...',
      isRead: false,
      isImportant: true,
      body: {
        text: 'This is a demonstration of the new module system. You can search, read, and manage emails through voice commands.',
        html: '<p>This is a demonstration of the new module system. You can search, read, and manage emails through voice commands.</p>'
      }
    },
    {
      id: 'mock-2',
      threadId: 'thread-2',
      subject: 'Meeting Tomorrow at 3 PM',
      from: 'colleague@example.com',
      to: 'user@example.com',
      date: new Date(Date.now() - 3600000).toISOString(),
      snippet: 'Don\'t forget about our meeting tomorrow...',
      isRead: true,
      isImportant: false,
      body: {
        text: 'Don\'t forget about our meeting tomorrow at 3 PM in the conference room.',
        html: '<p>Don\'t forget about our meeting tomorrow at 3 PM in the conference room.</p>'
      }
    },
    {
      id: 'mock-3',
      threadId: 'thread-3',
      subject: 'Project Update Required',
      from: 'manager@example.com',
      to: 'user@example.com',
      date: new Date(Date.now() - 7200000).toISOString(),
      snippet: 'Please provide an update on the current project status...',
      isRead: false,
      isImportant: true,
      body: {
        text: 'Please provide an update on the current project status by end of day.',
        html: '<p>Please provide an update on the current project status by end of day.</p>'
      }
    }
  ];
  
  descriptor: ModuleDescriptor = {
    id: 'email',
    name: 'Mock Email Module',
    version: '1.0.0',
    description: 'Mock email module for testing - simulates email operations without server dependencies',
    capabilities: [
      {
        name: 'search',
        description: 'Search mock emails by query',
        parameters: [
          {
            name: 'query',
            type: 'string',
            description: 'Search query (e.g., "is:unread", "from:manager")',
            required: true
          },
          {
            name: 'maxResults',
            type: 'number',
            description: 'Maximum number of results',
            required: false
          }
        ],
        returns: {
          type: 'array',
          description: 'Array of mock email objects'
        },
        examples: [
          {
            description: 'Search for unread emails',
            input: { query: 'is:unread' },
            output: [{ id: 'mock-1', subject: 'Welcome to the Module System' }]
          }
        ]
      },
      {
        name: 'getInbox',
        description: 'Get mock inbox emails',
        parameters: [
          {
            name: 'maxResults',
            type: 'number',
            description: 'Maximum number of emails',
            required: false
          }
        ],
        returns: {
          type: 'object',
          description: 'Mock inbox response'
        }
      },
      {
        name: 'send',
        description: 'Simulate sending an email',
        parameters: [
          {
            name: 'to',
            type: 'string',
            description: 'Recipient email',
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
          }
        ],
        returns: {
          type: 'object',
          description: 'Send confirmation'
        }
      },
      {
        name: 'markAsRead',
        description: 'Mark mock emails as read',
        parameters: [
          {
            name: 'messageIds',
            type: 'array',
            description: 'Array of message IDs',
            required: true
          }
        ],
        returns: {
          type: 'object',
          description: 'Update confirmation'
        }
      },
      {
        name: 'getMessageDetails',
        description: 'Get details of a specific mock email',
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
          description: 'Email details'
        }
      }
    ],
    events: {
      emits: [
        'email:sent',
        'email:marked',
        'email:search:completed'
      ],
      listens: [
        'email:refresh',
        'email:sync'
      ]
    }
  };

  async initialize(services: any): Promise<void> {
    console.log('[MockEmailModule] Initializing');
    this.eventBus = services.eventBus;
    
    // Set up event listeners
    this.eventBus.on('email:refresh', this.handleRefresh.bind(this));
    this.eventBus.on('email:sync', this.handleSync.bind(this));
    
    console.log('[MockEmailModule] Initialized with', this.mockEmails.length, 'mock emails');
  }

  async executeOperation(operation: string, params: any): Promise<any> {
    console.log('[MockEmailModule] Executing operation:', operation, params);
    
    switch (operation) {
      case 'search':
        return this.searchEmails(params);
      
      case 'getInbox':
        return this.getInbox(params);
      
      case 'send':
        return this.sendEmail(params);
      
      case 'markAsRead':
        return this.markAsRead(params);
      
      case 'getMessageDetails':
        return this.getMessageDetails(params);
      
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  private searchEmails(params: any): any[] {
    const { query, maxResults = 10 } = params;
    let results = [...this.mockEmails];
    
    // Simple query parsing
    if (query.includes('is:unread')) {
      results = results.filter(e => !e.isRead);
    }
    if (query.includes('is:important')) {
      results = results.filter(e => e.isImportant);
    }
    if (query.includes('from:')) {
      const fromMatch = query.match(/from:(\S+)/);
      if (fromMatch) {
        const fromEmail = fromMatch[1];
        results = results.filter(e => e.from.includes(fromEmail));
      }
    }
    
    // Limit results
    results = results.slice(0, maxResults);
    
    // Emit event
    this.eventBus!.emit('email:search:completed', {
      query,
      resultCount: results.length
    });
    
    return results;
  }

  private getInbox(params: any): any {
    const { maxResults = 20 } = params;
    const messages = this.mockEmails.slice(0, maxResults);
    
    return {
      messages,
      nextPageToken: null,
      resultSizeEstimate: this.mockEmails.length
    };
  }

  private sendEmail(params: any): any {
    const { to, subject, body } = params;
    
    // Create a new mock email
    const newEmail = {
      id: `mock-${Date.now()}`,
      threadId: `thread-${Date.now()}`,
      subject,
      from: 'user@example.com',
      to,
      date: new Date().toISOString(),
      snippet: body.substring(0, 100),
      isRead: true,
      isImportant: false,
      body: {
        text: body,
        html: `<p>${body}</p>`
      }
    };
    
    // Add to mock storage
    this.mockEmails.unshift(newEmail);
    
    // Emit event
    this.eventBus!.emit('email:sent', {
      to,
      subject,
      id: newEmail.id
    });
    
    return {
      id: newEmail.id,
      threadId: newEmail.threadId,
      success: true
    };
  }

  private markAsRead(params: any): any {
    const { messageIds } = params;
    let modifiedCount = 0;
    
    for (const id of messageIds) {
      const email = this.mockEmails.find(e => e.id === id);
      if (email && !email.isRead) {
        email.isRead = true;
        modifiedCount++;
      }
    }
    
    // Emit event
    this.eventBus!.emit('email:marked', {
      messageIds,
      read: true,
      count: modifiedCount
    });
    
    return {
      success: true,
      modifiedCount
    };
  }

  private getMessageDetails(params: any): any {
    const { messageId } = params;
    const email = this.mockEmails.find(e => e.id === messageId);
    
    if (!email) {
      throw new Error(`Email not found: ${messageId}`);
    }
    
    return email;
  }

  private handleRefresh(): void {
    console.log('[MockEmailModule] Refreshing mock emails');
    // Could add new mock emails or update existing ones
  }

  private handleSync(): void {
    console.log('[MockEmailModule] Syncing mock emails');
    // Simulate sync operation
  }

  async dispose(): Promise<void> {
    console.log('[MockEmailModule] Disposing');
    
    if (this.eventBus) {
      this.eventBus.off('email:refresh', this.handleRefresh.bind(this));
      this.eventBus.off('email:sync', this.handleSync.bind(this));
    }
    
    this.eventBus = null;
    this.mockEmails = [];
  }
}