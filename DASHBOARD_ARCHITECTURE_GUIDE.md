# Dashboard Architecture Guide: React + WebRTC + WebGL Best Practices

## Executive Summary

This document outlines the correct architectural patterns for building a dashboard with persistent WebRTC connections (OpenAI Realtime API) and WebGL animations (Galaxy background, 3D orbs) without interference from React re-renders.

## Core Architectural Principle

**React components should SUBSCRIBE to persistent services, not OWN them.**

```
❌ WRONG: React Component Ownership Pattern
React Component → owns WebRTC Session → owns WebGL Context → UI changes → Everything Recreated

✅ CORRECT: Service Layer Subscription Pattern  
Persistent Services (WebRTC + WebGL) → React Components Subscribe → UI changes → Services Unaffected
```

## Layer Architecture

### Layer 1: Persistent Services (Foundation)
**Purpose**: Manage resources that must survive React re-renders
**Components**: 
- WebRTC Session Service (OpenAI Realtime API)
- WebGL Context Pool (Galaxy, Audio3DOrb, MiniOrb)
- Event Bus (Service ↔ React communication)

**Key Characteristics**:
- Initialized once at application startup
- Live outside React component lifecycle
- Never destroyed by UI changes
- Communicate via events, not direct coupling

### Layer 2: React UI Layer (Presentation)
**Purpose**: Render user interface and handle user interactions
**Components**:
- Dashboard components
- Sidebar navigation
- Settings panels  
- Transcript display

**Key Characteristics**:
- Pure presentation components
- Subscribe to service events via hooks
- Trigger service actions via event emission
- Never directly own persistent resources

## Implementation Patterns

### Pattern 1: WebRTC Service Singleton

```typescript
// ✅ CORRECT: Persistent Service
class WebRTCSessionService {
  private session: RealtimeSession | null = null;
  
  async connect(config: ConnectConfig): Promise<void> {
    // Session persists through all React re-renders
  }
}

// React Component Usage
function VoiceInterface() {
  const [status, setStatus] = useState('DISCONNECTED');
  
  // Subscribe to service events
  useServiceEvent('webrtc:status', ({ status }) => {
    setStatus(status);
  });
  
  // Trigger service actions
  const connect = () => webrtcSessionService.connect(config);
}
```

### Pattern 2: WebGL Context Pool

```typescript
// ✅ CORRECT: Shared Context Management
class WebGLContextService {
  private contexts: Map<string, WebGLContext> = new Map();
  
  getContext(id: string): WebGLContext {
    // Return existing or create new context
    // Contexts persist across component unmounts
  }
}

// React Component Usage
function Galaxy() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Mount to existing service-managed context
    const context = webglContextService.mountCanvas('galaxy', containerRef.current);
    
    return () => {
      // Unmount but preserve context
      webglContextService.unmountCanvas('galaxy');
    };
  }, []); // Empty deps - mount once only
}
```

### Pattern 3: Animation Isolation

```typescript
// ❌ WRONG: React State Animation (triggers re-renders)
const [sidebarOpen, setSidebarOpen] = useState(false);
<div style={{ width: sidebarOpen ? 300 : 60 }}>

// ✅ CORRECT: CSS-Only Animation (no React state)
<div className="sidebar transition-transform duration-200 hover:translate-x-0">
```

## Critical Anti-Patterns to Avoid

### Anti-Pattern 1: Component-Owned Resources
```typescript
// ❌ NEVER DO THIS
function GalaxyBackground() {
  const [renderer, setRenderer] = useState<WebGLRenderer>();
  
  useEffect(() => {
    const newRenderer = new WebGLRenderer(); // Creates new context on every re-render
    setRenderer(newRenderer);
  }, [props]); // Dependency on props = frequent recreation
}
```

### Anti-Pattern 2: Layout-Based Animations  
```typescript
// ❌ CAUSES RE-RENDERS
<motion.div animate={{ width: open ? 300 : 60 }}>

// ✅ NO RE-RENDERS
<div className="transition-transform hover:scale-110">
```

### Anti-Pattern 3: Mixed Responsibilities
```typescript
// ❌ COMPONENT DOES TOO MUCH
function App() {
  const session = useRealtimeSession(); // WebRTC ownership
  const webgl = useWebGLContext(); // WebGL ownership  
  const [sidebarOpen, setSidebarOpen] = useState(); // UI state
  // Any UI state change affects WebRTC/WebGL
}
```

