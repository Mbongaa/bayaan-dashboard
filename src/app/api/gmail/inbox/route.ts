import { NextRequest, NextResponse } from 'next/server';
import { gmailTokenService } from '../../../services/databaseService';
import { gmailAuthService } from '../../../lib/gmail/GmailAuthService';
import { createGmailService } from '../../../lib/gmail/GmailService';

/**
 * GET /api/gmail/inbox?userId=xxx&maxResults=20&pageToken=xxx&query=xxx
 * Fetch Gmail inbox messages for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const maxResults = parseInt(searchParams.get('maxResults') || '20');
    const pageToken = searchParams.get('pageToken') || undefined;
    const query = searchParams.get('query') || undefined;

    // Validate parameters
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (maxResults < 1 || maxResults > 100) {
      return NextResponse.json(
        { error: 'maxResults must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Get user's Gmail tokens
    const { data: tokenData, error: tokenError } = 
      await gmailTokenService.getGmailToken(userId);

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { 
          error: 'Gmail account not connected',
          message: 'Please connect your Gmail account first'
        },
        { status: 401 }
      );
    }

    try {
      // Decrypt tokens and create Gmail service
      const tokens = gmailAuthService.decryptTokens(tokenData.encrypted_tokens);
      const gmailService = await createGmailService(tokens);

      // Fetch inbox messages
      const inboxData = await gmailService.getInboxMessages(maxResults, pageToken, query);

      // Update token if it was refreshed during the API call
      const freshTokens = await gmailAuthService.getValidTokens(tokens);
      if (JSON.stringify(freshTokens) !== JSON.stringify(tokens)) {
        const encryptedTokens = gmailAuthService.encryptTokens(freshTokens);
        await gmailTokenService.updateGmailToken(userId, {
          encrypted_tokens: encryptedTokens
        });
      }

      return NextResponse.json({
        success: true,
        inbox: inboxData,
        gmail: tokenData.gmail_email
      });

    } catch (serviceError) {
      console.error('Gmail service error:', serviceError);
      
      // Check if it's an authentication error
      if (serviceError instanceof Error && serviceError.message.includes('invalid_grant')) {
        // Token is invalid, mark connection as inactive
        await gmailTokenService.deleteGmailToken(userId);
        
        return NextResponse.json(
          { 
            error: 'Gmail authentication expired',
            message: 'Please reconnect your Gmail account',
            requiresReauth: true
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to fetch inbox',
          details: serviceError instanceof Error ? serviceError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Gmail inbox fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch Gmail inbox',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/gmail/inbox
 * Mark messages as read/unread or perform other actions
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, messageId, action } = body;

    // Validate parameters
    if (!userId || !messageId || !action) {
      return NextResponse.json(
        { error: 'userId, messageId, and action are required' },
        { status: 400 }
      );
    }

    const validActions = ['markRead', 'markUnread', 'archive', 'delete'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Get user's Gmail tokens
    const { data: tokenData, error: tokenError } = 
      await gmailTokenService.getGmailToken(userId);

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { 
          error: 'Gmail account not connected',
          message: 'Please connect your Gmail account first'
        },
        { status: 401 }
      );
    }

    try {
      // Decrypt tokens and create Gmail service
      const tokens = gmailAuthService.decryptTokens(tokenData.encrypted_tokens);
      const gmailService = await createGmailService(tokens);

      // Perform the requested action
      let result;
      switch (action) {
        case 'markRead':
          await gmailService.markAsRead(messageId);
          result = { message: 'Message marked as read' };
          break;
        case 'markUnread':
          await gmailService.markAsUnread(messageId);
          result = { message: 'Message marked as unread' };
          break;
        case 'archive':
          await gmailService.archiveMessage(messageId);
          result = { message: 'Message archived' };
          break;
        case 'delete':
          await gmailService.deleteMessage(messageId);
          result = { message: 'Message deleted' };
          break;
        default:
          throw new Error('Invalid action');
      }

      return NextResponse.json({
        success: true,
        ...result
      });

    } catch (serviceError) {
      console.error('Gmail action error:', serviceError);
      
      if (serviceError instanceof Error && serviceError.message.includes('invalid_grant')) {
        await gmailTokenService.deleteGmailToken(userId);
        
        return NextResponse.json(
          { 
            error: 'Gmail authentication expired',
            message: 'Please reconnect your Gmail account',
            requiresReauth: true
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to perform action',
          details: serviceError instanceof Error ? serviceError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Gmail action error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform Gmail action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}