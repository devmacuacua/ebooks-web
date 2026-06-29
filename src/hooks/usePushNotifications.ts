"use client";

import { useEffect, useRef } from "react";
import { getToken } from "firebase/messaging";
import { getFirebaseMessaging, isFirebaseConfigured } from "@/lib/firebase";
import api from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export function usePushNotifications() {
  const registered = useRef(false);

  useEffect(() => {
    if (registered.current) return;
    if (!isFirebaseConfigured || !VAPID_KEY) return;
    if (!isAuthenticated()) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const messaging = getFirebaseMessaging();
        if (!messaging) return;

        const swReg = await navigator.serviceWorker.ready;
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swReg,
        });

        if (!token) return;

        await api.post("/api/notifications/push-devices", {
          token,
          platform: "web",
        });

        registered.current = true;
      } catch {
        // Silently degrade — push notifications are non-critical
      }
    };

    register();
  }, []);
}
