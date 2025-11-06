import React, { useState, useEffect } from 'react';
import { useData } from '../hooks/useDataContext';
import Card from './Card';
import Button from './Button';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon } from './icons/Icons';

// VAPID public key for push notification subscription.
// In a real application, this would come from your server/environment variables.
const VAPID_PUBLIC_KEY = 'BPlY8h_gZ-g9wU55z2P-w_a-vP0Xy7jS3FwZ4o_h5L8_z5C3e_k4N_r6O9Z8f_gJ_wX1r_i5C6f_kY0';

// Helper function to convert the VAPID key to a Uint8Array
const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};


const Profile: React.FC = () => {
    const { currentUser, updateUser } = useData();
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const navigate = useNavigate();

    // --- Notification State ---
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [isSupported, setIsSupported] = useState(false);


    useEffect(() => {
        if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);

            // Set initial state
            setPermissionStatus(Notification.permission);

            // Check for existing subscription
            navigator.serviceWorker.ready.then(reg => {
                reg.pushManager.getSubscription().then(sub => {
                    if (sub) {
                        setSubscription(sub);
                    }
                });
            });

            // Listen for permission changes more reliably
            const listenForPermissionChanges = async () => {
                try {
                    // FIX: Cast permission descriptor to 'any' to include 'userVisibleOnly',
                    // which is required for 'push' permission queries but might be missing from some TypeScript lib definitions.
                    const permissionResult = await navigator.permissions.query({ name: 'push', userVisibleOnly: true } as any);
                    permissionResult.onchange = () => {
                        setPermissionStatus(permissionResult.state as NotificationPermission);
                    };
                } catch (e) {
                    console.warn("Permissions API not supported, falling back to visibilitychange.", e);
                    // Fallback for browsers that don't support Permissions API for push
                    const checkPermission = () => setPermissionStatus(Notification.permission);
                    document.addEventListener('visibilitychange', checkPermission);
                    return () => document.removeEventListener('visibilitychange', checkPermission);
                }
            };

            listenForPermissionChanges();
        } else {
            setIsSupported(false);
        }
    }, []);

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name);
            setRole(currentUser.role);
            setHourlyRate(currentUser.hourlyRate.toString());
        }
    }, [currentUser]);


    const handleEnableNotifications = async () => {
        setIsSubscribing(true);
        setSubscription(null);
        try {
            const status = await Notification.requestPermission();
            setPermissionStatus(status);

            if (status !== 'granted') {
                console.log(`Notification permission status: ${status}`);
                if (status === 'denied') {
                    alert("You've blocked notifications. To enable them, please go to your browser's site settings for this app.");
                }
                setIsSubscribing(false);
                return;
            }

            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            console.log('Push Subscription Successful:', JSON.stringify(sub));
            setSubscription(sub);

        } catch (error) {
            console.error('Error subscribing to push notifications:', error);
            let message = 'Failed to subscribe to notifications. This can happen in private/incognito mode, or if your browser has an issue with its push service.';
            if (error instanceof DOMException) {
                if (error.name === 'NotAllowedError') {
                    message = 'Subscription failed. It seems permission was denied during the process.';
                } else if (error.name === 'NotSupportedError') {
                    message = 'Push notifications are not supported by this browser, or you might be in private/incognito mode.';
                } else if (error.name === 'InvalidStateError') {
                    message = 'Subscription failed because the service worker is not active. Please try reloading the page.';
                }
            }
            alert(message + ' Please check the console for technical details.');
            setSubscription(null);
        } finally {
            setIsSubscribing(false);
        }
    };

    const handleSendTestNotification = () => {
        if (!navigator.serviceWorker.controller) {
            alert('Service worker not active. Please reload the page.');
            return;
        }
        navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_TEST_NOTIFICATION',
            payload: {
                title: 'Test Notification',
                body: `Hello, ${currentUser?.name}! This is a test notification.`,
            },
        });
    };

    if (!currentUser) {
        return (
            <div className="text-center py-10">
                <h1 className="text-2xl font-bold text-gray-800">No User Selected</h1>
                <p className="mt-2 text-gray-600">Please select a user to view their profile.</p>
            </div>
        );
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !role || !hourlyRate) {
            alert('Please fill in all fields.');
            return;
        }
        updateUser(currentUser.id, {
            name,
            role,
            hourlyRate: Number(hourlyRate),
        });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000); // Hide message after 3 seconds
    };
    
    const isFormChanged = currentUser.name !== name || currentUser.role !== role || currentUser.hourlyRate !== Number(hourlyRate);

    const renderNotificationContent = () => {
        if (!isSupported) {
            return <p className="text-sm text-gray-500">Push notifications are not supported by your browser.</p>
        }

        if (permissionStatus === 'granted') {
            if (subscription) {
                 return (
                    <div>
                        <p className="text-sm text-green-700 mb-4">Push notifications are enabled on this device.</p>
                        <Button onClick={handleSendTestNotification}>Send Test Notification</Button>
                    </div>
                );
            }
            return (
                <div>
                    <p className="text-sm text-amber-700 mb-4">Permission is granted, but the subscription failed or is missing. This can happen in private/incognito mode.</p>
                    <Button onClick={handleEnableNotifications} disabled={isSubscribing}>
                        {isSubscribing ? 'Retrying...' : 'Retry Subscription'}
                    </Button>
                </div>
            );
        }
        
        if (permissionStatus === 'denied') {
            return (
                <div>
                    <p className="text-sm text-red-700 mb-2">Push notifications have been blocked.</p>
                    <p className="text-xs text-gray-500">You need to go into your browser's site settings to re-enable them for this app.</p>
                </div>
            );
        }
        
        return (
             <div>
                <p className="text-sm text-gray-600 mb-4">Enable push notifications to get important project updates.</p>
                <Button onClick={handleEnableNotifications} disabled={isSubscribing}>
                    {isSubscribing ? 'Waiting for permission...' : 'Enable Notifications'}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4">
                <ChevronLeftIcon className="w-5 h-5 mr-2" />
                Back
            </button>
            
            <div className="flex items-center space-x-4">
                 <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-20 h-20 rounded-full" />
                 <div>
                    <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
                    <p className="text-gray-500">Update your personal details here.</p>
                 </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                        <input
                            type="text"
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">Hourly Rate ($)</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                                type="number"
                                id="hourlyRate"
                                value={hourlyRate}
                                onChange={(e) => setHourlyRate(e.target.value)}
                                className="block w-full rounded-md border-slate-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                required
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                <span className="text-gray-500 sm:text-sm">USD</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end items-center space-x-4 pt-4">
                         {isSaved && (
                            <p className="text-sm font-medium text-green-600 transition-opacity duration-300">
                                Profile saved!
                            </p>
                        )}
                        <Button type="submit" disabled={!isFormChanged}>
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Card>

            <Card>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Notification Settings</h2>
                {renderNotificationContent()}
            </Card>
        </div>
    );
};

export default Profile;