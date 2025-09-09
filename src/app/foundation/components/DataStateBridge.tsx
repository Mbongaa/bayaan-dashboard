/**
 * DataStateBridge Component
 * 
 * This component bridges the DashboardDataService with React state management.
 * It subscribes to dashboard data events and provides state updates to parent components.
 * 
 * Usage:
 * <DataStateBridge 
 *   onMetricsUpdate={(metrics) => setMetrics(metrics)}
 *   onActivityAdded={(activity) => handleNewActivity(activity)}
 *   onSystemStatusChange={(status) => setSystemStatus(status)}
 * />
 */

import { useEffect, useRef } from 'react';
import { dashboardDataService, MetricData, ActivityItem, SystemStatus } from '../services/DashboardDataService';
import { eventMigrationHelper } from '../services/EventBus';

interface DataStateBridgeProps {
  onMetricsUpdate?: (metrics: MetricData[]) => void;
  onMetricUpdate?: (metric: MetricData) => void;
  onActivityAdded?: (activity: ActivityItem) => void;
  onActivitiesCleared?: (criteria?: any) => void;
  onSystemStatusChange?: (status: SystemStatus) => void;
  onDataRefresh?: () => void;
  autoRefreshInterval?: number; // Optional auto-refresh interval in ms
}

export function DataStateBridge({
  onMetricsUpdate,
  onMetricUpdate,
  onActivityAdded,
  onActivitiesCleared,
  onSystemStatusChange,
  onDataRefresh,
  autoRefreshInterval
}: DataStateBridgeProps) {
  const autoRefreshTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('[DataStateBridge] Setting up dashboard data event listeners');

    // Subscribe to metric updates
    const handleMetricUpdate = (event: any) => {
      console.log('[DataStateBridge] Metric updated:', event);
      if (onMetricUpdate && event.metric) {
        onMetricUpdate(event.metric);
      }
      // Also trigger full metrics update
      if (onMetricsUpdate) {
        onMetricsUpdate(dashboardDataService.getAllMetrics());
      }
    };

    // Subscribe to all metrics refresh
    const handleAllMetricsRefresh = () => {
      console.log('[DataStateBridge] All metrics refreshed');
      if (onMetricsUpdate) {
        onMetricsUpdate(dashboardDataService.getAllMetrics());
      }
      if (onDataRefresh) {
        onDataRefresh();
      }
    };

    // Subscribe to activity additions
    const handleActivityAdded = (event: any) => {
      console.log('[DataStateBridge] Activity added:', event);
      if (onActivityAdded && event.activity) {
        onActivityAdded(event.activity);
      }
    };

    // Subscribe to activities cleared
    const handleActivitiesCleared = (event: any) => {
      console.log('[DataStateBridge] Activities cleared:', event);
      if (onActivitiesCleared) {
        onActivitiesCleared(event.criteria);
      }
    };

    // Subscribe to system status updates
    const handleStatusUpdate = (event: any) => {
      console.log('[DataStateBridge] System status updated:', event);
      if (onSystemStatusChange && event.status) {
        onSystemStatusChange(event.status);
      }
    };

    // Add event listeners using migration helper to listen to both old and new event names
    const unsubscribeMetricUpdate = eventMigrationHelper.onBoth(
      'dashboard:metric-updated',
      'dashboard:data:metric-updated',
      handleMetricUpdate
    );
    const unsubscribeAllRefresh = eventMigrationHelper.onBoth(
      'dashboard:all-metrics-refreshed', 
      'dashboard:data:refreshed',
      handleAllMetricsRefresh
    );
    const unsubscribeActivityAdded = eventMigrationHelper.onBoth(
      'dashboard:activity-added',
      'dashboard:data:activity-added',
      handleActivityAdded  
    );
    const unsubscribeActivitiesCleared = eventMigrationHelper.onBoth(
      'dashboard:activities-cleared',
      'dashboard:data:activities-cleared', 
      handleActivitiesCleared
    );
    const unsubscribeStatusUpdate = eventMigrationHelper.onBoth(
      'dashboard:status-updated',
      'dashboard:data:status-updated',
      handleStatusUpdate
    );

    // Set up auto-refresh if interval provided
    if (autoRefreshInterval && autoRefreshInterval > 0) {
      console.log(`[DataStateBridge] Setting up auto-refresh every ${autoRefreshInterval}ms`);
      autoRefreshTimer.current = setInterval(() => {
        dashboardDataService.refreshAllMetrics().catch(console.error);
      }, autoRefreshInterval);
    }

    // Initial data sync
    const initialState = dashboardDataService.getState();
    console.log('[DataStateBridge] Initial state sync:', {
      metricsCount: initialState.metrics.length,
      activitiesCount: initialState.activities.length,
      systemHealth: initialState.summary.systemHealth.overall
    });
    
    if (onMetricsUpdate) {
      onMetricsUpdate(initialState.metrics);
    }

    // Cleanup
    return () => {
      unsubscribeMetricUpdate();
      unsubscribeAllRefresh();
      unsubscribeActivityAdded();
      unsubscribeActivitiesCleared();
      unsubscribeStatusUpdate();
      
      // Clear auto-refresh timer
      if (autoRefreshTimer.current) {
        clearInterval(autoRefreshTimer.current);
        autoRefreshTimer.current = null;
      }
      
      console.log('[DataStateBridge] Event listeners and timers removed');
    };
  }, [onMetricsUpdate, onMetricUpdate, onActivityAdded, onActivitiesCleared, onSystemStatusChange, onDataRefresh, autoRefreshInterval]);

  // This component doesn't render anything
  return null;
}

/**
 * Custom hook for easier usage
 */
export function useDashboardData() {
  const state = dashboardDataService.getState();
  return {
    metrics: state.metrics,
    activities: state.activities,
    systemStatus: state.systemStatus,
    summary: state.summary,
    refreshMetric: (id: string) => dashboardDataService.refreshMetric(id),
    refreshAllMetrics: () => dashboardDataService.refreshAllMetrics(),
    addActivity: (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => dashboardDataService.addActivity(activity),
    getSystemHealth: () => dashboardDataService.getSystemHealthSummary()
  };
}