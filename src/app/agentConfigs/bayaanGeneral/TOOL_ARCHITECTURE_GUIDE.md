# BayaanOptimized Tool Architecture Guide

## Overview
This document provides a comprehensive guide to the 13 optimized tools in the Bayaan agent system. Each tool is designed using parameter-driven architecture, consolidating related operations into single, efficient tools.

## System Architecture

### Service Layer Dependencies
```
Tools → Foundation Services → UI Components
         ├── NavigationService
         ├── DashboardDataService  
         ├── WorkspaceLayoutService
         └── EventBus (Global Events)
```

---

## Tool Documentation

### 1. casualResponse
**Purpose**: Handle general conversation and casual interactions

**Parameters**:
- `message` (string): The user's message to respond to

**Service Connections**:
- None (pure conversational tool)

**Use Cases**:
- Greetings and farewells
- General questions
- Casual conversation
- Non-action responses

**Example Flow**:
```
User: "How are you?"
→ casualResponse(message: "How are you?")
→ Returns: Friendly conversational response
```

---

### 2. navigate
**Purpose**: Handle all navigation and location state checking

**Consolidates**: 7 original tools
- getNavigationState
- controlNavigation
- navigateToDashboard
- navigateToVoiceMode
- activateDashboardSidebar
- selectDashboardSection
- selectBottomToolbarAction

**Parameters**:
- `action` (enum): "get_state" | "go" | "open" | "close" | "toggle" | "back"
- `target` (enum): "dashboard" | "voice" | "profile" | "settings" | "analytics" | "reports" | "sidebar" | "toolbar"

**Service Connections**:
```typescript
import { navigationService } from '../../foundation/services/NavigationService';
- navigationService.initialize()
- navigationService.getState()
- navigationService.navigateToSection()
- navigationService.toggleSidebar()
```

**Critical Rule**: ALWAYS call with `action: "get_state"` before ANY operation

**Use Cases**:
- Check current location: "Where am I?"
- Navigate to pages: "Go to settings"
- Control sidebar: "Open the sidebar"
- Check navigation state before other operations

**Example Flow**:
```
User: "Go to profile"
→ navigate(action: "get_state") // Check current location first
→ navigate(action: "go", target: "profile")
→ UI updates via NavigationService
```

---

### 3. controlUI
**Purpose**: Manage theme and UI settings

**Consolidates**: 2 original tools
- getThemeState
- controlTheme

**Parameters**:
- `action` (enum): "get" | "set" | "toggle"
- `value` (string, optional): "dark" | "light" | "system"

**Service Connections**:
```typescript
import { dashboardDataService } from '../../foundation/services/DashboardDataService';
- dashboardDataService.getThemeState()
- dashboardDataService.setTheme()
```

**Use Cases**:
- Check current theme: "What theme is active?"
- Change theme: "Switch to dark mode"
- Toggle theme: "Toggle the theme"

**Example Flow**:
```
User: "Switch to dark mode"
→ controlUI(action: "set", value: "dark")
→ dashboardDataService.setTheme("dark")
→ Event emitted: 'dashboard:theme-changed'
→ UI components update via event listeners
```

---

### 4. manageLayout
**Purpose**: Control workspace layout and panel arrangements

**Consolidates**: 5 original tools
- getWorkspaceState
- controlWorkspaceLayout
- handleWorkspaceCommand
- resizeWorkspaceLayout
- activateWorkspaceModule

**Parameters**:
- `action` (enum): "get" | "apply" | "grid" | "resize" | "command"
- `preset` (string, optional): "single" | "split" | "stacked" | "dashboard" | "grid"
- `gridRows` (number, optional): Number of rows for grid layout
- `gridColumns` (number, optional): Number of columns for grid layout
- `panelPercentages` (array, optional): Custom percentages for panels
- `command` (string, optional): Natural language layout command

**Service Connections**:
```typescript
import { foundationServices } from '../../foundation/services/FoundationServices';
- foundationServices.workspace.getState()
- foundationServices.workspace.applyPreset()
- foundationServices.workspace.createProportionalLayout()
- foundationServices.workspace.handleWorkspaceCommand()
```

