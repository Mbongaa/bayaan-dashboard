/**
 * NavigationService - Manages workspace navigation state and sidebar control
 * 
 * This service provides a centralized navigation state management system that:
 * - Controls sidebar expand/collapse state
 * - Manages workspace section navigation
 * - Emits events for React component subscriptions
 * - Supports both voice control and manual interaction
 */

import { eventMigrationHelper, NavigationSection, SidebarState } from './EventBus';
import { ServiceContainer } from './ServiceContainer';

// Re-export types for backward compatibility
export type { NavigationSection, SidebarState } from './EventBus';

interface NavigationState {
  sidebarState: SidebarState;
  currentSection: NavigationSection;
  contentMode: 'voice' | 'workspace';
}

interface NavigationEvent {
  type: 'sidebar-state' | 'section-change' | 'content-mode';
  payload: any;
}

class NavigationService {
  private static instance: NavigationService;
  private state: NavigationState;
  private isInitialized: boolean = false;
  private serviceContainer?: ServiceContainer;

  private constructor() {
    this.state = {
      sidebarState: 'collapsed',
      currentSection: null,
      contentMode: 'voice'
    };
  }

  static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  initialize(): void {
    if (this.isInitialized) return;
    
    console.log('[NavigationService] Initializing navigation service');
    this.isInitialized = true;
    
    // Restore state from localStorage if available
    this.restoreState();
  }

  /**
   * Phase 2: Set service container for direct communication (Connect to phone system)
   */
  setServiceContainer(container: ServiceContainer): void {
    this.serviceContainer = container;
    console.log('[NavigationService] Connected to service communication system');
  }

