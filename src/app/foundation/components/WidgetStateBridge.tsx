'use client';

import { useEffect, useState } from 'react';
import { WorkspaceDataService } from '../services/WorkspaceDataService';

/**
 * Widget State Bridge Component
 * 
 * Bridges the DashboardDataService widget state with React components.
 * Listens for widget events and provides hooks for dashboard components
 * to sync their widget states with the service layer.
 */

interface WidgetVisibilityChange {
  widgetId: string;
  isVisible: boolean;
}

interface WidgetExpansionChange {
  widgetId: string;
  isExpanded: boolean;
}

interface WidgetRefresh {
  widgetId: string;
}

interface WidgetReorder {
  order: string[];
}

interface WidgetFilter {
  filter: any;
}

export function WidgetStateBridge() {
  const [, setWidgetUpdates] = useState<Record<string, any>>({});
  
  useEffect(() => {
    const workspaceService = WorkspaceDataService.getInstance();
    
    // Listen for widget visibility changes
    const handleVisibilityChange = (event: WidgetVisibilityChange) => {
      console.log('[WidgetStateBridge] Visibility changed:', event);
      
      // Update local state to trigger re-renders
      setWidgetUpdates(prev => ({
        ...prev,
        [`${event.widgetId}-visibility`]: {
          isVisible: event.isVisible,
          timestamp: Date.now()
        }
      }));
      
      // Update the actual widget element if it exists
      updateWidgetVisibility(event.widgetId, event.isVisible);
    };
    
    // Listen for widget expansion changes
    const handleExpansionChange = (event: WidgetExpansionChange) => {
      console.log('[WidgetStateBridge] Expansion changed:', event);
      
      setWidgetUpdates(prev => ({
        ...prev,
        [`${event.widgetId}-expansion`]: {
          isExpanded: event.isExpanded,
          timestamp: Date.now()
        }
      }));
      
      updateWidgetExpansion(event.widgetId, event.isExpanded);
    };
    
    // Listen for widget refreshes
    const handleRefreshStart = (event: WidgetRefresh) => {
      console.log('[WidgetStateBridge] Refresh started:', event);
      
      // Show loading state on widget
      updateWidgetLoadingState(event.widgetId, true);
      showWidgetNotification(`Refreshing ${event.widgetId}`, 'info');
    };
    
    const handleRefreshComplete = (event: WidgetRefresh) => {
      console.log('[WidgetStateBridge] Refresh complete:', event);
      
      // Hide loading state on widget
      updateWidgetLoadingState(event.widgetId, false);
      showWidgetNotification(`${event.widgetId} refreshed`, 'success');
    };
    
    // Listen for widget reordering
    const handleReorder = (event: WidgetReorder) => {
      console.log('[WidgetStateBridge] Widgets reordered:', event);
      
      // Reorder widgets in the DOM
      reorderWidgetsInDOM(event.order);
      showWidgetNotification('Widgets reordered', 'success');
    };
    
    // Listen for widget filtering
    const handleFilter = (event: WidgetFilter) => {
      console.log('[WidgetStateBridge] Filter applied:', event);
      
      // Update widget visibility based on filter
      syncAllWidgets();
      showWidgetNotification('Filter applied', 'info');
    };
    
    const handleFilterCleared = () => {
      console.log('[WidgetStateBridge] Filter cleared');
      
      // Reset all widgets to visible
      syncAllWidgets();
      showWidgetNotification('All widgets visible', 'info');
    };
    
    // Subscribe to events
    workspaceService.on('widget:visibility-changed', handleVisibilityChange);
    workspaceService.on('widget:expansion-changed', handleExpansionChange);
    workspaceService.on('widget:expanded', handleExpansionChange);
    workspaceService.on('widget:collapsed', handleExpansionChange);
    workspaceService.on('widget:refresh-start', handleRefreshStart);
    workspaceService.on('widget:refresh-complete', handleRefreshComplete);
    workspaceService.on('widgets:reordered', handleReorder);
    workspaceService.on('widgets:filtered', handleFilter);
    workspaceService.on('widgets:filter-cleared', handleFilterCleared);
    
    // Initial sync - set widgets to current state
    syncAllWidgets();
    
    // Cleanup
    return () => {
      workspaceService.off('widget:visibility-changed', handleVisibilityChange);
      workspaceService.off('widget:expansion-changed', handleExpansionChange);
      workspaceService.off('widget:expanded', handleExpansionChange);
      workspaceService.off('widget:collapsed', handleExpansionChange);
      workspaceService.off('widget:refresh-start', handleRefreshStart);
      workspaceService.off('widget:refresh-complete', handleRefreshComplete);
      workspaceService.off('widgets:reordered', handleReorder);
      workspaceService.off('widgets:filtered', handleFilter);
      workspaceService.off('widgets:filter-cleared', handleFilterCleared);
    };
  }, []);
  
  /**
   * Update widget visibility in the DOM
   * Note: Now handled by React state in components, keeping for potential future use
   */
  const updateWidgetVisibility = (widgetId: string, isVisible: boolean) => {
    // Widget visibility is now controlled by React state and CSS transitions
    // in the component itself for smoother animations
    console.log(`[WidgetStateBridge] Widget ${widgetId} visibility changed to ${isVisible}`);
  };
  
  /**
   * Update widget expansion state in the DOM
   * Note: Now handled by React state in components, keeping for potential future use
   */
  const updateWidgetExpansion = (widgetId: string, isExpanded: boolean) => {
    // Widget expansion is now controlled by React state and CSS transitions
    // in the component itself for smoother animations
    console.log(`[WidgetStateBridge] Widget ${widgetId} expansion changed to ${isExpanded}`);
  };
  
  /**
   * Update widget loading state in the DOM
   */
  const updateWidgetLoadingState = (widgetId: string, isLoading: boolean) => {
    const widget = document.querySelector(`[data-widget-id="${widgetId}"]`);
    if (!widget) {
      console.warn(`[WidgetStateBridge] Widget ${widgetId} not found in DOM`);
      return;
    }
    
    const loadingIndicator = widget.querySelector('[data-widget-loading]');
    
    if (isLoading) {
      // Show loading indicator
      if (!loadingIndicator) {
        const loader = document.createElement('div');
        loader.setAttribute('data-widget-loading', 'true');
        loader.className = 'absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10';
        loader.innerHTML = '<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>';
        widget.appendChild(loader);
      }
    } else {
      // Hide loading indicator
      if (loadingIndicator) {
        loadingIndicator.remove();
      }
    }
  };
  
  /**
   * Reorder widgets in the DOM
   */
  const reorderWidgetsInDOM = (order: string[]) => {
    const container = document.querySelector('[data-widgets-container]');
    if (!container) {
      console.warn('[WidgetStateBridge] Widgets container not found');
      return;
    }
    
    // Create a document fragment to minimize reflows
    const fragment = document.createDocumentFragment();
    
    order.forEach(widgetId => {
      const widget = document.querySelector(`[data-widget-id="${widgetId}"]`);
      if (widget) {
        fragment.appendChild(widget);
      }
    });
    
    // Append all widgets in new order
    container.appendChild(fragment);
  };
  
  /**
   * Sync all widgets with service state
   */
  const syncAllWidgets = () => {
    const workspaceService = WorkspaceDataService.getInstance();
    const widgets = workspaceService.getAllWidgets();
    
    widgets.forEach(widget => {
      updateWidgetVisibility(widget.id, widget.isVisible);
      updateWidgetExpansion(widget.id, widget.isExpanded);
      if (widget.isLoading) {
        updateWidgetLoadingState(widget.id, true);
      }
    });
  };
  
  /**
   * Show a notification for widget actions
   */
  const showWidgetNotification = (message: string, type: 'success' | 'info' | 'error') => {
    // Create a temporary notification element
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 left-4 px-4 py-2 rounded-lg text-white z-50 animate-slideUp
      ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.add('animate-fadeOut');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  };
  
  // This component doesn't render anything visible
  return null;
}

