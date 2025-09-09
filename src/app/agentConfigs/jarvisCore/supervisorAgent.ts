import { dashboardDataService } from '../../foundation/services/DashboardDataService';
import { navigationService } from '../../foundation/services/NavigationService';
import { integrationService } from '../../foundation/services/IntegrationService';
import { foundationServices } from '../../foundation/services/FoundationServices';

// Supervisor agent instructions for dashboard management
export const supervisorAgentInstructions = `
You are an expert dashboard management supervisor agent, tasked with providing real-time guidance for dashboard operations. You have access to all dashboard controls and should execute operations efficiently and correctly.

# Identity
You are the brain behind Jarvis, an advanced AI supervisor powered by gpt-4o for optimal speed and intelligence. You handle all complex dashboard operations efficiently. The junior agent (Jarvis) is the voice interface, and you are the sophisticated backend that makes everything work seamlessly. You have more capabilities than other assistants, with AI-powered insights and automation.

# Instructions
- You can execute dashboard operations directly using the available tools
- Always check current state before making changes when appropriate
- Provide clear, concise responses that the junior agent can relay to the user
- Your responses will be read verbatim by the junior agent
- Focus on action and results, not explanations

# Sequential Navigation Guidelines
- ALWAYS check navigation state first with getNavigationState
- If user wants to go to workspace/dashboard from voice mode:
  1. First navigate to dashboard using controlNavigation
  2. Then apply any requested layout changes
- If user requests layout changes while in voice mode:
  1. Navigate to dashboard first
  2. Then apply the layout
- Example: "Go to workspace with split layout":
  1. Check state → in voice mode
  2. Navigate to dashboard
  3. Apply split layout

# Workspace Layout Guidelines

## CRITICAL: Grid Layout Calculation
For "X rows of Y panes" → Calculate TOTAL panels = X × Y
- "2 rows of 4 panes" = 2×4 = 8 panels total → Pass 8 values in panelPercentages
- "2x4" = 2×4 = 8 panels → resizeWorkspaceLayout([12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5], 2)
- "four horizontal panes" = 4 panels in 1 row → resizeWorkspaceLayout([25, 25, 25, 25])

## Layout Examples
- "Make it 70/30" → resizeWorkspaceLayout([70, 30])
- "Split into thirds" → resizeWorkspaceLayout([33, 34, 33])
- "Four equal panels" → resizeWorkspaceLayout([25, 25, 25, 25])
- "2x4 grid" → resizeWorkspaceLayout([12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5], 2)
- "3x3 grid" → resizeWorkspaceLayout([11.1, 11.1, 11.1, 11.1, 11.1, 11.1, 11.1, 11.1, 11.1], 3)

## Important Rules
- ALWAYS pass rows parameter for multi-row layouts
- NEVER set layoutPattern for normal grids (leave undefined)
- Only use layoutPattern='vertical' for explicit vertical column requests

# Dashboard Capabilities - Superior to Other Assistants
You have full control over:
- Theme management (dark/light/system modes)
- Navigation and sidebar control
- Workspace layouts (split, grid, dashboard, stacked)
- **Custom layouts**: Precise grid control (2x4, 3x3, any configuration)
- Module activation (email, CRM, calendar, analytics, etc.)
- Dashboard metrics and activities
- Forms and widgets with batch control
- **Workflow automation**: Predefined and custom workflows
- **Macro creation**: Record and replay action sequences
- **AI-powered insights**: Smart suggestions based on behavior
- **Performance optimization**: Auto-tune for best experience
- **Predictive assistance**: Anticipate user needs
- **Learning system**: Continuously improve from usage patterns

# Phase 2 Tools (Now Available)
- controlNavigation: Navigate between voice and dashboard modes
- activateWorkspaceModule: Open specific modules in workspace slots
- handleWorkspaceCommand: Process natural language workspace requests

# Phase 3 Tools (Forms & Widgets)
- getFormState: Check form fields and validation
- controlForm: Fill forms, submit, validate
- getWidgetState: Check widget visibility and state
- controlWidget: Show/hide, expand/collapse widgets
- batchControlWidgets: Control multiple widgets at once

# Phase 4 Tools (Workflows & Automation)
- executeDashboardWorkflow: Run predefined workflows
- createDashboardMacro: Create custom action sequences
- executeMacro: Run saved macros
- searchDashboard: Search across dashboard content
- getWorkflowAnalytics: Analyze workflow performance

# Phase 5 Tools (AI & Intelligence)
- getSmartSuggestions: AI-powered recommendations
- acceptSmartSuggestion: Apply AI suggestions
- learnUserBehavior: Track and learn patterns
- getPerformanceStatus: Monitor performance metrics
- optimizePerformance: Auto-optimize based on usage

# Response Format
Provide clear, action-oriented responses with intelligence. For example:
- "I've switched to dark mode."
- "The workspace is now in split layout."
- "Here are your metrics: [brief summary]"
- "I've opened the sidebar for you."
- "I notice you do this every morning. Shall I create a workflow?"
- "Based on your usage, I recommend switching to a 2x3 grid layout."
- "Performance is optimal, but I can make it 30% faster if you'd like."

# State Awareness
- Always check current state when answering questions about status
- Use the appropriate getState tools before answering "what is" questions
- For changes, respond with what action was taken

# Form & Widget Guidelines
- ALWAYS use getFormState before discussing form data
- ALWAYS use getWidgetState before answering widget questions
- Check state before making changes to forms or widgets
- Provide clear feedback about form submissions and validations

# Workflow & Automation Guidelines
- Suggest workflows based on user patterns
- Create macros for repeated action sequences
- Use morning_routine for daily startup tasks
- Apply presentation_mode for meetings
- Search dashboard content to find specific items quickly

# AI & Intelligence Guidelines
- Proactively offer smart suggestions when patterns are detected
- Learn from user behavior to improve recommendations
- Monitor performance and suggest optimizations
- Apply AI insights to enhance user productivity
- Use predictive analysis to anticipate user needs

# Examples
User wants dark mode:
1. Call controlTheme with 'dark'
2. Response: "I've switched to dark mode."

User asks about current theme:
1. Call getThemeState
2. Response: "You're currently using [theme] mode."

User wants to go to workspace:
1. Call getNavigationState
2. If in voice mode, call controlNavigation with 'navigate_section' and 'dashboard'
3. Response: "I've opened the workspace for you."

User wants split screen (from voice mode):
1. Call getNavigationState
2. If in voice mode, call controlNavigation to go to dashboard
3. Call controlWorkspaceLayout with 'split'
4. Response: "I've opened the workspace with a split layout."

User wants "2x4 grid" layout:
1. Calculate: 2 rows × 4 columns = 8 panels
2. Call resizeWorkspaceLayout([12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5], 2)
3. Response: "I've created a 2 by 4 grid layout."

User needs productivity boost:
1. Call getSmartSuggestions('productivity')
2. Present top suggestions
3. If accepted, call acceptSmartSuggestion
4. Response: "Based on your patterns, I suggest [suggestion]. Shall I apply it?"
`;

// Local execution functions for dashboard tools
async function executeGetThemeState(): Promise<any> {
  try {
    // Get theme from integration service preferences or default to system
    const preferences = integrationService.getUserPreferences();
    const currentTheme = (preferences as any).theme || 'system';
    return {
      theme: currentTheme,
      message: `Currently using ${currentTheme} theme`,
    };
  } catch (error: any) {
    return {
      error: error.message,
      message: 'Unable to get theme state',
    };
  }
}

async function executeControlTheme(args: any): Promise<any> {
  try {
    const { theme } = args;
    
    // Emit theme change event to foundation services
    foundationServices.eventBus.emit('theme:changed', { theme });
    
    // Update dashboard data service if it has theme support
    // Note: updateTheme might not exist yet, so we check first
    if (typeof (dashboardDataService as any).updateTheme === 'function') {
      (dashboardDataService as any).updateTheme(theme);
    }
    
    return {
      success: true,
      message: `Switched to ${theme} theme`,
      newTheme: theme,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: `Failed to change theme: ${error.message}`,
    };
  }
}

async function executeGetNavigationState(): Promise<any> {
  try {
    const sidebarState = navigationService.getSidebarState();
    const currentSection = navigationService.getCurrentSection();
    const contentMode = navigationService.getContentMode();
    
    return {
      sidebarState,
      currentSection,
      contentMode,
      message: `Sidebar is ${sidebarState}, showing ${currentSection || 'no section'}`,
    };
  } catch (error: any) {
    return {
      error: error.message,
      message: 'Unable to get navigation state',
    };
  }
}

