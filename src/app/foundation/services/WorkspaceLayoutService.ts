import { Layout } from 'react-grid-layout';
import { EventBus, eventMigrationHelper } from './EventBus';
import { CacheManager } from './CacheManager';

export interface WorkspaceModule {
  id: string;
  name: string;
  type: 'email' | 'crm' | 'calendar' | 'analytics' | 'tasks' | 'chat' | 'documents' | 'empty';
  status: 'loading' | 'active' | 'idle' | 'error';
  metadata?: {
    lastAccessed?: Date;
    userPreference?: number;
    dataSource?: string;
  };
}

export interface LayoutPreset {
  name: string;
  description: string;
  layouts: Layout[];
  modules: string[];
  voiceTriggers: string[];
}

export interface WorkspaceState {
  activeLayout: string;
  modules: Map<string, WorkspaceModule>;
  layouts: Map<string, Layout[]>;
  history: LayoutHistoryItem[];
  userPreferences: UserLayoutPreferences;
  focusedModuleId?: string;
}

interface LayoutHistoryItem {
  timestamp: Date;
  layoutName: string;
  trigger: 'voice' | 'manual' | 'system';
  modules: string[];
}

interface UserLayoutPreferences {
  preferredLayouts: Map<string, number>; // layout name -> usage count
  modulePositions: Map<string, { x: number; y: number }>; // module -> preferred position
  screenOptimization: 'desktop' | 'tablet' | 'mobile';
}

class WorkspaceLayoutService {
  private static instance: WorkspaceLayoutService | null = null;
  private state: WorkspaceState;
  private eventBus: EventBus;
  private cacheManager?: CacheManager;
  private readonly MAX_HISTORY = 50;
  private isInitialized: boolean = false;

  // Predefined layout presets for voice commands
  private readonly PRESETS: Map<string, LayoutPreset> = new Map([
    ['single', {
      name: 'single',
      description: 'Single focused module',
      layouts: [
        { i: 'module-1', x: 0, y: 0, w: 12, h: 12, minW: 4, minH: 4 }
      ],
      modules: ['module-1'],
      voiceTriggers: ['single', 'fullscreen', 'one module', 'focus mode']
    }],
    ['split', {
      name: 'split',
      description: 'Two modules side by side',
      layouts: [
        { i: 'module-1', x: 0, y: 0, w: 6, h: 12, minW: 3, minH: 4 },
        { i: 'module-2', x: 6, y: 0, w: 6, h: 12, minW: 3, minH: 4 }
      ],
      modules: ['module-1', 'module-2'],
      voiceTriggers: ['split', 'side by side', 'two panels', 'split view']
    }],
    ['focus-sidebar', {
      name: 'focus-sidebar',
      description: 'Main focus with sidebar',
      layouts: [
        { i: 'module-1', x: 0, y: 0, w: 8, h: 12, minW: 4, minH: 4 },
        { i: 'module-2', x: 8, y: 0, w: 4, h: 12, minW: 2, minH: 4 }
      ],
      modules: ['module-1', 'module-2'],
      voiceTriggers: ['focus with sidebar', 'main and sidebar', '70 30 split']
    }],
    ['stacked', {
      name: 'stacked',
      description: 'Modules stacked vertically',
      layouts: [
        { i: 'module-1', x: 0, y: 0, w: 12, h: 6, minW: 4, minH: 3 },
        { i: 'module-2', x: 0, y: 6, w: 12, h: 6, minW: 4, minH: 3 }
      ],
      modules: ['module-1', 'module-2'],
      voiceTriggers: ['stacked', 'vertical', 'top and bottom', 'stack']
    }],
    ['dashboard', {
      name: 'dashboard',
      description: 'Multi-module dashboard',
      layouts: [
        { i: 'module-1', x: 0, y: 0, w: 6, h: 6, minW: 3, minH: 3 },
        { i: 'module-2', x: 6, y: 0, w: 6, h: 6, minW: 3, minH: 3 },
        { i: 'module-3', x: 0, y: 6, w: 4, h: 6, minW: 2, minH: 3 },
        { i: 'module-4', x: 4, y: 6, w: 4, h: 6, minW: 2, minH: 3 },
        { i: 'module-5', x: 8, y: 6, w: 4, h: 6, minW: 2, minH: 3 }
      ],
      modules: ['module-1', 'module-2', 'module-3', 'module-4', 'module-5'],
      voiceTriggers: ['dashboard', 'overview', 'multiple panels', 'dashboard view']
    }],
    ['grid', {
      name: 'grid',
      description: 'Equal grid layout',
      layouts: [
        { i: 'module-1', x: 0, y: 0, w: 4, h: 6, minW: 2, minH: 3 },
        { i: 'module-2', x: 4, y: 0, w: 4, h: 6, minW: 2, minH: 3 },
        { i: 'module-3', x: 8, y: 0, w: 4, h: 6, minW: 2, minH: 3 },
        { i: 'module-4', x: 0, y: 6, w: 4, h: 6, minW: 2, minH: 3 },
        { i: 'module-5', x: 4, y: 6, w: 4, h: 6, minW: 2, minH: 3 },
        { i: 'module-6', x: 8, y: 6, w: 4, h: 6, minW: 2, minH: 3 }
      ],
      modules: ['module-1', 'module-2', 'module-3', 'module-4', 'module-5', 'module-6'],
      voiceTriggers: ['grid', 'equal grid', 'six panels', 'matrix']
    }],
    ['custom', {
      name: 'custom',
      description: 'Custom user-defined layout',
      layouts: [], // Will be populated dynamically when user resizes
      modules: [],
      voiceTriggers: ['custom', 'customized', 'modified']
    }]
  ]);

