'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { ParsedMessage } from '../../lib/gmail/GmailService';

interface GmailModuleProps {
  userId: string;
  onConnectionChange?: (connected: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}

interface GmailStatus {
  connected: boolean;
  gmailEmail?: string;
  isValid?: boolean;
  error?: string;
  requiresReauth?: boolean;
}

interface ComposeState {
  isOpen: boolean;
  to: string;
  subject: string;
  body: string;
  replyToId?: string;
  threadId?: string;
}

export function GmailModule({ userId, onConnectionChange, className, style }: GmailModuleProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Enhanced debug logging
  useEffect(() => {
    console.log('📧 GmailModule Debug:', {
      userId: userId,
      hasUserId: !!userId,
      typeOfUserId: typeof userId,
      timestamp: new Date().toISOString()
    });
  }, [userId]);
  
  // State
  const [status, setStatus] = useState<GmailStatus>({ connected: false });
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ParsedMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true); // Start as true to show loading
  const [error, setError] = useState<string>('');
  const [compose, setCompose] = useState<ComposeState>({
    isOpen: false,
    to: '',
    subject: '',
    body: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [nextPageToken, setNextPageToken] = useState<string>('');
  
  // Refs for managing intervals and initialization
  const refreshInterval = useRef<NodeJS.Timeout>();
  const authCheckRef = useRef<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);
  const checkStatusRef = useRef<(() => Promise<boolean>) | null>(null);
  const fetchInboxRef = useRef<((pageToken?: string, query?: string) => Promise<void>) | null>(null);

  // Wait for client-side mount
  useEffect(() => {
    setMounted(true);
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, []);

  // Theme-aware colors
  const isDark = mounted ? (resolvedTheme === 'dark') : false;
  const colors = {
    text: {
      primary: isDark ? '#f3f4f6' : '#1f2937',
      secondary: isDark ? '#d1d5db' : '#374151',
      muted: isDark ? '#9ca3af' : '#6b7280',
    },
    background: {
      card: isDark ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
      hover: isDark ? 'rgba(55, 65, 81, 0.3)' : 'rgba(156, 163, 175, 0.3)',
      selected: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
      button: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
    },
    border: {
      default: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(156, 163, 175, 0.6)',
      active: isDark ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.6)',
    }
  };

  // Check Gmail connection status
  const checkStatus = useCallback(async () => {
    if (!userId || authCheckRef.current) return false;
    authCheckRef.current = true;

    try {
      const response = await fetch(`/api/gmail/status?userId=${userId}`);
      const data = await response.json();
      
      setStatus({
        connected: data.connected || false,
        gmailEmail: data.gmailEmail,
        isValid: data.isValid,
        error: data.error,
        requiresReauth: data.requiresReauth
      });

      onConnectionChange?.(data.connected || false);

      // Return the connection status
      return data.connected && !data.requiresReauth;
    } catch (err) {
      console.error('Error checking Gmail status:', err);
      setStatus({ 
        connected: false, 
        error: 'Failed to check connection status' 
      });
      return false;
    } finally {
      authCheckRef.current = false;
    }
  }, [userId, onConnectionChange]);

  // Fetch inbox messages
  const fetchInbox = useCallback(async (pageToken?: string, query?: string) => {
    if (!userId) return;
    
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        userId,
        maxResults: '20'
      });
      
      if (pageToken) params.set('pageToken', pageToken);
      if (query) params.set('query', query);

      const response = await fetch(`/api/gmail/inbox?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch inbox');
      }

      if (data.success && data.inbox) {
        if (pageToken) {
          // Append to existing messages for pagination
          setMessages(prev => [...prev, ...data.inbox.messages]);
        } else {
          // Replace messages for fresh fetch
          setMessages(data.inbox.messages || []);
        }
        setNextPageToken(data.inbox.nextPageToken || '');
      }
    } catch (err) {
      console.error('Error fetching inbox:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch inbox');
      
      if (err instanceof Error && err.message.includes('expired')) {
        setStatus(prev => ({ ...prev, requiresReauth: true }));
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Handle OAuth authentication
  const handleAuthenticate = async () => {
    if (!userId) {
      console.error('❌ Cannot authenticate: userId is undefined');
      setError('User authentication required. Please log in first.');
      return;
    }

    console.log('📧 Starting OAuth flow with userId:', userId);

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/gmail/auth?userId=${userId}`);
      const data = await response.json();
      console.log('📧 OAuth initiation response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate authentication');
      }

