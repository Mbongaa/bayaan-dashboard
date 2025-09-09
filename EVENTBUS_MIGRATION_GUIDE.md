# EventBus Migration Guide & Architecture Documentation

## 📋 Overview

This document provides a comprehensive guide to the EventBus architecture, migration system, and event naming conventions implemented in Phase 1 of the architecture enhancement project.

## 🏗️ Architecture Components

### Core Files
- `src/app/foundation/services/EventBus.ts` - Enhanced EventBus with typed interfaces
- `src/app/foundation/services/FoundationServices.ts` - Service container with EventBus integration
- All `*StateBridge.tsx` components - React-Service bridge pattern

## 📝 Event Naming Convention

### Standard Format
```
{service}:{domain}:{action}
```

### Service Prefixes
| Prefix | Purpose | Example Events |
|--------|---------|----------------|
| `foundation` | System-level events | `foundation:system:initialized` |
| `navigation` | Navigation and routing | `navigation:sidebar:changed` |
| `workspace` | Workspace layouts & modules | `workspace:layout:changed` |
| `dashboard` | Dashboard data & UI | `dashboard:data:metric-updated` |
| `integration` | Cross-service integration | `integration:performance:updated` |
| `session` | WebRTC and voice sessions | `session:webrtc:status-changed` |

### Domain Categories
| Domain | Purpose | Example Actions |
|--------|---------|-----------------|
| `system` | System lifecycle | `initialized`, `shutdown` |
| `sidebar` | Sidebar state | `changed`, `expanded`, `collapsed` |
| `section` | Page navigation | `changed`, `mode-changed` |
| `layout` | Workspace layouts | `changed`, `updated` |
| `module` | Module loading | `activating`, `activated` |
| `data` | Data operations | `updated`, `refreshed`, `added` |
| `widget` | Widget management | `expanded`, `collapsed`, `refresh-start` |
| `form` | Form interactions | `field-changed`, `submitted`, `reset` |
| `workflow` | Workflow execution | `started`, `step-completed`, `completed` |

## 📊 Complete Event Index

### Navigation Events (3 events)
| Legacy Event | New Standardized Event | Data Type | Status |
|--------------|------------------------|-----------|--------|
| `navigation:sidebar-state` | `navigation:sidebar:changed` | `{state: SidebarState, source: string}` | ✅ Migrated |
| `navigation:section-change` | `navigation:section:changed` | `{section: NavigationSection, contentMode: string, source: string}` | ✅ Migrated |
| `navigation:content-mode` | `navigation:section:mode-changed` | `{mode: string, section: NavigationSection, source: string}` | ✅ Migrated |

### Workspace Events (4 events)
| Legacy Event | New Standardized Event | Data Type | Status |
|--------------|------------------------|-----------|--------|
| `workspace-layout-changed` | `workspace:layout:changed` | `WorkspaceLayoutEvent` (see below) | ✅ Migrated |
| `workspace-layout-updated` | `workspace:layout:updated` | `WorkspaceLayoutEvent` | ✅ Migrated |
| `workspace-module-activating` | `workspace:module:activating` | `{moduleId: string, type: string}` | ✅ Migrated |
| `workspace-module-activated` | `workspace:module:activated` | `{moduleId: string, type: string}` | ✅ Migrated |

### Enhanced WorkspaceLayoutEvent Type
```typescript
interface WorkspaceLayoutEvent {
  layout: string;           // Layout name ('custom', 'dashboard', etc.)
  preset?: string;          // Preset identifier  
  layouts: Layout[];        // React-grid-layout configuration
  modules?: string[];       // Module identifiers
  proportions?: number[];   // Custom layout proportions [70, 30]
  emptySpace?: number;      // Unused space percentage
  panelCount?: number;      // Number of active panels
  rows?: number;            // Grid rows for multi-row layouts
  layoutPattern?: string;   // 'horizontal', 'vertical', 'grid'
}
```

