'use client';

import { useEffect } from 'react';
import { useSyncOnResume } from '@/hooks/useOfflineReader';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/components/ui/toast';

export function ServiceWorkerRegistrar() {
  useSyncOnResume();
  usePushNotifications();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              toast({
                title: 'Nova versão disponível',
                description: 'Recarregue a página para actualizar a aplicação.',
              });
            }
          });
        });
      })
      .catch((err) => console.warn('[SW] Registration failed:', err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