/**
 * Hook for components to get widget state from service
 */
export function useWidgetState(widgetId: string) {
  const [widgetState, setWidgetState] = useState<any>(null);
  
  useEffect(() => {
    const workspaceService = WorkspaceDataService.getInstance();
    
    // Get initial state
    const state = workspaceService.getWidgetState(widgetId);
    setWidgetState(state);
    
    // Listen for changes
    const handleChange = (event: any) => {
      if (event.widgetId === widgetId) {
        const state = workspaceService.getWidgetState(widgetId);
        setWidgetState(state);
      }
    };
    
    // Subscribe to all widget events
    workspaceService.on('widget:visibility-changed', handleChange);
    workspaceService.on('widget:expansion-changed', handleChange);
    workspaceService.on('widget:refresh-complete', handleChange);
    
    return () => {
      workspaceService.off('widget:visibility-changed', handleChange);
      workspaceService.off('widget:expansion-changed', handleChange);
      workspaceService.off('widget:refresh-complete', handleChange);
    };
  }, [widgetId]);
  
  return widgetState;
}

/**
 * Hook for components to control widgets
 */
export function useWidgetControl(widgetId: string) {
  const workspaceService = WorkspaceDataService.getInstance();
  const widgetState = useWidgetState(widgetId);
  
  const toggleVisibility = () => {
    workspaceService.toggleWidget(widgetId);
  };
  
  const toggleExpansion = () => {
    workspaceService.toggleWidgetExpansion(widgetId);
  };
  
  const refresh = () => {
    workspaceService.refreshWidget(widgetId);
  };
  
  return {
    state: widgetState,
    toggleVisibility,
    toggleExpansion,
    refresh,
    isVisible: widgetState?.isVisible ?? false,
    isExpanded: widgetState?.isExpanded ?? false,
    isLoading: widgetState?.isLoading ?? false,
  };
}