### Dashboard Data Events (8 events migrated)
| Legacy Event | New Standardized Event | Data Type | Status |
|--------------|------------------------|-----------|--------|
| `dashboard:metric-updated` | `dashboard:data:metric-updated` | `{metric: MetricData}` | ✅ Migrated |
| `dashboard:all-metrics-refreshed` | `dashboard:data:refreshed` | `undefined` | ✅ Migrated |
| `dashboard:activity-added` | `dashboard:data:activity-added` | `{activity: ActivityItem}` | ✅ Migrated |
| `dashboard:activities-cleared` | `dashboard:data:activities-cleared` | `{criteria?: any}` | ✅ Migrated |
| `dashboard:status-updated` | `dashboard:data:status-updated` | `{status: SystemStatus}` | ✅ Migrated |
| `dashboard:theme-changed` | `dashboard:data:theme-changed` | `{theme: string, context: any}` | ✅ Migrated |
| `dashboard:auto-refresh-set` | `dashboard:data:auto-refresh-set` | `{metricId: string, intervalMs: number}` | ✅ Migrated |
| `dashboard:auto-refresh-cleared` | `dashboard:data:auto-refresh-cleared` | `{metricId: string}` | ✅ Migrated |

### Widget Events (7 events migrated)
| Legacy Event | New Standardized Event | Data Type | Status |
|--------------|------------------------|-----------|--------|
| `widget:visibility-changed` | `dashboard:widget:visibility-changed` | `{widgetId: string, isVisible: boolean}` | ✅ Migrated |
| `widget:expanded` | `dashboard:widget:expanded` | `{widgetId: string}` | ✅ Migrated |
| `widget:collapsed` | `dashboard:widget:collapsed` | `{widgetId: string}` | ✅ Migrated |
| `widget:expansion-changed` | `dashboard:widget:expansion-changed` | `{widgetId: string, isExpanded: boolean}` | ✅ Migrated |
| `widget:refresh-start` | `dashboard:widget:refresh-start` | `{widgetId: string}` | ✅ Migrated |
| `widget:refresh-complete` | `dashboard:widget:refresh-complete` | `{widgetId: string}` | ✅ Migrated |
| `widgets:reordered` | `dashboard:widgets:reordered` | `{order: string[]}` | ✅ Migrated |

### Form Events (3 events migrated)
| Legacy Event | New Standardized Event | Data Type | Status |
|--------------|------------------------|-----------|--------|
| `form:field-changed` | `dashboard:form:field-changed` | `{formId: string, fieldId: string, value: any, isValid: boolean}` | ✅ Migrated |
| `form:submitted` | `dashboard:form:submitted` | `{formId: string, data: any}` | ✅ Migrated |
| `form:reset` | `dashboard:form:reset` | `{formId: string}` | ✅ Migrated |

### Workflow Events (4 events migrated)
| Legacy Event | New Standardized Event | Data Type | Status |
|--------------|------------------------|-----------|--------|
| `workflow:started` | `dashboard:workflow:started` | `{workflowId: string, workflow: string}` | ✅ Migrated |
| `workflow:step-completed` | `dashboard:workflow:step-completed` | `{workflowId: string, stepId: string, stepIndex: number, totalSteps: number}` | ✅ Migrated |
| `workflow:completed` | `dashboard:workflow:completed` | `{workflowId: string, status: string}` | ✅ Migrated |
| `workflow:created` | `dashboard:workflow:created` | `{workflowId: string, name: string}` | ✅ Migrated |

### Foundation Events (1 event)
| Legacy Event | New Standardized Event | Data Type | Status |
|--------------|------------------------|-----------|--------|
| `foundation:initialized` | `foundation:system:initialized` | `undefined` | ✅ Migrated |

## 🛠️ Migration Helper System

### EventMigrationHelper Class
```typescript
// Subscribe to both legacy and new events during transition
const unsubscribe = eventMigrationHelper.onBoth(
  'workspace-layout-changed',      // Legacy event
  'workspace:layout:changed',      // New event
  (data) => { /* handler */ }
);

// Emit to both legacy and new events during transition
eventMigrationHelper.emitBoth(
  'workspace-layout-changed',      // Legacy event
  'workspace:layout:changed',      // New event  
  { layout, layouts, modules }     // Event data
);
```

### Migration Status Checking
```typescript
// Get migration progress report
const report = eventMigrationHelper.getMigrationReport();
console.log('Legacy events still in use:', report.legacyEventsInUse);

// Get event statistics
const stats = globalEventBus.getEventStats(); 
console.log('Total listeners:', stats.activeListeners);
console.log('Deprecated events used:', stats.deprecatedEventsUsed);
```

## 🔧 Development Features

### Deprecation Warnings
- **Development Mode Only**: Warnings shown only when `NODE_ENV === 'development'`
- **One-Time Warnings**: Each deprecated event shows warning once per session
- **Clear Guidance**: Shows exact new event name to use
- **Easy Disable**: `globalEventBus.setDeprecationWarnings(false)` for testing

