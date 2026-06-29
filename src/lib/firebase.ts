import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getMessaging, type Messaging } from "firebase/messaging";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  config.apiKey && config.projectId && config.messagingSenderId && config.appId
);

let app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null;
  if (!app) {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(config);
  }
  return app;
}

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === "undefined") return null;
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  try {
    return getMessaging(firebaseApp);
  } catch {
    return null;
  }
}
