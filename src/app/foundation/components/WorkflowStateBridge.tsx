'use client';

import { useEffect, useState } from 'react';
import { WorkspaceDataService, WorkflowExecution } from '../services/WorkspaceDataService';

/**
 * Workflow State Bridge Component
 * 
 * Bridges the DashboardDataService workflow execution with React components.
 * Provides real-time updates on workflow progress and allows components
 * to monitor and control workflow execution.
 */

interface WorkflowStartedEvent {
  workflowId: string;
  workflow: string;
}

interface WorkflowStepCompletedEvent {
  workflowId: string;
  stepId: string;
  stepIndex: number;
  totalSteps: number;
}

interface WorkflowCompletedEvent {
  workflowId: string;
  status: 'completed' | 'failed' | 'cancelled';
}

interface WorkflowProgress {
  isRunning: boolean;
  workflowId?: string;
  workflowName?: string;
  currentStep: number;
  totalSteps: number;
  percentage: number;
  status?: 'running' | 'completed' | 'failed' | 'cancelled';
  error?: string;
}

export function WorkflowStateBridge() {
  const [, setWorkflowProgress] = useState<WorkflowProgress>({
    isRunning: false,
    currentStep: 0,
    totalSteps: 0,
    percentage: 0
  });
  
  useEffect(() => {
    const workspaceService = WorkspaceDataService.getInstance();
    
    // Listen for workflow start
    const handleWorkflowStarted = (event: WorkflowStartedEvent) => {
      console.log('[WorkflowStateBridge] Workflow started:', event);
      
      setWorkflowProgress({
        isRunning: true,
        workflowId: event.workflowId,
        workflowName: event.workflow,
        currentStep: 0,
        totalSteps: 0,
        percentage: 0,
        status: 'running'
      });
      
      // Show notification
      showWorkflowNotification(`Starting workflow: ${event.workflow}`, 'info');
      
      // Add visual indicator to page
      showWorkflowProgressBar(true);
    };
    
    // Listen for workflow step completion
    const handleStepCompleted = (event: WorkflowStepCompletedEvent) => {
      console.log('[WorkflowStateBridge] Step completed:', event);
      
      const percentage = ((event.stepIndex + 1) / event.totalSteps) * 100;
      
      setWorkflowProgress(prev => ({
        ...prev,
        currentStep: event.stepIndex + 1,
        totalSteps: event.totalSteps,
        percentage
      }));
      
      // Update progress bar
      updateWorkflowProgressBar(percentage);
      
      // Show step notification for important steps
      if (event.stepIndex === 0 || event.stepIndex === event.totalSteps - 1) {
        showWorkflowNotification(
          `Step ${event.stepIndex + 1}/${event.totalSteps} completed`,
          'info'
        );
      }
    };
    
    // Listen for workflow completion
    const handleWorkflowCompleted = (event: WorkflowCompletedEvent) => {
      console.log('[WorkflowStateBridge] Workflow completed:', event);
      
      setWorkflowProgress(prev => ({
        ...prev,
        isRunning: false,
        status: event.status,
        percentage: event.status === 'completed' ? 100 : prev.percentage
      }));
      
      // Hide progress bar after delay
      setTimeout(() => {
        showWorkflowProgressBar(false);
      }, 2000);
      
      // Show completion notification
      const message = event.status === 'completed' 
        ? 'Workflow completed successfully'
        : event.status === 'failed'
        ? 'Workflow failed'
        : 'Workflow cancelled';
      
      showWorkflowNotification(
        message,
        event.status === 'completed' ? 'success' : 'error'
      );
      
      // Trigger any widget refreshes if needed
      if (event.status === 'completed') {
        refreshAffectedWidgets();
      }
    };
    
    // Subscribe to events
    workspaceService.on('workflow:started', handleWorkflowStarted);
    workspaceService.on('workflow:step-completed', handleStepCompleted);
    workspaceService.on('workflow:completed', handleWorkflowCompleted);
    
    // Cleanup
    return () => {
      workspaceService.off('workflow:started', handleWorkflowStarted);
      workspaceService.off('workflow:step-completed', handleStepCompleted);
      workspaceService.off('workflow:completed', handleWorkflowCompleted);
    };
  }, []);
  
  /**
   * Show/hide workflow progress bar
   */
  const showWorkflowProgressBar = (show: boolean) => {
    const existingBar = document.getElementById('workflow-progress-bar');
    
    if (show && !existingBar) {
      const progressBar = document.createElement('div');
      progressBar.id = 'workflow-progress-bar';
      progressBar.className = 'fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 z-50';
      progressBar.innerHTML = `
        <div id="workflow-progress-fill" 
             class="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
             style="width: 0%">
        </div>
      `;
      document.body.appendChild(progressBar);
      
      // Add glow effect
      setTimeout(() => {
        progressBar.classList.add('shadow-lg');
      }, 100);
    } else if (!show && existingBar) {
      existingBar.classList.add('opacity-0');
      setTimeout(() => {
        existingBar.remove();
      }, 300);
    }
  };
  
  /**
   * Update workflow progress bar
   */
  const updateWorkflowProgressBar = (percentage: number) => {
    const progressFill = document.getElementById('workflow-progress-fill');
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
      
      // Add pulse effect at milestones
      if (percentage === 25 || percentage === 50 || percentage === 75 || percentage === 100) {
        progressFill.classList.add('animate-pulse');
        setTimeout(() => {
          progressFill.classList.remove('animate-pulse');
        }, 1000);
      }
    }
  };
  
  /**
   * Show workflow notification
   */
  const showWorkflowNotification = (message: string, type: 'success' | 'info' | 'error') => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `
      fixed bottom-20 right-4 px-6 py-3 rounded-lg text-white z-50 
      transform translate-x-0 transition-all duration-300 ease-in-out
      flex items-center space-x-2 shadow-lg
      ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'}
    `;
    
    // Add icon based on type
    const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
    
    notification.innerHTML = `
      <span class="text-xl">${icon}</span>
      <span>${message}</span>
    `;
    
    // Add entrance animation
    notification.style.transform = 'translateX(400px)';
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  };
  
  /**
   * Refresh widgets that were affected by the workflow
   */
  const refreshAffectedWidgets = () => {
    // This could be more intelligent based on what the workflow did
    // For now, just emit a general refresh event
    const workspaceService = WorkspaceDataService.getInstance();
    
    // Check if any widgets need refreshing based on workflow
    const visibleWidgets = workspaceService.getVisibleWidgets();
    visibleWidgets.forEach(widget => {
      // Only refresh data widgets, not layout widgets
      if (widget.type === 'metrics' || widget.type === 'activities' || widget.type === 'status') {
        console.log(`[WorkflowStateBridge] Refreshing widget: ${widget.id}`);
        // The widget components will handle the refresh based on events
      }
    });
  };
  
  // This component doesn't render anything visible
  return null;
}

/**
 * Hook for components to get current workflow execution state
 */
export function useWorkflowState() {
  useState<WorkflowExecution | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  
  useEffect(() => {
    const workspaceService = WorkspaceDataService.getInstance();
    
    const handleWorkflowStarted = () => {
      setIsRunning(true);
    };
    
    const handleWorkflowCompleted = () => {
      setIsRunning(false);
      // Could fetch the completed workflow from history if needed
    };
    
    workspaceService.on('workflow:started', handleWorkflowStarted);
    workspaceService.on('workflow:completed', handleWorkflowCompleted);
    
    return () => {
      workspaceService.off('workflow:started', handleWorkflowStarted);
      workspaceService.off('workflow:completed', handleWorkflowCompleted);
    };
  }, []);
  
  return {
    isRunning
  };
}

/**
 * Hook for components to execute workflows
 */
export function useWorkflowControl() {
  const workspaceService = WorkspaceDataService.getInstance();
  const { isRunning } = useWorkflowState();
  
  const executeWorkflow = async (workflowId: string, _variables?: Record<string, any>) => {
    if (isRunning) {
      console.warn('[WorkflowStateBridge] Another workflow is already running');
      return { success: false, message: 'Another workflow is already running' };
    }
    
    return await workspaceService.executeWorkflow(workflowId, _variables);
  };
  
  const executeMacro = async (trigger: string) => {
    if (isRunning) {
      console.warn('[WorkflowStateBridge] Another workflow is already running');
      return { success: false, message: 'Another workflow is already running' };
    }
    
    return await workspaceService.executeMacroByTrigger(trigger);
  };
  
  const getAllWorkflows = () => {
    return workspaceService.getAllWorkflows();
  };
  
  return {
    executeWorkflow,
    executeMacro,
    getAllWorkflows,
    isRunning
  };
}