      if (data.authUrl) {
        // Open OAuth flow in new window
        const popup = window.open(
          data.authUrl,
          'gmailAuth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        // Listen for OAuth completion
        const checkAuthComplete = setInterval(() => {
          try {
            if (popup?.closed) {
              clearInterval(checkAuthComplete);
              // Check if auth completed successfully
              setTimeout(() => {
                checkStatus().then(isConnected => {
                  if (isConnected) {
                    fetchInbox();
                  }
                });
              }, 1000);
            }
          } catch (e) {
            // Cross-origin error means popup is still open
          }
        }, 1000);

        // Handle message from OAuth callback
        const handleAuthMessage = async (event: MessageEvent) => {
          // Security: Validate origin to prevent cross-site attacks
          if (event.origin !== window.location.origin) {
            console.log('Ignoring message from different origin:', event.origin);
            return;
          }
          
          console.log('📧 Received postMessage:', {
            type: event.data?.type,
            hasData: !!event.data,
            dataKeys: event.data ? Object.keys(event.data) : []
          });
          
          if (event.data?.type === 'GMAIL_AUTH_SUCCESS') {
            console.log('Received OAuth success message:', event.data);
            clearInterval(checkAuthComplete);
            popup?.close();
            window.removeEventListener('message', handleAuthMessage);
            
            // Extract OAuth data
            const { code, state, userId: messageUserId } = event.data;
            
            // Add detailed logging for debugging
            console.log('📧 OAuth data validation:', {
              hasCode: !!code,
              hasState: !!state,
              messageUserId: messageUserId || 'undefined',
              currentUserId: userId || 'undefined',
              userIdMatch: messageUserId === userId,
              codeLength: code?.length || 0,
              stateFormat: state || 'undefined'
            });
            
            if (code && state && messageUserId === userId) {
              try {
                setLoading(true);
                console.log('📧 Exchanging OAuth code for tokens...');
                console.log('📧 Sending to /api/gmail/auth:', { 
                  code: code.substring(0, 10) + '...', 
                  state, 
                  userId: messageUserId 
                });
                
                const response = await fetch('/api/gmail/auth', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ code, state, userId: messageUserId })
                });
                
                const data = await response.json();
                console.log('📧 Token exchange response:', data);
                
                if (data.success) {
                  console.log('✅ Gmail account connected successfully');
                  // Check status to update UI
                  const isConnected = await checkStatus();
                  if (isConnected) {
                    await fetchInbox();
                  }
                } else {
                  console.error('❌ Token exchange failed:', data);
                  setError(data.error || 'Failed to complete authentication');
                }
              } catch (err) {
                console.error('❌ OAuth token exchange error:', err);
                setError('Failed to complete authentication');
              } finally {
                setLoading(false);
              }
            } else {
              // Log the actual mismatch details
              const mismatchReason = !code ? 'Missing authorization code' :
                                   !state ? 'Missing state parameter' :
                                   !messageUserId ? 'Missing user ID from OAuth' :
                                   !userId ? 'No user ID in component' :
                                   messageUserId !== userId ? `User ID mismatch: OAuth(${messageUserId}) vs Component(${userId})` :
                                   'Unknown validation error';
              
              console.error('❌ OAuth data mismatch:', {
                code: code ? 'present' : 'missing',
                state: state ? 'present' : 'missing',
                messageUserId: messageUserId || 'missing',
                expectedUserId: userId || 'missing',
                reason: mismatchReason
              });
              
              setError(`Authentication failed: ${mismatchReason}`);
            }
          } else if (event.data?.type === 'GMAIL_AUTH_ERROR') {
            console.error('❌ Received OAuth error message:', event.data);
            clearInterval(checkAuthComplete);
            popup?.close();
            window.removeEventListener('message', handleAuthMessage);
            setError(event.data.errorDescription || event.data.error || 'Authentication failed');
          }
        };

        window.addEventListener('message', handleAuthMessage);
      }
    } catch (err) {
      console.error('Error initiating OAuth:', err);
      setError(err instanceof Error ? err.message : 'Failed to start authentication');
    } finally {
      setLoading(false);
    }
  };

  // Send email/reply
  const sendEmail = async () => {
    if (!userId || !compose.to || !compose.body) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          to: compose.to,
          subject: compose.subject,
          emailBody: compose.body,
          threadId: compose.threadId,
          inReplyTo: compose.replyToId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      if (data.success) {
        // Clear compose form
        setCompose({
          isOpen: false,
          to: '',
          subject: '',
          body: ''
        });
        
        // Refresh inbox to show sent email
        await fetchInbox();
      }
    } catch (err) {
      console.error('Error sending email:', err);
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  // Mark message as read
  const markAsRead = async (messageId: string) => {
    if (!userId) return;

    try {
      const response = await fetch('/api/gmail/inbox', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          messageId,
          action: 'markRead'
        })
      });

      if (response.ok) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, isRead: true } : msg
        ));
      }
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  // Reply to message
  const replyToMessage = (message: ParsedMessage) => {
    setCompose({
      isOpen: true,
      to: message.from,
      subject: message.subject.startsWith('Re:') ? message.subject : `Re: ${message.subject}`,
      body: `\n\n--- Original Message ---\nFrom: ${message.from}\nDate: ${message.date}\nSubject: ${message.subject}\n\n${message.body.text || message.body.html || ''}`,
      threadId: message.threadId,
      replyToId: message.id
    });
  };

  // Search messages
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      fetchInbox(undefined, query.trim());
    } else {
      fetchInbox(); // Reset to inbox
    }
  };

  // Store stable references to functions
  useEffect(() => {
    checkStatusRef.current = checkStatus;
    fetchInboxRef.current = fetchInbox;
  }, [checkStatus, fetchInbox]);

  // Reset initialization flag when userId changes
  useEffect(() => {
    // Reset the flag when user changes
    return () => {
      isInitializedRef.current = false;
    };
  }, [userId]);

  // Initialize and check status ONLY ONCE per userId
  useEffect(() => {
    if (mounted && userId && !isInitializedRef.current) {
      isInitializedRef.current = true;
      
      // Use the ref versions to avoid dependency issues
      const doInitialCheck = async () => {
        setIsCheckingStatus(true); // Start checking
        try {
          if (checkStatusRef.current && fetchInboxRef.current) {
            const isConnected = await checkStatusRef.current();
            if (isConnected) {
              await fetchInboxRef.current();
            }
          }
        } finally {
          setIsCheckingStatus(false); // Done checking, show actual state
        }
      };
      
      doInitialCheck();
    } else if (mounted && !userId) {
      // If there's no userId, we're definitely not connected
      setIsCheckingStatus(false);
    }
  }, [mounted, userId]); // Only depend on mounted and userId, not the functions

  // Set up periodic refresh (separate effect with minimal dependencies)
  useEffect(() => {
    if (mounted && userId && status.connected) {
      // Clear any existing interval
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
      
      // Set up new interval
      refreshInterval.current = setInterval(() => {
        // Use the ref version to avoid stale closure
        if (fetchInboxRef.current) {
          fetchInboxRef.current();
        }
      }, 60000); // Refresh every minute
      
      // Cleanup on dependency change or unmount
      return () => {
        if (refreshInterval.current) {
          clearInterval(refreshInterval.current);
        }
      };
    }
  }, [mounted, userId, status.connected]); // Remove fetchInbox dependency

  // Handle URL parameters for OAuth callback
  useEffect(() => {
    if (mounted) {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('gmail_code');
      const state = urlParams.get('gmail_state');
      const gmailUserId = urlParams.get('gmail_user_id');

      if (code && state && gmailUserId === userId) {
        // Complete OAuth flow
        fetch('/api/gmail/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state, userId })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            checkStatus().then(isConnected => {
              if (isConnected) {
                fetchInbox();
              }
            });
          } else {
            setError(data.error || 'Authentication failed');
          }
        })
        .catch(err => {
          console.error('OAuth completion error:', err);
          setError('Authentication failed');
        });

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [mounted, userId, checkStatus]);

  if (!mounted) {
    return <div style={{ ...style }} className={className}>Loading...</div>;
  }

  return (
    <div 
      className={className}
      style={{
        ...style,
        backgroundColor: colors.background.card,
        border: `1px solid ${colors.border.default}`,
        borderRadius: '24px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        borderBottom: `1px solid ${colors.border.default}`,
        paddingBottom: '12px'
      }}>
        <div>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: colors.text.primary
          }}>
            Gmail
          </h3>
          {status.gmailEmail && (
            <p style={{
              margin: 0,
              fontSize: '12px',
              color: colors.text.muted,
              marginTop: '2px'
            }}>
              {status.gmailEmail}
            </p>
          )}
        </div>
        
        {status.connected ? (
          <button
            onClick={() => setCompose(prev => ({ ...prev, isOpen: !prev.isOpen }))}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              borderRadius: '12px',
              border: `1px solid ${colors.border.active}`,
              backgroundColor: colors.background.button,
              color: colors.text.primary,
              cursor: 'pointer'
            }}
          >
            Compose
          </button>
        ) : (
          <button
            onClick={handleAuthenticate}
            disabled={loading}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              borderRadius: '12px',
              border: `1px solid ${colors.border.active}`,
              backgroundColor: '#3b82f6',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Connecting...' : 'Connect Gmail'}
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '14px',
          color: '#ef4444'
        }}>
          {error}
        </div>
      )}

      {/* Loading State - Show while checking initial connection */}
      {isCheckingStatus && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          color: colors.text.muted
        }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Checking Gmail connection...
          </p>
        </div>
      )}

      {/* Authentication Required - Only show after we've checked and confirmed no connection */}
      {!isCheckingStatus && !status.connected && !loading && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          color: colors.text.muted
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
          <h4 style={{ margin: '0 0 8px 0', color: colors.text.primary }}>
            Connect Your Gmail Account
          </h4>
          <p style={{ margin: 0, fontSize: '14px', maxWidth: '200px' }}>
            Connect your Gmail account to read and send emails from your Bayaan dashboard.
          </p>
        </div>
      )}

      {/* Main Content - Only show after checking is complete and we're connected */}
      {!isCheckingStatus && status.connected && (
        <>
          {/* Search Bar */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: `1px solid ${colors.border.default}`,
                borderRadius: '8px',
                backgroundColor: colors.background.card,
                color: colors.text.primary,
                outline: 'none'
              }}
            />
          </div>

          {/* Compose Form */}
          <AnimatePresence>
            {compose.isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{
                  backgroundColor: colors.background.hover,
                  border: `1px solid ${colors.border.default}`,
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="email"
                    placeholder="To:"
                    value={compose.to}
                    onChange={(e) => setCompose(prev => ({ ...prev, to: e.target.value }))}
                    style={{
                      padding: '8px 12px',
                      fontSize: '14px',
                      border: `1px solid ${colors.border.default}`,
                      borderRadius: '6px',
                      backgroundColor: colors.background.card,
                      color: colors.text.primary,
                      outline: 'none'
                    }}
                  />
                  
                  <input
                    type="text"
                    placeholder="Subject:"
                    value={compose.subject}
                    onChange={(e) => setCompose(prev => ({ ...prev, subject: e.target.value }))}
                    style={{
                      padding: '8px 12px',
                      fontSize: '14px',
                      border: `1px solid ${colors.border.default}`,
                      borderRadius: '6px',
                      backgroundColor: colors.background.card,
                      color: colors.text.primary,
                      outline: 'none'
                    }}
                  />
                  
                  <textarea
                    placeholder="Type your message..."
                    value={compose.body}
                    onChange={(e) => setCompose(prev => ({ ...prev, body: e.target.value }))}
                    rows={4}
                    style={{
                      padding: '8px 12px',
                      fontSize: '14px',
                      border: `1px solid ${colors.border.default}`,
                      borderRadius: '6px',
                      backgroundColor: colors.background.card,
                      color: colors.text.primary,
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={sendEmail}
                      disabled={loading || !compose.to || !compose.body}
                      style={{
                        padding: '8px 16px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        cursor: loading || !compose.to || !compose.body ? 'not-allowed' : 'pointer',
                        opacity: loading || !compose.to || !compose.body ? 0.6 : 1
                      }}
                    >
                      {loading ? 'Sending...' : 'Send'}
                    </button>
                    
                    <button
                      onClick={() => setCompose(prev => ({ ...prev, isOpen: false }))}
                      style={{
                        padding: '8px 16px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        border: `1px solid ${colors.border.default}`,
                        backgroundColor: colors.background.button,
                        color: colors.text.primary,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages List */}
          <div style={{ 
            flex: 1, 
            overflow: 'auto',
            display: 'flex',
            flexDirection: selectedMessage ? 'row' : 'column',
            gap: '16px'
          }}>
            {/* Message List */}
            <div style={{ 
              flex: selectedMessage ? '1' : 'none',
              minWidth: selectedMessage ? '200px' : 'auto'
            }}>
              {loading && messages.length === 0 ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: colors.text.muted
                }}>
                  Loading emails...
                </div>
              ) : messages.length === 0 ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: colors.text.muted
                }}>
                  No emails found
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => {
                        setSelectedMessage(message);
                        if (!message.isRead) {
                          markAsRead(message.id);
                        }
                      }}
                      style={{
                        padding: '12px',
                        backgroundColor: selectedMessage?.id === message.id 
                          ? colors.background.selected 
                          : message.isRead 
                            ? colors.background.card 
                            : colors.background.hover,
                        border: `1px solid ${colors.border.default}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '4px'
                      }}>
                        <span style={{
                          fontWeight: message.isRead ? 400 : 600,
                          color: colors.text.primary,
                          fontSize: '13px'
                        }}>
                          {message.from.split('<')[0].trim() || message.from}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          color: colors.text.muted,
                          flexShrink: 0,
                          marginLeft: '8px'
                        }}>
                          {new Date(message.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div style={{
                        fontWeight: message.isRead ? 400 : 500,
                        color: colors.text.primary,
                        fontSize: '12px',
                        marginBottom: '4px'
                      }}>
                        {message.subject}
                      </div>
                      
                      <div style={{
                        color: colors.text.muted,
                        fontSize: '11px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {message.snippet}
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Load More Button */}
                  {nextPageToken && (
                    <button
                      onClick={() => fetchInbox(nextPageToken, searchQuery || undefined)}
                      disabled={loading}
                      style={{
                        padding: '8px 16px',
                        fontSize: '12px',
                        borderRadius: '8px',
                        border: `1px solid ${colors.border.default}`,
                        backgroundColor: colors.background.button,
                        color: colors.text.primary,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1
                      }}
                    >
                      {loading ? 'Loading...' : 'Load More'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Message Detail */}
            {selectedMessage && (
              <div style={{
                flex: '2',
                minWidth: '300px',
                backgroundColor: colors.background.card,
                border: `1px solid ${colors.border.default}`,
                borderRadius: '12px',
                padding: '16px',
                overflow: 'auto'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      margin: '0 0 8px 0',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: colors.text.primary
                    }}>
                      {selectedMessage.subject}
                    </h4>
                    <p style={{
                      margin: '0 0 4px 0',
                      fontSize: '14px',
                      color: colors.text.secondary
                    }}>
                      From: {selectedMessage.from}
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: '12px',
                      color: colors.text.muted
                    }}>
                      {selectedMessage.date}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => replyToMessage(selectedMessage)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '11px',
                        borderRadius: '6px',
                        border: `1px solid ${colors.border.active}`,
                        backgroundColor: colors.background.button,
                        color: colors.text.primary,
                        cursor: 'pointer'
                      }}
                    >
                      Reply
                    </button>
                    
                    <button
                      onClick={() => setSelectedMessage(null)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '11px',
                        borderRadius: '6px',
                        border: `1px solid ${colors.border.default}`,
                        backgroundColor: colors.background.button,
                        color: colors.text.primary,
                        cursor: 'pointer'
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div style={{
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: colors.text.primary,
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedMessage.body.text || selectedMessage.body.html || 'No content available'}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}