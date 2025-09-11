/**
 * Z-Index Layer Architecture
 * 
 * This file defines the z-index layering system for the application.
 * Layers are organized from lowest (background) to highest (critical overlays).
 * 
 * HIERARCHY:
 * 1. Background Layer (0-10): Galaxy and base elements
 * 2. Dashboard Layer (20-50): Dashboard, sidebar, controls
 * 3. Foundation/Voice Layer (60-90): 3D Orb, Chatbox, PTT (HIGHEST PRIORITY)
 * 4. Critical Overlays (100+): Modals, drag states, debug
 */

// ============================================
// LAYER 1: BACKGROUND (0-10)
// ============================================
export const Z_GALAXY_BACKGROUND = 0;        // Galaxy background effect
export const Z_BASE_CONTENT = 10;            // Base content layer

// ============================================
// LAYER 2: DASHBOARD (20-50)
// ============================================
export const Z_SIDEBAR = 20;                 // Sidebar navigation
export const Z_DASHBOARD_CONTENT = 30;       // Dashboard overlay and content
export const Z_CONTROLS = 40;                // Theme toggle, mode toggle
export const Z_DROPDOWN = 50;                // Dropdown menus

// ============================================
// LAYER 3: FOUNDATION/VOICE (60-90) - HIGHEST PRIORITY
// ============================================
export const Z_TRANSCRIPT = 60;              // Transcript and events
export const Z_AUDIO_ORB = 70;              // 3D Audio visualization orb
export const Z_CHATBOX = 80;                // Chatbox input
export const Z_PTT = 90;                    // Push-to-talk button

// ============================================
// LAYER 4: CRITICAL OVERLAYS (100+)
// ============================================
export const Z_DRAG_ACTIVE = 100;           // Items being dragged/resized
export const Z_MODAL_BACKDROP = 100;        // Modal backdrops
export const Z_MODAL = 110;                 // Modal content
export const Z_NOTIFICATION = 120;          // Toast notifications
export const Z_FULLSCREEN = 150;            // Fullscreen overlays
export const Z_DEBUG = 9999;                // Debug overlays (dev only)

// ============================================
// TAILWIND CLASS MAPPINGS
// ============================================
export const Z_CLASSES = {
  galaxy: 'z-0',
  base: 'z-10',
  sidebar: 'z-20',
  dashboard: 'z-30',
  controls: 'z-40',
  dropdown: 'z-50',
  transcript: 'z-[60]',
  orb: 'z-[70]',
  chatbox: 'z-[80]',
  ptt: 'z-[90]',
  dragActive: 'z-[100]',
  modal: 'z-[110]',
  notification: 'z-[120]',
  fullscreen: 'z-[150]',
  debug: 'z-[9999]'
} as const;

// ============================================
// USAGE GUIDELINES
// ============================================
/**
 * IMPORTANT: Voice interface elements (orb, chatbox, PTT) should ALWAYS
 * have the highest z-index among regular UI elements to ensure they
 * remain accessible and visible.
 * 
 * When adding new components:
 * 1. Identify which layer category it belongs to
 * 2. Use the appropriate constant from this file
 * 3. Avoid hardcoding z-index values
 * 4. If a new layer is needed, add it here with documentation
 * 
 * Example usage:
 * - In TypeScript: style={{ zIndex: Z_AUDIO_ORB }}
 * - In Tailwind: className={Z_CLASSES.orb}
 */