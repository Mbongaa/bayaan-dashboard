import React, { useEffect, useState } from 'react';
import { foundationServices } from '../../foundation/services/FoundationServices';

/**
 * WebRTC Service Test Component
 * 
 * A simple component to test that our WebRTC service is properly initialized
 * and working. This runs alongside the existing implementation without
 * interfering with it.
 */
interface WebRTCServiceTestProps {
  useImprovedGalaxy?: boolean;
  setUseImprovedGalaxy?: (value: boolean) => void;
}

export function WebRTCServiceTest({ useImprovedGalaxy, setUseImprovedGalaxy }: WebRTCServiceTestProps) {
  const [healthStatus, setHealthStatus] = useState(foundationServices.getHealthStatus());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark as client-side rendered
    setIsClient(true);
    
    // Update health status every 5 seconds
    const interval = setInterval(() => {
      setHealthStatus(foundationServices.getHealthStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        minWidth: '200px'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>🔧 Foundation Services</div>
      
      <div style={{ marginBottom: '3px' }}>
        <span style={{ color: healthStatus.isInitialized ? '#4ade80' : '#f87171' }}>●</span>
        {' '}Initialized: {healthStatus.isInitialized ? 'Yes' : 'No'}
      </div>
      
      <div style={{ marginBottom: '3px' }}>
        <span style={{ color: '#60a5fa' }}>●</span>
        {' '}WebGL Contexts: {healthStatus.webgl.totalContexts}
      </div>
      
      <div style={{ marginBottom: '3px' }}>
        <span style={{ 
          color: healthStatus.webrtc.status === 'CONNECTED' ? '#4ade80' : 
                healthStatus.webrtc.status === 'CONNECTING' ? '#fbbf24' : 
                '#f87171' 
        }}>●</span>
        {' '}WebRTC: {healthStatus.webrtc.status}
      </div>
      
      <div style={{ marginBottom: '3px' }}>
        <span style={{ color: '#a78bfa' }}>●</span>
        {' '}Event Listeners: {healthStatus.eventBus.totalListeners}
      </div>
      
      {setUseImprovedGalaxy && isClient && (
        <div style={{ marginTop: '5px', paddingTop: '5px', borderTop: '1px solid #374151' }}>
          <button
            onClick={() => setUseImprovedGalaxy(!useImprovedGalaxy)}
            style={{
              background: useImprovedGalaxy ? '#059669' : '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              padding: '4px 8px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            {useImprovedGalaxy ? '⚠️ Improved Galaxy (Debug)' : '✅ Original Galaxy'}
          </button>
        </div>
      )}
      
      <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>
        Service Layer Active
      </div>
    </div>
  );
}

export default WebRTCServiceTest;