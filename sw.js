// sw.js

// This event is triggered when the service worker is first installed.
self.addEventListener('install', (event) => {
  console.log('Service worker: install event in progress.');
  // Skip waiting to activate immediately.
  self.skipWaiting();
});

// This event is triggered when the service worker is activated.
self.addEventListener('activate', (event) => {
  console.log('Service worker: activate event in progress.');
  // Take control of all clients (open tabs) that are in scope.
  event.waitUntil(self.clients.claim());
});

// A minimal fetch handler is required for the app to be considered installable.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

// --- PUSH NOTIFICATION LOGIC ---

// Listener for incoming push notifications from a server
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');

  let data = {
    title: 'ConstructTrack Pro',
    body: 'You have a new update!',
    icon: '/scc-logo-192.png',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('Push event data is not valid JSON:', e);
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/scc-logo-192.png',
    badge: '/scc-logo-72.png', // Small icon for notification bar
    vibrate: [200, 100, 200],
    tag: 'construct-track-pro-notification',
    renotify: true,
    data: {
      url: self.registration.scope, // URL to open on click
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Listener for when a user clicks on a notification
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // If a window for the app is already open, focus it.
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Listener for test notifications sent from the client-side app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_TEST_NOTIFICATION') {
        const { title, body } = event.data.payload;
        event.waitUntil(
            self.registration.showNotification(title, {
                body: body,
                icon: '/scc-logo-192.png',
                badge: '/scc-logo-72.png',
            })
        );
    }
});
