import { NextRequest } from 'next/server';

/**
 * GET /api/gmail/auth/callback
 * OAuth 2.0 callback endpoint - returns HTML that posts message to parent window
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Extract user ID from state (format: userId-timestamp-random)
    // The userId is a UUID that contains hyphens, so we need to be careful with splitting
    // We'll extract everything before the timestamp (which is a long number)
    let userId = null;
    if (state) {
      const parts = state.split('-');
      // The UUID has 5 parts (8-4-4-4-12 chars), timestamp is after that
      // So we take the first 5 parts and join them back
      if (parts.length >= 7) { // UUID (5 parts) + timestamp + random
        userId = parts.slice(0, 5).join('-');
      } else {
        // Fallback: try to extract based on timestamp pattern
        const timestampIndex = parts.findIndex(part => /^\d{13}/.test(part));
        if (timestampIndex > 0) {
          userId = parts.slice(0, timestampIndex).join('-');
        }
      }
    }
    
    console.log('📧 OAuth callback - Extracted userId:', userId, 'from state:', state);

    // Create HTML response that posts message to parent window
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Completing Gmail Authorization...</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            backdrop-filter: blur(10px);
          }
          .spinner {
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="spinner"></div>
          <p>${error ? 'Authentication failed' : 'Completing authentication...'}</p>
          <p style="font-size: 0.9em; opacity: 0.8;">You can close this window if it doesn't close automatically.</p>
        </div>
        <script>
          // Prepare the message payload
          const params = {
            code: ${JSON.stringify(code)},
            state: ${JSON.stringify(state)},
            error: ${JSON.stringify(error)},
            errorDescription: ${JSON.stringify(errorDescription)},
            userId: ${JSON.stringify(userId)}
          };
          
          // Security: Check if we have a parent window (popup scenario)
          if (window.opener && window.opener !== window) {
            try {
              // Send message to parent window with OAuth data
              window.opener.postMessage({
                type: params.error ? 'GMAIL_AUTH_ERROR' : 'GMAIL_AUTH_SUCCESS',
                ...params
              }, window.location.origin);
              
              console.log('OAuth message sent to parent window');
            } catch (e) {
              console.error('Failed to send message to parent window:', e);
            }
          } else {
            // Fallback: redirect if no parent window (direct navigation scenario)
            console.log('No parent window detected, using fallback redirect');
            const url = new URL('/dashboard', window.location.origin);
            
            if (params.code) {
              url.searchParams.set('gmail_code', params.code);
              url.searchParams.set('gmail_state', params.state);
              url.searchParams.set('gmail_user_id', params.userId);
            } else if (params.error) {
              url.searchParams.set('gmail_error', params.errorDescription || params.error);
            }
            
            // Redirect after a short delay to show the message
            setTimeout(() => {
              window.location.href = url.toString();
            }, 1000);
          }
          
          // Attempt to close the popup window after sending message
          setTimeout(() => {
            try {
              window.close();
            } catch (e) {
              console.log('Window close blocked by browser');
            }
          }, 500);
        </script>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: { 
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
    });

  } catch (error) {
    console.error('Gmail OAuth callback error:', error);
    
    // Return error HTML
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>Authentication Error</title></head>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'GMAIL_AUTH_ERROR',
              error: 'Authentication callback failed',
              errorDescription: ${JSON.stringify(error instanceof Error ? error.message : 'Unknown error')}
            }, window.location.origin);
          }
          setTimeout(() => window.close(), 500);
        </script>
      </body>
      </html>
    `;
    
    return new Response(errorHtml, {
      headers: { 'Content-Type': 'text/html' },
      status: 500
    });
  }
}