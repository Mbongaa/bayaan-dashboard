import React, { useEffect, useState } from 'react';
import { foundationServices } from '../../foundation/services/FoundationServices';
import { useWebRTCService } from '../../foundation/hooks/useWebRTCService';

/**
 * Service Layer Demo Component
 * 
 * Demonstrates how dashboard components can safely use the service layer
 * without interfering with foundation components like Galaxy and Audio3DOrb
 */
export function ServiceLayerDemo() {
  const [isVisible, setIsVisible] = useState(false);
  const [serviceHealth, setServiceHealth] = useState(foundationServices.getHealthStatus());

  // Use WebRTC service for status monitoring (without interfering with main session)
  const webrtcService = useWebRTCService({
    autoSetupCallbacks: false // Don't interfere with main session
  });

  // Update service health periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setServiceHealth(foundationServices.getHealthStatus());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Simulate dashboard component animations that DON'T interfere with foundation
  const [animationPhase, setAnimationPhase] = useState(0);
  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setAnimationPhase(phase => (phase + 1) % 4);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '20px',
        borderRadius: '10px',
        fontFamily: 'monospace',
        fontSize: '14px',
        minWidth: '300px',
        zIndex: 9999,
        border: '2px solid #4ade80'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#4ade80' }}>
        🚀 Service Layer Demo
      </div>
      
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          background: isVisible ? '#059669' : '#374151',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          padding: '8px 16px',
          cursor: 'pointer',
          marginBottom: '15px',
          fontSize: '12px'
        }}
      >
        {isVisible ? '✅ Dashboard Active' : '⚪ Show Dashboard'}
      </button>

      {isVisible && (
        <div>
          {/* Animated dashboard widget */}
          <div style={{ 
            marginBottom: '15px',
            padding: '10px',
            background: 'rgba(34, 197, 94, 0.2)',
            borderRadius: '5px',
            border: '1px solid #22c55e'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
              Widget Status {['⚪', '🔵', '🟢', '🟡'][animationPhase]}
            </div>
            
            <div style={{ fontSize: '10px', color: '#a3a3a3' }}>
              Foundation Services: {serviceHealth.isInitialized ? 'Connected' : 'Disconnected'}
            </div>
            
            <div style={{ fontSize: '10px', color: '#a3a3a3' }}>
              WebRTC: {webrtcService.status}
            </div>
            
            <div style={{ fontSize: '10px', color: '#a3a3a3' }}>
              WebGL Contexts: {serviceHealth.webgl.totalContexts}
            </div>
          </div>

          {/* Performance meter */}
          <div style={{ 
            marginBottom: '10px',
            padding: '8px',
            background: 'rgba(59, 130, 246, 0.2)',
            borderRadius: '5px',
            border: '1px solid #3b82f6'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '5px' }}>
              📊 Resource Usage
            </div>
            
            <div style={{ display: 'flex', gap: '10px', fontSize: '9px' }}>
              <div>
                <div>Memory: Good</div>
                <div style={{ color: '#22c55e' }}>████████░░ 80%</div>
              </div>
              <div>
                <div>GPU: Optimal</div>
                <div style={{ color: '#3b82f6' }}>██████████ 100%</div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>
            🎯 Dashboard components working independently
            <br />
            Foundation layer unaffected
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceLayerDemo;