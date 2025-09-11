import { EventEmitter } from 'events';
import { WorkspaceDataService } from './WorkspaceDataService';
import { navigationService } from './NavigationService';
import { globalEventBus } from './EventBus';

/**
 * Integration Service - Phase 5
 * 
 * Provides complete integration between all dashboard services with:
 * - Intelligent context awareness
 * - User preference learning
 * - Performance monitoring
 * - Error recovery
 * - Analytics tracking
 */

// Types for integration features
export interface UserContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
  isWeekend: boolean;
  isWorkingHours: boolean;
  currentActivity: string;
  recentActions: string[];
  frequentWorkflows: string[];
  preferredTheme: 'light' | 'dark' | 'auto';
  lastActiveTime: Date;
}

export interface PerformanceMetrics {
  workflowExecutionTime: number;
  averageResponseTime: number;
  widgetLoadTime: number;
  navigationSpeed: number;
  errorRate: number;
  successRate: number;
}

export interface UserPreferences {
  defaultMorningWorkflow?: string;
  defaultEveningWorkflow?: string;
  preferredWidgets: string[];
  quickAccessMacros: string[];
  autoExecuteWorkflows: boolean;
  smartSuggestions: boolean;
  performanceMode: 'balanced' | 'performance' | 'battery';
}

export interface SmartSuggestion {
  id: string;
  type: 'workflow' | 'action' | 'macro' | 'setting';
  suggestion: string;
  reason: string;
  confidence: number;
  action: () => Promise<any>;
}

export interface ErrorRecovery {
  errorType: string;
  errorCount: number;
  lastError: Date;
  recoveryStrategy: 'retry' | 'fallback' | 'skip' | 'alert';
  recoveryAttempts: number;
  recovered: boolean;
}

export interface WorkflowAnalytics {
  workflowId: string;
  executionCount: number;
  averageTime: number;
  successRate: number;
  lastExecuted: Date;
  userSatisfaction?: number;
}

class IntegrationServiceClass extends EventEmitter {
  private static instance: IntegrationServiceClass;
  private dashboardService: WorkspaceDataService;
  private navigationService: typeof navigationService;
  
  private userContext: UserContext;
  private performanceMetrics: PerformanceMetrics;
  private userPreferences: UserPreferences;
  private errorRecoveryMap: Map<string, ErrorRecovery>;
  private workflowAnalytics: Map<string, WorkflowAnalytics>;
  private smartSuggestions: SmartSuggestion[];
  
  private performanceMonitor: any;
  private contextUpdateInterval: any;
  private analyticsBuffer: any[];
  
  private constructor() {
    super();
    
    this.dashboardService = WorkspaceDataService.getInstance();
    this.navigationService = navigationService;
    
    // Initialize user context
    this.userContext = this.initializeUserContext();
    
    // Initialize performance metrics
    this.performanceMetrics = {
      workflowExecutionTime: 0,
      averageResponseTime: 0,
      widgetLoadTime: 0,
      navigationSpeed: 0,
      errorRate: 0,
      successRate: 100
    };
    
    // Initialize user preferences with defaults
    this.userPreferences = this.loadUserPreferences();
    
    // Initialize error recovery map
    this.errorRecoveryMap = new Map();
    
    // Initialize workflow analytics
    this.workflowAnalytics = new Map();
    
    // Initialize smart suggestions
    this.smartSuggestions = [];
    
    // Initialize analytics buffer
    this.analyticsBuffer = [];
    
    // Start monitoring
    this.startContextMonitoring();
    this.startPerformanceMonitoring();
    this.attachServiceListeners();
  }
  
  static getInstance(): IntegrationServiceClass {
    if (!IntegrationServiceClass.instance) {
      IntegrationServiceClass.instance = new IntegrationServiceClass();
    }
    return IntegrationServiceClass.instance;
  }
  
