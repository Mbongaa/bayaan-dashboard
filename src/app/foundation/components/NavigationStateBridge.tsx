/**
 * NavigationStateBridge Component
 * 
 * This component bridges the NavigationService with React state management.
 * It subscribes to navigation events and provides state updates to parent components.
 * 
 * Usage:
 * <NavigationStateBridge 
 *   onSectionChange={(section) => setSelectedSection(section)}
 * />
 */

import { useEffect, useRef } from 'react';
import { navigationService, NavigationSection } from '../services/NavigationService';
import { eventMigrationHelper } from '../services/EventBus';

interface NavigationStateBridgeProps {
  onSectionChange?: (section: NavigationSection, contentMode: 'voice' | 'workspace') => void;
  onContentModeChange?: (mode: 'voice' | 'workspace') => void;
}

export function NavigationStateBridge({
  onSectionChange,
  onContentModeChange
}: NavigationStateBridgeProps) {
  const isInitialized = useRef(false);

  useEffect(() => {
    // Initialize service once
    if (!isInitialized.current) {
      navigationService.initialize();
      isInitialized.current = true;
      console.log('[NavigationStateBridge] Navigation service initialized');
    }

    // Subscribe to section changes
    const handleSectionChange = (event: any) => {
      console.log('[NavigationStateBridge] Section change event:', event);
      if (onSectionChange) {
        onSectionChange(event.section, event.contentMode);
      }
      if (onContentModeChange) {
        onContentModeChange(event.contentMode);
      }
    };

    // Add event listeners using the migration helper to listen to both old and new events
    const unsubscribeSection = eventMigrationHelper.onBoth(
      'navigation:section-change', 
      'navigation:section:changed',
      handleSectionChange
    );

    // Sync initial state
    const initialState = navigationService.getState();
    console.log('[NavigationStateBridge] Initial state:', initialState);
    
    if (onSectionChange) {
      onSectionChange(initialState.currentSection, initialState.contentMode);
    }
    if (onContentModeChange) {
      onContentModeChange(initialState.contentMode);
    }

    // Cleanup
    return () => {
      unsubscribeSection();
      console.log('[NavigationStateBridge] Event listeners removed');
    };
  }, [onSectionChange, onContentModeChange]);

  // This component doesn't render anything
  return null;
}

/**
 * Custom hook for easier usage
 */
export function useNavigationState() {
  const state = navigationService.getState();
  return {
    currentSection: state.currentSection,
    contentMode: state.contentMode,
    navigateToSection: (section: NavigationSection) => navigationService.navigateToSection(section),
    backToVoice: () => navigationService.backToVoice()
  };
}