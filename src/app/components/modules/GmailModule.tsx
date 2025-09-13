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
  const [searchExpanded, setSearchExpanded] = useState(false);
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
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        // Silently handle API not available - this is expected if Gmail isn't configured
        setStatus({ 
          connected: false, 
          error: 'Gmail service not available' 
        });
        return false;
      }
      
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
      // Silently handle network errors - don't spam console
      // This is expected if the API isn't running
      setStatus({ 
        connected: false, 
        error: 'Gmail service unavailable' 
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
      
      if (!response.ok) {
        // Silently handle API errors
        setError('Gmail service unavailable');
        return;
      }
      
      const data = await response.json();

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
      // Silently handle network errors
      setError('Unable to connect to Gmail');
      
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

  // Handle email selection events from VA
  useEffect(() => {
    if (!mounted) return;

    const handleEmailSelect = (event: CustomEvent) => {
      console.log('📧 Email select event received:', event.detail);
      const { messageId } = event.detail;
      
      // Find the message in the current list
      const message = messages.find(m => m.id === messageId);
      if (message) {
        setSelectedMessage(message);
        // Mark as read if unread
        if (!message.isRead) {
          markAsRead(messageId);
        }
      } else {
        console.log('📧 Message not found in current list:', messageId);
        // Optionally, you could fetch the specific message here
      }
    };

    // Listen for email:select events from the EventBus
    window.addEventListener('email:select', handleEmailSelect as EventListener);
    
    return () => {
      window.removeEventListener('email:select', handleEmailSelect as EventListener);
    };
  }, [mounted, messages, markAsRead]);

  if (!mounted) {
    return <div style={{ ...style }} className={className}>Loading...</div>;
  }

  return (
    <div 
      className={className}
      style={{
        ...style,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden', // Keep container hidden, but allow child scrolling
        position: 'relative' // Ensure proper positioning context
        // No background, border, or padding - let grid cell handle it
      }}
    >
      {/* Minimal Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '12px',
        marginBottom: '12px'
        // No border - just spacing for visual separation
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flex: 1
        }}>
          <span style={{
            margin: 0,
            fontSize: '11px',
            fontWeight: 500,
            color: colors.text.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            opacity: 0.7
          }}>
            Gmail
          </span>
          {status.gmailEmail && (
            <>
              <span style={{
                margin: 0,
                fontSize: '11px',
                color: colors.text.muted,
                opacity: 0.5
              }}>
                •
              </span>
              <span style={{
                margin: 0,
                fontSize: '11px',
                color: colors.text.muted,
                opacity: 0.6
              }}>
                {status.gmailEmail}
              </span>
            </>
          )}
          
          {/* Search functionality - integrated into header */}
          {status.connected && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginLeft: '12px',
              flex: 1
            }}>
              <AnimatePresence mode="wait">
                {!searchExpanded ? (
                  <motion.button
                    key="search-icon"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setSearchExpanded(true)}
                    style={{
                      padding: '4px',
                      fontSize: '14px',
                      background: 'none',
                      border: 'none',
                      color: colors.text.muted,
                      cursor: 'pointer',
                      opacity: 0.6,
                      transition: 'opacity 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.6';
                    }}
                    title="Search emails"
                  >
                    🔍
                  </motion.button>
                ) : (
                  <motion.div
                    key="search-bar"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '180px', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      position: 'relative'
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      onBlur={() => {
                        // Only collapse if search is empty
                        if (!searchQuery) {
                          setTimeout(() => setSearchExpanded(false), 200);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setSearchQuery('');
                          handleSearch('');
                          setSearchExpanded(false);
                        }
                      }}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '4px 24px 4px 8px',
                        fontSize: '11px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                        color: colors.text.primary,
                        outline: 'none'
                      }}
                    />
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        handleSearch('');
                        setSearchExpanded(false);
                      }}
                      style={{
                        position: 'absolute',
                        right: '4px',
                        padding: '2px',
                        fontSize: '10px',
                        background: 'none',
                        border: 'none',
                        color: colors.text.muted,
                        cursor: 'pointer',
                        opacity: 0.5,
                        transition: 'opacity 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.5';
                      }}
                    >
                      ✕
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
        
        {status.connected ? (
          <button
            onClick={() => setCompose(prev => ({ ...prev, isOpen: !prev.isOpen }))}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              color: colors.text.primary,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontWeight: 500
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
            }}
          >
            Compose
          </button>
        ) : (
          <button
            onClick={handleAuthenticate}
            disabled={loading}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: '#3b82f6',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.15s ease',
              fontWeight: 500
            }}
          >
            {loading ? 'Connecting...' : 'Connect'}
          </button>
        )}
      </div>

      {/* Error Display - Minimal */}
      {error && (
        <div style={{
          padding: '8px',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          borderRadius: '4px',
          marginBottom: '12px',
          fontSize: '11px',
          color: '#ef4444'
        }}>
          {error}
        </div>
      )}

      {/* Loading State - Minimal */}
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
          <p style={{ margin: 0, fontSize: '11px', opacity: 0.6 }}>
            Connecting...
          </p>
        </div>
      )}

      {/* Authentication Required - Minimal */}
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
          <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>✉️</div>
          <p style={{ margin: 0, fontSize: '11px', opacity: 0.6 }}>
            Connect Gmail to get started
          </p>
        </div>
      )}

      {/* Main Content - Only show after checking is complete and we're connected */}
      {!isCheckingStatus && status.connected && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          overflow: 'auto', // Allow this container to scroll when needed
          maxHeight: 'calc(100% - 38px)' // Account for more compact header height
        }}>

          {/* Compose Form - Minimal overlay */}
          <AnimatePresence>
            {compose.isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{
                  backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '12px',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="email"
                    placeholder="To"
                    value={compose.to}
                    onChange={(e) => setCompose(prev => ({ ...prev, to: e.target.value }))}
                    style={{
                      padding: '6px 8px',
                      fontSize: '12px',
                      border: 'none',
                      borderRadius: '4px',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                      color: colors.text.primary,
                      outline: 'none'
                    }}
                  />
                  
                  <input
                    type="text"
                    placeholder="Subject"
                    value={compose.subject}
                    onChange={(e) => setCompose(prev => ({ ...prev, subject: e.target.value }))}
                    style={{
                      padding: '6px 8px',
                      fontSize: '12px',
                      border: 'none',
                      borderRadius: '4px',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                      color: colors.text.primary,
                      outline: 'none'
                    }}
                  />
                  
                  <textarea
                    placeholder="Message"
                    value={compose.body}
                    onChange={(e) => setCompose(prev => ({ ...prev, body: e.target.value }))}
                    rows={3}
                    style={{
                      padding: '6px 8px',
                      fontSize: '12px',
                      border: 'none',
                      borderRadius: '4px',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                      color: colors.text.primary,
                      outline: 'none',
                      resize: 'vertical',
                      minHeight: '60px'
                    }}
                  />
                  
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={sendEmail}
                      disabled={loading || !compose.to || !compose.body}
                      style={{
                        padding: '6px 12px',
                        fontSize: '11px',
                        borderRadius: '20px',
                        border: 'none',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        cursor: loading || !compose.to || !compose.body ? 'not-allowed' : 'pointer',
                        opacity: loading || !compose.to || !compose.body ? 0.6 : 1,
                        fontWeight: 500
                      }}
                    >
                      {loading ? 'Sending...' : 'Send'}
                    </button>
                    
                    <button
                      onClick={() => setCompose(prev => ({ ...prev, isOpen: false }))}
                      style={{
                        padding: '6px 12px',
                        fontSize: '11px',
                        borderRadius: '20px',
                        border: 'none',
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                        color: colors.text.primary,
                        cursor: 'pointer',
                        fontWeight: 500
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
            minHeight: 0, // Critical: allows flex item to shrink below content
            overflow: 'visible', // Changed to visible to allow proper scrolling
            display: 'flex',
            flexDirection: selectedMessage ? 'row' : 'column',
            gap: '16px'
          }}>
            {/* Message List */}
            <div 
              onMouseDown={(e) => {
                // Only stop propagation if it's not a scroll action
                const target = e.target as HTMLElement;
                const scrollableElement = e.currentTarget as HTMLElement;
                // Check if the element has scrollable content
                if (scrollableElement.scrollHeight > scrollableElement.clientHeight) {
                  // Allow scroll, but prevent drag on the scrollbar area
                  const rect = scrollableElement.getBoundingClientRect();
                  const scrollbarWidth = scrollableElement.offsetWidth - scrollableElement.clientWidth;
                  // If clicking on scrollbar area, don't stop propagation
                  if (e.clientX > rect.right - scrollbarWidth - 5) {
                    return; // Allow scrollbar interaction
                  }
                }
                e.stopPropagation(); // Prevent grid drag for content area
              }}
              onTouchStart={(e) => {
                // Allow touch scrolling
                const touch = e.touches[0];
                const startY = touch.clientY;
                let lastY = startY;
                
                const handleTouchMove = (moveEvent: TouchEvent) => {
                  const currentTouch = moveEvent.touches[0];
                  const deltaY = currentTouch.clientY - lastY;
                  lastY = currentTouch.clientY;
                  
                  // If significant vertical movement, it's a scroll gesture
                  if (Math.abs(currentTouch.clientY - startY) > 5) {
                    // Allow scroll, don't stop propagation
                    return;
                  }
                };
                
                const handleTouchEnd = () => {
                  document.removeEventListener('touchmove', handleTouchMove);
                  document.removeEventListener('touchend', handleTouchEnd);
                };
                
                document.addEventListener('touchmove', handleTouchMove, { passive: true });
                document.addEventListener('touchend', handleTouchEnd);
                
                // Only prevent grid drag if not scrolling
                if (Math.abs(touch.clientY - startY) < 5) {
                  e.stopPropagation();
                }
              }}
              style={{ 
                flex: 1, // Always use 1, not 'none'
                minWidth: selectedMessage ? '200px' : 'auto',
                overflow: 'auto', // Scrolling happens here
                minHeight: 0, // Allow shrinking
                pointerEvents: 'auto', // Ensure pointer events work
                WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
                scrollBehavior: 'smooth' // Smooth scrolling
              }}>
              {loading && messages.length === 0 ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: colors.text.muted,
                  fontSize: '11px',
                  opacity: 0.6
                }}>
                  Loading...
                </div>
              ) : messages.length === 0 ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: colors.text.muted,
                  fontSize: '11px',
                  opacity: 0.6
                }}>
                  No emails
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      onClick={(e) => {
                        // Don't stop propagation for clicks - just handle the click
                        setSelectedMessage(message);
                        if (!message.isRead) {
                          markAsRead(message.id);
                        }
                      }}
                      onMouseDown={(e) => {
                        // Only stop drag, not scroll
                        if (e.button === 0) { // Left click only
                          e.stopPropagation();
                        }
                      }}
                      style={{
                        padding: '8px 4px',
                        backgroundColor: selectedMessage?.id === message.id 
                          ? (isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)')
                          : 'rgba(0, 0, 0, 0)',
                        borderLeft: selectedMessage?.id === message.id 
                          ? '2px solid #3b82f6'
                          : '2px solid transparent',
                        cursor: 'pointer',
                        fontSize: '13px',
                        transition: 'background-color 0.15s ease',
                        marginLeft: '-2px' // Compensate for border
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDark 
                          ? 'rgba(255, 255, 255, 0.02)' 
                          : 'rgba(0, 0, 0, 0.02)';
                      }}
                      onMouseLeave={(e) => {
                        if (selectedMessage?.id !== message.id) {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0)';
                        }
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '2px'
                      }}>
                        <span style={{
                          fontWeight: message.isRead ? 400 : 500,
                          color: message.isRead ? colors.text.secondary : colors.text.primary,
                          fontSize: '12px',
                          opacity: message.isRead ? 0.8 : 1
                        }}>
                          {message.from.split('<')[0].trim() || message.from}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          color: colors.text.muted,
                          flexShrink: 0,
                          marginLeft: '8px',
                          opacity: 0.6
                        }}>
                          {new Date(message.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div style={{
                        fontWeight: message.isRead ? 400 : 450,
                        color: message.isRead ? colors.text.secondary : colors.text.primary,
                        fontSize: '11px',
                        marginBottom: '2px',
                        opacity: message.isRead ? 0.8 : 1
                      }}>
                        {message.subject}
                      </div>
                      
                      <div style={{
                        color: colors.text.muted,
                        fontSize: '10px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        opacity: 0.6
                      }}>
                        {message.snippet}
                      </div>
                    </div>
                  ))}
                  
                  {/* Load More Button - Minimal */}
                  {nextPageToken && (
                    <button
                      onClick={() => fetchInbox(nextPageToken, searchQuery || undefined)}
                      disabled={loading}
                      style={{
                        padding: '6px 12px',
                        fontSize: '11px',
                        borderRadius: '20px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: colors.text.muted,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1,
                        textAlign: 'center',
                        width: '100%',
                        marginTop: '8px',
                        transition: 'opacity 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.6';
                      }}
                    >
                      {loading ? '...' : '↓ More'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Message Detail - Minimal design */}
            {selectedMessage && (
              <div style={{
                flex: '2',
                minWidth: '300px',
                minHeight: 0, // Allow shrinking for proper scrolling
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '12px',
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
        </div>
      )}
    </div>
  );
}