## Sidebar Navigation Best Practices

### CSS-Only Hover Expansion
```css
/* Sidebar container */
.sidebar {
  width: 60px;
  transition: width 200ms ease-in-out;
}

.sidebar:hover {
  width: 300px;
}

/* Main content offset */
.main-content {
  margin-left: 60px;
  transition: margin-left 200ms ease-in-out;
}

.sidebar:hover + .main-content {
  margin-left: 300px;
}
```

### Transform-Based Layout Shifts
```typescript
// Use transforms instead of layout changes
const SidebarLayout = () => {
  return (
    <div className="flex">
      <div className="sidebar w-[60px] hover:w-[300px] transition-all">
        {/* Sidebar content */}
      </div>
      <div className="main-content flex-1 transform transition-transform">
        {/* Main content - transforms smoothly without affecting WebGL */}
      </div>
    </div>
  );
};
```

## Event Bus Communication Pattern

### Service → React Communication
```typescript
// Service emits events
webrtcSessionService.on('status_change', (status) => {
  eventBus.emit('webrtc:status', { status });
});

// React component subscribes
function StatusIndicator() {
  const [status, setStatus] = useState('DISCONNECTED');
  
  useServiceEvent('webrtc:status', ({ status }) => {
    setStatus(status);
  });
}
```

### React → Service Communication
```typescript
// React triggers service actions via events
function ConnectButton() {
  const handleConnect = () => {
    eventBus.emit('ui:connect_requested', { agentConfig: 'bayaanGeneral' });
  };
}

// Service listens for UI events
class WebRTCSessionService {
  constructor() {
    eventBus.on('ui:connect_requested', this.handleConnect.bind(this));
  }
}
```

## Performance Optimization Techniques

### 1. Component Memoization
```typescript
const Galaxy = React.memo(() => {
  // Component only re-renders if props actually change
});

const AudioOrb = React.memo(() => {
  // Isolated from parent re-renders
});
```

### 2. Stable Callback References
```typescript
// ✅ STABLE - prevents re-renders
const handleClick = useCallback(() => {
  action();
}, []); // Empty deps = stable reference

// ❌ UNSTABLE - creates new function every render
const handleClick = () => action();
```

### 3. Context Value Memoization
```typescript
const contextValue = useMemo(() => ({
  session: sessionRef.current,
  status: connectionStatus
}), [connectionStatus]); // Only changes when status actually changes
```

## WebGL Context Management Rules

### Rule 1: One Context Per Logical Unit
```typescript
// ✅ GOOD: Shared contexts
webglContextService.getContext('galaxy');    // One for galaxy
webglContextService.getContext('audio-orb'); // One for audio visualization
webglContextService.getContext('ui-elements'); // One for UI WebGL needs
```

### Rule 2: Context Lifecycle Management
```typescript
// Context creation
const context = webglContextService.getContext('component-id');

// Context sharing (multiple components can use same context)
const sharedContext = webglContextService.getContext('shared-context');

// Context cleanup (only when truly no longer needed)
webglContextService.destroyContext('component-id');
```

### Rule 3: Error Recovery
```typescript
// Handle context loss gracefully
canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault(); // Prevent default context loss behavior
  // Attempt to restore or degrade gracefully
});

canvas.addEventListener('webglcontextrestored', () => {
  // Reinitialize resources with existing context
});
```

## React + OpenAI Realtime API Integration

### Correct Session Management Pattern
```typescript
// ✅ CORRECT: Service manages session
class RealtimeSessionService {
  private session: RealtimeSession | null = null;
  
  async connect(agents: RealtimeAgent[]) {
    this.session = new RealtimeSession(agents[0], config);
    await this.session.connect();
    // Session persists through UI changes
  }
}

// React component subscribes to session events
function useRealtimeStatus() {
  const [status, setStatus] = useState('DISCONNECTED');
  
  useEffect(() => {
    return realtimeSessionService.on('status', setStatus);
  }, []);
  
  return status;
}
```

