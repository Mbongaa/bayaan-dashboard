import { NextRequest, NextResponse } from 'next/server';
import { gmailTokenService } from '../../../services/databaseService';
import { gmailAuthService } from '../../../lib/gmail/GmailAuthService';

/**
 * GET /api/gmail/status?userId=xxx
 * Check Gmail connection status for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user has active Gmail connection
    const { data: hasConnection, error: connectionError } = 
      await gmailTokenService.hasActiveGmailConnection(userId);

    if (connectionError) {
      console.error('Error checking Gmail connection:', connectionError);
      return NextResponse.json(
        { 
          connected: false,
          error: 'Failed to check connection status',
          details: connectionError.message
        },
        { status: 500 }
      );
    }

    if (!hasConnection) {
      return NextResponse.json({
        connected: false,
        gmailEmail: null,
        message: 'No Gmail account connected'
      });
    }

    // Get Gmail token details
    const { data: tokenData, error: tokenError } = 
      await gmailTokenService.getGmailToken(userId);

    if (tokenError || !tokenData) {
      console.error('Error fetching Gmail token:', tokenError);
      return NextResponse.json(
        {
          connected: false,
          error: 'Failed to retrieve Gmail connection details',
          details: tokenError?.message
        },
        { status: 500 }
      );
    }

    try {
      // Decrypt and validate tokens
      const tokens = gmailAuthService.decryptTokens(tokenData.encrypted_tokens);
      const isValid = gmailAuthService.isTokenValid(tokens);

      return NextResponse.json({
        connected: true,
        gmailEmail: tokenData.gmail_email,
        isValid,
        connectedAt: tokenData.created_at,
        lastUpdated: tokenData.updated_at
      });

    } catch (decryptError) {
      console.error('Error decrypting Gmail tokens:', decryptError);
      
      // Token is corrupted or expired, mark as inactive
      await gmailTokenService.deleteGmailToken(userId);
      
      return NextResponse.json({
        connected: false,
        gmailEmail: null,
        error: 'Gmail connection expired or corrupted',
        message: 'Please reconnect your Gmail account'
      });
    }

  } catch (error) {
    console.error('Gmail status check error:', error);
    return NextResponse.json(
      { 
        connected: false,
        error: 'Failed to check Gmail status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gmail/status
 * Disconnect Gmail account (revoke access)
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get current tokens to revoke them with Google
    const { data: tokenData } = await gmailTokenService.getGmailToken(userId);
    
    if (tokenData) {
      try {
        const tokens = gmailAuthService.decryptTokens(tokenData.encrypted_tokens);
        // Revoke tokens with Google
        await gmailAuthService.revokeTokens(tokens.access_token);
      } catch (revokeError) {
        console.warn('Failed to revoke tokens with Google:', revokeError);
        // Continue with local deletion even if Google revocation fails
      }
    }

    // Delete/deactivate tokens in our database
    const { data: success, error: deleteError } = 
      await gmailTokenService.deleteGmailToken(userId);

    if (deleteError || !success) {
      console.error('Error deleting Gmail token:', deleteError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to disconnect Gmail account',
          details: deleteError?.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Gmail account disconnected successfully'
    });

  } catch (error) {
    console.error('Gmail disconnect error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to disconnect Gmail account',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}