**Special Features**:
- Grid action automatically calculates panel percentages
- Natural language command processing

**Use Cases**:
- Check layout: "What's the current layout?"
- Apply presets: "Split screen view"
- Create grids: "Make 2 rows of 4 panels"
- Custom layouts: "Make left panel 70%"

**Example Flow**:
```
User: "Create 2 rows of 4 panels"
→ manageLayout(action: "grid", gridRows: 2, gridColumns: 4)
→ Auto-calculates: 8 panels at 12.5% each
→ foundationServices.workspace.createProportionalLayout([12.5, ...], 2)
→ WorkspaceGrid component re-renders
```

---

### 5. activateModule
**Purpose**: Place specific modules in workspace slots

**Consolidates**: 7 original tools
- activateEmailModule
- activateCalendarModule
- activateNotesModule
- activateWeatherModule
- activateNewsModule
- activateStocksModule
- activateTasksModule

**Parameters**:
- `moduleType` (enum): "email" | "calendar" | "notes" | "weather" | "news" | "stocks" | "tasks"
- `slot` (string): "module-1" through "module-6"

**Service Connections**:
```typescript
import { foundationServices } from '../../foundation/services/FoundationServices';
- foundationServices.workspace.activateModule(slot, moduleType)
```

**Use Cases**:
- Activate modules: "Show email in the first slot"
- Replace modules: "Put calendar in module 2"

**Example Flow**:
```
User: "Show email"
→ activateModule(moduleType: "email", slot: "module-1")
→ foundationServices.workspace.activateModule("module-1", "email")
→ WorkspaceModule component updates
```

---

### 6. manageDashboard
**Purpose**: Handle dashboard data queries and operations

**Consolidates**: 4 original tools
- getDashboardState
- manageDashboardData
- searchDashboard
- getDashboardSummary

**Parameters**:
- `action` (enum): "get_state" | "get_summary" | "search" | "refresh" | "update_metric" | "system_health"
- `searchQuery` (string, optional): Search term
- `metricId` (string, optional): Specific metric to update
- `includeMetrics` (boolean, optional): Include metrics in response
- `includeActivities` (boolean, optional): Include activities in response

**Service Connections**:
```typescript
import { dashboardDataService } from '../../foundation/services/DashboardDataService';
- dashboardDataService.getState()
- dashboardDataService.getDashboardSummary()
- dashboardDataService.searchDashboard()
- dashboardDataService.refreshAllMetrics()
- dashboardDataService.updateMetric()
- dashboardDataService.getSystemStatus()
```

**Use Cases**:
- Check metrics: "What are the current metrics?"
- Search data: "Search for sales reports"
- Refresh data: "Refresh all metrics"
- System health: "Check system status"

**Example Flow**:
```
User: "Search for user sessions"
→ manageDashboard(action: "search", searchQuery: "user sessions")
→ dashboardDataService.searchDashboard("user sessions")
→ Returns filtered results
→ UI updates search results display
```

---

### 7. manageForm
**Purpose**: Handle all form operations including state checking and field updates

**Consolidates**: 2 original tools
- getFormState
- controlForm

**Parameters**:
- `action` (enum): "get_state" | "fill_field" | "submit" | "reset" | "validate"
- `formId` (enum): "profile" | "settings" | "all"
- `fieldId` (string, optional): Field identifier for fill_field
- `value` (string, optional): Value to set for fill_field

**Service Connections**:
```typescript
import { dashboardDataService } from '../../foundation/services/DashboardDataService';
- dashboardDataService.getFormState(formId)
- dashboardDataService.getAllFormsState()
- dashboardDataService.setFieldValue(formId, fieldId, value)
- dashboardDataService.submitForm(formId)
- dashboardDataService.resetForm(formId)
```

**Field Reference**:
- Profile form: `fullName`, `email`, `language`, `voiceSpeed`
- Settings form: `pushToTalk`, `volume`, `theme`

**Event Flow**:
```
setFieldValue() called
→ Emits to DashboardDataService EventEmitter
→ Emits to Global EventBus
→ FormStateBridge receives event
→ Updates DOM element with data-field-id
```

