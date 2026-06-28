'use client';

import { useEffect } from 'react';
import { useSyncOnResume } from '@/hooks/useOfflineReader';

export function ServiceWorkerRegistrar() {
  useSyncOnResume();

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available — could show an "Update available" toast here
                console.log('[SW] New version available');
              }
            });
          }
        });
      })
      .catch((err) => console.warn('[SW] Registration failed:', err));
  }, []);

  return null;
}
