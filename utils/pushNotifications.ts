export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  timestamp?: number;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationService {
  private vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY'; // Replace with your VAPID public key
  private subscription: PushSubscription | null = null;
  private readonly notificationSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    if (!this.notificationSupported) {
      console.warn('Push notifications are not supported in this browser');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        this.subscription = existingSubscription;
        console.log('Existing push subscription found');
      }
    } catch (error) {
      console.error('Error initializing push notification service:', error);
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.notificationSupported) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!this.notificationSupported) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await this.requestPermission();
    
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource
      });

      this.subscription = subscription;
      
      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      const success = await this.subscription.unsubscribe();
      
      if (success) {
        this.subscription = null;
        // Notify server about unsubscription
        await this.removeSubscriptionFromServer();
      }
      
      return success;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
      }
    };

    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscriptionData,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('Push subscription sent to server successfully');
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      throw error;
    }
  }

  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Error removing subscription from server:', response.statusText);
      }
    } catch (error) {
      console.error('Error removing subscription from server:', error);
    }
  }

  // Local notifications (for immediate feedback)
  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    if (!this.notificationSupported || Notification.permission !== 'granted') {
      console.warn('Cannot show local notification: permission not granted');
      return;
    }

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/icon-72x72.png',
      tag: payload.tag || 'construction-manager',
      data: payload.data,
      requireInteraction: true
    };

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(payload.title, options);
    } catch (error) {
      console.error('Error showing local notification:', error);
      // Fallback to browser notification
      new Notification(payload.title, options);
    }
  }

  // Predefined notification templates
  async notifyTaskDeadline(taskTitle: string, dueDate: Date): Promise<void> {
    const timeDiff = dueDate.getTime() - Date.now();
    const hoursLeft = Math.ceil(timeDiff / (1000 * 60 * 60));
    
    let body = '';
    if (hoursLeft <= 0) {
      body = `Task "${taskTitle}" is overdue!`;
    } else if (hoursLeft <= 24) {
      body = `Task "${taskTitle}" is due in ${hoursLeft} hours`;
    } else {
      body = `Task "${taskTitle}" is due soon`;
    }

    await this.showLocalNotification({
      title: 'Task Deadline Reminder',
      body,
      tag: 'task-deadline',
      data: { type: 'task_deadline', taskTitle },
      actions: [
        { action: 'view_task', title: 'View Task', icon: '/icon-view.png' },
        { action: 'dismiss', title: 'Dismiss', icon: '/icon-dismiss.png' }
      ]
    });
  }

  async notifyProjectUpdate(projectName: string, updateType: string): Promise<void> {
    await this.showLocalNotification({
      title: 'Project Update',
      body: `${projectName}: ${updateType}`,
      tag: 'project-update',
      data: { type: 'project_update', projectName, updateType },
      actions: [
        { action: 'view_project', title: 'View Project', icon: '/icon-view.png' },
        { action: 'dismiss', title: 'Dismiss', icon: '/icon-dismiss.png' }
      ]
    });
  }

  async notifyTeamMemberClockIn(memberName: string, projectName: string): Promise<void> {
    await this.showLocalNotification({
      title: 'Team Member Clock In',
      body: `${memberName} clocked in to ${projectName}`,
      tag: 'team-clock-in',
      data: { type: 'team_clock_in', memberName, projectName },
      actions: [
        { action: 'view_team', title: 'View Team', icon: '/icon-view.png' },
        { action: 'dismiss', title: 'Dismiss', icon: '/icon-dismiss.png' }
      ]
    });
  }

  async notifyLowInventory(itemName: string, currentStock: number): Promise<void> {
    await this.showLocalNotification({
      title: 'Low Inventory Alert',
      body: `${itemName} is running low (${currentStock} remaining)`,
      tag: 'low-inventory',
      data: { type: 'low_inventory', itemName, currentStock },
      actions: [
        { action: 'view_inventory', title: 'View Inventory', icon: '/icon-view.png' },
        { action: 'order_more', title: 'Order More', icon: '/icon-add.png' }
      ]
    });
  }

  // Utility functions
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Getters
  get isSubscribed(): boolean {
    return this.subscription !== null;
  }

  get hasPermission(): boolean {
    return Notification.permission === 'granted';
  }

  get isSupported(): boolean {
    return this.notificationSupported;
  }

  getSubscription(): PushSubscription | null {
    return this.subscription;
  }

  // Check if notifications are enabled in browser settings
  async checkNotificationSettings(): Promise<{
    permission: NotificationPermission;
    isSubscribed: boolean;
    isSupported: boolean;
  }> {
    return {
      permission: Notification.permission,
      isSubscribed: this.isSubscribed,
      isSupported: this.notificationSupported
    };
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();