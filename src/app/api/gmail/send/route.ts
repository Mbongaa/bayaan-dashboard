import { NextRequest, NextResponse } from 'next/server';
import { gmailTokenService } from '../../../services/databaseService';
import { gmailAuthService } from '../../../lib/gmail/GmailAuthService';
import { createGmailService, SendEmailRequest } from '../../../lib/gmail/GmailService';

/**
 * POST /api/gmail/send
 * Send email or reply to existing thread
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      to, 
      subject, 
      emailBody, 
      threadId, 
      replyTo, 
      inReplyTo 
    } = body;

    // Validate required parameters
    if (!userId || !to || !emailBody) {
      return NextResponse.json(
        { error: 'userId, to, and emailBody are required' },
        { status: 400 }
      );
    }

    // Validate email format (basic validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      );
    }

    // Validate body length (Gmail has limits)
    if (emailBody.length > 25 * 1024 * 1024) { // 25MB limit
      return NextResponse.json(
        { error: 'Email body too large (max 25MB)' },
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

      // Prepare email request
      const emailRequest: SendEmailRequest = {
        to,
        subject: subject || '(No Subject)',
        body: emailBody,
        threadId: threadId || undefined,
        replyTo: replyTo || undefined,
        inReplyTo: inReplyTo || undefined
      };

      // Send the email
      const result = await gmailService.sendReply(emailRequest);

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
        message: threadId ? 'Reply sent successfully' : 'Email sent successfully',
        messageId: result.id,
        threadId: result.threadId,
        sentTo: to,
        sentFrom: tokenData.gmail_email
      });

    } catch (serviceError) {
      console.error('Gmail send error:', serviceError);
      
      // Check if it's an authentication error
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

      // Check for quota exceeded
      if (serviceError instanceof Error && serviceError.message.includes('quotaExceeded')) {
        return NextResponse.json(
          { 
            error: 'Gmail quota exceeded',
            message: 'You have reached your Gmail API quota limit. Please try again later.',
            retryAfter: 3600 // Suggest retry after 1 hour
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to send email',
          details: serviceError instanceof Error ? serviceError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Gmail send API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gmail/send/thread?userId=xxx&threadId=xxx
 * Get thread messages for composing replies
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const threadId = searchParams.get('threadId');

    // Validate parameters
    if (!userId || !threadId) {
      return NextResponse.json(
        { error: 'userId and threadId are required' },
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
      const threadMessages = await gmailService.getThreadMessages(threadId);

      return NextResponse.json({
        success: true,
        thread: {
          id: threadId,
          messages: threadMessages,
          messageCount: threadMessages.length
        }
      });

    } catch (serviceError) {
      console.error('Gmail thread fetch error:', serviceError);
      
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
          error: 'Failed to fetch thread',
          details: serviceError instanceof Error ? serviceError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Gmail thread API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch thread',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}