### Event Handler Stability
```typescript
// ✅ STABLE: Event handlers don't recreate session
const disconnect = useCallback(() => {
  realtimeSessionService.disconnect();
}, []); // No dependencies = stable reference

// ✅ STABLE: UI state changes don't affect session
const [sidebarOpen, setSidebarOpen] = useState(false);
// This state change won't affect WebRTC session
```

## Dashboard Animation Guidelines

### Safe Animation Properties
**Properties that DON'T trigger re-renders:**
- `transform: translateX(), translateY(), scale(), rotate()`
- `opacity`
- `filter: blur(), brightness()`
- `box-shadow`, `border-radius`

**Properties that DO trigger re-renders (avoid):**
- `width`, `height` (layout changes)
- `margin`, `padding` (layout changes)  
- `position` changes that affect other elements
- `display`, `visibility` (when they affect layout)

### Sidebar Animation Example
```tsx
// ✅ CORRECT: Pure CSS, no JavaScript state
const Sidebar = () => {
  return (
    <div className="fixed left-0 top-0 h-full w-[60px] hover:w-[300px] transition-all duration-300 ease-in-out z-10">
      {/* Sidebar content */}
    </div>
  );
};

// Main content automatically adjusts
const MainContent = () => {
  return (
    <div className="ml-[60px] hover:ml-[300px] transition-all duration-300 ease-in-out">
      {/* Your voice assistant UI here - never re-renders */}
    </div>
  );
};
```

## Error Prevention Checklist

### Before Adding Any Animation:
- [ ] Does this trigger React state changes?
- [ ] Does this cause layout shifts?
- [ ] Will this affect components with WebGL/WebRTC?
- [ ] Can this be achieved with CSS-only?

### Before Creating WebGL Contexts:
- [ ] Is this context managed by a service?
- [ ] Is this context shared across components?
- [ ] Is there proper cleanup on context loss?
- [ ] Are all shader programs properly managed?

### Before Adding React Effects:
- [ ] Are dependencies stable?
- [ ] Is cleanup function implemented?
- [ ] Does this effect recreate expensive resources?
- [ ] Can this be moved to service layer?

## Migration Strategy for Existing Applications

### Phase 1: Identify Resource Ownership
1. Find all `new WebGLRenderer()`, `new RealtimeSession()` calls
2. Identify which React components own these resources
3. Map the dependency chain (what triggers their recreation)

### Phase 2: Extract to Services
1. Create service classes for each resource type
2. Implement event-based communication
3. Add error handling and recovery

### Phase 3: Convert Components to Subscribers
1. Remove resource creation from React components
2. Add service event subscriptions
3. Convert to pure presentation components

### Phase 4: Optimize Animations
1. Convert JavaScript animations to CSS
2. Use transform properties instead of layout properties
3. Add performance monitoring

## Debugging Tools

### WebGL Context Monitoring
```typescript
// Count active contexts
const contexts = webglContextService.getActiveContexts();
console.log(`Active WebGL contexts: ${contexts.length}`);

// Monitor context creation
webglContextService.on('context_created', ({ id }) => {
  console.log(`New context created: ${id}`);
});
```

### React Render Monitoring  
```typescript
// Detect unnecessary re-renders
const WhyDidYouRender = require('@welldone-software/why-did-you-render');
WhyDidYouRender(React, {
  trackAllPureComponents: true,
});
```

### Performance Profiling
```typescript
// Monitor service layer performance
const performanceMonitor = {
  startTime: performance.now(),
  
  logOperation(operation: string) {
    const duration = performance.now() - this.startTime;
    console.log(`${operation} took ${duration}ms`);
    this.startTime = performance.now();
  }
};
```

## Future Dashboard Features

With this architecture in place, you can safely add:
- **Real-time Analytics**: Charts that update without affecting voice assistant
- **Multi-user Sessions**: Multiple WebRTC connections managed by service layer
- **Complex Animations**: Smooth transitions without resource recreation
- **Dynamic Layouts**: Dashboard widgets that rearrange without breaking connections
- **Mobile Responsiveness**: Touch gestures and responsive layouts

## Conclusion

The service layer architecture transforms React from a resource manager into a pure UI renderer. This separation of concerns ensures that your voice assistant remains stable and performant while providing unlimited flexibility for dashboard features and animations.

**Key Takeaway**: React excels at UI management when it's not burdened with managing persistent connections and graphics resources. The service layer handles the "heavy lifting" while React handles the "beautiful presentation."