import React, { useState, useEffect, useCallback } from 'react';
import Button from './Button';
import Modal from './Modal';
import { DownloadIcon, WifiIcon, UpdateIcon, BellIcon } from './icons/Icons';
import { pushNotificationService } from '../utils/pushNotifications';
import { offlineSyncService } from '../utils/offlineSync';

// This interface is needed because the default Event type doesn't include
// properties specific to the BeforeInstallPromptEvent.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface SyncStats {
  pending: number;
  failed: number;
  lastSync?: number;
}

const PWAFeatures: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [syncStats, setSyncStats] = useState<SyncStats>({ pending: 0, failed: 0 });
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
      // Trigger sync when coming back online
      offlineSyncService.forceSync();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
      // Hide offline alert after 5 seconds
      setTimeout(() => setShowOfflineAlert(false), 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Service Worker registration and update detection
  useEffect(() => {
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          setSwRegistration(registration);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });

          // Listen for controlled by new service worker
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
          });

        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
    };

    registerServiceWorker();
  }, []);

  // PWA install prompt handling
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Check notification permissions and sync stats
  useEffect(() => {
    const checkStatus = async () => {
      const notificationStatus = await pushNotificationService.checkNotificationSettings();
      setIsNotificationEnabled(notificationStatus.permission === 'granted');

      const stats = await offlineSyncService.getSyncStats();
      setSyncStats(stats);
    };

    checkStatus();

    // Update sync stats every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [isOnline]);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      console.log(`Install prompt outcome: ${outcome}`);
      setInstallPrompt(null);
    } catch (error) {
      console.error('Error during app installation:', error);
    }
  };

  const handleUpdateClick = () => {
    setShowUpdateModal(true);
  };

  const confirmUpdate = () => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdateModal(false);
  };

  const handleNotificationClick = () => {
    setShowNotificationModal(true);
  };

  const enableNotifications = async () => {
    try {
      await pushNotificationService.subscribe();
      setIsNotificationEnabled(true);
      setShowNotificationModal(false);
      
      // Show a test notification
      await pushNotificationService.showLocalNotification({
        title: 'Notifications Enabled',
        body: 'You will now receive important updates from Construction Manager',
        tag: 'notifications-enabled'
      });
    } catch (error) {
      console.error('Error enabling notifications:', error);
      alert('Failed to enable notifications. Please check your browser settings.');
    }
  };

  const handleSyncClick = async () => {
    if (isOnline) {
      await offlineSyncService.forceSync();
      const stats = await offlineSyncService.getSyncStats();
      setSyncStats(stats);
    }
  };

  const formatLastSync = (timestamp?: number): string => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <>
      {/* Offline Alert */}
      {showOfflineAlert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-down">
          <div className="flex items-center space-x-2">
            <WifiIcon className="w-5 h-5" />
            <span>You're offline. Changes will sync when connection is restored.</span>
          </div>
        </div>
      )}

      {/* PWA Action Buttons */}
      <div className="fixed bottom-24 right-4 z-40 space-y-2 md:bottom-6 md:right-6">
        {/* Install App Button */}
        {installPrompt && (
          <Button 
            onClick={handleInstallClick} 
            className="bg-green-600 hover:bg-green-700 focus:ring-green-500 shadow-lg animate-bounce block"
            aria-label="Install the application to your device"
          >
            <DownloadIcon className="w-5 h-5 mr-2 -ml-1" />
            Install App
          </Button>
        )}

        {/* Update Available Button */}
        {updateAvailable && (
          <Button 
            onClick={handleUpdateClick} 
            className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-lg animate-pulse block"
            aria-label="Update available"
          >
            <UpdateIcon className="w-5 h-5 mr-2 -ml-1" />
            Update Available
          </Button>
        )}

        {/* Enable Notifications Button */}
        {!isNotificationEnabled && pushNotificationService.isSupported && (
          <Button 
            onClick={handleNotificationClick} 
            className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 shadow-lg block"
            aria-label="Enable notifications"
          >
            <BellIcon className="w-5 h-5 mr-2 -ml-1" />
            Enable Notifications
          </Button>
        )}
      </div>

      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white text-xs py-2 px-4 flex items-center justify-between md:hidden">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-1 ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          
          {(syncStats.pending > 0 || syncStats.failed > 0) && (
            <button
              onClick={handleSyncClick}
              className="text-yellow-400 hover:text-yellow-300"
              disabled={!isOnline}
            >
              {syncStats.pending > 0 && `${syncStats.pending} pending`}
              {syncStats.pending > 0 && syncStats.failed > 0 && ', '}
              {syncStats.failed > 0 && `${syncStats.failed} failed`}
            </button>
          )}
        </div>
        
        <div className="text-gray-400">
          Last sync: {formatLastSync(syncStats.lastSync)}
        </div>
      </div>

      {/* Update Modal */}
      <Modal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)}>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            App Update Available
          </h3>
          <p className="text-gray-600 mb-6">
            A new version of Construction Manager is available. Update now to get the latest features and improvements.
          </p>
          <div className="flex space-x-3">
            <Button
              onClick={confirmUpdate}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Update Now
            </Button>
            <Button
              onClick={() => setShowUpdateModal(false)}
              variant="secondary"
            >
              Later
            </Button>
          </div>
        </div>
      </Modal>

      {/* Notification Permission Modal */}
      <Modal isOpen={showNotificationModal} onClose={() => setShowNotificationModal(false)}>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Enable Notifications
          </h3>
          <p className="text-gray-600 mb-6">
            Stay updated with important project information, task deadlines, and team activities. 
            You can manage notification preferences in your browser settings.
          </p>
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>Task deadline reminders</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Project updates and milestones</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
              <span>Team member check-ins</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span>Low inventory alerts</span>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={enableNotifications}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Enable Notifications
            </Button>
            <Button
              onClick={() => setShowNotificationModal(false)}
              variant="secondary"
            >
              Not Now
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PWAFeatures;