**Use Cases**:
- Check form state: "What's in my profile?"
- Fill fields: "Set my name to John"
- Submit forms: "Submit my profile"
- Reset forms: "Reset settings"

**Example Flow**:
```
User: "Set my name to John Doe"
→ manageForm(action: "get_state", formId: "profile") // Optional but recommended
→ manageForm(action: "fill_field", formId: "profile", fieldId: "fullName", value: "John Doe")
→ dashboardDataService.setFieldValue("profile", "fullName", "John Doe")
→ Event: 'form:field-changed'
→ FormStateBridge updates DOM
```

---

### 8. manageWidget
**Purpose**: Control dashboard widgets individually or in batches

**Consolidates**: 3 original tools
- getWidgetState
- controlWidget
- batchControlWidgets

**Parameters**:
- `action` (enum): "get_state" | "show" | "hide" | "expand" | "collapse" | "toggle" | "refresh" | "batch" | "reorder" | "filter"
- `widgetId` (string, optional): Specific widget ID
- `batchOperations` (array, optional): Multiple operations for batch action
- `widgetOrder` (array, optional): New order for widgets
- `filter` (object, optional): Filter criteria

**Service Connections**:
```typescript
import { dashboardDataService } from '../../foundation/services/DashboardDataService';
- dashboardDataService.getWidgetState(widgetId)
- dashboardDataService.getAllWidgetsState()
- dashboardDataService.setWidgetVisibility(widgetId, isVisible)
- dashboardDataService.expandWidget(widgetId)
- dashboardDataService.collapseWidget(widgetId)
- dashboardDataService.batchControlWidgets(operations)
- dashboardDataService.reorderWidgets(order)
```

**Use Cases**:
- Check state: "Which widgets are visible?"
- Control visibility: "Hide the metrics widget"
- Batch operations: "Show only analytics widgets"
- Reorder: "Move tasks widget to the top"

**Example Flow**:
```
User: "Hide all widgets except metrics"
→ manageWidget(action: "batch", batchOperations: [
    {widgetId: "metrics", action: "show"},
    {widgetId: "activities", action: "hide"},
    {widgetId: "notifications", action: "hide"}
  ])
→ dashboardDataService.batchControlWidgets(operations)
→ Events emitted for each widget
→ WidgetStateBridge updates UI
```

---

### 9. createNote
**Purpose**: Create new notes in the system

**Parameters**:
- `title` (string): Note title
- `content` (string): Note content
- `tags` (array, optional): Tags for categorization

**Service Connections**:
```typescript
import { dashboardDataService } from '../../foundation/services/DashboardDataService';
- dashboardDataService.addActivity() // Logs note creation
```

**Use Cases**:
- Create notes: "Create a note about the meeting"
- Add tagged notes: "Make a note tagged urgent"

**Example Flow**:
```
User: "Create a note: Remember to call client"
→ createNote(title: "Reminder", content: "Remember to call client")
→ Note stored in system
→ Activity logged in dashboard
```

---

### 10. addTask
**Purpose**: Add tasks to the task management system

**Parameters**:
- `title` (string): Task title
- `priority` (enum): "low" | "medium" | "high"
- `dueDate` (string, optional): Due date in ISO format

**Service Connections**:
```typescript
import { dashboardDataService } from '../../foundation/services/DashboardDataService';
- dashboardDataService.addActivity() // Logs task creation
```

**Use Cases**:
- Add tasks: "Add task: Review proposal"
- Set priority: "High priority task: Fix bug"
- Set due dates: "Task due tomorrow: Submit report"

**Example Flow**:
```
User: "Add high priority task: Fix login bug"
→ addTask(title: "Fix login bug", priority: "high")
→ Task added to task manager
→ Activity logged
→ Tasks widget updates if visible
```

---

### 11. scheduleEvent
**Purpose**: Schedule calendar events

**Parameters**:
- `title` (string): Event title
- `startTime` (string): Start time in ISO format
- `duration` (number): Duration in minutes
- `description` (string, optional): Event description

**Service Connections**:
```typescript
import { dashboardDataService } from '../../foundation/services/DashboardDataService';
- dashboardDataService.addActivity() // Logs event creation
```