### Type Safety
```typescript
// Full TypeScript support with autocomplete
eventBus.onTyped('workspace:layout:changed', (data) => {
  // data.proportions - number[] (custom layout proportions)
  // data.emptySpace - number (unused space percentage)  
  // data.layoutPattern - string ('horizontal'|'vertical'|'grid')
  // data.panelCount - number (number of panels)
  // Full IDE autocomplete and type checking
});
```

## 🚀 Enhanced Custom Layout System Integration

### Voice Command Support
The migrated event system fully supports enhanced custom layout features:

**Voice Commands:**
- `"70/30 split"` → Creates proportional layout with 30% empty space
- `"25/25/25/25 grid"` → Creates 4-panel equal grid
- `"60/40 horizontal"` → Creates 2-panel horizontal layout
- `"custom 3x2 grid"` → Creates multi-row grid layout

**Enhanced Event Data:**
```typescript
// Custom layout event includes all metadata
{
  layout: 'custom',
  proportions: [70, 30],      // User-specified proportions
  emptySpace: 0,              // Calculated empty space
  panelCount: 2,              // Number of panels
  rows: 1,                    // Grid rows
  layoutPattern: 'horizontal', // Layout type
  layouts: [...],             // React-grid-layout config
  modules: ['module-1', 'module-2'] // Module IDs
}
```

## 🔍 Debugging & Monitoring

### Event Flow Tracing
```typescript
// Check which events are being used
const stats = globalEventBus.getEventStats();
console.log('Events with active listeners:', stats.eventsWithListeners);

// Monitor deprecated event usage
console.log('Deprecated events still in use:', stats.deprecatedEventsUsed);

// Get listener count for specific event
const count = globalEventBus.getListenerCount('workspace:layout:changed');
console.log(`Listeners for workspace layout: ${count}`);
```

### Migration Progress Tracking
```typescript
// Check migration status
const report = eventMigrationHelper.getMigrationReport();
console.log(`Migration progress: ${report.legacyEventsInUse.length}/${report.totalLegacyEvents} legacy events still in use`);

// Get suggested migrations
report.suggestedMigrations.forEach(migration => {
  console.log(`Migrate: ${migration.from} → ${migration.to}`);
});
```

## 📁 File Organization

### Service Layer (`src/app/foundation/services/`)
- **EventBus.ts** - Core event system with typed interfaces
- **NavigationService.ts** - Navigation state management ✅ Migrated
- **WorkspaceLayoutService.ts** - Workspace layout management ✅ Migrated  
- **DashboardDataService.ts** - Dashboard data management ✅ Partially Migrated
- **IntegrationService.ts** - Cross-service integration 🔄 Needs Migration
- **FoundationServices.ts** - Service container ✅ Migrated

### State Bridge Layer (`src/app/foundation/components/`)
- **NavigationStateBridge.tsx** - Navigation state sync ✅ Migrated
- **DataStateBridge.tsx** - Dashboard data sync ✅ Migrated
- **WorkflowStateBridge.tsx** - Workflow state sync 🔄 Needs Migration
- **WidgetStateBridge.tsx** - Widget state sync 🔄 Needs Migration
- **FormStateBridge.tsx** - Form state sync 🔄 Needs Migration
- **IntegrationStateBridge.tsx** - Integration sync 🔄 Needs Migration

### UI Layer (`src/app/dashboard/components/`)
- **WorkspaceGrid.tsx** - Dynamic workspace grid ✅ Migrated
- **DashboardContentRenderer.tsx** - Content routing ✅ Compatible

## 🎯 Critical Voice Command Flows (All Working)

### Navigation Flow
```
Voice: "go to workspace" 
→ NavigationService.handleVoiceCommand() 
→ emitBoth('navigation:section-change', 'navigation:section:changed')
→ NavigationStateBridge.onBoth() 
→ DashboardContentRenderer updates
```

### Workspace Layout Flow  
```
Voice: "70/30 split"
→ WorkspaceLayoutService.createProportionalLayout([70, 30])
→ emitBoth('workspace-layout-changed', 'workspace:layout:changed') 
→ WorkspaceGrid.onBoth()
→ React Grid Layout updates with proportions metadata
```

### Custom Layout Flow
```
Voice: "25/25/25/25 grid"
→ parseVoiceCommand() detects 4-panel pattern
→ createProportionalLayout([25, 25, 25, 25])
→ Calculates optimal 2x2 grid layout
→ emitBoth() with enhanced event data (proportions, rows, layoutPattern)
→ WorkspaceGrid renders 4-panel grid
```

