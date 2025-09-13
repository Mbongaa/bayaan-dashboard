import { NextRequest, NextResponse } from 'next/server';
import { gmailTokenService } from '../../../services/databaseService';
import { gmailAuthService } from '../../../lib/gmail/GmailAuthService';
import { createGmailService } from '../../../lib/gmail/GmailService';

/**
 * POST /api/gmail/archive
 * Archive emails (remove from inbox)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, messageIds } = body;

    // Validate parameters
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { error: 'Message IDs array is required' },
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

      // Archive each message
      let archivedCount = 0;
      const errors: string[] = [];

      for (const messageId of messageIds) {
        try {
          await gmailService.archiveMessage(messageId);
          archivedCount++;
        } catch (error) {
          console.error(`Failed to archive message ${messageId}:`, error);
          errors.push(messageId);
        }
      }

      // Update token if it was refreshed during the API calls
      const freshTokens = await gmailAuthService.getValidTokens(tokens);
      if (JSON.stringify(freshTokens) !== JSON.stringify(tokens)) {
        const encryptedTokens = gmailAuthService.encryptTokens(freshTokens);
        await gmailTokenService.updateGmailToken(userId, {
          encrypted_tokens: encryptedTokens
        });
      }

      return NextResponse.json({
        success: true,
        archivedCount,
        totalRequested: messageIds.length,
        errors: errors.length > 0 ? errors : undefined
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
        { error: 'Failed to archive messages', details: serviceError },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Archive messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}