**Use Cases**:
- Schedule meetings: "Schedule meeting at 2pm for 1 hour"
- Add events: "Add team standup tomorrow at 10am"

**Example Flow**:
```
User: "Schedule meeting at 2pm for 30 minutes"
→ scheduleEvent(title: "Meeting", startTime: "2024-01-01T14:00:00", duration: 30)
→ Event added to calendar
→ Calendar module updates if visible
```

---

### 12. manageWorkflow
**Purpose**: Handle workflow automation and voice macros

**Consolidates**: 4 original tools
- executeDashboardWorkflow
- createDashboardMacro
- executeMacro
- Workflow management tools

**Parameters**:
- `action` (enum): "create" | "execute" | "schedule" | "create_macro" | "execute_macro" | "list_macros"
- `workflowId` (string, optional): Workflow identifier
- `name` (string, optional): Workflow/macro name
- `steps` (array, optional): Workflow steps
- `trigger` (string, optional): Trigger phrase for macros

**Service Connections**:
```typescript
import { dashboardDataService } from '../../foundation/services/DashboardDataService';
- dashboardDataService.executeWorkflow(workflowId)
- dashboardDataService.createWorkflow(name, steps)
- dashboardDataService.createMacro(name, actions, trigger)
- dashboardDataService.executeMacro(macroId)
```

**Use Cases**:
- Create workflows: "Create daily dashboard refresh workflow"
- Execute workflows: "Run morning routine"
- Create macros: "Create macro 'status check'"
- Voice shortcuts: "When I say 'morning', open email and calendar"

**Example Flow**:
```
User: "Create macro: when I say 'dashboard', show all widgets"
→ manageWorkflow(action: "create_macro", 
    name: "Show Dashboard",
    trigger: "dashboard",
    steps: [{action: "showAllWidgets"}])
→ dashboardDataService.createMacro(...)
→ Macro stored and available for voice activation
```

---

### 13. aiAssist
**Purpose**: AI-powered intelligence and optimization features

**Consolidates**: 7 original tools
- getSmartSuggestions
- acceptSmartSuggestion
- getPerformanceStatus
- optimizePerformance
- learnUserBehavior
- getWorkflowAnalytics
- AI prediction/automation tools

**Parameters**:
- `action` (enum): "get_suggestions" | "accept_suggestion" | "performance_status" | "optimize_performance" | "learn_behavior" | "workflow_analytics" | "analyze" | "predict" | "automate"
- `suggestionId` (string, optional): ID of suggestion to accept
- `analysisType` (string, optional): Type of analysis

**Service Connections**:
```typescript
import { dashboardDataService } from '../../foundation/services/DashboardDataService';
- dashboardDataService.getSmartSuggestions()
- dashboardDataService.getPerformanceStatus()
- dashboardDataService.optimizePerformance()
// Some AI features may not be fully implemented
```

**Use Cases**:
- Get suggestions: "What do you suggest?"
- Check performance: "How's the dashboard performing?"
- Optimize: "Optimize dashboard performance"
- Learn patterns: "Learn my usage patterns"

**Example Flow**:
```
User: "Optimize dashboard performance"
→ aiAssist(action: "performance_status") // Check current state
→ aiAssist(action: "optimize_performance")
→ Analyzes metrics, widgets, and usage
→ Applies optimizations
→ Returns performance improvements
```

---

## Event System Architecture

### Dual Event System
The system uses two parallel event systems for compatibility:

1. **DashboardDataService EventEmitter**
   - Node.js EventEmitter
   - Used by React components (FormStateBridge, WidgetStateBridge)
   - Direct instance listeners

2. **Global EventBus**
   - Custom event system
   - Used for service-to-service communication
   - Type-safe event definitions

### Event Flow Example
```
Tool calls setFieldValue()
→ DashboardDataService updates internal state
→ Emits to its own EventEmitter: this.emit('form:field-changed', data)
→ Also emits to EventBus: eventMigrationHelper.emitBoth(...)
→ FormStateBridge (listening on DashboardDataService) receives event
→ Updates DOM element
→ User sees the change
```

---

## Component Bridges

### FormStateBridge
- Listens to: DashboardDataService EventEmitter
- Events: 'form:field-changed', 'form:submitted', 'form:reset'
- Updates: DOM elements with data-form-id and data-field-id

