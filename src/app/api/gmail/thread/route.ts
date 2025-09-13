import { NextRequest, NextResponse } from 'next/server';
import { gmailTokenService } from '../../../services/databaseService';
import { gmailAuthService } from '../../../lib/gmail/GmailAuthService';
import { createGmailService } from '../../../lib/gmail/GmailService';

/**
 * GET /api/gmail/thread?userId=xxx&threadId=xxx
 * Get all messages in a thread
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const threadId = searchParams.get('threadId');

    // Validate parameters
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
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

      // Get thread messages
      const messages = await gmailService.getThreadMessages(threadId);

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
        messages,
        threadId,
        messageCount: messages.length
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

      // Check if thread not found
      if (serviceError instanceof Error && serviceError.message.includes('not found')) {
        return NextResponse.json(
          { 
            error: 'Thread not found',
            threadId
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to get thread', details: serviceError },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Get thread error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}