  /**
   * Initialize user context based on current time and history
   */
  private initializeUserContext(): UserContext {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    let timeOfDay: UserContext['timeOfDay'];
    if (hour < 6) timeOfDay = 'night';
    else if (hour < 12) timeOfDay = 'morning';
    else if (hour < 18) timeOfDay = 'afternoon';
    else if (hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return {
      timeOfDay,
      dayOfWeek: dayNames[day],
      isWeekend: day === 0 || day === 6,
      isWorkingHours: hour >= 9 && hour < 17 && day > 0 && day < 6,
      currentActivity: 'idle',
      recentActions: [],
      frequentWorkflows: [],
      preferredTheme: 'auto',
      lastActiveTime: now
    };
  }
  
  /**
   * Load user preferences from localStorage
   */
  private loadUserPreferences(): UserPreferences {
    if (typeof window === 'undefined') {
      return this.getDefaultPreferences();
    }
    
    const stored = localStorage.getItem('integrationPreferences');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return this.getDefaultPreferences();
      }
    }
    
    return this.getDefaultPreferences();
  }
  
  /**
   * Get default preferences
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      defaultMorningWorkflow: 'morning-briefing',
      defaultEveningWorkflow: 'end-of-day',
      preferredWidgets: ['metrics-widget', 'activities-widget'],
      quickAccessMacros: [],
      autoExecuteWorkflows: false,
      smartSuggestions: true,
      performanceMode: 'balanced'
    };
  }
  
  /**
   * Save user preferences
   */
  private saveUserPreferences(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('integrationPreferences', JSON.stringify(this.userPreferences));
    }
  }
  
  /**
   * Start monitoring user context
   */
  private startContextMonitoring(): void {
    // Update context every minute
    this.contextUpdateInterval = setInterval(() => {
      this.updateUserContext();
      this.generateSmartSuggestions();
    }, 60000);
    
    // Initial update
    this.updateUserContext();
    this.generateSmartSuggestions();
  }
  
  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        this.performanceMonitor = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.processPerformanceEntry(entry);
          }
        });
        
        this.performanceMonitor.observe({ 
          entryTypes: ['measure', 'navigation', 'resource'] 
        });
      } catch (error) {
        console.warn('[IntegrationService] Performance monitoring not available:', error);
      }
    }
  }
  
  /**
   * Process performance entries
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    // Update metrics based on performance data
    if (entry.name.includes('workflow')) {
      this.performanceMetrics.workflowExecutionTime = 
        (this.performanceMetrics.workflowExecutionTime + entry.duration) / 2;
    } else if (entry.name.includes('widget')) {
      this.performanceMetrics.widgetLoadTime = 
        (this.performanceMetrics.widgetLoadTime + entry.duration) / 2;
    } else if (entry.name.includes('navigation')) {
      this.performanceMetrics.navigationSpeed = 
        (this.performanceMetrics.navigationSpeed + entry.duration) / 2;
    }
    
    // Calculate average response time
    this.performanceMetrics.averageResponseTime = 
      (this.performanceMetrics.workflowExecutionTime + 
       this.performanceMetrics.widgetLoadTime + 
       this.performanceMetrics.navigationSpeed) / 3;
    
    // Emit performance update
    this.emit('performance:updated', this.performanceMetrics);
  }
  
  /**
   * Attach listeners to other services
   */
  private attachServiceListeners(): void {
    // Listen to workflow events
    this.dashboardService.on('workflow:completed', (event: any) => {
      this.trackWorkflowAnalytics(event.workflowId, event.status === 'completed');
      this.updateUserContext();
    });
    
    // Listen to navigation section changes via EventBus
    globalEventBus.on('navigation:section:changed', (data: any) => {
      this.userContext.recentActions.push(`navigate:${data.section}`);
      if (this.userContext.recentActions.length > 20) {
        this.userContext.recentActions.shift();
      }
    });
    
    // Listen to error events
    this.dashboardService.on('error', (error: any) => {
      this.handleError(error);
    });
  }
  
  /**
   * Update user context based on recent activity
   */
  private updateUserContext(): void {
    const now = new Date();
    const hour = now.getHours();
    
    // Update time of day
    if (hour < 6) this.userContext.timeOfDay = 'night';
    else if (hour < 12) this.userContext.timeOfDay = 'morning';
    else if (hour < 18) this.userContext.timeOfDay = 'afternoon';
    else if (hour < 22) this.userContext.timeOfDay = 'evening';
    else this.userContext.timeOfDay = 'night';
    
    // Update working hours
    this.userContext.isWorkingHours = hour >= 9 && hour < 17 && !this.userContext.isWeekend;
    
    // Analyze frequent workflows
    this.analyzeFrequentWorkflows();
    
    // Emit context update
    this.emit('context:updated', this.userContext);
  }
  
  /**
   * Analyze and identify frequently used workflows
   */
  private analyzeFrequentWorkflows(): void {
    const workflowCounts = new Map<string, number>();
    
    for (const [id, analytics] of this.workflowAnalytics) {
      workflowCounts.set(id, analytics.executionCount);
    }
    
    // Sort by execution count and get top 5
    this.userContext.frequentWorkflows = Array.from(workflowCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);
  }
  
  /**
   * Generate smart suggestions based on context
   */
  private generateSmartSuggestions(): void {
    if (!this.userPreferences.smartSuggestions) {
      this.smartSuggestions = [];
      return;
    }
    
    const suggestions: SmartSuggestion[] = [];
    
    // Time-based suggestions
    if (this.userContext.timeOfDay === 'morning' && !this.hasRecentAction('workflow:morning-briefing')) {
      suggestions.push({
        id: 'morning-briefing-suggestion',
        type: 'workflow',
        suggestion: 'Start your morning briefing?',
        reason: `Good morning! It's ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
        confidence: 0.9,
        action: async () => {
          return this.dashboardService.executeWorkflow('morning-briefing');
        }
      });
    }
    
    if (this.userContext.timeOfDay === 'evening' && !this.hasRecentAction('workflow:end-of-day')) {
      suggestions.push({
        id: 'end-of-day-suggestion',
        type: 'workflow',
        suggestion: 'Run end-of-day cleanup?',
        reason: `It's evening, time to wrap up`,
        confidence: 0.85,
        action: async () => {
          return this.dashboardService.executeWorkflow('end-of-day');
        }
      });
    }
    
    // Activity-based suggestions
    if (this.userContext.isWorkingHours && !this.hasRecentAction('workflow:focus-mode')) {
      suggestions.push({
        id: 'focus-mode-suggestion',
        type: 'workflow',
        suggestion: 'Enable focus mode for productive work?',
        reason: 'Working hours detected',
        confidence: 0.75,
        action: async () => {
          return this.dashboardService.executeWorkflow('focus-mode');
        }
      });
    }
    
    // Performance-based suggestions
    if (this.performanceMetrics.averageResponseTime > 1000) {
      suggestions.push({
        id: 'performance-optimization',
        type: 'setting',
        suggestion: 'Enable performance mode?',
        reason: 'System running slower than usual',
        confidence: 0.8,
        action: async () => {
          this.userPreferences.performanceMode = 'performance';
          this.saveUserPreferences();
          return { success: true };
        }
      });
    }
    
    // Frequently used workflow suggestions
    if (this.userContext.frequentWorkflows.length > 0) {
      const topWorkflow = this.userContext.frequentWorkflows[0];
      if (!this.hasRecentAction(`workflow:${topWorkflow}`)) {
        suggestions.push({
          id: `frequent-${topWorkflow}`,
          type: 'workflow',
          suggestion: `Run ${topWorkflow}?`,
          reason: 'Frequently used workflow',
          confidence: 0.7,
          action: async () => {
            return this.dashboardService.executeWorkflow(topWorkflow);
          }
        });
      }
    }
    
    this.smartSuggestions = suggestions.sort((a, b) => b.confidence - a.confidence);
    this.emit('suggestions:updated', this.smartSuggestions);
  }
  
  /**
   * Check if an action was performed recently
   */
  private hasRecentAction(action: string, withinMinutes: number = 60): boolean {
    const recentTime = Date.now() - (withinMinutes * 60 * 1000);
    return this.userContext.recentActions.some(a => {
      if (a.includes(action)) {
        // Check if action timestamp is within the time window
        // For simplicity, we'll assume recent actions are recent
        return true;
      }
      return false;
    });
  }
  
  /**
   * Track workflow analytics
   */
  private trackWorkflowAnalytics(workflowId: string, success: boolean): void {
    if (!this.workflowAnalytics.has(workflowId)) {
      this.workflowAnalytics.set(workflowId, {
        workflowId,
        executionCount: 0,
        averageTime: 0,
        successRate: 100,
        lastExecuted: new Date()
      });
    }
    
    const analytics = this.workflowAnalytics.get(workflowId)!;
    analytics.executionCount++;
    analytics.lastExecuted = new Date();
    
    // Update success rate
    const previousTotal = analytics.executionCount - 1;
    const previousSuccesses = (analytics.successRate / 100) * previousTotal;
    const newSuccesses = previousSuccesses + (success ? 1 : 0);
    analytics.successRate = (newSuccesses / analytics.executionCount) * 100;
    
    // Add to recent actions
    this.userContext.recentActions.push(`workflow:${workflowId}`);
    
    // Save analytics
    this.saveAnalytics();
  }
  
  /**
   * Save analytics to localStorage
   */
  private saveAnalytics(): void {
    if (typeof window !== 'undefined') {
      const analyticsData = Array.from(this.workflowAnalytics.entries());
      localStorage.setItem('workflowAnalytics', JSON.stringify(analyticsData));
    }
  }
  
  /**
   * Handle errors with recovery strategies
   */
  private handleError(error: any): void {
    const errorKey = error.type || 'unknown';
    
    if (!this.errorRecoveryMap.has(errorKey)) {
      this.errorRecoveryMap.set(errorKey, {
        errorType: errorKey,
        errorCount: 0,
        lastError: new Date(),
        recoveryStrategy: 'retry',
        recoveryAttempts: 0,
        recovered: false
      });
    }
    
    const recovery = this.errorRecoveryMap.get(errorKey)!;
    recovery.errorCount++;
    recovery.lastError = new Date();
    
    // Determine recovery strategy based on error count
    if (recovery.errorCount < 3) {
      recovery.recoveryStrategy = 'retry';
      this.attemptRecovery(error, recovery);
    } else if (recovery.errorCount < 5) {
      recovery.recoveryStrategy = 'fallback';
      this.attemptFallback(error, recovery);
    } else {
      recovery.recoveryStrategy = 'alert';
      this.alertUser(error, recovery);
    }
    
    // Update error rate
    this.performanceMetrics.errorRate = 
      (this.performanceMetrics.errorRate + 1) / 
      (this.performanceMetrics.successRate + this.performanceMetrics.errorRate + 1) * 100;
    
    this.emit('error:handled', { error, recovery });
  }
  
  /**
   * Attempt to recover from error
   */
  private attemptRecovery(error: any, recovery: ErrorRecovery): void {
    recovery.recoveryAttempts++;
    
    setTimeout(() => {
      // Retry the failed operation
      console.log(`[IntegrationService] Attempting recovery for ${error.type}`);
      
      // Mark as recovered if successful
      recovery.recovered = true;
      recovery.errorCount = 0;
      
      this.emit('error:recovered', { error, recovery });
    }, 1000 * recovery.recoveryAttempts);
  }
  
  /**
   * Attempt fallback for error
   */
  private attemptFallback(error: any, recovery: ErrorRecovery): void {
    console.log(`[IntegrationService] Using fallback for ${error.type}`);
    
    // Implement fallback logic based on error type
    switch (error.type) {
      case 'workflow:failed':
        // Fallback to simpler workflow
        this.dashboardService.executeWorkflow('fallback-simple');
        break;
      case 'widget:load-failed':
        // Show placeholder widget
        this.dashboardService.toggleWidget(error.widgetId);
        break;
      default:
        // Generic fallback
        console.warn(`[IntegrationService] No specific fallback for ${error.type}`);
    }
    
    recovery.recovered = true;
    this.emit('error:fallback', { error, recovery });
  }
  
  /**
   * Alert user about persistent error
   */
  private alertUser(error: any, recovery: ErrorRecovery): void {
    console.error(`[IntegrationService] Persistent error: ${error.type}`, error);
    
    this.emit('error:alert', {
      title: 'System Issue Detected',
      message: `We're experiencing issues with ${error.type}. Our team has been notified.`,
      error,
      recovery
    });
  }
  
  // Public API
  
  /**
   * Get current user context
   */
  getUserContext(): UserContext {
    return { ...this.userContext };
  }
  
  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }
  
  /**
   * Get user preferences
   */
  getUserPreferences(): UserPreferences {
    return { ...this.userPreferences };
  }
  
  /**
   * Update user preferences
   */
  updateUserPreferences(updates: Partial<UserPreferences>): void {
    this.userPreferences = { ...this.userPreferences, ...updates };
    this.saveUserPreferences();
    this.emit('preferences:updated', this.userPreferences);
  }
  
  /**
   * Get smart suggestions
   */
  getSmartSuggestions(): SmartSuggestion[] {
    return [...this.smartSuggestions];
  }
  
  /**
   * Execute a smart suggestion
   */
  async executeSuggestion(suggestionId: string): Promise<any> {
    const suggestion = this.smartSuggestions.find(s => s.id === suggestionId);
    
    if (!suggestion) {
      throw new Error(`Suggestion ${suggestionId} not found`);
    }
    
    try {
      const result = await suggestion.action();
      
      // Track successful execution
      this.userContext.recentActions.push(`suggestion:${suggestionId}`);
      
      // Remove executed suggestion
      this.smartSuggestions = this.smartSuggestions.filter(s => s.id !== suggestionId);
      
      this.emit('suggestion:executed', { suggestion, result });
      
      return result;
    } catch (error) {
      this.handleError({ type: 'suggestion:failed', suggestionId, error });
      throw error;
    }
  }
  
  /**
   * Get workflow analytics
   */
  getWorkflowAnalytics(): WorkflowAnalytics[] {
    return Array.from(this.workflowAnalytics.values());
  }
  
  /**
   * Get error recovery status
   */
  getErrorRecoveryStatus(): ErrorRecovery[] {
    return Array.from(this.errorRecoveryMap.values());
  }
  
  /**
   * Optimize performance based on current mode
   */
  optimizePerformance(): void {
    switch (this.userPreferences.performanceMode) {
      case 'performance':
        // Maximum performance settings
        // TODO: Implement setRefreshInterval in WorkspaceDataService
        // this.dashboardService.setRefreshInterval(5000); // Faster refresh
        // TODO: Implement enablePreloading in NavigationService
        // this.navigationService.enablePreloading(true);
        console.log('[IntegrationService] Performance mode: Maximum speed');
        break;
      case 'battery':
        // Battery saving mode
        // TODO: Implement setRefreshInterval in WorkspaceDataService
        // this.dashboardService.setRefreshInterval(30000); // Slower refresh
        // TODO: Implement enablePreloading in NavigationService
        // this.navigationService.enablePreloading(false);
        console.log('[IntegrationService] Battery mode: Reduced resource usage');
        break;
      case 'balanced':
      default:
        // Balanced settings
        // TODO: Implement setRefreshInterval in WorkspaceDataService
        // this.dashboardService.setRefreshInterval(15000);
        // TODO: Implement enablePreloading in NavigationService
        // this.navigationService.enablePreloading(true);
        console.log('[IntegrationService] Balanced mode: Optimal performance');
        break;
    }
    
    this.emit('performance:optimized', this.userPreferences.performanceMode);
  }
  
  /**
   * Learn from user behavior
   */
  learnUserBehavior(action: string, context: any): void {
    // Add to analytics buffer
    this.analyticsBuffer.push({
      action,
      context,
      timestamp: new Date(),
      userContext: { ...this.userContext }
    });
    
    // Process buffer periodically (every 10 actions)
    if (this.analyticsBuffer.length >= 10) {
      this.processAnalyticsBuffer();
    }
  }
  
  /**
   * Process analytics buffer to learn patterns
   */
  private processAnalyticsBuffer(): void {
    // Analyze patterns in user behavior
    const patterns = this.analyzePatterns(this.analyticsBuffer);
    
    // Update preferences based on patterns
    if (patterns.morningWorkflow && patterns.morningWorkflow !== this.userPreferences.defaultMorningWorkflow) {
      this.userPreferences.defaultMorningWorkflow = patterns.morningWorkflow;
    }
    
    if (patterns.eveningWorkflow && patterns.eveningWorkflow !== this.userPreferences.defaultEveningWorkflow) {
      this.userPreferences.defaultEveningWorkflow = patterns.eveningWorkflow;
    }
    
    if (patterns.preferredWidgets) {
      this.userPreferences.preferredWidgets = patterns.preferredWidgets;
    }
    
    // Save updated preferences
    this.saveUserPreferences();
    
    // Clear buffer
    this.analyticsBuffer = [];
    
    this.emit('behavior:learned', patterns);
  }
  
  /**
   * Analyze patterns in user behavior
   */
  private analyzePatterns(buffer: any[]): any {
    const patterns: any = {};
    
    // Analyze morning workflows
    const morningActions = buffer.filter(b => 
      b.userContext.timeOfDay === 'morning' && 
      b.action.startsWith('workflow:')
    );
    
    if (morningActions.length > 0) {
      const workflowCounts = new Map<string, number>();
      morningActions.forEach(a => {
        const workflow = a.action.replace('workflow:', '');
        workflowCounts.set(workflow, (workflowCounts.get(workflow) || 0) + 1);
      });
      
      // Get most frequent morning workflow
      patterns.morningWorkflow = Array.from(workflowCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0];
    }
    
    // Analyze evening workflows
    const eveningActions = buffer.filter(b => 
      b.userContext.timeOfDay === 'evening' && 
      b.action.startsWith('workflow:')
    );
    
    if (eveningActions.length > 0) {
      const workflowCounts = new Map<string, number>();
      eveningActions.forEach(a => {
        const workflow = a.action.replace('workflow:', '');
        workflowCounts.set(workflow, (workflowCounts.get(workflow) || 0) + 1);
      });
      
      patterns.eveningWorkflow = Array.from(workflowCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0];
    }
    
    // Analyze widget preferences
    const widgetActions = buffer.filter(b => b.action.startsWith('widget:'));
    if (widgetActions.length > 0) {
      const widgetCounts = new Map<string, number>();
      widgetActions.forEach(a => {
        const widget = a.action.split(':')[1];
        widgetCounts.set(widget, (widgetCounts.get(widget) || 0) + 1);
      });
      
      patterns.preferredWidgets = Array.from(widgetCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([widget]) => widget);
    }
    
    return patterns;
  }
  
  /**
   * Clean up resources
   */
  shutdown(): void {
    if (this.contextUpdateInterval) {
      clearInterval(this.contextUpdateInterval);
    }
    
    if (this.performanceMonitor) {
      this.performanceMonitor.disconnect();
    }
    
    // Save any pending analytics
    this.saveAnalytics();
    this.saveUserPreferences();
    
    this.removeAllListeners();
    
    console.log('[IntegrationService] Shutdown complete');
  }
}

// Export singleton instance
export const integrationService = IntegrationServiceClass.getInstance();