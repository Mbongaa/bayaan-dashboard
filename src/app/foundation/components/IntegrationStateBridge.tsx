'use client';

import { useEffect, useState } from 'react';
import { 
  integrationService, 
  UserContext, 
  SmartSuggestion,
  PerformanceMetrics,
  UserPreferences
} from '../services/IntegrationService';

/**
 * Integration State Bridge Component
 * 
 * Bridges the IntegrationService with React components to provide:
 * - Performance monitoring
 * - Error recovery  
 * - User preference learning
 * - Background intelligence without visual interruptions
 */

export function IntegrationStateBridge() {
  
  useEffect(() => {
    // Listen for error alerts only - critical errors that need user attention
    const handleErrorAlert = (alert: any) => {
      console.error('[IntegrationStateBridge] Error alert:', alert);
      showErrorNotification(alert.title, alert.message);
    };
    
    // Listen for performance optimizations (silent background optimization)
    const handlePerformanceOptimized = (mode: string) => {
      console.log('[IntegrationStateBridge] Performance optimized:', mode);
      // Silently optimize without showing notifications
    };
    
    // Listen for context updates (for background learning)
    const handleContextUpdate = (context: UserContext) => {
      console.log('[IntegrationStateBridge] User context updated:', context);
      // Context updates are handled silently for learning
    };
    
    // Listen for suggestions (for logging only, no UI)
    const handleSuggestionsUpdate = (suggestions: SmartSuggestion[]) => {
      console.log('[IntegrationStateBridge] Smart suggestions available:', suggestions.length);
      // Suggestions are available via voice commands only
    };
    
    // Subscribe to events
    integrationService.on('error:alert', handleErrorAlert);
    integrationService.on('performance:optimized', handlePerformanceOptimized);
    integrationService.on('context:updated', handleContextUpdate);
    integrationService.on('suggestions:updated', handleSuggestionsUpdate);
    
    // Initial optimization
    integrationService.optimizePerformance();
    
    // Cleanup
    return () => {
      integrationService.off('error:alert', handleErrorAlert);
      integrationService.off('performance:optimized', handlePerformanceOptimized);
      integrationService.off('context:updated', handleContextUpdate);
      integrationService.off('suggestions:updated', handleSuggestionsUpdate);
    };
  }, []);
  
  /**
   * Show error notification for critical errors only
   */
  const showErrorNotification = (title: string, message: string) => {
    const notification = document.createElement('div');
    notification.className = `
      fixed bottom-20 left-4 px-6 py-3 rounded-lg text-white z-50 
      transform translate-x-0 transition-all duration-300 ease-in-out
      flex items-center space-x-2 shadow-lg max-w-md bg-red-500
    `;
    
    notification.innerHTML = `
      <span class="text-xl">✗</span>
      <span>${title}: ${message}</span>
    `;
    
    notification.style.transform = 'translateX(-400px)';
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
      notification.style.transform = 'translateX(-400px)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 4000);
  };
  
  // Component doesn't render anything - just handles background intelligence
  return null;
}

/**
 * Hook to access integration features programmatically
 * Used by components that need integration data
 */
export function useIntegration() {
  const [context, setContext] = useState<UserContext | null>(null);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  
  useEffect(() => {
    // Get initial values
    setContext(integrationService.getUserContext());
    setSuggestions(integrationService.getSmartSuggestions());
    setMetrics(integrationService.getPerformanceMetrics());
    setPreferences(integrationService.getUserPreferences());
    
    // Listen for updates
    const handleContextUpdate = (ctx: UserContext) => setContext(ctx);
    const handleSuggestionsUpdate = (sugg: SmartSuggestion[]) => setSuggestions(sugg);
    const handlePerformanceUpdate = (perf: PerformanceMetrics) => setMetrics(perf);
    const handlePreferencesUpdate = (pref: UserPreferences) => setPreferences(pref);
    
    integrationService.on('context:updated', handleContextUpdate);
    integrationService.on('suggestions:updated', handleSuggestionsUpdate);
    integrationService.on('performance:updated', handlePerformanceUpdate);
    integrationService.on('preferences:updated', handlePreferencesUpdate);
    
    return () => {
      integrationService.off('context:updated', handleContextUpdate);
      integrationService.off('suggestions:updated', handleSuggestionsUpdate);
      integrationService.off('performance:updated', handlePerformanceUpdate);
      integrationService.off('preferences:updated', handlePreferencesUpdate);
    };
  }, []);
  
  const updatePreferences = (updates: Partial<UserPreferences>) => {
    integrationService.updateUserPreferences(updates);
  };
  
  const executeSuggestion = async (suggestionId: string) => {
    return integrationService.executeSuggestion(suggestionId);
  };
  
  const learnBehavior = (action: string, context: any) => {
    integrationService.learnUserBehavior(action, context);
  };
  
  return {
    context,
    suggestions,
    metrics,
    preferences,
    updatePreferences,
    executeSuggestion,
    learnBehavior
  };
}