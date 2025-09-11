'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './workspace.css';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { foundationServices } from '../../../foundation/services/FoundationServices';
import { eventMigrationHelper } from '../../../foundation/services/EventBus';
import { GmailModule } from '../../../components/modules/GmailModule';
import { useAuth } from '../../../hooks/useSupabase';
import { AgentOutputDisplay } from '../AgentOutputDisplay';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Available module types for dragging
export const MODULE_TYPES = [
  { type: 'email', icon: '✉️', title: 'Gmail', description: 'Email management' },
  { type: 'crm', icon: '🤝', title: 'CRM', description: 'Customer relations' },
  { type: 'calendar', icon: '📅', title: 'Calendar', description: 'Schedule management' },
  { type: 'analytics', icon: '📊', title: 'Analytics', description: 'Data insights' }
] as const;

export interface WorkspaceItem {
  id: string;
  title: string;
  type: 'email' | 'crm' | 'calendar' | 'analytics' | 'empty';
  status: 'loading' | 'active' | 'idle';
  metadata?: any;
}

interface WorkspaceGridProps {
  onLayoutChange?: (layout: Layout[]) => void;
  onItemActivate?: (itemId: string) => void;
  onModuleDrop?: (itemId: string, moduleType: string) => void;
}

// Predefined layout templates for voice commands
const LAYOUT_TEMPLATES: { [key: string]: Layout[] } = {
  single: [
    { i: 'item-1', x: 0, y: 0, w: 12, h: 10, minW: 4, minH: 4 }
  ],
  split: [
    { i: 'item-1', x: 0, y: 0, w: 6, h: 10, minW: 3, minH: 4 },
    { i: 'item-2', x: 6, y: 0, w: 6, h: 10, minW: 3, minH: 4 }
  ],
  'side-by-side': [
    { i: 'item-1', x: 0, y: 0, w: 6, h: 10, minW: 3, minH: 4 },
    { i: 'item-2', x: 6, y: 0, w: 6, h: 10, minW: 3, minH: 4 }
  ],
  stacked: [
    { i: 'item-1', x: 0, y: 0, w: 12, h: 5, minW: 4, minH: 3 },
    { i: 'item-2', x: 0, y: 5, w: 12, h: 5, minW: 4, minH: 3 }
  ],
  'focus-sidebar': [
    { i: 'item-1', x: 0, y: 0, w: 8, h: 10, minW: 4, minH: 4 },
    { i: 'item-2', x: 8, y: 0, w: 4, h: 10, minW: 2, minH: 4 }
  ],
  dashboard: [
    { i: 'item-1', x: 0, y: 0, w: 6, h: 5, minW: 3, minH: 3 },
    { i: 'item-2', x: 6, y: 0, w: 6, h: 5, minW: 3, minH: 3 },
    { i: 'item-3', x: 0, y: 5, w: 4, h: 5, minW: 2, minH: 3 },
    { i: 'item-4', x: 4, y: 5, w: 4, h: 5, minW: 2, minH: 3 },
    { i: 'item-5', x: 8, y: 5, w: 4, h: 5, minW: 2, minH: 3 }
  ],
  grid: [
    { i: 'item-1', x: 0, y: 0, w: 4, h: 5, minW: 2, minH: 3 },
    { i: 'item-2', x: 4, y: 0, w: 4, h: 5, minW: 2, minH: 3 },
    { i: 'item-3', x: 8, y: 0, w: 4, h: 5, minW: 2, minH: 3 },
    { i: 'item-4', x: 0, y: 5, w: 4, h: 5, minW: 2, minH: 3 },
    { i: 'item-5', x: 4, y: 5, w: 4, h: 5, minW: 2, minH: 3 },
    { i: 'item-6', x: 8, y: 5, w: 4, h: 5, minW: 2, minH: 3 }
  ],
  custom: [] as Layout[] // Will be populated dynamically when user resizes
};

export function WorkspaceGrid({ onLayoutChange, onItemActivate, onModuleDrop }: WorkspaceGridProps) {
  const { resolvedTheme } = useTheme();
  const { user, loading: authLoading, session } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  // Derive dark mode from resolved theme
  const isDarkMode = resolvedTheme === 'dark';
  
  // Enhanced debug logging
  useEffect(() => {
    console.log('🔍 WorkspaceGrid Auth Debug:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      hasSession: !!session,
      sessionUser: session?.user?.id,
      authLoading: authLoading,
      timestamp: new Date().toISOString()
    });
  }, [user, session, authLoading]);
  
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({
    lg: LAYOUT_TEMPLATES.dashboard,
    md: LAYOUT_TEMPLATES.dashboard,
    sm: LAYOUT_TEMPLATES.stacked,
    xs: LAYOUT_TEMPLATES.single,
    xxs: LAYOUT_TEMPLATES.single
  });

  const [items, setItems] = useState<WorkspaceItem[]>([
    { id: 'item-1', title: 'Email Module', type: 'empty', status: 'idle' },
    { id: 'item-2', title: 'CRM Module', type: 'empty', status: 'idle' },
    { id: 'item-3', title: 'Calendar', type: 'empty', status: 'idle' },
    { id: 'item-4', title: 'Analytics', type: 'empty', status: 'idle' },
    { id: 'item-5', title: 'Tasks', type: 'empty', status: 'idle' }
  ]);

  const [activeLayout, setActiveLayout] = useState<string>('dashboard');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  
  // Track when we're applying a preset to avoid triggering custom layout
  const isApplyingPreset = useRef(false);

  // Wait for client-side mount to detect theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Theme-aware colors - matching sidebar aesthetic
  // Check system preference as fallback instead of defaulting to dark
  const isDark = mounted 
    ? (resolvedTheme === 'dark') 
    : (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  const colors = {
    text: {
      primary: isDark ? '#f3f4f6' : '#1f2937', // gray-100 : gray-800
      secondary: isDark ? '#d1d5db' : '#374151', // gray-300 : gray-700
      muted: isDark ? '#9ca3af' : '#6b7280', // gray-400 : gray-500
    },
    border: {
      default: 'transparent', // No visible border for clean look
      hover: isDark 
        ? 'rgba(55, 65, 81, 0.2)' // Subtle on hover/drag
        : 'rgba(156, 163, 175, 0.2)', // Subtle on hover/drag
      active: isDark
        ? 'rgba(59, 130, 246, 0.3)' // Blue for active/selected
        : 'rgba(59, 130, 246, 0.2)', // Blue for active/selected
    },
    background: {
      card: isDark 
        ? 'rgba(0, 0, 0, 0.1)' // black/10 - same as sidebar
        : 'rgba(255, 255, 255, 0.1)', // white/10 - same as sidebar
      button: isDark 
        ? 'rgba(0, 0, 0, 0.1)' // black/10 - same as sidebar
        : 'rgba(255, 255, 255, 0.1)', // white/10 - same as sidebar
      buttonHover: isDark 
        ? 'rgba(0, 0, 0, 0.1)' // same as base - no change on hover
        : 'rgba(255, 255, 255, 0.1)', // same as base - no change on hover
      active: isDark
        ? 'rgba(0, 0, 0, 0.1)' // same as sidebar
        : 'rgba(255, 255, 255, 0.1)', // same as sidebar
      activeButton: isDark
        ? 'rgba(0, 0, 0, 0.1)' // same as sidebar
        : 'rgba(255, 255, 255, 0.1)', // same as sidebar
    },
    shadow: {
      button: 'none', // no shadow for clean look
      activeButton: 'none', // no shadow even when active
      card: 'none', // no shadow on cards
    }
  };

  // Subscribe to workspace events from the service layer
  useEffect(() => {
    // Handle layout changes from the service
    const handleLayoutChange = (data: any) => {
      if (data.layouts || (data.layout && data.layouts)) {
        // Set flag to prevent the grid's onLayoutChange from switching to custom
        isApplyingPreset.current = true;
        
        // Handle both old format (layout + layouts) and new format (just layouts)
        const sourceLayouts = data.layouts || [];
        
        // Translate module IDs from service to item IDs for grid
        const translatedLayouts = sourceLayouts.map((layout: any) => ({
          ...layout,
          i: layout.i.replace('module-', 'item-')
        }));
        
        // Check if this is a custom preset activation
        const layoutName = data.preset === 'custom' || data.layout === 'custom' ? 'custom' : data.layout;
        
        // Update the custom template if it's a custom layout
        if (layoutName === 'custom') {
          LAYOUT_TEMPLATES.custom = translatedLayouts;
        }
        
        // Apply translated layouts to all breakpoints
        setLayouts({
          lg: translatedLayouts,
          md: translatedLayouts,
          sm: translatedLayouts.length > 2 ? LAYOUT_TEMPLATES.stacked : translatedLayouts,
          xs: LAYOUT_TEMPLATES.single,
          xxs: LAYOUT_TEMPLATES.single
        });
        setActiveLayout(layoutName);
        
        // Reset flag after a short delay to allow the grid to process the change
        setTimeout(() => {
          isApplyingPreset.current = false;
        }, 100);
        
        // Adjust items to match layout
        const moduleCount = data.modules?.length || sourceLayouts.length;
        setItems(prev => {
          const newItems = [...prev];
          for (let i = prev.length; i < moduleCount; i++) {
            newItems.push({
              id: `item-${i + 1}`,
              title: `Module ${i + 1}`,
              type: 'empty',
              status: 'idle'
            });
          }
          return newItems.slice(0, moduleCount);
        });
      }
    };

    // Handle module activation from the service
    const handleModuleActivation = (data: any) => {
      if (data.moduleId && data.type) {
        // Map module IDs to item IDs
        const itemId = data.moduleId.replace('module-', 'item-');
        activateItem(itemId, data.type);
      }
    };

    // Subscribe to events using migration helper to listen to both old and new event names
    const unsubscribeLayout = eventMigrationHelper.onBoth(
      'workspace-layout-changed',
      'workspace:layout:changed', 
      handleLayoutChange
    );
    const unsubscribeModule = eventMigrationHelper.onBoth(
      'workspace-module-activated',
      'workspace:module:activated',
      handleModuleActivation
    );

    // Initialize with current state from service
    const currentLayout = foundationServices.workspace.getCurrentLayout();
    if (currentLayout.layouts.length > 0) {
      // Use handleLayoutChange which includes ID translation
      handleLayoutChange({
        layout: currentLayout.name,
        layouts: currentLayout.layouts,
        modules: currentLayout.modules
      });
    } else if (currentLayout.name === 'custom') {
      // If custom is set but has no layouts, reset to dashboard
      foundationServices.workspace.applyPreset('dashboard', 'system');
    }

    // Cleanup
    return () => {
      unsubscribeLayout();
      unsubscribeModule();
    };
  }, []);

  const applyLayout = useCallback((templateName: string) => {
    const template = LAYOUT_TEMPLATES[templateName];
    if (!template) return;
    
    // Set flag to prevent handleLayoutChange from switching to custom
    isApplyingPreset.current = true;
    
    // For non-custom presets, notify the service to apply the preset
    if (templateName !== 'custom') {
      // Call the service to apply the preset - this will emit events that update our state
      foundationServices.workspace.applyPreset(templateName, 'manual');
    } else {
      // For custom preset, just apply locally since custom is managed differently
      setLayouts({
        lg: template,
        md: template,
        sm: LAYOUT_TEMPLATES.stacked,
        xs: LAYOUT_TEMPLATES.single,
        xxs: LAYOUT_TEMPLATES.single
      });
      setActiveLayout(templateName);
      
      // Adjust items array to match template length
      const templateLength = template.length;
      setItems(prev => {
        if (prev.length < templateLength) {
          // Add empty items if needed
          const newItems = [...prev];
          for (let i = prev.length; i < templateLength; i++) {
            newItems.push({
              id: `item-${i + 1}`,
              title: `Module ${i + 1}`,
              type: 'empty',
              status: 'idle'
            });
          }
          return newItems;
        }
        return prev.slice(0, templateLength);
      });
      
      // Reset flag after applying custom preset
      setTimeout(() => {
        isApplyingPreset.current = false;
      }, 100);
    }
  }, []);

  const activateItem = useCallback((itemId: string, type: WorkspaceItem['type']) => {
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, type, status: 'loading' as const }
        : item
    ));

    // Simulate loading
    setTimeout(() => {
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, status: 'active' as const }
          : item
      ));
    }, 1000);

    onItemActivate?.(itemId);
  }, [onItemActivate]);

  // Handle dropping a module onto a grid item
  const handleModuleDrop = useCallback((itemId: string, moduleType: string) => {
    const moduleInfo = MODULE_TYPES.find(m => m.type === moduleType);
    if (!moduleInfo) return;

    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            type: moduleType as WorkspaceItem['type'], 
            status: 'loading' as const,
            title: moduleInfo.title
          }
        : item
    ));

    // Simulate loading and then activate
    setTimeout(() => {
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, status: 'active' as const }
          : item
      ));
    }, 1000);

    // Call external handler if provided
    onModuleDrop?.(itemId, moduleType);
    onItemActivate?.(itemId);
  }, [onModuleDrop, onItemActivate]);

  // Handle drag over grid item
  const handleDragOver = useCallback((e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverItem(itemId);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear drag over if we're actually leaving the element
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverItem(null);
    }
  }, []);

  // Handle drop on grid item
  const handleDrop = useCallback((e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    const moduleType = e.dataTransfer.getData('text/plain');
    if (moduleType) {
      handleModuleDrop(itemId, moduleType);
    }
    setDragOverItem(null);
  }, [handleModuleDrop]);

  const handleLayoutChange = useCallback((layout: Layout[], layouts: { [key: string]: Layout[] }) => {
    setLayouts(layouts);
    onLayoutChange?.(layout);
    
    // Only switch to custom if this is a manual resize, not a preset application
    if (!isApplyingPreset.current && activeLayout !== 'custom') {
      setActiveLayout('custom');
      // Update the custom template with the current layout
      LAYOUT_TEMPLATES.custom = layout;
      
      // Notify the service that we've switched to custom layout
      foundationServices.workspace.changeLayout(
        layout.map(item => ({
          ...item,
          i: item.i.replace('item-', 'module-')  // Convert back to module IDs for service
        }))
      );
    }
  }, [onLayoutChange, activeLayout]);

  const renderItem = (item: WorkspaceItem) => {
    const isActive = item.status === 'active';
    const isLoading = item.status === 'loading';
    const isDraggedOver = dragOverItem === item.id;

    return (
      <motion.div
        key={item.id}
        className={`workspace-item ${item.type} ${item.status}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        onDragOver={(e) => handleDragOver(e, item.id)}
        onDragLeave={(e) => handleDragLeave(e, item.id)}
        onDrop={(e) => handleDrop(e, item.id)}
        style={{
          height: '100%',
          width: '100%',
          backgroundColor: isDraggedOver
            ? colors.background.selected
            : isActive 
              ? colors.background.active
              : colors.background.card,
          backdropFilter: 'blur(10px)',
          border: isDraggedOver
            ? `1px solid ${colors.border.active}` // Visible when dragging
            : isActive 
              ? `1px solid ${colors.border.active}` // Visible when active
              : 'none', // No border for normal state
          borderRadius: '24px',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden', // Contain content within grid bounds
          cursor: isDragging ? 'grabbing' : 'default', // Default cursor for content area
          boxShadow: isActive 
            ? colors.shadow.activeButton
            : colors.shadow.card
        }}
      >
        {/* Header */}
        <div className="workspace-item-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '4px',
          borderBottom: `1px solid ${colors.border.default}`,
          paddingBottom: '2px',
          height: '16px',
          cursor: isDragging ? 'grabbing' : 'grab' // Grab cursor only on header
        }}>
          <h3 style={{ 
            fontSize: '10px', 
            fontWeight: 600,
            color: colors.text.primary,
            margin: 0,
            lineHeight: 1,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            opacity: 0.8
          }}>
            {item.title}
          </h3>
          <div style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            backgroundColor: isActive ? '#10b981' : isLoading ? '#f59e0b' : '#6b7280',
            flexShrink: 0
          }} />
        </div>

        {/* Content Area */}
        <div className="workspace-item-content" style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.text.secondary
        }}>
          {isLoading ? (
            <div className="loading-spinner">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: '32px',
                  height: '32px',
                  border: `3px solid ${colors.border.default}`,
                  borderTopColor: '#3b82f6',
                  borderRadius: '50%'
                }}
              />
            </div>
          ) : item.type === 'empty' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '8px', 
                opacity: isDraggedOver ? 0.8 : 0.3,
                transform: isDraggedOver ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.2s ease'
              }}>
                {isDraggedOver ? '📥' : '⬚'}
              </div>
              <p style={{ fontSize: '12px', opacity: 0.7 }}>
                {isDraggedOver ? 'Drop module here' : 'Empty Slot'}
              </p>
              {!isDraggedOver && (
                <p style={{ fontSize: '10px', opacity: 0.5, marginTop: '4px' }}>
                  Voice: &quot;Load {item.title.toLowerCase()}&quot; or drag from sidebar
                </p>
              )}
            </div>
          ) : item.type === 'email' ? (
            // Render Gmail Module
            authLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                <p style={{ fontSize: '12px', opacity: 0.7 }}>
                  Loading authentication...
                </p>
              </div>
            ) : user?.id ? (
              <GmailModule
                userId={user.id}
                onConnectionChange={(connected) => {
                  console.log('Gmail connection status:', connected);
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '0',
                  padding: '0',
                  backgroundColor: 'transparent'
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔒</div>
                <p style={{ fontSize: '12px', opacity: 0.7 }}>
                  Please log in to access Gmail
                </p>
                <p style={{ fontSize: '10px', opacity: 0.5, marginTop: '8px' }}>
                  Go to /login to authenticate
                </p>
              </div>
            )
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                {item.type === 'crm' && '🤝'}
                {item.type === 'calendar' && '📅'}
                {item.type === 'analytics' && '📊'}
              </div>
              <p style={{ fontSize: '14px', fontWeight: 500 }}>{item.type.toUpperCase()}</p>
              <p style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px' }}>
                Module Active
              </p>
            </div>
          )}
        </div>

        {/* Resize Handle Indicator */}
        <div style={{
          position: 'absolute',
          bottom: '4px',
          right: '4px',
          width: '16px',
          height: '16px',
          opacity: 0.3
        }}>
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M14 10v2h-2zm0-4v2h-2zm-4 4v2h-2zm4-8v2h-2zm-8 8v2H4zm4-4v2H8z" />
          </svg>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="workspace-container" style={{ 
      height: '100%', 
      width: '100%',
      backgroundColor: 'transparent',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Layout Control Bar - Fixed at top */}
      <div style={{
        padding: '16px',
        display: 'flex',
        gap: '6px',
        alignItems: 'center',
        flexWrap: 'wrap',
        borderBottom: `1px solid ${colors.border.default}`,
        backgroundColor: 'transparent'
      }}>
        <span style={{ 
          fontSize: '13px', 
          fontWeight: 500,
          color: colors.text.secondary,
          marginRight: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Layout
        </span>
        {Object.keys(LAYOUT_TEMPLATES).map(template => (
          <button
            key={template}
            onClick={() => applyLayout(template)}
            onMouseEnter={(e) => {
              if (activeLayout !== template) {
                e.currentTarget.style.backgroundColor = colors.background.buttonHover;
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeLayout !== template) {
                e.currentTarget.style.backgroundColor = colors.background.button;
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              borderRadius: '9999px', // Full pill shape
              border: `1px solid ${activeLayout === template 
                ? colors.border.active
                : colors.border.default}`,
              backgroundColor: activeLayout === template 
                ? colors.background.activeButton
                : colors.background.button,
              backdropFilter: 'blur(12px)',
              color: activeLayout === template 
                ? '#ffffff' 
                : colors.text.primary,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontWeight: activeLayout === template ? 500 : 400,
              boxShadow: activeLayout === template 
                ? colors.shadow.activeButton
                : colors.shadow.button,
              transform: activeLayout === template ? 'scale(1.02)' : 'scale(1)'
            }}
          >
            {template.charAt(0).toUpperCase() + template.slice(1).replace('-', ' ')}
          </button>
        ))}
        
        {/* Agent Output Display - Minimal typewriter text */}
        <AgentOutputDisplay />
      </div>

      {/* Scrollable Grid Container */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px'
      }}>
        {/* Grid Layout - Full height with dynamic row height */}
        <ResponsiveGridLayout
        className="workspace-grid"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        onDragStart={() => setIsDragging(true)}
        onDragStop={() => setIsDragging(false)}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={80}
        isDraggable={true}
        isResizable={true}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
        style={{ flex: 1 }}
      >
        {items.map(item => (
          <div key={item.id}>
            {renderItem(item)}
          </div>
        ))}
      </ResponsiveGridLayout>
      </div>
    </div>
  );
}