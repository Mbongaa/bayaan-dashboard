import { OAuth2Client } from 'google-auth-library';
import { Credentials } from 'google-auth-library';
import * as jwt from 'jsonwebtoken';

export interface GmailTokens {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expiry_date?: number | null;
  token_type?: string;
}

export interface StoredTokens {
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Gmail Authentication Service
 * Handles OAuth 2.0 flow for Gmail API access
 */
export class GmailAuthService {
  private oauth2Client: OAuth2Client;
  private readonly scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  constructor() {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Missing Google OAuth credentials in environment variables');
    }

    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/gmail/auth/callback'
    );
  }

  /**
   * Generate OAuth 2.0 authorization URL
   */
  getAuthorizationUrl(userId: string, state?: string): string {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes,
      state: state || userId,
      prompt: 'consent', // Force consent to ensure we get refresh token
      include_granted_scopes: true
    });

    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GmailTokens> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token) {
        throw new Error('No access token received from Google');
      }

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || undefined,
        id_token: tokens.id_token || undefined,
        expiry_date: tokens.expiry_date || null,
        token_type: tokens.token_type || 'Bearer'
      };
    } catch (error) {
      throw new Error(`Failed to exchange code for tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<GmailTokens> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      if (!credentials.access_token) {
        throw new Error('Failed to refresh access token');
      }

      return {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || refreshToken, // Keep original if not provided
        expiry_date: credentials.expiry_date || null,
        token_type: credentials.token_type || 'Bearer'
      };
    } catch (error) {
      throw new Error(`Failed to refresh access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user info from Google
   */
  async getUserInfo(accessToken: string): Promise<{ email: string; name: string; picture?: string }> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userInfo = await response.json();
      
      return {
        email: userInfo.email,
        name: userInfo.name || userInfo.email,
        picture: userInfo.picture
      };
    } catch (error) {
      throw new Error(`Failed to get user info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate and get fresh tokens
   */
  async getValidTokens(tokens: GmailTokens): Promise<GmailTokens> {
    const now = Date.now();
    const expiryTime = tokens.expiry_date;

    // If token expires in less than 5 minutes, refresh it
    if (expiryTime && (expiryTime - now < 300000) && tokens.refresh_token) {
      return await this.refreshAccessToken(tokens.refresh_token);
    }

    return tokens;
  }

  /**
   * Create authenticated OAuth2Client for Gmail API
   */
  getAuthenticatedClient(tokens: GmailTokens): OAuth2Client {
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const credentials: Credentials = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      token_type: tokens.token_type || 'Bearer'
    };

    client.setCredentials(credentials);
    return client;
  }

  /**
   * Revoke tokens (logout)
   */
  async revokeTokens(accessToken: string): Promise<void> {
    try {
      await this.oauth2Client.revokeToken(accessToken);
    } catch (error) {
      throw new Error(`Failed to revoke tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Encrypt tokens for secure storage
   */
  encryptTokens(tokens: GmailTokens): string {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured for token encryption');
    }

    return jwt.sign(tokens, process.env.JWT_SECRET, {
      expiresIn: '30d' // Token encryption expires in 30 days
    });
  }

  /**
   * Decrypt tokens from storage
   */
  decryptTokens(encryptedTokens: string): GmailTokens {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured for token decryption');
    }

    try {
      const decoded = jwt.verify(encryptedTokens, process.env.JWT_SECRET) as GmailTokens;
      return decoded;
    } catch (error) {
      throw new Error('Failed to decrypt tokens - tokens may be expired or invalid');
    }
  }

  /**
   * Check if tokens are valid
   */
  isTokenValid(tokens: GmailTokens): boolean {
    if (!tokens.access_token) return false;
    
    if (tokens.expiry_date) {
      const now = Date.now();
      // Consider token invalid if it expires in less than 1 minute
      return tokens.expiry_date > (now + 60000);
    }
    
    return true;
  }
}

// Export singleton instance
export const gmailAuthService = new GmailAuthService();