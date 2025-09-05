"use client";

import React from 'react';
import { DashboardHome } from './pages/DashboardHome';

/**
 * Dashboard Content Renderer
 * 
 * Central component that renders the appropriate dashboard content based on 
 * the selected menu item. This component handles:
 * - Dynamic component loading based on selection
 * - Loading states and transitions
 * - Error boundaries for individual dashboard components
 */

interface DashboardContentRendererProps {
  selectedItem: string | null;
  onBackToVoice?: () => void;
}

export function DashboardContentRenderer({ 
  selectedItem, 
  onBackToVoice 
}: DashboardContentRendererProps) {
  // If no item selected, return null (voice assistant mode)
  if (!selectedItem) {
    return null;
  }

  const renderContent = () => {
    switch (selectedItem) {
      case 'dashboard':
        return <DashboardHome />;
      
      case 'profile':
        return <ProfilePage />;
      
      case 'settings':
        return <SettingsPage />;
      
      default:
        return (
          <div className="p-6 h-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Page Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The requested dashboard page could not be found.
              </p>
              <button
                onClick={onBackToVoice}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Back to Voice Assistant
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {renderContent()}
    </div>
  );
}

// Placeholder components for Profile and Settings pages
const ProfilePage = () => {
  return (
    <div className="p-6 h-full">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Profile Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/30 dark:bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Account Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-black/50"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-black/50"
                  placeholder="Enter your email"
                />
              </div>
            </div>
          </div>

          <div className="bg-white/30 dark:bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Voice Preferences
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Preferred Language
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-black/50">
                  <option>English</option>
                  <option>Arabic</option>
                  <option>French</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Voice Response Speed
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-black/50">
                  <option>Normal</option>
                  <option>Fast</option>
                  <option>Slow</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  return (
    <div className="p-6 h-full">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            System Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure your Bayaan AI system preferences and advanced settings.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white/30 dark:bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Audio Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-gray-700 dark:text-gray-300">Auto-connect on load</span>
                </label>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-gray-700 dark:text-gray-300">Audio playback enabled</span>
                </label>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-gray-700 dark:text-gray-300">Push-to-talk mode</span>
                </label>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-gray-700 dark:text-gray-300">Show dock navigation</span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white/30 dark:bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Visual Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Theme
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-black/50">
                  <option>System</option>
                  <option>Light</option>
                  <option>Dark</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Galaxy Animation
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-black/50">
                  <option>Enhanced</option>
                  <option>Classic</option>
                  <option>Minimal</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white/30 dark:bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Advanced Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  VAD Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-black/50">
                  <option>Semantic VAD</option>
                  <option>Server VAD</option>
                  <option>Disabled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Audio Codec
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-black/50">
                  <option>Opus (48kHz)</option>
                  <option>PCMU (8kHz)</option>
                  <option>PCMA (8kHz)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContentRenderer;