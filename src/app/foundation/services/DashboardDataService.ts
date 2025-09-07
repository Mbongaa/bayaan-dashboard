import { EventEmitter } from 'events';

/**
 * Dashboard Data Service
 * 
 * Manages all dashboard data including metrics, activities, and system status.
 * This service provides a centralized way for the VA to query and control
 * dashboard data through well-defined methods.
 */

// Type definitions
export interface MetricData {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'good' | 'warning' | 'critical';
  lastUpdated: Date;
  icon?: string;
}

export interface ActivityItem {
  id: string;
  type: 'voice' | 'system' | 'dashboard' | 'performance' | 'security' | 'user';
  message: string;
  timestamp: Date;
  severity?: 'info' | 'warning' | 'error' | 'success';
  metadata?: Record<string, any>;
}

export interface SystemStatus {
  id: string;
  service: string;
  status: 'active' | 'ready' | 'optimized' | 'connected' | 'error' | 'degraded';
  health: number; // 0-100
  message?: string;
  lastChecked: Date;
}

export interface FilterCriteria {
  type?: string[];
  severity?: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeState {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  isSystem: boolean;
}

// Form-related types
export type FieldType = 'text' | 'email' | 'select' | 'checkbox' | 'number' | 'password';

export interface FieldDefinition {
  type: FieldType;
  label: string;
  required?: boolean;
  validation?: 'email' | 'apiKey' | 'url' | 'phone';
  options?: string[]; // For select fields
  default?: any;
  placeholder?: string;
}

export interface FormField {
  id: string;
  value: any;
  isValid: boolean;
  errorMessage?: string;
  touched: boolean;
}

export interface FormDefinition {
  id: string;
  name: string;
  fields: Record<string, FieldDefinition>;
}

export interface FormState {
  formId: string;
  fields: Map<string, FormField>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

// Widget-related types
export interface WidgetState {
  id: string;
  name: string;
  type: 'metrics' | 'activities' | 'status' | 'chart' | 'custom';
  isVisible: boolean;
  isExpanded: boolean;
  isLoading: boolean;
  position: number;
  settings?: Record<string, any>;
  lastRefresh?: Date;
}

export interface WidgetFilter {
  visibility?: 'all' | 'visible' | 'hidden';
  types?: string[];
  expandedOnly?: boolean;
}

// Workflow-related types
export interface WorkflowStep {
  id: string;
  type: 'navigation' | 'form' | 'widget' | 'data' | 'wait' | 'condition';
  action: string;
  parameters: Record<string, any>;
  description: string;
  preconditions?: WorkflowCondition[];
  rollback?: WorkflowStep;
  retryCount?: number;
  timeout?: number;
}

export interface WorkflowCondition {
  type: 'state' | 'value' | 'exists';
  target: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  variables?: Record<string, any>;
  tags?: string[];
  createdAt: Date;
  lastUsed?: Date;
  usageCount: number;
}

export interface WorkflowExecution {
  workflowId: string;
  startedAt: Date;
  completedAt?: Date;
  currentStepIndex: number;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  results: Record<string, any>;
  error?: string;
  executionHistory: WorkflowStepResult[];
}

export interface WorkflowStepResult {
  stepId: string;
  status: 'success' | 'failed' | 'skipped';
  startedAt: Date;
  completedAt: Date;
  result?: any;
  error?: string;
}

export interface DashboardMacro {
  id: string;
  name: string;
  description: string;
  voiceTriggers: string[];
  workflow: WorkflowDefinition;
  isEnabled: boolean;
  createdAt: Date;
  lastUsed?: Date;
  usageCount: number;
}

export interface SearchQuery {
  query: string;
  scope: ('metrics' | 'activities' | 'forms' | 'widgets' | 'all')[];
  filters?: {
    timeRange?: { start: Date; end: Date };
    severity?: string[];
    status?: string[];
  };
  limit?: number;
  sortBy?: 'relevance' | 'date' | 'name';
}

export interface SearchResult {
  type: 'metric' | 'activity' | 'form_field' | 'widget';
  id: string;
  name: string;
  description: string;
  relevanceScore: number;
  data: any;
  highlight?: string;
}

export interface DashboardDataState {
  metrics: Map<string, MetricData>;
  activities: ActivityItem[];
  systemStatus: SystemStatus[];
  theme: ThemeState;
  forms: Map<string, FormState>;
  formDefinitions: Map<string, FormDefinition>;
  widgets: Map<string, WidgetState>;
  widgetFilters: Map<string, WidgetFilter>;
  workflows: Map<string, WorkflowDefinition>;
  macros: Map<string, DashboardMacro>;
  currentWorkflow: WorkflowExecution | null;
  workflowHistory: WorkflowExecution[];
  lastRefresh: Date;
}

export class DashboardDataService extends EventEmitter {
  private state: DashboardDataState;
  private refreshIntervals: Map<string, NodeJS.Timeout> = new Map();
  private static instance: DashboardDataService | null = null;

  private constructor() {
    super();
    this.state = {
      metrics: new Map(),
      activities: [],
      systemStatus: [],
      theme: {
        theme: 'system',
        resolvedTheme: 'light',
        isSystem: true
      },
      forms: new Map(),
      formDefinitions: new Map(),
      widgets: new Map(),
      widgetFilters: new Map(),
      workflows: new Map(),
      macros: new Map(),
      currentWorkflow: null,
      workflowHistory: [],
      lastRefresh: new Date()
    };
    this.initializeDefaultData();
    this.initializeThemeSync();
    this.initializeForms();
    this.initializeWidgets();
    this.initializeWorkflows();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): DashboardDataService {
    if (!DashboardDataService.instance) {
      DashboardDataService.instance = new DashboardDataService();
    }
    return DashboardDataService.instance;
  }

  /**
   * Initialize with default dashboard data
   */
  private initializeDefaultData(): void {
    // Initialize default metrics
    this.state.metrics.set('active-sessions', {
      id: 'active-sessions',
      label: 'Active Sessions',
      value: 1234,
      trend: 'up',
      status: 'good',
      lastUpdated: new Date(),
      icon: '📊'
    });

    this.state.metrics.set('voice-interactions', {
      id: 'voice-interactions',
      label: 'Voice Interactions',
      value: 5678,
      trend: 'up',
      status: 'good',
      lastUpdated: new Date(),
      icon: '🎤'
    });

    this.state.metrics.set('system-health', {
      id: 'system-health',
      label: 'System Health',
      value: 'Excellent',
      status: 'good',
      lastUpdated: new Date(),
      icon: '✅'
    });

    this.state.metrics.set('uptime', {
      id: 'uptime',
      label: 'Uptime',
      value: 99.9,
      unit: '%',
      trend: 'stable',
      status: 'good',
      lastUpdated: new Date(),
      icon: '🚀'
    });

    // Initialize recent activities
    this.state.activities = [
      {
        id: 'act-1',
        type: 'voice',
        message: 'Voice session started with Agent Zahra',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        severity: 'info'
      },
      {
        id: 'act-2',
        type: 'system',
        message: 'Foundation services initialized successfully',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        severity: 'success'
      },
      {
        id: 'act-3',
        type: 'dashboard',
        message: 'Dashboard components loaded',
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        severity: 'info'
      },
      {
        id: 'act-4',
        type: 'performance',
        message: 'WebGL contexts optimized',
        timestamp: new Date(Date.now() - 12 * 60 * 1000),
        severity: 'success'
      }
    ];

    // Initialize system status
    this.state.systemStatus = [
      {
        id: 'status-1',
        service: 'Foundation Services',
        status: 'active',
        health: 100,
        lastChecked: new Date()
      },
      {
        id: 'status-2',
        service: 'WebRTC Session',
        status: 'ready',
        health: 98,
        lastChecked: new Date()
      },
      {
        id: 'status-3',
        service: 'WebGL Contexts',
        status: 'optimized',
        health: 95,
        lastChecked: new Date()
      },
      {
        id: 'status-4',
        service: 'Event Bus',
        status: 'connected',
        health: 100,
        lastChecked: new Date()
      }
    ];
  }

  /**
   * Initialize form definitions
   */
  private initializeForms(): void {
    // Profile Form
    this.state.formDefinitions.set('profile', {
      id: 'profile',
      name: 'Profile Settings',
      fields: {
        fullName: {
          type: 'text',
          label: 'Full Name',
          required: true,
          placeholder: 'Enter your full name'
        },
        email: {
          type: 'email',
          label: 'Email',
          required: true,
          validation: 'email',
          placeholder: 'Enter your email'
        },
        language: {
          type: 'select',
          label: 'Preferred Language',
          options: ['English', 'Arabic', 'French'],
          default: 'English'
        },
        voiceSpeed: {
          type: 'select',
          label: 'Voice Response Speed',
          options: ['Normal', 'Fast', 'Slow'],
          default: 'Normal'
        }
      }
    });

    // Settings Form
    this.state.formDefinitions.set('settings', {
      id: 'settings',
      name: 'System Settings',
      fields: {
        autoConnect: {
          type: 'checkbox',
          label: 'Auto-connect on load',
          default: true
        },
        audioPlayback: {
          type: 'checkbox',
          label: 'Audio playback enabled',
          default: true
        },
        pushToTalk: {
          type: 'checkbox',
          label: 'Push-to-talk mode',
          default: false
        },
        showDock: {
          type: 'checkbox',
          label: 'Show dock navigation',
          default: true
        },
        theme: {
          type: 'select',
          label: 'Theme',
          options: ['System', 'Light', 'Dark'],
          default: 'System'
        },
        galaxyAnimation: {
          type: 'select',
          label: 'Galaxy Animation',
          options: ['Enhanced', 'Classic', 'Minimal'],
          default: 'Enhanced'
        },
        vadType: {
          type: 'select',
          label: 'VAD Type',
          options: ['Semantic VAD', 'Server VAD', 'Disabled'],
          default: 'Semantic VAD'
        },
        audioCodec: {
          type: 'select',
          label: 'Audio Codec',
          options: ['Opus (48kHz)', 'PCMU (8kHz)', 'PCMA (8kHz)'],
          default: 'Opus (48kHz)'
        }
      }
    });

    // Initialize form states
    this.state.formDefinitions.forEach((definition, formId) => {
      const fields = new Map<string, FormField>();
      
      Object.entries(definition.fields).forEach(([fieldId, fieldDef]) => {
        fields.set(fieldId, {
          id: fieldId,
          value: fieldDef.default ?? '',
          isValid: !fieldDef.required,
          touched: false
        });
      });

      this.state.forms.set(formId, {
        formId,
        fields,
        isValid: true,
        isDirty: false,
        isSubmitting: false
      });
    });
  }

  /**
   * Get form state
   */
  getFormState(formId: string): FormState | null {
    const form = this.state.forms.get(formId);
    if (!form) {
      console.warn(`[DashboardDataService] Form ${formId} not found`);
      return null;
    }
    return form;
  }

  /**
   * Get all forms state
   */
  getAllFormsState(): Record<string, any> {
    const formsState: Record<string, any> = {};
    
    this.state.forms.forEach((form, formId) => {
      const definition = this.state.formDefinitions.get(formId);
      if (!definition) return;
      
      const fieldsData: Record<string, any> = {};
      form.fields.forEach((field, fieldId) => {
        fieldsData[fieldId] = {
          value: field.value,
          label: definition.fields[fieldId]?.label || fieldId,
          isValid: field.isValid,
          touched: field.touched,
          errorMessage: field.errorMessage
        };
      });
      
      formsState[formId] = {
        name: definition.name,
        isValid: form.isValid,
        isDirty: form.isDirty,
        isSubmitting: form.isSubmitting,
        fields: fieldsData
      };
    });
    
    return formsState;
  }

  /**
   * Set form field value
   */
  setFieldValue(formId: string, fieldId: string, value: any): { success: boolean; message: string } {
    const form = this.state.forms.get(formId);
    const definition = this.state.formDefinitions.get(formId);
    
    if (!form || !definition) {
      return { success: false, message: `Form ${formId} not found` };
    }
    
    const field = form.fields.get(fieldId);
    const fieldDef = definition.fields[fieldId];
    
    if (!field || !fieldDef) {
      return { success: false, message: `Field ${fieldId} not found in form ${formId}` };
    }
    
    // Update field value
    field.value = value;
    field.touched = true;
    
    // Validate field
    field.isValid = this.validateField(value, fieldDef);
    if (!field.isValid) {
      field.errorMessage = this.getValidationError(value, fieldDef);
    } else {
      field.errorMessage = undefined;
    }
    
    // Update form state
    form.isDirty = true;
    form.isValid = Array.from(form.fields.values()).every(f => f.isValid);
    
    // Emit event
    this.emit('form:field-changed', { formId, fieldId, value, isValid: field.isValid });
    
    return { 
      success: true, 
      message: `Field ${fieldDef.label} updated to "${value}"` 
    };
  }

  /**
   * Validate a field value
   */
  private validateField(value: any, fieldDef: FieldDefinition): boolean {
    // Required validation
    if (fieldDef.required && !value) {
      return false;
    }
    
    // Type-specific validation
    if (fieldDef.validation) {
      switch (fieldDef.validation) {
        case 'email':
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        case 'url':
          try {
            new URL(value);
            return true;
          } catch {
            return false;
          }
        case 'phone':
          return /^[\d\s\-\+\(\)]+$/.test(value) && value.replace(/\D/g, '').length >= 10;
        case 'apiKey':
          return value && value.length >= 20;
        default:
          return true;
      }
    }
    
    return true;
  }

  /**
   * Get validation error message
   */
  private getValidationError(value: any, fieldDef: FieldDefinition): string {
    if (fieldDef.required && !value) {
      return `${fieldDef.label} is required`;
    }
    
    if (fieldDef.validation) {
      switch (fieldDef.validation) {
        case 'email':
          return 'Please enter a valid email address';
        case 'url':
          return 'Please enter a valid URL';
        case 'phone':
          return 'Please enter a valid phone number';
        case 'apiKey':
          return 'API key must be at least 20 characters';
        default:
          return 'Invalid value';
      }
    }
    
    return 'Invalid value';
  }

