"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { 
  isPWAInstallable, 
  showPWAInstallPrompt, 
  isIOS, 
  isSafari, 
  isStandalone 
} from '@/app/lib/mobileUtils';

interface PWAInstallPromptProps {
  onDismiss?: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onDismiss }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isSafariDevice, setIsSafariDevice] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Check device and browser capabilities
    setIsIOSDevice(isIOS());
    setIsSafariDevice(isSafari());
    setIsInstallable(isPWAInstallable());

    // Don't show if already installed as standalone app
    if (isStandalone()) {
      return;
    }

    // Check if user has previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Show prompt again after 7 days or if never dismissed
    if (!dismissed || daysSinceDismissed > 7) {
      // Delay showing the prompt to not interfere with initial load
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Listen for the beforeinstallprompt event (Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt && !isIOSDevice) {
      // Chrome/Edge install
      const accepted = await showPWAInstallPrompt(deferredPrompt);
      if (accepted) {
        setDeferredPrompt(null);
        handleDismiss();
      }
    } else if (isIOSDevice && isSafariDevice) {
      // iOS Safari - show manual install instructions
      alert(`To install Bayaan AI on your iPhone:
      
1. Tap the Share button (□↗) at the bottom of Safari
2. Scroll down and tap "Add to Home Screen"
3. Tap "Add" in the top right corner

The app will then appear on your home screen!`);
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setShowPrompt(false);
    onDismiss?.();
  };

  // Don't show prompt if conditions aren't met
  if (!showPrompt || isStandalone() || (!isInstallable && !isIOSDevice)) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-50 pointer-events-auto"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 mx-auto max-w-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 text-white rounded-lg">
                <Smartphone size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  Install Bayaan AI
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Add to home screen for quick access
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          <div className="flex gap-2">
            <motion.button
              onClick={handleInstall}
              whileTap={{ scale: 0.95 }}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Download size={16} />
              {isIOSDevice ? 'Show Instructions' : 'Install'}
            </motion.button>
            <motion.button
              onClick={handleDismiss}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              Maybe Later
            </motion.button>
          </div>

          {isIOSDevice && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Look for the Share button <span className="font-mono">□↗</span> in Safari
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;