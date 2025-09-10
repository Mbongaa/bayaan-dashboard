import { gmail_v1, google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GmailTokens, gmailAuthService } from './GmailAuthService';

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId?: string;
  internalDate: string;
  payload: gmail_v1.Schema$MessagePart;
  sizeEstimate: number;
  raw?: string;
}

export interface ParsedMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: {
    text?: string;
    html?: string;
  };
  attachments: EmailAttachment[];
  isRead: boolean;
  isImportant: boolean;
  timestamp: number;
}

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
}

export interface InboxResponse {
  messages: ParsedMessage[];
  nextPageToken?: string;
  resultSizeEstimate: number;
}

export interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  threadId?: string;
  replyTo?: string;
  inReplyTo?: string;
}

/**
 * Gmail Service
 * Handles all Gmail API operations
 */
export class GmailService {
  private gmail: gmail_v1.Gmail;
  private auth: OAuth2Client;

  constructor(tokens: GmailTokens) {
    this.auth = gmailAuthService.getAuthenticatedClient(tokens);
    this.gmail = google.gmail({ version: 'v1', auth: this.auth });
  }

  /**
   * Get inbox messages with pagination
   */
  async getInboxMessages(maxResults: number = 20, pageToken?: string, query?: string): Promise<InboxResponse> {
    try {
      const searchQuery = query ? `in:inbox ${query}` : 'in:inbox';
      
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: searchQuery,
        maxResults,
        pageToken
      });

      if (!response.data.messages) {
        return {
          messages: [],
          nextPageToken: response.data.nextPageToken || undefined,
          resultSizeEstimate: response.data.resultSizeEstimate || 0
        };
      }

      // Fetch detailed information for each message in parallel
      const messageDetails = await Promise.all(
        response.data.messages.map(async (message) => {
          return await this.getMessageDetails(message.id!);
        })
      );

      return {
        messages: messageDetails,
        nextPageToken: response.data.nextPageToken || undefined,
        resultSizeEstimate: response.data.resultSizeEstimate || 0
      };
    } catch (error) {
      throw new Error(`Failed to fetch inbox messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get detailed message information
   */
  async getMessageDetails(messageId: string): Promise<ParsedMessage> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const message = response.data;
      if (!message.payload) {
        throw new Error('Message payload not found');
      }

      const headers = message.payload.headers || [];
      const isRead = !message.labelIds?.includes('UNREAD');
      const isImportant = message.labelIds?.includes('IMPORTANT') || false;

      return {
        id: message.id!,
        threadId: message.threadId!,
        labelIds: message.labelIds || [],
        snippet: message.snippet || '',
        subject: this.getHeader(headers, 'Subject') || '(No Subject)',
        from: this.getHeader(headers, 'From') || '',
        to: this.getHeader(headers, 'To') || '',
        date: this.getHeader(headers, 'Date') || '',
        body: this.extractBody(message.payload),
        attachments: this.extractAttachments(message.payload),
        isRead,
        isImportant,
        timestamp: parseInt(message.internalDate || '0')
      };
    } catch (error) {
      throw new Error(`Failed to fetch message details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get thread messages (conversation)
   */
  async getThreadMessages(threadId: string): Promise<ParsedMessage[]> {
    try {
      const response = await this.gmail.users.threads.get({
        userId: 'me',
        id: threadId,
        format: 'full'
      });

      if (!response.data.messages) {
        return [];
      }

      return response.data.messages.map((message) => {
        const headers = message.payload?.headers || [];
        const isRead = !message.labelIds?.includes('UNREAD');
        const isImportant = message.labelIds?.includes('IMPORTANT') || false;

        return {
          id: message.id!,
          threadId: message.threadId!,
          labelIds: message.labelIds || [],
          snippet: message.snippet || '',
          subject: this.getHeader(headers, 'Subject') || '(No Subject)',
          from: this.getHeader(headers, 'From') || '',
          to: this.getHeader(headers, 'To') || '',
          date: this.getHeader(headers, 'Date') || '',
          body: this.extractBody(message.payload!),
          attachments: this.extractAttachments(message.payload!),
          isRead,
          isImportant,
          timestamp: parseInt(message.internalDate || '0')
        };
      }).sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp
    } catch (error) {
      throw new Error(`Failed to fetch thread messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send email reply
   */
  async sendReply(request: SendEmailRequest): Promise<{ id: string; threadId?: string }> {
    try {
      const emailContent = this.buildEmailMessage(request);
      const encodedMessage = Buffer.from(emailContent)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const sendRequest: gmail_v1.Params$Resource$Users$Messages$Send = {
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      };

      if (request.threadId) {
        sendRequest.requestBody!.threadId = request.threadId;
      }

      const response = await this.gmail.users.messages.send(sendRequest);

      return {
        id: response.data.id!,
        threadId: response.data.threadId
      };
    } catch (error) {
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      });
    } catch (error) {
      throw new Error(`Failed to mark message as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mark message as unread
   */
  async markAsUnread(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: ['UNREAD']
        }
      });
    } catch (error) {
      throw new Error(`Failed to mark message as unread: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Archive message
   */
  async archiveMessage(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['INBOX']
        }
      });
    } catch (error) {
      throw new Error(`Failed to archive message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.delete({
        userId: 'me',
        id: messageId
      });
    } catch (error) {
      throw new Error(`Failed to delete message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search messages
   */
  async searchMessages(query: string, maxResults: number = 20): Promise<ParsedMessage[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults
      });

      if (!response.data.messages) {
        return [];
      }

      // Fetch detailed information for each message
      const messageDetails = await Promise.all(
        response.data.messages.map(async (message) => {
          return await this.getMessageDetails(message.id!);
        })
      );

      return messageDetails;
    } catch (error) {
      throw new Error(`Failed to search messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's Gmail profile
   */
  async getProfile(): Promise<{ emailAddress: string; messagesTotal: number; threadsTotal: number }> {
    try {
      const response = await this.gmail.users.getProfile({
        userId: 'me'
      });

      return {
        emailAddress: response.data.emailAddress!,
        messagesTotal: response.data.messagesTotal || 0,
        threadsTotal: response.data.threadsTotal || 0
      };
    } catch (error) {
      throw new Error(`Failed to get Gmail profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods

  private getHeader(headers: gmail_v1.Schema$MessagePartHeader[], name: string): string | undefined {
    const header = headers.find(h => h.name?.toLowerCase() === name.toLowerCase());
    return header?.value || undefined;
  }

  private extractBody(payload: gmail_v1.Schema$MessagePart): { text?: string; html?: string } {
    const body: { text?: string; html?: string } = {};

    const extractFromPart = (part: gmail_v1.Schema$MessagePart): void => {
      if (part.body?.data) {
        const content = Buffer.from(part.body.data, 'base64').toString('utf-8');
        
        if (part.mimeType === 'text/plain') {
          body.text = content;
        } else if (part.mimeType === 'text/html') {
          body.html = content;
        }
      }

      if (part.parts) {
        part.parts.forEach(extractFromPart);
      }
    };

    extractFromPart(payload);
    return body;
  }

  private extractAttachments(payload: gmail_v1.Schema$MessagePart): EmailAttachment[] {
    const attachments: EmailAttachment[] = [];

    const extractFromPart = (part: gmail_v1.Schema$MessagePart): void => {
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType || 'application/octet-stream',
          size: part.body.size || 0,
          attachmentId: part.body.attachmentId
        });
      }

      if (part.parts) {
        part.parts.forEach(extractFromPart);
      }
    };

    extractFromPart(payload);
    return attachments;
  }

  private buildEmailMessage(request: SendEmailRequest): string {
    const lines = [
      `To: ${request.to}`,
      `Subject: ${request.replyTo ? 'Re: ' : ''}${request.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 7bit'
    ];

    if (request.inReplyTo) {
      lines.push(`In-Reply-To: ${request.inReplyTo}`);
      lines.push(`References: ${request.inReplyTo}`);
    }

    lines.push('', request.body);

    return lines.join('\r\n');
  }
}

/**
 * Factory function to create Gmail service instance
 */
export async function createGmailService(tokens: GmailTokens): Promise<GmailService> {
  // Ensure tokens are valid and refresh if needed
  const validTokens = await gmailAuthService.getValidTokens(tokens);
  return new GmailService(validTokens);
}