"use client";

import React from 'react';
import { useWidgetControl } from '@/app/foundation/components/WidgetStateBridge';

/**
 * Dashboard Home Page
 * 
 * Main dashboard landing page that loads when "Dashboard" menu item is selected.
 * This component demonstrates the dashboard layer architecture - it can safely
 * add any functionality without affecting the foundation layer (voice assistant).
 */
export function DashboardHome() {
  // Get widget states for controlling visibility and expansion
  const metricsWidget = useWidgetControl('metrics-widget');
  const activitiesWidget = useWidgetControl('activities-widget');
  const statusWidget = useWidgetControl('status-widget');
  // Performance chart widget could be added here if needed
  // const performanceWidget = useWidgetControl('performance-chart');

  return (
    <div className="p-6 h-full overflow-y-auto" data-widgets-container>
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome to your Bayaan AI Dashboard. Monitor system status, manage settings, and track performance.
          </p>
        </div>

        {/* Quick Stats Grid - Metrics Widget */}
        <div 
          data-widget-id="metrics-widget"
          className={`mb-8 transition-all duration-500 ease-in-out transform-gpu
            ${metricsWidget.isVisible 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 -translate-y-4 scale-95 pointer-events-none absolute'}`}
          style={{ 
            maxHeight: metricsWidget.isVisible ? '1000px' : '0px',
            overflow: 'hidden'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Key Metrics
            </h2>
            <button
              data-widget-toggle
              onClick={() => metricsWidget.toggleExpansion()}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-expanded={metricsWidget.isExpanded}
            >
              {metricsWidget.isExpanded ? '−' : '+'}
            </button>
          </div>
          <div 
            data-widget-content
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-300 ease-in-out
              ${metricsWidget.isExpanded 
                ? 'opacity-100 max-h-96' 
                : 'opacity-0 max-h-0 overflow-hidden'}`}
          >
          <div className="bg-white/30 dark:bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sessions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">1,234</p>
              </div>
              <div className="text-green-500 text-xl">📊</div>
            </div>
          </div>

          <div className="bg-white/30 dark:bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Voice Interactions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">5,678</p>
              </div>
              <div className="text-blue-500 text-xl">🎤</div>
            </div>
          </div>

          <div className="bg-white/30 dark:bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Health</p>
                <p className="text-2xl font-bold text-green-500">Excellent</p>
              </div>
              <div className="text-green-500 text-xl">✅</div>
            </div>
          </div>

          <div className="bg-white/30 dark:bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Uptime</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">99.9%</p>
              </div>
              <div className="text-purple-500 text-xl">🚀</div>
            </div>
          </div>
          </div>
        </div>

        {/* Activity Feed and System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Activities Widget */}
          <div 
            data-widget-id="activities-widget"
            className={`transition-all duration-500 ease-in-out transform-gpu
              ${activitiesWidget.isVisible 
                ? 'opacity-100 translate-x-0 scale-100' 
                : 'opacity-0 -translate-x-4 scale-95 pointer-events-none'}`}
          >
            <div className="bg-white/30 dark:bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Recent Activity
                </h2>
                <button
                  data-widget-toggle
                  onClick={() => activitiesWidget.toggleExpansion()}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-expanded={activitiesWidget.isExpanded}
                >
                  {activitiesWidget.isExpanded ? '−' : '+'}
                </button>
              </div>
              <div 
                data-widget-content
                className={`space-y-4 transition-all duration-300 ease-in-out
                  ${activitiesWidget.isExpanded 
                    ? 'opacity-100 max-h-96 overflow-y-auto' 
                    : 'opacity-0 max-h-0 overflow-hidden'}`}
              >
              {[
                { type: 'voice', message: 'Voice session started with Agent Zahra', time: '2 minutes ago' },
                { type: 'system', message: 'Foundation services initialized successfully', time: '5 minutes ago' },
                { type: 'dashboard', message: 'Dashboard components loaded', time: '8 minutes ago' },
                { type: 'performance', message: 'WebGL contexts optimized', time: '12 minutes ago' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'voice' ? 'bg-blue-500' :
                    activity.type === 'system' ? 'bg-green-500' :
                    activity.type === 'dashboard' ? 'bg-purple-500' : 'bg-orange-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{activity.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>

          {/* System Status Widget */}
          <div 
            data-widget-id="status-widget"
            className={`transition-all duration-500 ease-in-out transform-gpu
              ${statusWidget.isVisible 
                ? 'opacity-100 translate-x-0 scale-100' 
                : 'opacity-0 translate-x-4 scale-95 pointer-events-none'}`}
          >
            <div className="bg-white/30 dark:bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  System Status
                </h2>
                <button
                  data-widget-toggle
                  onClick={() => statusWidget.toggleExpansion()}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-expanded={statusWidget.isExpanded}
                >
                  {statusWidget.isExpanded ? '−' : '+'}
                </button>
              </div>
              <div 
                data-widget-content
                className={`space-y-4 transition-all duration-300 ease-in-out
                  ${statusWidget.isExpanded 
                    ? 'opacity-100 max-h-96 overflow-y-auto' 
                    : 'opacity-0 max-h-0 overflow-hidden'}`}
              >
              {[
                { service: 'Foundation Services', status: 'active', health: '100%' },
                { service: 'WebRTC Session', status: 'ready', health: '98%' },
                { service: 'WebGL Contexts', status: 'optimized', health: '95%' },
                { service: 'Event Bus', status: 'connected', health: '100%' }
              ].map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm text-gray-900 dark:text-gray-100">{service.service}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{service.health}</p>
                    <p className="text-xs text-green-500">{service.status}</p>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;