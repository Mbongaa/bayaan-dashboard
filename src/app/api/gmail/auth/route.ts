import { NextRequest, NextResponse } from 'next/server';
import { gmailAuthService } from '../../../lib/gmail/GmailAuthService';
import { gmailTokenService } from '../../../services/databaseService';

/**
 * GET /api/gmail/auth
 * Initiates Gmail OAuth 2.0 authorization flow
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

    // Generate state parameter for security (CSRF protection)
    const state = `${userId}-${Date.now()}-${Math.random()}`;
    
    console.log('📧 OAuth initiation - userId:', userId, 'state:', state);
    
    // Get authorization URL
    const authUrl = gmailAuthService.getAuthorizationUrl(userId, state);

    return NextResponse.json({
      success: true,
      authUrl,
      state
    });

  } catch (error) {
    console.error('Gmail OAuth initiation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to initiate Gmail authentication',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gmail/auth
 * Handles OAuth callback and token exchange
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state, userId } = body;

    console.log('📧 Token exchange request received:', {
      hasCode: !!code,
      codeLength: code?.length || 0,
      state: state || 'missing',
      userId: userId || 'missing'
    });

    // Validate required parameters
    if (!code) {
      console.error('❌ Missing authorization code');
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      console.error('❌ Missing user ID');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate state parameter (basic validation)
    if (state && !state.startsWith(userId)) {
      console.error('❌ State validation failed:', {
        state,
        userId,
        startsWithUserId: state?.startsWith(userId)
      });
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      );
    }

    console.log('✅ Validation passed, exchanging code for tokens...');

    // Exchange authorization code for tokens
    const tokens = await gmailAuthService.exchangeCodeForTokens(code);

    // Get user info from Google to verify the account
    console.log('📧 Getting user info from Google...');
    const userInfo = await gmailAuthService.getUserInfo(tokens.access_token);
    console.log('📧 Google user info:', { email: userInfo.email, name: userInfo.name });

    // Encrypt tokens for secure storage
    const encryptedTokens = gmailAuthService.encryptTokens(tokens);
    console.log('📧 Tokens encrypted, storing in database...');

    // Store encrypted tokens in database
    const { data: storedToken, error: storeError } = await gmailTokenService.storeGmailToken({
      user_id: userId,
      encrypted_tokens: encryptedTokens,
      gmail_email: userInfo.email
    });

    if (storeError || !storedToken) {
      console.error('❌ Failed to store Gmail tokens:', storeError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to store Gmail credentials',
          details: storeError?.message 
        },
        { status: 500 }
      );
    }

    console.log('✅ Gmail tokens stored successfully for user:', userId);

    return NextResponse.json({
      success: true,
      message: 'Gmail account connected successfully',
      gmailEmail: userInfo.email,
      userName: userInfo.name
    });

  } catch (error) {
    console.error('Gmail OAuth callback error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to complete Gmail authentication',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}