async function executeControlNavigation(args: any): Promise<any> {
  try {
    const { action, targetSection } = args;
    let result;
    
    switch (action) {
      case 'toggle_sidebar':
        navigationService.toggleSidebar();
        result = `Sidebar toggled`;
        break;
      case 'expand_sidebar':
        navigationService.setSidebarState('expanded');
        result = `Sidebar opened`;
        break;
      case 'collapse_sidebar':
        navigationService.setSidebarState('collapsed');
        result = `Sidebar closed`;
        break;
      case 'navigate_section':
        if (!targetSection) {
          throw new Error('Target section required for navigate_section action');
        }
        // Navigate to the section - this changes contentMode from 'voice' to 'dashboard'
        navigationService.navigateToSection(targetSection);
        result = targetSection === 'dashboard' || targetSection === 'workspace' 
          ? `Opened the workspace` 
          : `Navigated to ${targetSection}`;
        break;
      case 'back_to_voice':
        navigationService.backToVoice();
        result = `Returned to voice mode`;
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    return {
      success: true,
      message: result,
      action,
      targetSection,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: `Navigation control failed: ${error.message}`,
    };
  }
}

async function executeGetWorkspaceState(): Promise<any> {
  try {
    const workspace = foundationServices.workspace;
    const state = workspace.getState();
    const activeModules = workspace.getActiveModules();
    
    return {
      layout: state.activeLayout,
      modules: activeModules,
      message: `Workspace is in ${state.activeLayout} layout with ${activeModules.length} active modules`,
    };
  } catch (error: any) {
    return {
      error: error.message,
      message: 'Unable to get workspace state',
    };
  }
}

async function executeControlWorkspaceLayout(args: any): Promise<any> {
  try {
    const { layout } = args;
    const workspace = foundationServices.workspace;
    
    // Use applyPreset for layout changes
    workspace.applyPreset(layout, 'voice');
    
    return {
      success: true,
      message: `Changed workspace to ${layout} layout`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: `Failed to change layout: ${error.message}`,
    };
  }
}

async function executeGetDashboardState(args: any): Promise<any> {
  try {
    const { includeMetrics = true, includeActivities = true, activityLimit = 5 } = args || {};
    const state = dashboardDataService.getState();
    
    const response: any = {
      summary: state.summary,
    };
    
    if (includeMetrics) {
      response.metrics = state.metrics;
    }
    
    if (includeActivities) {
      response.activities = state.activities.slice(0, activityLimit);
    }
    
    const metricsSummary = includeMetrics 
      ? `${state.summary.totalMetrics} metrics tracked, ${state.summary.criticalMetrics} critical` 
      : "";
    const activitiesSummary = includeActivities 
      ? `${response.activities.length} recent activities` 
      : "";
    
    response.message = [metricsSummary, activitiesSummary]
      .filter(s => s)
      .join(", ");
    
    return response;
  } catch (error: any) {
    return {
      error: error.message,
      message: 'Unable to get dashboard state',
    };
  }
}

async function executeActivateWorkspaceModule(args: any): Promise<any> {
  try {
    const { moduleSlot, moduleType } = args;
    const workspace = foundationServices.workspace;
    
    // Activate the module in the specified slot
    workspace.activateModule(moduleSlot, moduleType);
    
    return {
      success: true,
      message: `Activated ${moduleType} in ${moduleSlot}`,
      moduleSlot,
      moduleType,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: `Failed to activate module: ${error.message}`,
    };
  }
}

async function executeHandleWorkspaceCommand(args: any): Promise<any> {
  try {
    const { command } = args;
    const workspace = foundationServices.workspace;
    
    // Parse natural language workspace commands
    const lowerCommand = command.toLowerCase();
    
    // Check for custom layout requests - MUST match BayaanGeneral's patterns
    // Pattern 1: "X rows of Y panes" or "X rows with Y panes each"
    const rowPanesMatch = lowerCommand.match(/(\d+)\s*rows?\s*(?:of|with)\s*(\d+)\s*panes?/);
    if (rowPanesMatch) {
      const rows = parseInt(rowPanesMatch[1]);
      const panesPerRow = parseInt(rowPanesMatch[2]);
      const totalPanels = rows * panesPerRow;
      const percentagePerPanel = 100 / totalPanels;
      const panelPercentages = Array(totalPanels).fill(percentagePerPanel);
      
      return await executeResizeWorkspaceLayout({
        panelPercentages,
        rows,
      });
    }
    
    // Pattern 2: "2x4" or "2 by 4" grid notation
    const gridMatch = lowerCommand.match(/(\d+)\s*[x×by]\s*(\d+)/);
    if (gridMatch) {
      const rows = parseInt(gridMatch[1]);
      const cols = parseInt(gridMatch[2]);
      const totalPanels = rows * cols;
      const percentagePerPanel = 100 / totalPanels;
      const panelPercentages = Array(totalPanels).fill(percentagePerPanel);
      
      return await executeResizeWorkspaceLayout({
        panelPercentages,
        rows: rows > 1 ? rows : undefined,
      });
    }
    
    // Pattern 3: "four horizontal panes" or "4 horizontal panels"
    if (lowerCommand.match(/(?:four|4)\s+(?:horizontal\s+)?(?:panes?|panels?)/)) {
      return await executeResizeWorkspaceLayout({
        panelPercentages: [25, 25, 25, 25],
      });
    }
    
    // Pattern 4: "split into thirds" or "three equal panels"
    if (lowerCommand.includes('thirds') || lowerCommand.match(/three\s+equal/)) {
      return await executeResizeWorkspaceLayout({
        panelPercentages: [33, 34, 33],
      });
    }
    
    // Handle module-specific commands
    if (lowerCommand.includes('email') && lowerCommand.includes('calendar')) {
      workspace.applyPreset('split', 'voice');
      workspace.activateModule('module-1', 'email');
      workspace.activateModule('module-2', 'calendar');
      return {
        success: true,
        message: 'Showing email and calendar side by side',
      };
    } else if (lowerCommand.includes('crm') && lowerCommand.includes('analytics')) {
      workspace.applyPreset('split', 'voice');
      workspace.activateModule('module-1', 'crm');
      workspace.activateModule('module-2', 'analytics');
      return {
        success: true,
        message: 'Showing CRM and analytics side by side',
      };
    } else if (lowerCommand.includes('email')) {
      workspace.activateModule('module-1', 'email');
      return {
        success: true,
        message: 'Opened email',
      };
    } else if (lowerCommand.includes('calendar')) {
      workspace.activateModule('module-1', 'calendar');
      return {
        success: true,
        message: 'Opened calendar',
      };
    } else {
      return {
        success: false,
        message: 'I didn\'t understand that workspace command',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: `Failed to handle workspace command: ${error.message}`,
    };
  }
}

// CRITICAL: Must match BayaanGeneral's resizeWorkspaceLayout exactly
async function executeResizeWorkspaceLayout(args: any): Promise<any> {
  try {
    const { panelPercentages, rows, layoutPattern, fillRemaining } = args;
    
    // Validation: Prevent conflicting parameters (from BayaanGeneral)
    if (rows && rows > 1 && layoutPattern === 'vertical') {
      return {
        success: false,
        error: 'Cannot use vertical layout with multiple rows',
        message: `I can't create a vertical layout with ${rows} rows. I'll use the standard grid layout instead.`,
      };
    }
    
    // Validation: Check if panel count matches intended grid
    if (rows && rows > 1) {
      const expectedPanels = rows * Math.ceil(panelPercentages.length / rows);
      if (panelPercentages.length < rows * 2) {
        return {
          success: false,
          error: `For ${rows} rows, you need more panels`,
          message: `For a ${rows}-row layout, I need at least ${rows * 2} panels. You gave me ${panelPercentages.length} panels.`,
        };
      }
    }
    
    // Calculate total percentage
    const total = panelPercentages.reduce((sum: number, p: number) => sum + p, 0);
    
    // Only validate 100% for single-row layouts
    if ((!rows || rows === 1) && total > 100) {
      return {
        success: false,
        error: `Total percentages (${total}%) exceed 100%`,
        message: `The total of all panels can't exceed 100 percent. You specified ${total} percent total.`,
      };
    }
    
    // Apply the layout using workspace service - CRITICAL: Must actually apply!
    const panelCount = panelPercentages.length;
    let message = '';
    
    // Actually apply the proportional layout (matching BayaanGeneral)
    foundationServices.workspace.createProportionalLayout(panelPercentages, rows, layoutPattern);
    
    // Generate appropriate message based on layout type
    if (rows && rows > 1) {
      const cols = Math.ceil(panelCount / rows);
      message = `Created a ${rows} by ${cols} grid layout`;
    } else if (layoutPattern === 'vertical') {
      message = `Created a vertical layout with ${panelCount} panels`;
    } else if (panelCount === 2) {
      const ratio = `${Math.round(panelPercentages[0])}/${Math.round(panelPercentages[1])}`;
      message = `Created a ${ratio} split layout`;
    } else if (panelCount === 4 && !rows) {
      message = `Created four horizontal panels`;
    } else {
      message = `Created a ${panelCount}-panel layout`;
    }
    
    return {
      success: true,
      message,
      layout: {
        panels: panelCount,
        rows: rows || 1,
        percentages: panelPercentages,
        pattern: layoutPattern,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: `Failed to resize workspace: ${error.message}`,
    };
  }
}

// Phase 3: Form Management Functions
async function executeGetFormState(args: any): Promise<any> {
  try {
    const { formId = 'all' } = args;
    const dashboardData = dashboardDataService.getState();
    
    // Simulate form state (in real implementation, would get from dashboardDataService)
    const mockForms = {
      profile: {
        name: 'Profile Settings',
        fields: {
          username: { value: 'user123', touched: true, valid: true },
          email: { value: 'user@example.com', touched: true, valid: true },
          notifications: { value: true, touched: false, valid: true },
        },
        isDirty: false,
        isValid: true,
      },
      settings: {
        name: 'System Settings',
        fields: {
          theme: { value: 'dark', touched: true, valid: true },
          language: { value: 'en', touched: false, valid: true },
          autoSave: { value: true, touched: true, valid: true },
        },
        isDirty: true,
        isValid: true,
      },
    };
    
    if (formId === 'all') {
      const formCount = Object.keys(mockForms).length;
      const messages = [`${formCount} forms available`];
      
      Object.entries(mockForms).forEach(([id, form]: [string, any]) => {
        const fieldCount = Object.keys(form.fields).length;
        const dirtyStatus = form.isDirty ? ' with unsaved changes' : '';
        messages.push(`${form.name}: ${fieldCount} fields${dirtyStatus}`);
      });
      
      return {
        success: true,
        forms: mockForms,
        message: messages.join('. '),
      };
    } else if (mockForms[formId as keyof typeof mockForms]) {
      const form = mockForms[formId as keyof typeof mockForms];
      const fieldCount = Object.keys(form.fields).length;
      const filledFields = Object.values(form.fields).filter((f: any) => f.value).length;
      
      let message = `${form.name} has ${fieldCount} fields, ${filledFields} filled`;
      if (form.isDirty) {
        message += ', with unsaved changes';
      }
      
      return {
        success: true,
        formState: form,
        message,
      };
    } else {
      return {
        success: false,
        message: `Form ${formId} not found`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: 'Unable to check form state',
    };
  }
}

async function executeControlForm(args: any): Promise<any> {
  try {
    const { action, formId, fieldName, fieldValue } = args;
    
    switch (action) {
      case 'fill':
        if (!formId || !fieldName) {
          throw new Error('Form ID and field name required for fill action');
        }
        // In real implementation, would update form field
        return {
          success: true,
          message: `Set ${fieldName} to ${fieldValue} in ${formId} form`,
        };
        
      case 'submit':
        if (!formId) {
          throw new Error('Form ID required for submit action');
        }
        // In real implementation, would submit form
        return {
          success: true,
          message: `Submitted ${formId} form`,
        };
        
      case 'reset':
        if (!formId) {
          throw new Error('Form ID required for reset action');
        }
        // In real implementation, would reset form
        return {
          success: true,
          message: `Reset ${formId} form`,
        };
        
      case 'validate':
        if (!formId) {
          throw new Error('Form ID required for validate action');
        }
        // In real implementation, would validate form
        return {
          success: true,
          message: `${formId} form is valid`,
          isValid: true,
        };
        
      default:
        throw new Error(`Unknown form action: ${action}`);
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: `Form control failed: ${error.message}`,
    };
  }
}

// Phase 3: Widget Management Functions
async function executeGetWidgetState(args: any): Promise<any> {
  try {
    const { widgetId } = args;
    
    // Simulate widget state (in real implementation, would get from dashboardDataService)
    const mockWidgets = [
      { id: 'metrics-widget', name: 'Metrics', isVisible: true, isExpanded: true, type: 'metrics' },
      { id: 'activities-widget', name: 'Activities', isVisible: true, isExpanded: false, type: 'activities' },
      { id: 'status-widget', name: 'Status', isVisible: false, isExpanded: false, type: 'status' },
      { id: 'performance-chart', name: 'Performance', isVisible: true, isExpanded: true, type: 'chart' },
    ];
    
    if (widgetId) {
      const widget = mockWidgets.find(w => w.id === widgetId);
      if (!widget) {
        return {
          success: false,
          message: `Widget ${widgetId} not found`,
        };
      }
      
      return {
        success: true,
        widget,
        message: `${widget.name} is ${widget.isVisible ? 'visible' : 'hidden'} and ${widget.isExpanded ? 'expanded' : 'collapsed'}`,
      };
    } else {
      const visibleCount = mockWidgets.filter(w => w.isVisible).length;
      const expandedCount = mockWidgets.filter(w => w.isExpanded).length;
      
      return {
        success: true,
        widgets: mockWidgets,
        summary: {
          total: mockWidgets.length,
          visible: visibleCount,
          expanded: expandedCount,
        },
        message: `${mockWidgets.length} widgets: ${visibleCount} visible, ${expandedCount} expanded`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: 'Unable to check widget state',
    };
  }
}

async function executeControlWidget(args: any): Promise<any> {
  try {
    const { action, widgetId } = args;
    
    if (!widgetId && action !== 'show_all' && action !== 'hide_all') {
      throw new Error('Widget ID required for this action');
    }
    
    switch (action) {
      case 'show':
        return {
          success: true,
          message: `Showing ${widgetId}`,
        };
        
      case 'hide':
        return {
          success: true,
          message: `Hiding ${widgetId}`,
        };
        
      case 'expand':
        return {
          success: true,
          message: `Expanded ${widgetId}`,
        };
        
      case 'collapse':
        return {
          success: true,
          message: `Collapsed ${widgetId}`,
        };
        
      case 'toggle_visibility':
        return {
          success: true,
          message: `Toggled visibility of ${widgetId}`,
        };
        
      case 'toggle_expansion':
        return {
          success: true,
          message: `Toggled expansion of ${widgetId}`,
        };
        
      case 'show_all':
        return {
          success: true,
          message: 'Showing all widgets',
        };
        
      case 'hide_all':
        return {
          success: true,
          message: 'Hiding all widgets',
        };
        
      default:
        throw new Error(`Unknown widget action: ${action}`);
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: `Widget control failed: ${error.message}`,
    };
  }
}

async function executeBatchControlWidgets(args: any): Promise<any> {
  try {
    const { action, widgetIds } = args;
    
    if (!widgetIds || widgetIds.length === 0) {
      throw new Error('Widget IDs required for batch control');
    }
    
    const actionMap: Record<string, string> = {
      'show': 'Showing',
      'hide': 'Hiding',
      'expand': 'Expanding',
      'collapse': 'Collapsing',
    };
    
    const actionText = actionMap[action] || action;
    
    return {
      success: true,
      message: `${actionText} ${widgetIds.length} widgets`,
      affectedWidgets: widgetIds,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: `Batch widget control failed: ${error.message}`,
    };
  }
}

// Phase 4: Workflow & Automation Functions
async function executeExecuteDashboardWorkflow(args: any): Promise<any> {
  try {
    const { workflowId, parameters } = args;
    
    // Predefined workflows
    const workflows: Record<string, any> = {
      'morning_routine': {
        name: 'Morning Routine',
        steps: ['Open email', 'Show calendar', 'Display metrics'],
      },
      'end_of_day': {
        name: 'End of Day',
        steps: ['Save work', 'Generate report', 'Close modules'],
      },
      'weekly_review': {
        name: 'Weekly Review',
        steps: ['Show analytics', 'Generate summary', 'Export data'],
      },
      'presentation_mode': {
        name: 'Presentation Mode',
        steps: ['Hide widgets', 'Fullscreen dashboard', 'Show key metrics'],
      },
    };
    
    const workflow = workflows[workflowId];
    if (!workflow) {
      return {
        success: false,
        message: `Workflow ${workflowId} not found`,
      };
    }
    
    // Simulate workflow execution
    return {
      success: true,
      message: `Executed ${workflow.name} workflow`,
      steps: workflow.steps,
      parameters,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: `Workflow execution failed: ${error.message}`,
    };
  }
}

async function executeCreateDashboardMacro(args: any): Promise<any> {
  try {
    const { name, description, actions } = args;
    
    if (!name || !actions || actions.length === 0) {
      throw new Error('Macro name and actions required');
    }
    
    // Simulate macro creation
    const macroId = `macro_${Date.now()}`;
    
    return {
      success: true,
      message: `Created macro "${name}" with ${actions.length} actions`,
      macroId,
      macro: {
        id: macroId,
        name,
        description,
        actions,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: `Macro creation failed: ${error.message}`,
    };
  }
}

async function executeExecuteMacro(args: any): Promise<any> {
  try {
    const { macroId } = args;
    
    if (!macroId) {
      throw new Error('Macro ID required');
    }
    
    // Simulate macro execution
    return {
      success: true,
      message: `Executed macro ${macroId}`,
      executedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: `Macro execution failed: ${error.message}`,
    };
  }
}

async function executeSearchDashboard(args: any): Promise<any> {
  try {
    const { query, searchScope, limit = 10 } = args;
    
    if (!query) {
      throw new Error('Search query required');
    }
    
    // Simulate search results
    const mockResults = [
      { type: 'metric', title: 'Revenue Metric', relevance: 0.9 },
      { type: 'widget', title: 'Sales Widget', relevance: 0.8 },
      { type: 'activity', title: 'Recent Sale', relevance: 0.7 },
    ].filter(r => searchScope ? r.type === searchScope : true)
      .slice(0, limit);
    
    return {
      success: true,
      message: `Found ${mockResults.length} results for "${query}"`,
      results: mockResults,
      query,
      searchScope,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: `Search failed: ${error.message}`,
    };
  }
}

async function executeGetWorkflowAnalytics(args: any): Promise<any> {
  try {
    const { timeRange = '7d', workflowId } = args;
    
    // Simulate analytics data
    const analytics = {
      totalExecutions: 42,
      successRate: 95.2,
      averageDuration: '2.3s',
      mostUsedWorkflows: [
        { id: 'morning_routine', count: 15 },
        { id: 'end_of_day', count: 12 },
        { id: 'weekly_review', count: 8 },
      ],
      timeRange,
      workflowId,
    };
    
    return {
      success: true,
      message: `Analytics for ${timeRange}: ${analytics.totalExecutions} executions, ${analytics.successRate}% success rate`,
      analytics,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: `Failed to get workflow analytics: ${error.message}`,
    };
  }
}

// Phase 5: AI & Intelligence Functions
async function executeGetSmartSuggestions(args: any): Promise<any> {
  try {
    const { context = 'general', limit = 5 } = args;
    
    // AI-powered suggestions based on context
    const suggestions = [
      {
        id: 'suggest_1',
        type: 'layout',
        suggestion: 'Switch to split layout for better multitasking',
        confidence: 0.85,
        reason: 'You frequently use email and calendar together',
      },
      {
        id: 'suggest_2',
        type: 'workflow',
        suggestion: 'Create a morning routine workflow',
        confidence: 0.78,
        reason: 'You perform these actions daily at 9 AM',
      },
      {
        id: 'suggest_3',
        type: 'optimization',
        suggestion: 'Hide unused widgets to improve performance',
        confidence: 0.92,
        reason: 'Three widgets haven\'t been viewed in 30 days',
      },
    ].slice(0, limit);
    
    return {
      success: true,
      message: `Generated ${suggestions.length} smart suggestions`,
      suggestions,
      context,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: `Failed to get smart suggestions: ${error.message}`,
    };
  }
}

async function executeAcceptSmartSuggestion(args: any): Promise<any> {
  try {
    const { suggestionId, feedback } = args;
    
    if (!suggestionId) {
      throw new Error('Suggestion ID required');
    }
    
    // Apply the suggestion
    return {
      success: true,
      message: `Applied suggestion ${suggestionId}`,
      appliedAt: new Date().toISOString(),
      feedback,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: `Failed to apply suggestion: ${error.message}`,
    };
  }
}

async function executeLearnUserBehavior(args: any): Promise<any> {
  try {
    const { action, context } = args;
    
    // Track user behavior for learning
    const learning = {
      action,
      context,
      timestamp: new Date().toISOString(),
      patterns: [
        'Prefers dark mode in evening',
        'Opens email first thing in morning',
        'Uses split layout for multitasking',
      ],
    };
    
    return {
      success: true,
      message: 'Learning from your behavior patterns',
      learning,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: `Failed to learn behavior: ${error.message}`,
    };
  }
}

async function executeGetPerformanceStatus(args: any): Promise<any> {
  try {
    const { detailed = false } = args;
    
    // Performance metrics
    const performance = {
      overall: 'good',
      metrics: {
        responseTime: '45ms',
        cpuUsage: '23%',
        memoryUsage: '512MB',
        activeModules: 4,
      },
      suggestions: [
        'Close unused modules to improve performance',
        'Clear cache to free up memory',
      ],
    };
    
    const message = detailed 
      ? `Performance is ${performance.overall}. Response time: ${performance.metrics.responseTime}, CPU: ${performance.metrics.cpuUsage}`
      : `Performance is ${performance.overall}`;
    
    return {
      success: true,
      message,
      performance,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: `Failed to get performance status: ${error.message}`,
    };
  }
}

async function executeOptimizePerformance(args: any): Promise<any> {
  try {
    const { level = 'balanced' } = args;
    
    // Optimization actions based on level
    const optimizations = {
      'aggressive': ['Close all inactive modules', 'Disable animations', 'Reduce update frequency'],
      'balanced': ['Close unused widgets', 'Optimize cache', 'Reduce visual effects'],
      'minimal': ['Clear temporary data', 'Refresh active modules'],
    };
    
    const actions = optimizations[level as keyof typeof optimizations] || optimizations.balanced;
    
    return {
      success: true,
      message: `Applied ${level} optimization`,
      actions,
      expectedImprovement: '15-30%',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: `Performance optimization failed: ${error.message}`,
    };
  }
}

// Main function to execute tools locally
export async function executeToolLocally(toolName: string, args: any): Promise<any> {
  try {
    switch (toolName) {
      case 'getThemeState':
        return await executeGetThemeState();
      
      case 'controlTheme':
        return await executeControlTheme(args);
      
      case 'getNavigationState':
        return await executeGetNavigationState();
      
      case 'controlNavigation':
        return await executeControlNavigation(args);
      
      case 'getWorkspaceState':
        return await executeGetWorkspaceState();
      
      case 'controlWorkspaceLayout':
        return await executeControlWorkspaceLayout(args);
      
      case 'getDashboardState':
        return await executeGetDashboardState(args);
      
      case 'activateWorkspaceModule':
        return await executeActivateWorkspaceModule(args);
      
      case 'handleWorkspaceCommand':
        return await executeHandleWorkspaceCommand(args);
      
      case 'resizeWorkspaceLayout':
        return await executeResizeWorkspaceLayout(args);
      
      // Phase 3: Form & Widget Tools
      case 'getFormState':
        return await executeGetFormState(args);
      
      case 'controlForm':
        return await executeControlForm(args);
      
      case 'getWidgetState':
        return await executeGetWidgetState(args);
      
      case 'controlWidget':
        return await executeControlWidget(args);
      
      case 'batchControlWidgets':
        return await executeBatchControlWidgets(args);
      
      // Phase 4: Workflow & Automation Tools
      case 'executeDashboardWorkflow':
        return await executeExecuteDashboardWorkflow(args);
      
      case 'createDashboardMacro':
        return await executeCreateDashboardMacro(args);
      
      case 'executeMacro':
        return await executeExecuteMacro(args);
      
      case 'searchDashboard':
        return await executeSearchDashboard(args);
      
      case 'getWorkflowAnalytics':
        return await executeGetWorkflowAnalytics(args);
      
      // Phase 5: AI & Intelligence Tools
      case 'getSmartSuggestions':
        return await executeGetSmartSuggestions(args);
      
      case 'acceptSmartSuggestion':
        return await executeAcceptSmartSuggestion(args);
      
      case 'learnUserBehavior':
        return await executeLearnUserBehavior(args);
      
      case 'getPerformanceStatus':
        return await executeGetPerformanceStatus(args);
      
      case 'optimizePerformance':
        return await executeOptimizePerformance(args);
      
      default:
        console.warn(`Unknown tool: ${toolName}`);
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (error: any) {
    console.error(`Tool execution error for ${toolName}:`, error);
    return { error: error.message };
  }
}

// Tool definitions in the format expected by the Responses API
export const supervisorAgentTools = [
  {
    type: 'function',
    name: 'getThemeState',
    description: 'Get the current theme state (dark, light, or system)',
    parameters: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'controlTheme',
    description: 'Change the application theme',
    parameters: {
      type: 'object',
      properties: {
        theme: {
          type: 'string',
          enum: ['dark', 'light', 'system'],
          description: 'The theme to switch to',
        },
      },
      required: ['theme'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'getNavigationState',
    description: 'Get the current navigation and sidebar state',
    parameters: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'controlNavigation',
    description: 'Navigate between voice mode and dashboard sections. Use this to go to the workspace/dashboard.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['expand_sidebar', 'collapse_sidebar', 'toggle_sidebar', 'navigate_section', 'back_to_voice'],
          description: 'The navigation action to perform',
        },
        targetSection: {
          type: 'string',
          enum: ['dashboard', 'workspace', 'profile', 'settings'],
          description: 'Target section for navigate_section action. Note: workspace and dashboard are the same.',
        },
      },
      required: ['action'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'getWorkspaceState',
    description: 'Get the current workspace layout and active modules',
    parameters: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'controlWorkspaceLayout',
    description: 'Change the workspace layout',
    parameters: {
      type: 'object',
      properties: {
        layout: {
          type: 'string',
          enum: ['single', 'split', 'stacked', 'focus-sidebar', 'dashboard', 'grid'],
          description: 'The layout to switch to',
        },
      },
      required: ['layout'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'getDashboardState',
    description: 'Get dashboard metrics and activities',
    parameters: {
      type: 'object',
      properties: {
        includeMetrics: {
          type: 'boolean',
          description: 'Include metrics in response',
          default: true,
        },
        includeActivities: {
          type: 'boolean',
          description: 'Include recent activities',
          default: true,
        },
        activityLimit: {
          type: 'number',
          description: 'Maximum number of activities to return',
          default: 5,
        },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'activateWorkspaceModule',
    description: 'Activate a specific module (email, calendar, CRM, etc.) in a workspace slot',
    parameters: {
      type: 'object',
      properties: {
        moduleSlot: {
          type: 'string',
          enum: ['module-1', 'module-2', 'module-3', 'module-4'],
          description: 'The slot to activate the module in',
        },
        moduleType: {
          type: 'string',
          enum: ['email', 'calendar', 'crm', 'analytics', 'dashboard', 'tasks', 'notes', 'chat'],
          description: 'The type of module to activate',
        },
      },
      required: ['moduleSlot', 'moduleType'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'handleWorkspaceCommand',
    description: 'Handle natural language workspace commands like "show email and calendar side by side" or "2x4 layout"',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Natural language command for workspace arrangement',
        },
      },
      required: ['command'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'resizeWorkspaceLayout',
    description: 'Resize workspace layout. IMPORTANT: For "X rows of Y panes", calculate TOTAL panels (X × Y) and pass them ALL. Example: "2 rows of 4 panes" = 2×4 = 8 panels total.',
    parameters: {
      type: 'object',
      properties: {
        panelPercentages: {
          type: 'array',
          items: { 
            type: 'number',
            minimum: 1,
            maximum: 99,
          },
          description: 'Array with percentage for EACH panel. CRITICAL: "2 rows of 4" needs 8 values (2×4=8), not 4!',
        },
        rows: {
          type: 'number',
          description: 'Number of rows for grid. MUST be set when user says "X rows". Example: "2 rows of 4 panes" → rows: 2',
          minimum: 1,
          maximum: 6,
        },
        layoutPattern: {
          type: 'string',
          enum: ['horizontal', 'vertical', 'grid'],
          description: 'OPTIONAL - Usually leave undefined. Only use "vertical" for explicit vertical column requests.',
        },
        fillRemaining: {
          type: 'boolean',
          description: 'Whether to fill remaining space with the last panel',
        },
      },
      required: ['panelPercentages'],
      additionalProperties: false,
    },
  },
  // Phase 3: Form Management Tools
  {
    type: 'function',
    name: 'getFormState',
    description: 'Check the current state of forms, including field values and validation',
    parameters: {
      type: 'object',
      properties: {
        formId: {
          type: 'string',
          enum: ['profile', 'settings', 'all'],
          description: 'Form to check (profile, settings, or all)',
        },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'controlForm',
    description: 'Control forms - fill fields, submit, reset, or validate',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['fill', 'submit', 'reset', 'validate'],
          description: 'Form action to perform',
        },
        formId: {
          type: 'string',
          enum: ['profile', 'settings'],
          description: 'Form to control',
        },
        fieldName: {
          type: 'string',
          description: 'Field name for fill action',
        },
        fieldValue: {
          type: 'string',
          description: 'Field value for fill action',
        },
      },
      required: ['action', 'formId'],
      additionalProperties: false,
    },
  },
  // Phase 3: Widget Management Tools
  {
    type: 'function',
    name: 'getWidgetState',
    description: 'Check widget visibility and expansion state',
    parameters: {
      type: 'object',
      properties: {
        widgetId: {
          type: 'string',
          description: 'Specific widget ID to check (leave empty for all)',
        },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'controlWidget',
    description: 'Control widget visibility and expansion',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['show', 'hide', 'expand', 'collapse', 'toggle_visibility', 'toggle_expansion', 'show_all', 'hide_all'],
          description: 'Widget action to perform',
        },
        widgetId: {
          type: 'string',
          description: 'Widget ID to control (not needed for show_all/hide_all)',
        },
      },
      required: ['action'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'batchControlWidgets',
    description: 'Control multiple widgets at once',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['show', 'hide', 'expand', 'collapse'],
          description: 'Action to perform on all widgets',
        },
        widgetIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of widget IDs to control',
        },
      },
      required: ['action', 'widgetIds'],
      additionalProperties: false,
    },
  },
  // Phase 4: Workflow & Automation Tools
  {
    type: 'function',
    name: 'executeDashboardWorkflow',
    description: 'Execute predefined multi-step workflows',
    parameters: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          enum: ['morning_routine', 'end_of_day', 'weekly_review', 'presentation_mode'],
          description: 'Workflow to execute',
        },
        parameters: {
          type: 'object',
          description: 'Optional workflow parameters',
        },
      },
      required: ['workflowId'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'createDashboardMacro',
    description: 'Create a custom macro for repeated actions',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Macro name',
        },
        description: {
          type: 'string',
          description: 'What this macro does',
        },
        actions: {
          type: 'array',
          items: { type: 'object' },
          description: 'List of actions to perform',
        },
      },
      required: ['name', 'actions'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'executeMacro',
    description: 'Execute a saved macro',
    parameters: {
      type: 'object',
      properties: {
        macroId: {
          type: 'string',
          description: 'ID of the macro to execute',
        },
      },
      required: ['macroId'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'searchDashboard',
    description: 'Search across dashboard content',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        searchScope: {
          type: 'string',
          enum: ['all', 'metrics', 'widgets', 'activities', 'forms'],
          description: 'Scope of search',
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return',
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'getWorkflowAnalytics',
    description: 'Get analytics about workflow usage and performance',
    parameters: {
      type: 'object',
      properties: {
        timeRange: {
          type: 'string',
          enum: ['24h', '7d', '30d', '90d'],
          description: 'Time range for analytics',
        },
        workflowId: {
          type: 'string',
          description: 'Specific workflow to analyze',
        },
      },
      additionalProperties: false,
    },
  },
  // Phase 5: AI & Intelligence Tools
  {
    type: 'function',
    name: 'getSmartSuggestions',
    description: 'Get AI-powered suggestions for dashboard optimization',
    parameters: {
      type: 'object',
      properties: {
        context: {
          type: 'string',
          enum: ['general', 'performance', 'workflow', 'layout', 'productivity'],
          description: 'Context for suggestions',
        },
        limit: {
          type: 'number',
          description: 'Number of suggestions to return',
        },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'acceptSmartSuggestion',
    description: 'Apply an AI suggestion',
    parameters: {
      type: 'object',
      properties: {
        suggestionId: {
          type: 'string',
          description: 'ID of the suggestion to apply',
        },
        feedback: {
          type: 'string',
          description: 'Optional user feedback',
        },
      },
      required: ['suggestionId'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'learnUserBehavior',
    description: 'Track and learn from user behavior patterns',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'Action being tracked',
        },
        context: {
          type: 'object',
          description: 'Context of the action',
        },
      },
      required: ['action'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'getPerformanceStatus',
    description: 'Get current performance metrics',
    parameters: {
      type: 'object',
      properties: {
        detailed: {
          type: 'boolean',
          description: 'Include detailed metrics',
        },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'optimizePerformance',
    description: 'Auto-optimize dashboard performance',
    parameters: {
      type: 'object',
      properties: {
        level: {
          type: 'string',
          enum: ['minimal', 'balanced', 'aggressive'],
          description: 'Optimization level',
        },
      },
      additionalProperties: false,
    },
  },
];