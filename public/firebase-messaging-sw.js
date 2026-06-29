// Firebase Messaging Service Worker
// Handles background push notifications when the app tab is not in focus.
// Replace the placeholder config values with your Firebase project credentials
// (NEXT_PUBLIC_FIREBASE_* env vars are NOT available in service workers —
// they must be inlined at deploy time or injected via the SW registration script).

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// These values are replaced at build time via next.config.ts / sw-env injection.
// If they are empty strings the SW will silently skip Firebase initialization.
const FIREBASE_CONFIG = {
  apiKey: self.__FIREBASE_API_KEY__ || '',
  authDomain: self.__FIREBASE_AUTH_DOMAIN__ || '',
  projectId: self.__FIREBASE_PROJECT_ID__ || '',
  messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID__ || '',
  appId: self.__FIREBASE_APP_ID__ || '',
};

if (FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId) {
  firebase.initializeApp(FIREBASE_CONFIG);

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title ?? 'EBooksStore';
    const body = payload.notification?.body ?? '';
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: payload.data,
    });
  });
}
