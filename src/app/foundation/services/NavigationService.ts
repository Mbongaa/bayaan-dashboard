/**
 * NavigationService - Manages dashboard navigation state and sidebar control
 * 
 * This service provides a centralized navigation state management system that:
 * - Controls sidebar expand/collapse state
 * - Manages dashboard section navigation
 * - Emits events for React component subscriptions
 * - Supports both voice control and manual interaction
 */

import { EventEmitter } from 'events';

export type NavigationSection = 'dashboard' | 'profile' | 'settings' | 'voice' | null;
export type SidebarState = 'expanded' | 'collapsed';

interface NavigationState {
  sidebarState: SidebarState;
  currentSection: NavigationSection;
  contentMode: 'voice' | 'dashboard';
}

interface NavigationEvent {
  type: 'sidebar-state' | 'section-change' | 'content-mode';
  payload: any;
}

class NavigationService extends EventEmitter {
  private static instance: NavigationService;
  private state: NavigationState;
  private isInitialized: boolean = false;

  private constructor() {
    super();
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
    
    this.emit('navigation:sidebar-state', {
      state: 'expanded',
      source: 'service'
    });
  }

  collapseSidebar(): void {
    if (this.state.sidebarState === 'collapsed') return;
    
    console.log('[NavigationService] Collapsing sidebar');
    this.state.sidebarState = 'collapsed';
    this.saveState();
    
    this.emit('navigation:sidebar-state', {
      state: 'collapsed',
      source: 'service'
    });
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
    
    this.emit('navigation:sidebar-state', {
      state,
      source: 'service'
    });
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
      this.state.contentMode = 'dashboard';
    }
    
    this.saveState();
    
    this.emit('navigation:section-change', {
      section,
      contentMode: this.state.contentMode,
      source: 'service'
    });
  }

  backToVoice(): void {
    console.log('[NavigationService] Returning to voice mode');
    this.state.currentSection = null;
    this.state.contentMode = 'voice';
    this.saveState();
    
    this.emit('navigation:section-change', {
      section: null,
      contentMode: 'voice',
      source: 'service'
    });
  }

  // State getters
  getSidebarState(): SidebarState {
    return this.state.sidebarState;
  }

  getCurrentSection(): NavigationSection {
    return this.state.currentSection;
  }

  getContentMode(): 'voice' | 'dashboard' {
    return this.state.contentMode;
  }

  getState(): NavigationState {
    return { ...this.state };
  }

  // Voice control integration
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

  // Cleanup
  destroy(): void {
    this.removeAllListeners();
    this.isInitialized = false;
    console.log('[NavigationService] Service destroyed');
  }
}

// Export singleton instance
export const navigationService = NavigationService.getInstance();