  private constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.state = {
      activeLayout: 'dashboard',
      modules: new Map(),
      layouts: new Map(),
      history: [],
      userPreferences: {
        preferredLayouts: new Map(),
        modulePositions: new Map(),
        screenOptimization: 'desktop'
      }
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(eventBus: EventBus): WorkspaceLayoutService {
    if (!WorkspaceLayoutService.instance) {
      WorkspaceLayoutService.instance = new WorkspaceLayoutService(eventBus);
    }
    return WorkspaceLayoutService.instance;
  }

  /**
   * Initialize the service
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('[WorkspaceLayoutService] Already initialized');
      return;
    }

    console.log('[WorkspaceLayoutService] Initializing workspace layout service...');
    this.initializeDefaultModules();
    this.setupEventListeners();
    this.isInitialized = true;
    
    // Load the default preset
    this.applyPreset('dashboard', 'system');
    
    console.log('[WorkspaceLayoutService] Workspace layout service initialized');
  }

  /**
   * Phase 3: Connect to cache manager for faster layout calculations
   */
  setCacheManager(cacheManager: CacheManager): void {
    this.cacheManager = cacheManager;
    console.log('[WorkspaceLayoutService] 🚀 Connected to cache manager for faster layouts');
  }

  /**
   * Apply a cached layout quickly (Skip expensive calculations)
   */
  private applyCachedLayout(cachedLayout: any, percentages: number[]): void {
    // Set custom preset as active
    this.state.activeLayout = 'custom';
    
    // Update the custom preset with the cached layout
    const customPreset = this.PRESETS.get('custom');
    if (customPreset) {
      customPreset.layouts = cachedLayout.layouts;
      customPreset.modules = cachedLayout.layouts.map((l: any) => l.i);
    }
    
    // Store the custom layout in state
    this.state.layouts.set('custom', cachedLayout.layouts);
    
    // Track in preferences
    const currentCount = this.state.userPreferences.preferredLayouts.get('custom') || 0;
    this.state.userPreferences.preferredLayouts.set('custom', currentCount + 1);
    
    // Add to history
    const moduleIds = cachedLayout.layouts.map((l: any) => l.i);
    this.addToHistory('custom', 'voice', moduleIds);
    
    // Emit event for UI update (using existing enhanced event structure)
    eventMigrationHelper.emitBoth(
      'workspace-layout-changed',
      'workspace:layout:changed',
      {
        layout: 'custom',
        preset: 'custom',
        layouts: cachedLayout.layouts,
        modules: moduleIds,
        proportions: percentages,
        emptySpace: 100 - percentages.reduce((a, b) => a + b, 0),
        panelCount: percentages.length,
        rows: cachedLayout.rows,
        layoutPattern: cachedLayout.layoutPattern
      }
    );
    
    console.log(`[WorkspaceLayoutService] ⚡ Applied cached ${percentages.join('/')} layout instantly`);
  }

  private initializeDefaultModules() {
    // Initialize with empty modules
    const defaultModules = [
      { id: 'module-1', name: 'Email', type: 'empty' as const },
      { id: 'module-2', name: 'CRM', type: 'empty' as const },
      { id: 'module-3', name: 'Calendar', type: 'empty' as const },
      { id: 'module-4', name: 'Analytics', type: 'empty' as const },
      { id: 'module-5', name: 'Tasks', type: 'empty' as const }
    ];

    defaultModules.forEach(mod => {
      this.state.modules.set(mod.id, {
        ...mod,
        status: 'idle',
        metadata: { lastAccessed: new Date() }
      });
    });
  }

  private setupEventListeners() {
    // Listen for voice commands
    this.eventBus.on('voice-command', this.handleVoiceCommand.bind(this));
    
    // Listen for module activation requests
    this.eventBus.on('module-activate', (data: any) => {
      if (data?.moduleId && data?.type) {
        this.activateModule(data.moduleId, data.type);
      }
    });
    
    // Listen for layout change requests
    this.eventBus.on('layout-change', (layoutData: any) => {
      if (layoutData) {
        this.changeLayout(layoutData);
      }
    });
  }

  /**
   * Parse proportions from a command like "70/30", "60 40", "make it 70"
   */
  /**
   * Calculate optimal number of rows for a given panel count
   */
  private calculateOptimalRows(panelCount: number): number {
    if (panelCount <= 3) return 1;
    if (panelCount <= 4) return 2;
    if (panelCount <= 6) return 2;
    if (panelCount <= 9) return 3;
    if (panelCount <= 12) return 3;
    if (panelCount <= 16) return 4;
    return Math.ceil(Math.sqrt(panelCount));
  }

  public parseProportions(command: string): { left: number; right: number } | null {
    const lowerCommand = command.toLowerCase();
    
    // Patterns to match proportion commands
    const patterns = [
      /(\d+)\s*[\/\-]\s*(\d+)/,           // 70/30, 70-30
      /(\d+)\s+to\s+(\d+)/,               // 70 to 30
      /(\d+)%?\s+(\d+)%?(?:\s+split)?/,   // 70 30, 70% 30%, 70 30 split
      /make\s+(?:it|left|first)\s+(\d+)/, // make it 70, make left 70
      /(\d+)%?\s+(?:percent|left)/        // 70 percent, 70 left
    ];
    
    for (const pattern of patterns) {
      const match = lowerCommand.match(pattern);
      if (match) {
        const left = parseInt(match[1]);
        const right = match[2] ? parseInt(match[2]) : 100 - left;
        
        // Validate proportions
        if (left >= 20 && left <= 80 && right >= 20 && right <= 80) {
          return { left, right };
        }
      }
    }
    
    // Check for descriptive resize commands
    if (lowerCommand.includes('equal')) {
      return { left: 50, right: 50 };
    }
    
    return null;
  }

  // Parse voice command and determine layout
  public parseVoiceCommand(command: string): { layout?: string; modules?: string[] } {
    const lowerCommand = command.toLowerCase();
    
    // Check for layout triggers
    for (const [presetName, preset] of this.PRESETS) {
      for (const trigger of preset.voiceTriggers) {
        if (lowerCommand.includes(trigger)) {
          return { layout: presetName };
        }
      }
    }

    // Parse module mentions
    const modules: string[] = [];
    if (lowerCommand.includes('email')) modules.push('email');
    if (lowerCommand.includes('crm') || lowerCommand.includes('deals')) modules.push('crm');
    if (lowerCommand.includes('calendar') || lowerCommand.includes('schedule')) modules.push('calendar');
    if (lowerCommand.includes('analytics') || lowerCommand.includes('reports')) modules.push('analytics');
    if (lowerCommand.includes('tasks') || lowerCommand.includes('todos')) modules.push('tasks');

    // Determine layout based on module count
    if (modules.length === 1) {
      return { layout: 'single', modules };
    } else if (modules.length === 2) {
      // Check for specific arrangements
      if (lowerCommand.includes('sidebar')) {
        return { layout: 'focus-sidebar', modules };
      } else if (lowerCommand.includes('stack')) {
        return { layout: 'stacked', modules };
      }
      return { layout: 'split', modules };
    } else if (modules.length > 2) {
      return { layout: 'dashboard', modules };
    }

    return {};
  }

  private handleVoiceCommand(command: string) {
    const { layout, modules } = this.parseVoiceCommand(command);
    
    if (layout) {
      this.applyPreset(layout, 'voice');
    }
    
    if (modules && modules.length > 0) {
      modules.forEach((moduleType, index) => {
        const moduleId = `module-${index + 1}`;
        this.activateModule(moduleId, moduleType as WorkspaceModule['type']);
      });
    }
  }

  public applyPreset(presetName: string, trigger: 'voice' | 'manual' | 'system' = 'manual') {
    const preset = this.PRESETS.get(presetName);
    if (!preset) {
      console.warn(`Preset ${presetName} not found`);
      return;
    }

    this.state.activeLayout = presetName;
    this.state.layouts.set(presetName, preset.layouts);

    // Track usage for preferences
    const currentCount = this.state.userPreferences.preferredLayouts.get(presetName) || 0;
    this.state.userPreferences.preferredLayouts.set(presetName, currentCount + 1);

    // Add to history
    this.addToHistory(presetName, trigger, preset.modules);

    // Emit layout change event using migration helper for both old and new event names
    eventMigrationHelper.emitBoth(
      'workspace-layout-changed',
      'workspace:layout:changed',
      {
        layout: presetName,
        layouts: preset.layouts,
        modules: preset.modules
      }
    );
  }

  /**
   * Focus control methods for VA integration
   */
  public focusModule(moduleId: string): void {
    this.state.focusedModuleId = moduleId;
    
    // Emit event for UI to handle focus
    window.dispatchEvent(new CustomEvent('workspace:focus-module', {
      detail: { moduleId }
    }));
    
    // Also emit through EventBus for other services
    this.eventBus.emit('workspace:module-focused', {
      moduleId,
      timestamp: new Date()
    });
    
    console.log(`🎯 WorkspaceLayout: Focused on module ${moduleId}`);
  }
  
  // Clear focus
  public clearFocus(): void {
    this.state.focusedModuleId = null;
    
    window.dispatchEvent(new CustomEvent('workspace:focus-module', {
      detail: { moduleId: null }
    }));
    
    this.eventBus.emit('workspace:focus-cleared', {
      timestamp: new Date()
    });
  }
  
  // Get currently focused module
  public getFocusedModule(): string | null {
    return this.state.focusedModuleId;
  }
  
  // Set focused module (called by UI)
  public setFocusedModule(moduleId: string | null): void {
    this.state.focusedModuleId = moduleId;
    
    if (moduleId) {
      this.eventBus.emit('workspace:module-focused', {
        moduleId,
        timestamp: new Date()
      });
    } else {
      this.eventBus.emit('workspace:focus-cleared', {
        timestamp: new Date()
      });
    }
  }
  
  // Focus on module by type (useful for VA commands like "focus on email")
  public focusModuleByType(moduleType: string): void {
    // Find the first module of the given type
    for (const [id, module] of this.state.modules) {
      if (module.type === moduleType) {
        this.focusModule(id);
        return;
      }
    }
    
    console.warn(`⚠️ No module of type '${moduleType}' found`);
  }

  /**
   * Create a custom proportional layout with specified percentages
   * Supports any number of panels, partial layouts, and multi-row grids
   * Phase 3: Enhanced with intelligent caching for faster performance
   */
  public createProportionalLayout(
    percentages: number[] | number, 
    rows?: number, 
    layoutPattern?: 'horizontal' | 'vertical' | 'grid',
    ...additionalArgs: number[]
  ): void {
    // Handle legacy calls with individual parameters
    if (typeof percentages === 'number') {
      // Legacy call with individual parameters - convert to array
      const allNumbers = [percentages, ...(rows !== undefined ? [rows] : []), ...additionalArgs].filter(arg => typeof arg === 'number');
      percentages = allNumbers;
      rows = 1; // Default to single row for legacy calls
    }
    
    // Ensure we have an array
    if (!Array.isArray(percentages) || percentages.length === 0) {
      console.warn('[WorkspaceLayoutService] Invalid percentages provided');
      return;
    }

    // Phase 3: Check cache first for faster custom layouts (like "70/30", "25/25/25/25")
    const finalRows = rows || 1;
    const finalPattern = layoutPattern || 'horizontal';
    
    if (this.cacheManager) {
      const cachedLayout = this.cacheManager.getCachedLayout(percentages, finalPattern, finalRows);
      if (cachedLayout) {
        console.log(`[WorkspaceLayoutService] ⚡ Using cached layout for ${percentages.join('/')} (${cachedLayout.calculationTime}ms saved)`);
        this.applyCachedLayout(cachedLayout, percentages);
        return;
      }
    }
    
    // Default values
    rows = rows || 1;
    layoutPattern = layoutPattern || 'horizontal';
    
    // IMPORTANT: If rows > 1 is explicitly set, ignore 'vertical' pattern
    // This prevents the confusing behavior where 'vertical' overrides rows
    if (rows > 1 && layoutPattern === 'vertical') {
      console.warn('[WorkspaceLayoutService] Ignoring vertical pattern because rows > 1. Using horizontal grid instead.');
      layoutPattern = 'horizontal';
    }
    
    // Auto-calculate rows for 'grid' pattern if not specified
    if (layoutPattern === 'grid' && rows === 1) {
      rows = this.calculateOptimalRows(percentages.length);
    }
    
    // For vertical pattern, rows = number of panels (only if rows wasn't explicitly set > 1)
    if (layoutPattern === 'vertical' && rows === 1) {
      rows = percentages.length;
    }
    
    // Calculate total percentage
    let totalPercent = percentages.reduce((sum, p) => sum + p, 0);
    
    // Validate total doesn't exceed 100%
    if (totalPercent > 100) {
      console.warn(`[WorkspaceLayoutService] Total percentages (${totalPercent}%) exceed 100%, scaling down`);
      const scale = 100 / totalPercent;
      percentages = percentages.map(p => Math.round(p * scale));
      totalPercent = percentages.reduce((sum, p) => sum + p, 0);
    }
    
    // Convert percentages to grid columns (12 column system)
    const layouts: Layout[] = [];
    const totalColumns = 12;
    const totalRows = 12; // Grid has 12 rows total
    const emptySpace = 100 - totalPercent;
    
    // Calculate panels per row
    const panelsPerRow = Math.ceil(percentages.length / rows);
    const rowHeight = Math.floor(totalRows / rows);
    
    // For multi-row layouts, we need to handle column width differently
    let columnWidth = totalColumns;
    if (rows === 1) {
      // Single row - use full width calculation
      columnWidth = Math.round((totalPercent / 100) * totalColumns);
    } else if (layoutPattern === 'vertical') {
      // Vertical stack - each panel uses full width
      columnWidth = totalColumns;
    } else {
      // Grid layout (for rows > 1) - divide columns by panels per row
      // This applies to both 'horizontal' and 'grid' patterns
      columnWidth = Math.floor(totalColumns / panelsPerRow);
    }
    
    // Create layout items with proper row/column positioning
    percentages.forEach((percent, index) => {
      const moduleId = `module-${index + 1}`;
      
      let x = 0;
      let y = 0;
      let w = columnWidth;
      let h = rowHeight;
      
      if (layoutPattern === 'vertical') {
        // Vertical stack - full width, stacked vertically
        x = 0;
        y = index * rowHeight;
        w = Math.round((percent / 100) * totalColumns);
        h = rowHeight;
      } else if (rows > 1) {
        // Grid layout - calculate row and column position
        const row = Math.floor(index / panelsPerRow);
        const col = index % panelsPerRow;
        
        x = col * columnWidth;
        y = row * rowHeight;
        
        // For panels with custom percentages in grid, adjust width
        if (totalPercent < 100 && rows === 1) {
          w = Math.round((percent / 100) * totalColumns);
        } else {
          w = columnWidth;
        }
        
        // Last panel in row might need width adjustment
        if (col === panelsPerRow - 1 && x + w < totalColumns) {
          w = totalColumns - x;
        }
      } else {
        // Single row horizontal layout (existing logic)
        const usableColumns = Math.round((totalPercent / 100) * totalColumns);
        w = Math.round((percent / totalPercent) * usableColumns);
        w = Math.max(1, w); // Minimum 1 column
        
        // Calculate x position based on previous panels
        x = layouts.reduce((sum, layout) => sum + layout.w, 0);
        y = 0;
        h = totalRows;
      }
      
      // Ensure minimum dimensions
      w = Math.max(1, w);
      h = Math.max(2, h);
      
      layouts.push({
        i: moduleId,
        x,
        y,
        w,
        h,
        minW: 1,
        minH: 2
      });
    });
    
    // Set custom preset as active
    this.state.activeLayout = 'custom';
    
    // Update the custom preset with the new layout
    const customPreset = this.PRESETS.get('custom');
    if (customPreset) {
      customPreset.layouts = layouts;
      customPreset.modules = layouts.map(l => l.i);
    }
    
    // Store the custom layout in state
    this.state.layouts.set('custom', layouts);
    
    // Track in preferences
    const currentCount = this.state.userPreferences.preferredLayouts.get('custom') || 0;
    this.state.userPreferences.preferredLayouts.set('custom', currentCount + 1);
    
    // Add to history
    const moduleIds = layouts.map(l => l.i);
    this.addToHistory('custom', 'voice', moduleIds);
    
    // Emit event for UI update with custom preset active using migration helper
    eventMigrationHelper.emitBoth(
      'workspace-layout-changed',
      'workspace:layout:changed',
      {
        layout: 'custom',
        preset: 'custom',
        layouts: layouts,
        modules: moduleIds,
        proportions: percentages,
        emptySpace: emptySpace,
        panelCount: percentages.length,
        rows: rows,
        layoutPattern: layoutPattern
      }
    );
    
    const layoutDescription = rows > 1 
      ? `${rows}x${Math.ceil(percentages.length / rows)} grid`
      : `${percentages.length}-panel layout`;
    
    console.log(`[WorkspaceLayoutService] Created ${layoutDescription}: ${percentages.join('/')} with ${emptySpace}% empty`);
  }

  public activateModule(moduleId: string, type: WorkspaceModule['type']) {
    const workspaceModule = this.state.modules.get(moduleId);
    if (!workspaceModule) {
      console.warn(`Module ${moduleId} not found`);
      return;
    }

    // Update module status
    workspaceModule.type = type;
    workspaceModule.status = 'loading';
    workspaceModule.metadata = {
      ...workspaceModule.metadata,
      lastAccessed: new Date()
    };

    // Emit module activation event using migration helper
    eventMigrationHelper.emitBoth(
      'workspace-module-activating',
      'workspace:module:activating',
      {
        moduleId,
        type
      }
    );

    // Simulate loading (in real app, this would be Module Federation loading)
    setTimeout(() => {
      workspaceModule.status = 'active';
      eventMigrationHelper.emitBoth(
        'workspace-module-activated',
        'workspace:module:activated',
        {
          moduleId,
          type
        }
      );
    }, 1000);
  }

  public changeLayout(layoutData: Layout[]) {
    // Set custom preset as active when layout is manually changed
    this.state.activeLayout = 'custom';
    this.state.layouts.set('custom', layoutData);
    
    // Update the custom preset with the new layout
    const customPreset = this.PRESETS.get('custom');
    if (customPreset) {
      customPreset.layouts = layoutData;
      customPreset.modules = layoutData.map(l => l.i);
    }

    // Store module positions for preferences
    layoutData.forEach(item => {
      this.state.userPreferences.modulePositions.set(item.i, { x: item.x, y: item.y });
    });

    eventMigrationHelper.emitBoth(
      'workspace-layout-updated',
      'workspace:layout:updated',
      {
        layout: 'custom',
        preset: 'custom',
        layouts: layoutData
      }
    );
  }

  private addToHistory(layoutName: string, trigger: 'voice' | 'manual' | 'system', modules: string[]) {
    this.state.history.push({
      timestamp: new Date(),
      layoutName,
      trigger,
      modules
    });

    // Keep history limited
    if (this.state.history.length > this.MAX_HISTORY) {
      this.state.history.shift();
    }
  }

  // Get suggested layout based on user preferences and context
  public getSuggestedLayout(context: { modules?: string[]; timeOfDay?: string }): string {
    // Sort layouts by usage frequency
    const sortedPreferences = Array.from(this.state.userPreferences.preferredLayouts.entries())
      .sort((a, b) => b[1] - a[1]);

    if (sortedPreferences.length > 0) {
      return sortedPreferences[0][0];
    }

    // Default suggestions based on module count
    const moduleCount = context.modules?.length || 1;
    if (moduleCount === 1) return 'single';
    if (moduleCount === 2) return 'split';
    if (moduleCount <= 5) return 'dashboard';
    return 'grid';
  }

  public getActiveModules(): WorkspaceModule[] {
    return Array.from(this.state.modules.values())
      .filter(m => m.status === 'active');
  }

  public getState(): WorkspaceState {
    return this.state;
  }

  public getPresets(): LayoutPreset[] {
    return Array.from(this.PRESETS.values());
  }

  /**
   * Get current layout information
   */
  public getCurrentLayout(): { name: string; layouts: Layout[]; modules: string[] } {
    const layouts = this.state.layouts.get(this.state.activeLayout) || [];
    const preset = this.PRESETS.get(this.state.activeLayout);
    
    return {
      name: this.state.activeLayout,
      layouts,
      modules: preset?.modules || []
    };
  }

  /**
   * Handle voice command for workspace control
   */
  public handleWorkspaceCommand(command: string): { success: boolean; message: string; data?: any } {
    const lowerCommand = command.toLowerCase();
    
    // Check for N-panel layout patterns (4+ panels)
    // Pattern: any sequence of numbers separated by / - or :
    const multiPanelPattern = /(?:(\d+)\s*[\/\-:]\s*){3,}(\d+)/;  // Matches 4+ numbers
    const match = lowerCommand.match(multiPanelPattern);
    
    if (match) {
      // Extract all numbers from the command
      const numbers = lowerCommand.match(/\d+/g);
      if (numbers && numbers.length >= 4) {
        const percentages = numbers.map(n => parseInt(n));
        
        this.createProportionalLayout(percentages);
        return {
          success: true,
          message: `Created ${percentages.length}-panel layout: ${percentages.join('/')}`,
          data: { 
            layout: `custom-${percentages.length}panel`,
            proportions: percentages,
            panelCount: percentages.length
          }
        };
      }
    }
    
    // Check for three-panel layout patterns
    const threePanelPatterns = [
      /^(\d+)\s*[\/\-:]\s*(\d+)\s*[\/\-:]\s*(\d+)$/,  // Exact "30/40/30", "25-50-25"
      /three\s+panels?\s+(\d+)\s*[\/\-:]\s*(\d+)\s*[\/\-:]\s*(\d+)/, // "three panels 30/40/30"
      /triple\s+(\d+)\s*[\/\-:]\s*(\d+)\s*[\/\-:]\s*(\d+)/, // "triple 25/50/25"
    ];
    
    for (const pattern of threePanelPatterns) {
      const match = lowerCommand.match(pattern);
      if (match) {
        const percentages = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
        
        this.createProportionalLayout(percentages);
        return {
          success: true,
          message: `Created 3-panel layout: ${percentages.join('/')}`,
          data: { 
            layout: 'custom-3panel',
            proportions: percentages,
            panelCount: 3
          }
        };
      }
    }
    
    // Check for partial/two-panel resize commands
    const resizePatterns = [
      /resize.*?(\d+)\s*[\/\-:]\s*(\d+)/,           // "resize to 70/30", "resize 60-40"
      /make.*?(\d+)\s*[\/\-:]\s*(\d+)/,             // "make it 70/30"
      /change.*?(\d+)\s*[\/\-:]\s*(\d+)/,           // "change to 60/40"
      /split.*?(\d+)\s*[\/\-:]\s*(\d+)/,            // "split 75/25", "split 10/30" (partial)
      /adjust.*?(\d+)\s*[\/\-:]\s*(\d+)/,           // "adjust to 80/20"
      /partial.*?(\d+)\s*[\/\-:]\s*(\d+)/,          // "partial 10/30" (explicitly partial)
      /(\d+)\s*[\/\-:]\s*(\d+)\s*(?:layout|split)?/ // "70/30 layout", "60-40 split"
    ];
    
    for (const pattern of resizePatterns) {
      const match = lowerCommand.match(pattern);
      if (match) {
        const left = parseInt(match[1]);
        const right = parseInt(match[2]);
        const total = left + right;
        
        // Allow partial layouts (total < 100) or full layouts (total = 100)
        if (total <= 100) {
          this.createProportionalLayout([left, right]);
          
          const message = total < 100 
            ? `Created partial layout: ${left}/${right} with ${100 - total}% empty`
            : `Resized layout to ${left}/${right}`;
          
          return {
            success: true,
            message,
            data: { 
              layout: 'custom',
              proportions: [left, right],
              emptySpace: 100 - total
            }
          };
        } else {
          // Scale down if total exceeds 100
          const scale = 100 / total;
          const scaledLeft = Math.round(left * scale);
          const scaledRight = 100 - scaledLeft;
          
          this.createProportionalLayout([scaledLeft, scaledRight]);
          return {
            success: true,
            message: `Scaled layout to ${scaledLeft}/${scaledRight} (original ${left}/${right} exceeded 100%)`,
            data: { 
              layout: 'custom',
              proportions: [scaledLeft, scaledRight],
              original: [left, right]
            }
          };
        }
      }
    }
    
    // Fall back to original parsing for preset layouts
    const parsed = this.parseVoiceCommand(command);
    
    if (parsed.layout) {
      this.applyPreset(parsed.layout, 'voice');
      
      if (parsed.modules && parsed.modules.length > 0) {
        parsed.modules.forEach((moduleType, index) => {
          const moduleId = `module-${index + 1}`;
          this.activateModule(moduleId, moduleType as WorkspaceModule['type']);
        });
      }
      
      return {
        success: true,
        message: `Applied ${parsed.layout} layout`,
        data: { layout: parsed.layout, modules: parsed.modules }
      };
    }
    
    if (parsed.modules && parsed.modules.length > 0) {
      parsed.modules.forEach((moduleType, index) => {
        const moduleId = `module-${index + 1}`;
        this.activateModule(moduleId, moduleType as WorkspaceModule['type']);
      });
      
      return {
        success: true,
        message: `Activated ${parsed.modules.join(', ')} modules`,
        data: { modules: parsed.modules }
      };
    }
    
    return {
      success: false,
      message: 'Could not parse workspace command',
      data: null
    };
  }

  /**
   * Shutdown and cleanup
   */
  shutdown(): void {
    this.eventBus.off('voice-command');
    this.eventBus.off('module-activate');
    this.eventBus.off('layout-change');
    WorkspaceLayoutService.instance = null;
    console.log('[WorkspaceLayoutService] Service shutdown complete');
  }
}

export { WorkspaceLayoutService };
export default WorkspaceLayoutService;