## 🔧 Developer Usage Examples

### For New Development (Recommended)
```typescript
// Type-safe event subscription
eventBus.onTyped('workspace:layout:changed', (data) => {
  console.log('Layout changed:', data.layout);
  console.log('Proportions:', data.proportions);
  console.log('Empty space:', data.emptySpace);
  // Full type safety and autocomplete
});

// Type-safe event emission  
eventBus.emitTyped('dashboard:data:metric-updated', {
  metric: { id: 'cpu', label: 'CPU Usage', value: 75 }
});
```

### For Legacy Code (Still Works)
```typescript
// Legacy approach (shows deprecation warning in development)
eventBus.on('workspace-layout-changed', (data: any) => {
  // Still works exactly as before
  console.log('Layout:', data.layout);
});
```

### During Migration Period (Transition)
```typescript
// Listen to both old and new events
const unsubscribe = eventMigrationHelper.onBoth(
  'dashboard:metric-updated',        // Legacy
  'dashboard:data:metric-updated',   // New
  (data) => { /* handles both */ }
);

// Emit to both old and new events  
eventMigrationHelper.emitBoth(
  'dashboard:metric-updated',        // Legacy
  'dashboard:data:metric-updated',   // New
  { metric: metricData }
);
```

## 🎯 Enhanced Custom Layout System

### Layout Pattern Support
The enhanced workspace system supports sophisticated layout patterns:

**Single Row Layouts:**
- `[70, 30]` → 70%/30% split with 0% empty
- `[50, 25]` → 50%/25% split with 25% empty space
- `[60, 40]` → Perfect 60%/40% split

**Multi-Row Grid Layouts:**
- `[25, 25, 25, 25]` → 2x2 grid (auto-calculated)
- `[20, 20, 20, 20, 20]` → Optimal grid arrangement
- Supports up to 16 panels with intelligent row calculation

**Voice Command Examples:**
```
"70/30 split" → createProportionalLayout([70, 30])
"25/25/25/25 grid" → createProportionalLayout([25, 25, 25, 25], grid)
"three panels 30/40/30" → createProportionalLayout([30, 40, 30])
```

### ID Translation Pattern
**Service Layer** uses `module-*` identifiers:
```typescript
layouts: [
  { i: 'module-1', x: 0, y: 0, w: 6, h: 12 },
  { i: 'module-2', x: 6, y: 0, w: 6, h: 12 }
]
```

**UI Layer** uses `item-*` identifiers:
```typescript
// WorkspaceGrid translates: module-* → item-*
const translatedLayouts = sourceLayouts.map(layout => ({
  ...layout,
  i: layout.i.replace('module-', 'item-')
}));
```

## 🚨 Migration Status & Next Steps

### ✅ Phase 1 Completed
- **Core Infrastructure**: EventBus enhanced with typed interfaces
- **Critical Services**: Navigation, Workspace, key Dashboard events
- **State Bridges**: Navigation and Data bridges migrated
- **Voice Commands**: All working with enhanced custom layouts

### 🔄 Remaining Work (Optional/Incremental)
- **IntegrationService**: 11 integration events (non-critical)
- **Remaining State Bridges**: Widget, Form, Workflow, Integration
- **Remaining Dashboard Events**: ~15 less-critical events

### 🎯 Ready for Phase 2
With the foundation solid and critical flows working, we're ready for:
- **Service Dependency Injection System**
- **Cross-Service Communication Framework** 
- **Service Health Monitoring**
- **Performance & Observability Enhancements**

## 📖 For Future Developers

### Quick Start
1. **Use typed events**: Prefer `onTyped()` and `emitTyped()` for new code
2. **Follow naming convention**: `{service}:{domain}:{action}`  
3. **Check deprecation warnings**: Run in development mode to see migration suggestions
4. **Use migration helper**: For updating existing event usage

### Key Files to Understand
1. **EventBus.ts** - Start here to understand the event system
2. **WorkspaceLayoutService.ts** - Complex example with custom layout support
3. **NavigationStateBridge.tsx** - State bridge pattern example
4. **WorkspaceGrid.tsx** - UI component integration example

### Custom Layout Enhancement Points
- **Voice parsing** in `parseVoiceCommand()` and `handleWorkspaceCommand()`
- **Layout calculation** in `createProportionalLayout()`
- **ID translation** in WorkspaceGrid event handlers
- **Enhanced event data** includes proportions, emptySpace, layoutPattern

This migration preserves and enhances all existing functionality while providing a solid foundation for future architectural improvements.