### WidgetStateBridge
- Listens to: DashboardDataService EventEmitter
- Events: 'widget:visibility-changed', 'widget:expanded', 'widget:collapsed'
- Updates: Widget visibility and expansion states

### NavigationStateBridge
- Listens to: NavigationService via EventBus
- Events: 'navigation:section-changed', 'navigation:sidebar-toggled'
- Updates: Current page and sidebar state

### WorkflowStateBridge
- Listens to: DashboardDataService EventEmitter
- Events: 'workflow:started', 'workflow:completed', 'workflow:step-completed'
- Updates: Workflow execution status

---

## Best Practices

### 1. State Before Action
Always check state before performing actions:
```javascript
// Good
navigate(action: "get_state")
// Then
navigate(action: "go", target: "dashboard")

// Bad
navigate(action: "go", target: "dashboard") // Without checking state
```

### 2. Parameter-Driven Design
Use action parameters to specify operations:
```javascript
// Single tool with multiple actions
manageForm(action: "get_state", formId: "profile")
manageForm(action: "fill_field", formId: "profile", fieldId: "email", value: "user@example.com")
manageForm(action: "submit", formId: "profile")
```

### 3. Event-Driven Updates
UI updates happen through events, not direct manipulation:
```javascript
// Tool updates service
dashboardDataService.setFieldValue()
// Service emits event
this.emit('form:field-changed')
// Bridge receives and updates UI
FormStateBridge.handleFieldChange()
```

### 4. Service Layer Abstraction
Tools don't directly manipulate UI, they go through services:
```
Tool → Service → Event → Bridge → UI Component
```

---

## Troubleshooting

### Form Updates Not Showing
1. Check FormStateBridge is mounted in App.tsx
2. Verify events are emitting to DashboardDataService EventEmitter
3. Check DOM elements have correct data-form-id and data-field-id
4. Ensure form is visible when update occurs

### Navigation Not Working
1. Verify NavigationService is initialized
2. Check current state with navigate(action: "get_state")
3. Ensure target section exists in NavigationService

### Widget State Issues
1. Check widget IDs match between tool calls and service
2. Verify WidgetStateBridge is listening for events
3. Ensure widgets are registered in DashboardDataService

### Theme Not Changing
1. Verify dashboardDataService.setTheme() is called
2. Check theme-changed event is emitted
3. Ensure UI components listen for theme updates

---

## Development Workflow

### Adding New Tool Operations
1. Add action to enum in tool parameters
2. Add case in tool's execute function
3. Connect to appropriate service method
4. Ensure events are emitted for UI updates
5. Update tool description for AI understanding

### Testing Tools
1. Test with voice commands through the UI
2. Check browser console for event emissions
3. Verify service state updates
4. Confirm UI reflects changes
5. Test edge cases and error handling

### Debugging
1. Enable console logging in bridges (console.log already present)
2. Check Network tab for API calls (if any)
3. Use React DevTools to inspect component state
4. Monitor EventBus events in console
5. Check service state directly via console

---

## Performance Considerations

### Tool Evaluation
- 13 tools vs 29 original = 55% reduction in evaluation overhead
- Parameter-driven design reduces decision complexity
- Clear action enums guide AI to correct usage

### Event System
- Dual emission ensures compatibility but adds overhead
- Consider migrating fully to one system in future
- Event batching could improve performance

### Service Calls
- Services are singletons (getInstance pattern)
- State cached in services, not fetched each time
- Async imports keep initial bundle size down

---

## Future Improvements

### Potential Optimizations
1. Unified event system (eliminate dual emission)
2. Tool response caching for repeated queries
3. Batch operations for related tool calls
4. Progressive loading of service modules

### Suggested Enhancements
1. Add tool usage analytics
2. Implement tool suggestion system
3. Create tool chaining for complex workflows
4. Add tool validation before execution

---

## Conclusion

The 13 optimized tools provide a clean, efficient interface to the Bayaan dashboard system. Through parameter-driven design and service layer abstraction, complex operations are simplified while maintaining full functionality. The architecture ensures scalability, maintainability, and optimal AI performance.