  /**
   * Submit form
   */
  async submitForm(formId: string): Promise<{ success: boolean; message: string; data?: any }> {
    const form = this.state.forms.get(formId);
    const definition = this.state.formDefinitions.get(formId);
    
    if (!form || !definition) {
      return { success: false, message: `Form ${formId} not found` };
    }
    
    // Validate all fields
    let allValid = true;
    form.fields.forEach((field, fieldId) => {
      const fieldDef = definition.fields[fieldId];
      if (fieldDef) {
        field.isValid = this.validateField(field.value, fieldDef);
        if (!field.isValid) {
          field.errorMessage = this.getValidationError(field.value, fieldDef);
          allValid = false;
        }
      }
    });
    
    if (!allValid) {
      form.isValid = false;
      this.emit('form:validation-failed', { formId });
      return { success: false, message: 'Please fix validation errors' };
    }
    
    // Mark as submitting
    form.isSubmitting = true;
    this.emit('form:submitting', { formId });
    
    // Simulate form submission (in real app, this would make API call)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get form data
    const formData: Record<string, any> = {};
    form.fields.forEach((field, fieldId) => {
      formData[fieldId] = field.value;
    });
    
    // Mark as submitted
    form.isSubmitting = false;
    form.isDirty = false;
    this.emit('form:submitted', { formId, data: formData });
    
    // Add activity
    this.addActivity({
      type: 'dashboard',
      message: `Form "${definition.name}" submitted successfully`,
      severity: 'success',
      metadata: { formId, data: formData }
    });
    
    return { 
      success: true, 
      message: `${definition.name} submitted successfully`,
      data: formData
    };
  }

  /**
   * Reset form
   */
  resetForm(formId: string): { success: boolean; message: string } {
    const form = this.state.forms.get(formId);
    const definition = this.state.formDefinitions.get(formId);
    
    if (!form || !definition) {
      return { success: false, message: `Form ${formId} not found` };
    }
    
    // Reset all fields to defaults
    form.fields.forEach((field, fieldId) => {
      const fieldDef = definition.fields[fieldId];
      if (fieldDef) {
        field.value = fieldDef.default ?? '';
        field.isValid = !fieldDef.required;
        field.touched = false;
        field.errorMessage = undefined;
      }
    });
    
    // Reset form state
    form.isValid = true;
    form.isDirty = false;
    form.isSubmitting = false;
    
    this.emit('form:reset', { formId });
    
    return { 
      success: true, 
      message: `Form "${definition.name}" reset to defaults` 
    };
  }