  private restoreState(): void {
    if (typeof window === 'undefined') return;
    
    const savedState = localStorage.getItem('navigationState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        this.state = { ...this.state, ...parsed };
        console.log('[NavigationService] Restored state:', this.state);
      } catch (err) {
        console.warn('[NavigationService] Failed to restore state:', err);
      }
    }
  }

  private saveState(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('navigationState', JSON.stringify(this.state));
    } catch (err) {
      console.warn('[NavigationService] Failed to save state:', err);
    }
  }

  // Sidebar control methods
  expandSidebar(): void {
    if (this.state.sidebarState === 'expanded') return;
    
    console.log('[NavigationService] Expanding sidebar');
    this.state.sidebarState = 'expanded';
    this.saveState();
    
    // Emit to both legacy and new event names during transition
    eventMigrationHelper.emitBoth(
      'navigation:sidebar-state',
      'navigation:sidebar:changed',
      {
        state: 'expanded',
        source: 'service'
      }
    );
  }

  collapseSidebar(): void {
    if (this.state.sidebarState === 'collapsed') return;
    
    console.log('[NavigationService] Collapsing sidebar');
    this.state.sidebarState = 'collapsed';
    this.saveState();
    
    // Emit to both legacy and new event names during transition
    eventMigrationHelper.emitBoth(
      'navigation:sidebar-state',
      'navigation:sidebar:changed',
      {
        state: 'collapsed',
        source: 'service'
      }
    );
  }

  toggleSidebar(): void {
    if (this.state.sidebarState === 'expanded') {
      this.collapseSidebar();
    } else {
      this.expandSidebar();
    }
  }

  setSidebarState(state: SidebarState): void {
    if (this.state.sidebarState === state) return;
    
    console.log('[NavigationService] Setting sidebar state:', state);
    this.state.sidebarState = state;
    this.saveState();
    
    // Emit to both legacy and new event names during transition
    eventMigrationHelper.emitBoth(
      'navigation:sidebar-state',
      'navigation:sidebar:changed',
      {
        state,
        source: 'service'
      }
    );
  }

  // Navigation methods
  navigateToSection(section: NavigationSection): void {
    if (this.state.currentSection === section) return;
    
    console.log('[NavigationService] Navigating to section:', section);
    this.state.currentSection = section;
    
    // Set content mode based on section
    if (section === 'voice' || section === null) {
      this.state.contentMode = 'voice';
    } else {
      this.state.contentMode = 'workspace';
    }
    
    this.saveState();
    
    // Emit to both legacy and new event names during transition
    eventMigrationHelper.emitBoth(
      'navigation:section-change',
      'navigation:section:changed',
      {
        section: this.state.currentSection,
        contentMode: this.state.contentMode,
        source: 'service'
      }
    );
  }

  backToVoice(): void {
    console.log('[NavigationService] Returning to voice mode');
    this.state.currentSection = null;
    this.state.contentMode = 'voice';
    this.saveState();
    
    // Emit to both legacy and new event names during transition
    eventMigrationHelper.emitBoth(
      'navigation:section-change',
      'navigation:section:changed',
      {
        section: null,
        contentMode: 'voice',
        source: 'service'
      }
    );
  }

  // Content mode control methods
  setContentMode(mode: 'voice' | 'workspace'): void {
    if (this.state.contentMode === mode) return;
    
    console.log('[NavigationService] Setting content mode:', mode);
    this.state.contentMode = mode;
    
    // Adjust section based on mode
    if (mode === 'voice') {
      this.state.currentSection = null;
    } else if (mode === 'workspace' && !this.state.currentSection) {
      this.state.currentSection = 'workspace';
    }
    
    this.saveState();
    
    // Emit to both legacy and new event names during transition
    eventMigrationHelper.emitBoth(
      'navigation:content-mode',
      'navigation:section:mode-changed',
      {
        mode,
        section: this.state.currentSection,
        source: 'service'
      }
    );
  }

  toggleContentMode(): void {
    const newMode = this.state.contentMode === 'voice' ? 'workspace' : 'voice';
    this.setContentMode(newMode);
  }

  // State getters
  getSidebarState(): SidebarState {
    return this.state.sidebarState;
  }

  getCurrentSection(): NavigationSection {
    return this.state.currentSection;
  }

  getContentMode(): 'voice' | 'workspace' {
    return this.state.contentMode;
  }

  getState(): NavigationState {
    return { ...this.state };
  }

  // Voice control integration with Phase 2 service communication
  handleVoiceCommand(action: string, target?: string): { success: boolean; message: string } {
    console.log('[NavigationService] Handling voice command:', action, target);
    
    try {
      switch (action) {
        case 'expand_sidebar':
          this.expandSidebar();
          return { success: true, message: 'Sidebar expanded' };
          
        case 'collapse_sidebar':
          this.collapseSidebar();
          return { success: true, message: 'Sidebar collapsed' };
          
        case 'toggle_sidebar':
          this.toggleSidebar();
          return { 
            success: true, 
            message: `Sidebar ${this.state.sidebarState === 'expanded' ? 'collapsed' : 'expanded'}` 
          };
          
        case 'navigate_section':
          if (!target) {
            return { success: false, message: 'No section specified' };
          }
          
          // Phase 2: Enhanced navigation with workspace coordination
          if (target === 'workspace' && this.serviceContainer) {
            // Note: This is an async operation, but we maintain the sync interface for compatibility
            this.handleWorkspaceNavigationWithCoordination(target).catch(console.error);
            this.navigateToSection(target as NavigationSection);
            return { success: true, message: `Navigated to ${target} (enhanced coordination active)` };
          }
          
          this.navigateToSection(target as NavigationSection);
          return { success: true, message: `Navigated to ${target}` };
          
        case 'back_to_voice':
          this.backToVoice();
          return { success: true, message: 'Returned to voice mode' };
          
        default:
          return { success: false, message: `Unknown action: ${action}` };
      }
    } catch (error) {
      console.error('[NavigationService] Error handling voice command:', error);
      return { 
        success: false, 
        message: 'Failed to execute navigation command' 
      };
    }
  }

  /**
   * Phase 2: Enhanced workspace navigation with direct service communication
   * This demonstrates the "direct phone call" between Navigation and Workspace departments
   */
  private async handleWorkspaceNavigationWithCoordination(target: string): Promise<{ success: boolean; message: string }> {
    try {
      // First, navigate to the workspace section (existing functionality)
      this.navigateToSection(target as NavigationSection);
      
      // Phase 2: Direct communication with WorkspaceLayoutService
      if (this.serviceContainer?.isServiceAvailable('workspace')) {
        console.log('[NavigationService] 📞 Calling WorkspaceLayoutService directly...');
        
        // Get current layout status from workspace service directly (no intercom needed!)
        const workspaceStatus = await this.serviceContainer.call<{
          name: string;
          layouts: any[];
          modules: string[];
        }>('workspace', 'getCurrentLayout', {});
        
        console.log('[NavigationService] 📞 ✅ Got workspace status:', workspaceStatus);
        
        return { 
          success: true, 
          message: `Navigated to workspace (${workspaceStatus.name} layout active with ${workspaceStatus.modules.length} modules)` 
        };
      } else {
        // Fallback to original behavior if service communication not available
        return { success: true, message: `Navigated to ${target}` };
      }
    } catch (error) {
      console.error('[NavigationService] Error in enhanced navigation:', error);
      // Fallback to basic navigation
      this.navigateToSection(target as NavigationSection);
      return { success: true, message: `Navigated to ${target} (basic mode)` };
    }
  }

  // Cleanup
  destroy(): void {
    // Note: Event listeners are now managed by components through EventBus
    // No need to manually remove listeners here
    this.isInitialized = false;
    console.log('[NavigationService] Service destroyed');
  }
}

// Export singleton instance
export const navigationService = NavigationService.getInstance();