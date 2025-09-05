"use client";

import React from 'react';

/**
 * Dashboard Home Page
 * 
 * Main dashboard landing page that loads when "Dashboard" menu item is selected.
 * This component demonstrates the dashboard layer architecture - it can safely
 * add any functionality without affecting the foundation layer (voice assistant).
 */
export function DashboardHome() {
  return (
    <div className="p-6 h-full overflow-y-auto">
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

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        {/* Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/30 dark:bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Recent Activity
            </h2>
            <div className="space-y-4">
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

          <div className="bg-white/30 dark:bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              System Status
            </h2>
            <div className="space-y-4">
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
  );
}

export default DashboardHome;