  /**
   * Initialize theme synchronization
   */
  private initializeThemeSync(): void {
    // Sync with current theme on initialization
    this.syncThemeState();
    
    // Set up observer for theme changes
    if (typeof document !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const oldTheme = this.state.theme.resolvedTheme;
            this.syncThemeState();
            
            if (oldTheme !== this.state.theme.resolvedTheme) {
              this.emit('dashboard:theme-changed', {
                previousTheme: oldTheme,
                currentTheme: this.state.theme.resolvedTheme,
                theme: this.state.theme.theme
              });
            }
          }
        });
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });
    }
  }

  // Query Methods for VA

  /**
   * Get a specific metric by ID
   */
  getMetric(id: string): MetricData | undefined {
    return this.state.metrics.get(id);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): MetricData[] {
    return Array.from(this.state.metrics.values());
  }

  /**
   * Get metrics by status
   */
  getMetricsByStatus(status: 'good' | 'warning' | 'critical'): MetricData[] {
    return this.getAllMetrics().filter(m => m.status === status);
  }

  /**
   * Get recent activities with optional limit
   */
  getRecentActivities(limit?: number): ActivityItem[] {
    const activities = [...this.state.activities].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
    return limit ? activities.slice(0, limit) : activities;
  }

  /**
   * Get filtered activities
   */
  getFilteredActivities(criteria: FilterCriteria): ActivityItem[] {
    let filtered = [...this.state.activities];

    if (criteria.type && criteria.type.length > 0) {
      filtered = filtered.filter(a => criteria.type!.includes(a.type));
    }

    if (criteria.severity && criteria.severity.length > 0) {
      filtered = filtered.filter(a => a.severity && criteria.severity!.includes(a.severity));
    }

    if (criteria.timeRange) {
      filtered = filtered.filter(a => 
        a.timestamp >= criteria.timeRange!.start && 
        a.timestamp <= criteria.timeRange!.end
      );
    }

    if (criteria.search) {
      const search = criteria.search.toLowerCase();
      filtered = filtered.filter(a => 
        a.message.toLowerCase().includes(search)
      );
    }

    return filtered;
  }

  /**
   * Get system status
   */
  getSystemStatus(): SystemStatus[] {
    return [...this.state.systemStatus];
  }

  /**
   * Get system health summary
   */
  getSystemHealthSummary(): {
    overall: 'healthy' | 'degraded' | 'critical';
    avgHealth: number;
    issues: SystemStatus[];
  } {
    const statuses = this.getSystemStatus();
    const avgHealth = statuses.reduce((sum, s) => sum + s.health, 0) / statuses.length;
    const issues = statuses.filter(s => s.health < 90);

    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (avgHealth < 70) overall = 'critical';
    else if (avgHealth < 90) overall = 'degraded';

    return { overall, avgHealth, issues };
  }

  // Control Methods for VA

  /**
   * Refresh a specific metric
   */
  async refreshMetric(id: string): Promise<void> {
    const metric = this.state.metrics.get(id);
    if (!metric) {
      throw new Error(`Metric ${id} not found`);
    }

    // Simulate refresh with random variation
    const updatedMetric = { ...metric };
    
    if (typeof metric.value === 'number') {
      // Add some random variation
      const variation = Math.random() * 0.1 - 0.05; // ±5%
      updatedMetric.value = Math.round(metric.value * (1 + variation));
    }
    
    updatedMetric.lastUpdated = new Date();
    this.state.metrics.set(id, updatedMetric);

    this.emit('dashboard:metric-updated', { metric: updatedMetric });
    
    // Log activity
    this.addActivity({
      type: 'system',
      message: `Metric "${metric.label}" refreshed`,
      severity: 'info'
    });
  }

  /**
   * Refresh all metrics
   */
  async refreshAllMetrics(): Promise<void> {
    const promises = Array.from(this.state.metrics.keys()).map(id => 
      this.refreshMetric(id)
    );
    await Promise.all(promises);
    this.state.lastRefresh = new Date();
    this.emit('dashboard:all-metrics-refreshed');
  }

  /**
   * Add a new activity
   */
  addActivity(activity: Omit<ActivityItem, 'id' | 'timestamp'>): void {
    const newActivity: ActivityItem = {
      ...activity,
      id: `act-${Date.now()}`,
      timestamp: new Date()
    };

    this.state.activities.unshift(newActivity);
    
    // Keep only last 100 activities
    if (this.state.activities.length > 100) {
      this.state.activities = this.state.activities.slice(0, 100);
    }

    this.emit('dashboard:activity-added', { activity: newActivity });
  }

  /**
   * Clear activities by filter
   */
  clearActivities(criteria?: FilterCriteria): void {
    if (!criteria) {
      this.state.activities = [];
    } else {
      const toKeep = this.getFilteredActivities(criteria);
      const toKeepIds = new Set(toKeep.map(a => a.id));
      this.state.activities = this.state.activities.filter(a => !toKeepIds.has(a.id));
    }

    this.emit('dashboard:activities-cleared', { criteria });
  }

  /**
   * Update system status
   */
  updateSystemStatus(serviceId: string, update: Partial<SystemStatus>): void {
    const index = this.state.systemStatus.findIndex(s => s.id === serviceId);
    if (index === -1) {
      throw new Error(`Service ${serviceId} not found`);
    }

    this.state.systemStatus[index] = {
      ...this.state.systemStatus[index],
      ...update,
      lastChecked: new Date()
    };

    this.emit('dashboard:status-updated', { status: this.state.systemStatus[index] });
  }

  /**
   * Set auto-refresh for a metric
   */
  setAutoRefresh(metricId: string, intervalMs: number): void {
    // Clear existing interval if any
    if (this.refreshIntervals.has(metricId)) {
      clearInterval(this.refreshIntervals.get(metricId)!);
    }

    const interval = setInterval(() => {
      this.refreshMetric(metricId).catch(console.error);
    }, intervalMs);

    this.refreshIntervals.set(metricId, interval);
    this.emit('dashboard:auto-refresh-set', { metricId, intervalMs });
  }

  /**
   * Clear auto-refresh for a metric
   */
  clearAutoRefresh(metricId: string): void {
    if (this.refreshIntervals.has(metricId)) {
      clearInterval(this.refreshIntervals.get(metricId)!);
      this.refreshIntervals.delete(metricId);
      this.emit('dashboard:auto-refresh-cleared', { metricId });
    }
  }


  /**
   * Sync theme state with DOM and localStorage
   */
  private syncThemeState(): void {
    if (typeof document === 'undefined') return;
    
    // Check localStorage for theme (next-themes stores it here)
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    
    // Check if dark class is present on document
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    // Determine resolved theme
    const resolvedTheme: ResolvedTheme = isDarkMode ? 'dark' : 'light';
    
    // Determine actual theme setting
    const theme: Theme = storedTheme || 'system';
    const isSystem = theme === 'system';
    
    this.state.theme = {
      theme,
      resolvedTheme,
      isSystem
    };
  }

  /**
   * Get current theme state
   */
  getThemeState(): ThemeState {
    this.syncThemeState();
    return { ...this.state.theme };
  }

  /**
   * Set theme with state awareness
   */
  setTheme(theme: Theme | 'toggle'): { success: boolean; alreadyInState: boolean; message: string; previousTheme?: ResolvedTheme; newTheme?: Theme } {
    this.syncThemeState();
    
    // Check if already in desired state
    if (theme !== 'toggle') {
      if (this.state.theme.theme === theme && theme !== 'system') {
        return {
          success: true,
          alreadyInState: true,
          message: `Already using ${theme} theme`
        };
      }
      
      // For system theme, check if already set to system
      if (theme === 'system' && this.state.theme.isSystem) {
        return {
          success: true,
          alreadyInState: true,
          message: 'Already using system theme'
        };
      }
    }

    try {
      const previousResolvedTheme = this.state.theme.resolvedTheme;
      let newTheme: Theme;
      
      if (theme === 'toggle') {
        // Toggle between light and dark (not system)
        newTheme = this.state.theme.resolvedTheme === 'dark' ? 'light' : 'dark';
      } else {
        newTheme = theme;
      }

      // Update localStorage (next-themes format)
      localStorage.setItem('theme', newTheme);
      
      // Apply theme change to DOM
      if (newTheme === 'system') {
        // Use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.applyThemeToDOM(prefersDark ? 'dark' : 'light');
      } else {
        this.applyThemeToDOM(newTheme as ResolvedTheme);
      }

      // Update state
      this.syncThemeState();

      // Emit change event
      this.emit('dashboard:theme-changed', {
        previousTheme: previousResolvedTheme,
        currentTheme: this.state.theme.resolvedTheme,
        theme: this.state.theme.theme
      });

      // Log activity
      this.addActivity({
        type: 'system',
        message: `Theme changed to ${newTheme}`,
        severity: 'info'
      });

      return {
        success: true,
        alreadyInState: false,
        message: `Switched to ${newTheme} theme`,
        previousTheme: previousResolvedTheme,
        newTheme
      };

    } catch (error) {
      console.error('[DashboardDataService] Failed to set theme:', error);
      return {
        success: false,
        alreadyInState: false,
        message: 'Failed to change theme'
      };
    }
  }

  /**
   * Apply theme to DOM
   */
  private applyThemeToDOM(theme: ResolvedTheme): void {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    // Trigger next-themes update event
    window.dispatchEvent(new Event('theme-change'));
  }

  /**
   * Get complete dashboard state
   */
  getState(): {
    metrics: MetricData[];
    activities: ActivityItem[];
    systemStatus: SystemStatus[];
    theme: ThemeState;
    summary: {
      totalMetrics: number;
      criticalMetrics: number;
      recentActivityCount: number;
      systemHealth: {
        overall: 'healthy' | 'degraded' | 'critical';
        avgHealth: number;
        issues: SystemStatus[];
      };
    };
  } {
    const metrics = this.getAllMetrics();
    const criticalMetrics = this.getMetricsByStatus('critical');
    const systemHealth = this.getSystemHealthSummary();

    return {
      metrics,
      activities: this.getRecentActivities(10),
      systemStatus: this.getSystemStatus(),
      theme: this.getThemeState(),
      summary: {
        totalMetrics: metrics.length,
        criticalMetrics: criticalMetrics.length,
        recentActivityCount: this.state.activities.length,
        systemHealth
      }
    };
  }

  /**
   * Initialize dashboard widgets
   */
  private initializeWidgets(): void {
    // Initialize default dashboard widgets
    const defaultWidgets: WidgetState[] = [
      {
        id: 'metrics-widget',
        name: 'Key Metrics',
        type: 'metrics',
        isVisible: true,
        isExpanded: true,
        isLoading: false,
        position: 0,
        settings: { refreshInterval: 30000 },
        lastRefresh: new Date()
      },
      {
        id: 'activities-widget',
        name: 'Recent Activities',
        type: 'activities',
        isVisible: true,
        isExpanded: true,
        isLoading: false,
        position: 1,
        settings: { maxItems: 10 },
        lastRefresh: new Date()
      },
      {
        id: 'status-widget',
        name: 'System Status',
        type: 'status',
        isVisible: true,
        isExpanded: true,
        isLoading: false,
        position: 2,
        settings: { showDetails: true },
        lastRefresh: new Date()
      },
      {
        id: 'performance-chart',
        name: 'Performance Chart',
        type: 'chart',
        isVisible: true,
        isExpanded: false,
        isLoading: false,
        position: 3,
        settings: { chartType: 'line', timeRange: '1h' },
        lastRefresh: new Date()
      }
    ];

    // Register default widgets
    defaultWidgets.forEach(widget => {
      this.state.widgets.set(widget.id, widget);
    });

    // Initialize widget filters
    this.state.widgetFilters.set('default', {
      visibility: 'all',
      types: [],
      expandedOnly: false
    });

    console.log('[DashboardDataService] Widgets initialized:', this.state.widgets.size);
  }

  /**
   * Get widget state
   */
  getWidgetState(widgetId: string): WidgetState | null {
    const widget = this.state.widgets.get(widgetId);
    if (!widget) {
      console.warn(`[DashboardDataService] Widget ${widgetId} not found`);
      return null;
    }
    return widget;
  }

  /**
   * Get all widgets
   */
  getAllWidgets(): WidgetState[] {
    return Array.from(this.state.widgets.values());
  }

  /**
   * Get visible widgets
   */
  getVisibleWidgets(): WidgetState[] {
    return Array.from(this.state.widgets.values())
      .filter(widget => widget.isVisible)
      .sort((a, b) => a.position - b.position);
  }

  /**
   * Toggle widget visibility
   */
  toggleWidget(widgetId: string): { success: boolean; message: string } {
    const widget = this.state.widgets.get(widgetId);
    if (!widget) {
      return { success: false, message: `Widget ${widgetId} not found` };
    }

    widget.isVisible = !widget.isVisible;
    
    // Emit event
    this.emit('widget:visibility-changed', { 
      widgetId, 
      isVisible: widget.isVisible 
    });

    return { 
      success: true, 
      message: `Widget ${widget.name} is now ${widget.isVisible ? 'visible' : 'hidden'}` 
    };
  }

  /**
   * Expand widget
   */
  expandWidget(widgetId: string): { success: boolean; message: string } {
    const widget = this.state.widgets.get(widgetId);
    if (!widget) {
      return { success: false, message: `Widget ${widgetId} not found` };
    }

    if (widget.isExpanded) {
      return { success: true, message: `Widget ${widget.name} is already expanded` };
    }

    widget.isExpanded = true;
    
    // Emit event
    this.emit('widget:expanded', { widgetId });

    return { 
      success: true, 
      message: `Widget ${widget.name} expanded` 
    };
  }

  /**
   * Collapse widget
   */
  collapseWidget(widgetId: string): { success: boolean; message: string } {
    const widget = this.state.widgets.get(widgetId);
    if (!widget) {
      return { success: false, message: `Widget ${widgetId} not found` };
    }

    if (!widget.isExpanded) {
      return { success: true, message: `Widget ${widget.name} is already collapsed` };
    }

    widget.isExpanded = false;
    
    // Emit event
    this.emit('widget:collapsed', { widgetId });

    return { 
      success: true, 
      message: `Widget ${widget.name} collapsed` 
    };
  }

  /**
   * Toggle widget expansion
   */
  toggleWidgetExpansion(widgetId: string): { success: boolean; message: string } {
    const widget = this.state.widgets.get(widgetId);
    if (!widget) {
      return { success: false, message: `Widget ${widgetId} not found` };
    }

    widget.isExpanded = !widget.isExpanded;
    
    // Emit event
    this.emit('widget:expansion-changed', { 
      widgetId, 
      isExpanded: widget.isExpanded 
    });

    return { 
      success: true, 
      message: `Widget ${widget.name} ${widget.isExpanded ? 'expanded' : 'collapsed'}` 
    };
  }

  /**
   * Refresh widget data
   */
  refreshWidget(widgetId: string): { success: boolean; message: string } {
    const widget = this.state.widgets.get(widgetId);
    if (!widget) {
      return { success: false, message: `Widget ${widgetId} not found` };
    }

    widget.isLoading = true;
    
    // Emit refresh start event
    this.emit('widget:refresh-start', { widgetId });

    // Simulate refresh completion after delay
    setTimeout(() => {
      widget.isLoading = false;
      widget.lastRefresh = new Date();
      
      // Emit refresh complete event
      this.emit('widget:refresh-complete', { widgetId });
    }, 1000);

    return { 
      success: true, 
      message: `Refreshing widget ${widget.name}` 
    };
  }

  /**
   * Reorder widgets
   */
  reorderWidgets(widgetOrder: string[]): { success: boolean; message: string } {
    // Validate all widget IDs exist
    for (const widgetId of widgetOrder) {
      if (!this.state.widgets.has(widgetId)) {
        return { success: false, message: `Widget ${widgetId} not found` };
      }
    }

    // Update positions
    widgetOrder.forEach((widgetId, index) => {
      const widget = this.state.widgets.get(widgetId);
      if (widget) {
        widget.position = index;
      }
    });

    // Emit event
    this.emit('widgets:reordered', { order: widgetOrder });

    return { 
      success: true, 
      message: 'Widgets reordered successfully' 
    };
  }

  /**
   * Apply widget filter
   */
  applyWidgetFilter(filter: WidgetFilter): { success: boolean; message: string } {
    this.state.widgetFilters.set('current', filter);
    
    // Apply filter to widgets
    this.state.widgets.forEach(widget => {
      let shouldShow = true;

      // Check visibility filter
      if (filter.visibility === 'visible' && !widget.isVisible) {
        shouldShow = false;
      } else if (filter.visibility === 'hidden' && widget.isVisible) {
        shouldShow = false;
      }

      // Check type filter
      if (filter.types && filter.types.length > 0 && !filter.types.includes(widget.type)) {
        shouldShow = false;
      }

      // Check expanded filter
      if (filter.expandedOnly && !widget.isExpanded) {
        shouldShow = false;
      }

      // Update visibility based on filter
      widget.isVisible = shouldShow;
    });

    // Emit event
    this.emit('widgets:filtered', { filter });

    return { 
      success: true, 
      message: 'Widget filter applied' 
    };
  }

  /**
   * Clear widget filters
   */
  clearWidgetFilters(): { success: boolean; message: string } {
    // Reset all widgets to visible
    this.state.widgets.forEach(widget => {
      widget.isVisible = true;
    });

    // Clear current filter
    this.state.widgetFilters.delete('current');

    // Emit event
    this.emit('widgets:filter-cleared', {});

    return { 
      success: true, 
      message: 'Widget filters cleared' 
    };
  }

  /**
   * Initialize workflow definitions and macros
   */
  private initializeWorkflows(): void {
    // Define some default workflows
    const defaultWorkflows: WorkflowDefinition[] = [
      {
        id: 'morning-routine',
        name: 'Morning Routine',
        description: 'Refresh all data and show key metrics',
        steps: [
          {
            id: 'step-1',
            type: 'data',
            action: 'refresh_all_metrics',
            parameters: {},
            description: 'Refresh all metrics'
          },
          {
            id: 'step-2',
            type: 'widget',
            action: 'show_widget',
            parameters: { widgetId: 'metrics-widget' },
            description: 'Show metrics widget'
          },
          {
            id: 'step-3',
            type: 'widget',
            action: 'expand_widget',
            parameters: { widgetId: 'metrics-widget' },
            description: 'Expand metrics widget'
          },
          {
            id: 'step-4',
            type: 'widget',
            action: 'show_widget',
            parameters: { widgetId: 'activities-widget' },
            description: 'Show activities widget'
          }
        ],
        createdAt: new Date(),
        usageCount: 0
      },
      {
        id: 'cleanup-view',
        name: 'Cleanup View',
        description: 'Hide all widgets and reset filters',
        steps: [
          {
            id: 'step-1',
            type: 'widget',
            action: 'hide_all_widgets',
            parameters: {},
            description: 'Hide all widgets'
          },
          {
            id: 'step-2',
            type: 'widget',
            action: 'clear_filters',
            parameters: {},
            description: 'Clear all filters'
          }
        ],
        createdAt: new Date(),
        usageCount: 0
      }
    ];

    // Register default workflows
    defaultWorkflows.forEach(workflow => {
      this.state.workflows.set(workflow.id, workflow);
    });

    // Create a macro for morning routine
    const morningMacro: DashboardMacro = {
      id: 'morning-macro',
      name: 'Morning Routine Macro',
      description: 'Quick morning dashboard setup',
      voiceTriggers: ['morning routine', 'start my day', 'morning setup'],
      workflow: defaultWorkflows[0],
      isEnabled: true,
      createdAt: new Date(),
      usageCount: 0
    };

    this.state.macros.set(morningMacro.id, morningMacro);

    console.log('[DashboardDataService] Workflows initialized:', this.state.workflows.size);
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: string, variables?: Record<string, any>): Promise<{ success: boolean; message: string; execution?: WorkflowExecution }> {
    const workflow = this.state.workflows.get(workflowId);
    if (!workflow) {
      return { success: false, message: `Workflow ${workflowId} not found` };
    }

    // Check if another workflow is running
    if (this.state.currentWorkflow && this.state.currentWorkflow.status === 'running') {
      return { success: false, message: 'Another workflow is already running' };
    }

    // Create execution instance
    const execution: WorkflowExecution = {
      workflowId,
      startedAt: new Date(),
      currentStepIndex: 0,
      status: 'running',
      results: variables || {},
      executionHistory: []
    };

    this.state.currentWorkflow = execution;
    this.emit('workflow:started', { workflowId, workflow: workflow.name });

    // Execute steps
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      execution.currentStepIndex = i;

      // Check preconditions
      if (step.preconditions) {
        const conditionsMet = await this.checkWorkflowConditions(step.preconditions);
        if (!conditionsMet) {
          const stepResult: WorkflowStepResult = {
            stepId: step.id,
            status: 'skipped',
            startedAt: new Date(),
            completedAt: new Date()
          };
          execution.executionHistory.push(stepResult);
          continue;
        }
      }

      // Execute step
      const stepResult = await this.executeWorkflowStep(step, execution.results);
      execution.executionHistory.push(stepResult);

      if (stepResult.status === 'failed') {
        execution.status = 'failed';
        execution.error = stepResult.error;
        break;
      }

      // Store step result
      if (stepResult.result) {
        execution.results[step.id] = stepResult.result;
      }

      this.emit('workflow:step-completed', { 
        workflowId, 
        stepId: step.id, 
        stepIndex: i, 
        totalSteps: workflow.steps.length 
      });
    }

    // Complete workflow
    if (execution.status === 'running') {
      execution.status = 'completed';
    }
    execution.completedAt = new Date();

    // Update workflow usage
    workflow.lastUsed = new Date();
    workflow.usageCount++;

    // Add to history
    this.state.workflowHistory.unshift(execution);
    if (this.state.workflowHistory.length > 50) {
      this.state.workflowHistory = this.state.workflowHistory.slice(0, 50);
    }

    this.state.currentWorkflow = null;
    this.emit('workflow:completed', { workflowId, status: execution.status });

    return {
      success: execution.status === 'completed',
      message: execution.status === 'completed' 
        ? `Workflow "${workflow.name}" completed successfully`
        : `Workflow "${workflow.name}" failed: ${execution.error}`,
      execution
    };
  }

  /**
   * Execute a single workflow step
   */
  private async executeWorkflowStep(step: WorkflowStep, variables: Record<string, any>): Promise<WorkflowStepResult> {
    const result: WorkflowStepResult = {
      stepId: step.id,
      status: 'success',
      startedAt: new Date(),
      completedAt: new Date()
    };

    try {
      switch (step.type) {
        case 'widget':
          result.result = await this.executeWidgetAction(step.action, step.parameters);
          break;
        case 'form':
          result.result = await this.executeFormAction(step.action, step.parameters);
          break;
        case 'data':
          result.result = await this.executeDataAction(step.action, step.parameters);
          break;
        case 'navigation':
          // Would integrate with NavigationService
          result.result = { success: true, message: 'Navigation action simulated' };
          break;
        case 'wait':
          await new Promise(resolve => setTimeout(resolve, step.parameters.duration || 1000));
          break;
        case 'condition':
          // Conditional logic handled by preconditions
          break;
      }
      
      result.completedAt = new Date();
    } catch (error: any) {
      result.status = 'failed';
      result.error = error.message;
      result.completedAt = new Date();
    }

    return result;
  }

  /**
   * Execute widget-related workflow actions
   */
  private async executeWidgetAction(action: string, parameters: any): Promise<any> {
    switch (action) {
      case 'show_widget':
        return this.toggleWidget(parameters.widgetId);
      case 'hide_widget':
        return this.toggleWidget(parameters.widgetId);
      case 'expand_widget':
        return this.expandWidget(parameters.widgetId);
      case 'collapse_widget':
        return this.collapseWidget(parameters.widgetId);
      case 'refresh_widget':
        return this.refreshWidget(parameters.widgetId);
      case 'hide_all_widgets':
        this.state.widgets.forEach(widget => {
          widget.isVisible = false;
        });
        this.emit('widgets:all-hidden', {});
        return { success: true, message: 'All widgets hidden' };
      case 'show_all_widgets':
        this.state.widgets.forEach(widget => {
          widget.isVisible = true;
        });
        this.emit('widgets:all-shown', {});
        return { success: true, message: 'All widgets shown' };
      case 'clear_filters':
        return this.clearWidgetFilters();
      default:
        throw new Error(`Unknown widget action: ${action}`);
    }
  }

  /**
   * Execute form-related workflow actions
   */
  private async executeFormAction(action: string, parameters: any): Promise<any> {
    switch (action) {
      case 'fill_field':
        return this.setFieldValue(parameters.formId, parameters.fieldId, parameters.value);
      case 'submit_form':
        return await this.submitForm(parameters.formId);
      case 'reset_form':
        return this.resetForm(parameters.formId);
      case 'validate_form':
        const form = this.state.forms.get(parameters.formId);
        return { 
          success: true, 
          isValid: form?.isValid || false,
          message: form?.isValid ? 'Form is valid' : 'Form has validation errors'
        };
      default:
        throw new Error(`Unknown form action: ${action}`);
    }
  }

  /**
   * Execute data-related workflow actions
   */
  private async executeDataAction(action: string, parameters: any): Promise<any> {
    switch (action) {
      case 'refresh_all_metrics':
        await this.refreshAllMetrics();
        return { success: true, message: 'All metrics refreshed' };
      case 'refresh_metric':
        await this.refreshMetric(parameters.metricId);
        return { success: true, message: `Metric ${parameters.metricId} refreshed` };
      case 'add_activity':
        this.addActivity(parameters);
        return { success: true, message: 'Activity added' };
      case 'clear_activities':
        this.clearActivities(parameters.filter);
        return { success: true, message: 'Activities cleared' };
      default:
        throw new Error(`Unknown data action: ${action}`);
    }
  }

  /**
   * Check workflow conditions
   */
  private async checkWorkflowConditions(conditions: WorkflowCondition[]): Promise<boolean> {
    for (const condition of conditions) {
      const met = await this.evaluateCondition(condition);
      if (!met) return false;
    }
    return true;
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(condition: WorkflowCondition): Promise<boolean> {
    let targetValue: any;

    switch (condition.type) {
      case 'state':
        // Check state values
        if (condition.target.startsWith('widget.')) {
          const widgetId = condition.target.split('.')[1];
          const widget = this.state.widgets.get(widgetId);
          targetValue = widget ? widget.isVisible : false;
        } else if (condition.target.startsWith('form.')) {
          const [, formId, fieldId] = condition.target.split('.');
          const form = this.state.forms.get(formId);
          const field = form?.fields.get(fieldId);
          targetValue = field?.value;
        }
        break;
      case 'value':
        // Direct value comparison
        targetValue = condition.target;
        break;
      case 'exists':
        // Check if something exists
        if (condition.target.startsWith('widget.')) {
          const widgetId = condition.target.split('.')[1];
          targetValue = this.state.widgets.has(widgetId);
        } else if (condition.target.startsWith('form.')) {
          const formId = condition.target.split('.')[1];
          targetValue = this.state.forms.has(formId);
        }
        break;
    }

    // Evaluate operator
    switch (condition.operator) {
      case 'equals':
        return targetValue === condition.value;
      case 'not_equals':
        return targetValue !== condition.value;
      case 'contains':
        return String(targetValue).includes(String(condition.value));
      case 'greater_than':
        return Number(targetValue) > Number(condition.value);
      case 'less_than':
        return Number(targetValue) < Number(condition.value);
      default:
        return false;
    }
  }

  /**
   * Create a custom workflow
   */
  createWorkflow(workflow: Omit<WorkflowDefinition, 'createdAt' | 'usageCount'>): { success: boolean; message: string; workflowId?: string } {
    if (this.state.workflows.has(workflow.id)) {
      return { success: false, message: 'Workflow with this ID already exists' };
    }

    const newWorkflow: WorkflowDefinition = {
      ...workflow,
      createdAt: new Date(),
      usageCount: 0
    };

    this.state.workflows.set(workflow.id, newWorkflow);
    this.emit('workflow:created', { workflowId: workflow.id, name: workflow.name });

    return { 
      success: true, 
      message: `Workflow "${workflow.name}" created successfully`,
      workflowId: workflow.id
    };
  }

  /**
   * Get all workflows
   */
  getAllWorkflows(): WorkflowDefinition[] {
    return Array.from(this.state.workflows.values());
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): WorkflowDefinition | null {
    return this.state.workflows.get(workflowId) || null;
  }

  /**
   * Create a macro
   */
  createMacro(macro: Omit<DashboardMacro, 'createdAt' | 'usageCount'>): { success: boolean; message: string; macroId?: string } {
    if (this.state.macros.has(macro.id)) {
      return { success: false, message: 'Macro with this ID already exists' };
    }

    const newMacro: DashboardMacro = {
      ...macro,
      createdAt: new Date(),
      usageCount: 0
    };

    this.state.macros.set(macro.id, newMacro);
    this.emit('macro:created', { macroId: macro.id, name: macro.name });

    return { 
      success: true, 
      message: `Macro "${macro.name}" created successfully`,
      macroId: macro.id
    };
  }

  /**
   * Execute a macro by voice trigger
   */
  async executeMacroByTrigger(trigger: string): Promise<{ success: boolean; message: string }> {
    // Find matching macro
    const macro = Array.from(this.state.macros.values()).find(m => 
      m.isEnabled && m.voiceTriggers.some(t => 
        trigger.toLowerCase().includes(t.toLowerCase())
      )
    );

    if (!macro) {
      return { success: false, message: 'No matching macro found' };
    }

    // Update macro usage
    macro.lastUsed = new Date();
    macro.usageCount++;

    // Execute the macro's workflow
    return await this.executeWorkflow(macro.workflow.id);
  }

  /**
   * Search across dashboard
   */
  searchDashboard(query: SearchQuery): SearchResult[] {
    const results: SearchResult[] = [];
    const searchTerm = query.query.toLowerCase();

    // Search metrics
    if (query.scope.includes('metrics') || query.scope.includes('all')) {
      this.state.metrics.forEach(metric => {
        if (metric.label.toLowerCase().includes(searchTerm) ||
            String(metric.value).toLowerCase().includes(searchTerm)) {
          results.push({
            type: 'metric',
            id: metric.id,
            name: metric.label,
            description: `Value: ${metric.value}${metric.unit ? ' ' + metric.unit : ''}`,
            relevanceScore: this.calculateRelevance(searchTerm, metric.label),
            data: metric,
            highlight: metric.label
          });
        }
      });
    }

    // Search activities
    if (query.scope.includes('activities') || query.scope.includes('all')) {
      this.state.activities.forEach(activity => {
        if (activity.message.toLowerCase().includes(searchTerm)) {
          // Apply filters if provided
          if (query.filters?.severity && !query.filters.severity.includes(activity.severity || '')) {
            return;
          }
          if (query.filters?.timeRange) {
            if (activity.timestamp < query.filters.timeRange.start ||
                activity.timestamp > query.filters.timeRange.end) {
              return;
            }
          }

          results.push({
            type: 'activity',
            id: activity.id,
            name: activity.type,
            description: activity.message,
            relevanceScore: this.calculateRelevance(searchTerm, activity.message),
            data: activity,
            highlight: activity.message
          });
        }
      });
    }

    // Search widgets
    if (query.scope.includes('widgets') || query.scope.includes('all')) {
      this.state.widgets.forEach(widget => {
        if (widget.name.toLowerCase().includes(searchTerm)) {
          results.push({
            type: 'widget',
            id: widget.id,
            name: widget.name,
            description: `Widget type: ${widget.type}, ${widget.isVisible ? 'visible' : 'hidden'}`,
            relevanceScore: this.calculateRelevance(searchTerm, widget.name),
            data: widget,
            highlight: widget.name
          });
        }
      });
    }

    // Sort results
    if (query.sortBy === 'relevance') {
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } else if (query.sortBy === 'name') {
      results.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Apply limit
    if (query.limit) {
      return results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateRelevance(searchTerm: string, text: string): number {
    const lowerText = text.toLowerCase();
    const lowerSearch = searchTerm.toLowerCase();
    
    // Exact match
    if (lowerText === lowerSearch) return 100;
    
    // Starts with search term
    if (lowerText.startsWith(lowerSearch)) return 80;
    
    // Contains search term
    if (lowerText.includes(lowerSearch)) return 60;
    
    // Partial match
    const searchWords = lowerSearch.split(' ');
    const matchedWords = searchWords.filter(word => lowerText.includes(word));
    return (matchedWords.length / searchWords.length) * 40;
  }

  /**
   * Batch control widgets
   */
  batchControlWidgets(operations: Array<{ widgetId: string; action: 'show' | 'hide' | 'expand' | 'collapse' | 'refresh' }>): { success: boolean; message: string; results: any[] } {
    const results: any[] = [];
    
    for (const op of operations) {
      let result: any;
      
      switch (op.action) {
        case 'show':
        case 'hide':
          result = this.toggleWidget(op.widgetId);
          break;
        case 'expand':
          result = this.expandWidget(op.widgetId);
          break;
        case 'collapse':
          result = this.collapseWidget(op.widgetId);
          break;
        case 'refresh':
          result = this.refreshWidget(op.widgetId);
          break;
      }
      
      results.push({ widgetId: op.widgetId, action: op.action, result });
    }
    
    this.emit('widgets:batch-controlled', { operations, results });
    
    return {
      success: true,
      message: `Performed ${operations.length} widget operations`,
      results
    };
  }

  /**
   * Get comprehensive dashboard summary
   */
  getDashboardSummary(): {
    metrics: { total: number; critical: number; warning: number };
    activities: { total: number; recent: number; errors: number };
    widgets: { total: number; visible: number; expanded: number };
    forms: { total: number; withData: number; invalid: number };
    workflows: { total: number; running: boolean; lastCompleted?: string };
    system: { health: string; uptime: number };
  } {
    const criticalMetrics = this.getMetricsByStatus('critical').length;
    const warningMetrics = this.getMetricsByStatus('warning').length;
    
    const recentActivities = this.state.activities.filter(a => 
      (Date.now() - a.timestamp.getTime()) < 3600000 // Last hour
    ).length;
    
    const errorActivities = this.state.activities.filter(a => 
      a.severity === 'error'
    ).length;
    
    const visibleWidgets = Array.from(this.state.widgets.values()).filter(w => w.isVisible).length;
    const expandedWidgets = Array.from(this.state.widgets.values()).filter(w => w.isExpanded).length;
    
    const formsWithData = Array.from(this.state.forms.values()).filter(f => f.isDirty).length;
    const invalidForms = Array.from(this.state.forms.values()).filter(f => !f.isValid).length;
    
    const systemHealth = this.getSystemHealthSummary();
    const uptimeMetric = this.state.metrics.get('uptime');
    
    return {
      metrics: {
        total: this.state.metrics.size,
        critical: criticalMetrics,
        warning: warningMetrics
      },
      activities: {
        total: this.state.activities.length,
        recent: recentActivities,
        errors: errorActivities
      },
      widgets: {
        total: this.state.widgets.size,
        visible: visibleWidgets,
        expanded: expandedWidgets
      },
      forms: {
        total: this.state.forms.size,
        withData: formsWithData,
        invalid: invalidForms
      },
      workflows: {
        total: this.state.workflows.size,
        running: this.state.currentWorkflow?.status === 'running' || false,
        lastCompleted: this.state.workflowHistory[0]?.workflowId
      },
      system: {
        health: systemHealth.overall,
        uptime: Number(uptimeMetric?.value) || 0
      }
    };
  }

  /**
   * Handle voice commands for dashboard data
   */
  handleVoiceCommand(command: string, parameters?: any): { success: boolean; message: string; data?: any } {
    console.log('[DashboardDataService] Voice command:', command, parameters);

    switch (command) {
      case 'query_metrics':
        const metrics = this.getAllMetrics();
        return {
          success: true,
          message: `Found ${metrics.length} metrics`,
          data: metrics
        };

      case 'refresh_metric':
        if (!parameters?.metricId) {
          return { success: false, message: 'Metric ID required' };
        }
        this.refreshMetric(parameters.metricId);
        return { success: true, message: `Refreshing metric ${parameters.metricId}` };

      case 'query_activities':
        const limit = parameters?.limit || 10;
        const activities = this.getRecentActivities(limit);
        return {
          success: true,
          message: `Found ${activities.length} recent activities`,
          data: activities
        };

      case 'system_health':
        const health = this.getSystemHealthSummary();
        return {
          success: true,
          message: `System is ${health.overall} with ${health.avgHealth.toFixed(1)}% average health`,
          data: health
        };

      // Widget commands
      case 'show_widget':
        if (!parameters?.widgetId) {
          return { success: false, message: 'Widget ID required' };
        }
        return this.toggleWidget(parameters.widgetId);

      case 'expand_widget':
        if (!parameters?.widgetId) {
          return { success: false, message: 'Widget ID required' };
        }
        return this.expandWidget(parameters.widgetId);

      case 'collapse_widget':
        if (!parameters?.widgetId) {
          return { success: false, message: 'Widget ID required' };
        }
        return this.collapseWidget(parameters.widgetId);

      case 'refresh_widget':
        if (!parameters?.widgetId) {
          return { success: false, message: 'Widget ID required' };
        }
        return this.refreshWidget(parameters.widgetId);

      case 'list_widgets':
        const widgets = this.getAllWidgets();
        return {
          success: true,
          message: `Found ${widgets.length} widgets`,
          data: widgets.map(w => ({
            id: w.id,
            name: w.name,
            type: w.type,
            isVisible: w.isVisible,
            isExpanded: w.isExpanded
          }))
        };

      case 'show_only_metrics':
        return this.applyWidgetFilter({
          visibility: 'visible',
          types: ['metrics'],
          expandedOnly: false
        });

      case 'show_all_widgets':
        return this.clearWidgetFilters();

      default:
        return { success: false, message: `Unknown command: ${command}` };
    }
  }

  /**
   * Shutdown and cleanup
   */
  shutdown(): void {
    // Clear all auto-refresh intervals
    this.refreshIntervals.forEach(interval => clearInterval(interval));
    this.refreshIntervals.clear();
    
    // Clear event listeners
    this.removeAllListeners();
    
    // Reset singleton
    DashboardDataService.instance = null;
    
    console.log('[DashboardDataService] Service shutdown complete');
  }
}

// Export singleton instance
export const dashboardDataService = DashboardDataService.getInstance();