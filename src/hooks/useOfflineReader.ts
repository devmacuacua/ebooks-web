'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getOfflineBook,
  getOfflineBooks,
  saveOfflineBook,
  deleteOfflineBook,
  saveCachedPage,
  savePendingProgress,
  deletePendingProgress,
  getAllPendingProgress,
} from '@/lib/offline-db';
import type { OfflineBook } from '@/lib/offline-db';
import api from '@/lib/api';
import { getDeviceId } from '@/lib/auth';

// ── Online/offline status ──────────────────────────────────────────────────────

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return online;
}

// ── Sync pending progress when coming back online ──────────────────────────────

export function useSyncOnResume() {
  const online = useOnlineStatus();
  const wasSyncing = useRef(false);

  useEffect(() => {
    if (!online || wasSyncing.current) return;

    const sync = async () => {
      wasSyncing.current = true;
      try {
        // Try native Background Sync first
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          try {
            const reg = await navigator.serviceWorker.ready;
            await (reg as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-reading-progress');
            return;
          } catch {
            // Fall through to manual sync
          }
        }

        // Manual fallback: flush pending progress
        const pending = await getAllPendingProgress();
        await Promise.all(
          pending.map(async (p) => {
            try {
              await api.post('/api/reading/progress', {
                bookId: p.bookId,
                currentPage: p.currentPage,
                totalPages: p.totalPages,
                deviceId: p.deviceId,
              });
              await deletePendingProgress(p.bookId, p.deviceId);
            } catch {
              // Will retry next time online
            }
          })
        );
      } finally {
        wasSyncing.current = false;
      }
    };

    sync();
  }, [online]);
}

// ── Download a book for offline use ───────────────────────────────────────────

export type DownloadStatus = 'idle' | 'downloading' | 'ready' | 'error';

export interface OfflineBookState {
  status: DownloadStatus;
  progress: number;       // 0–100
  downloadedPages: number;
  totalPages: number;
}

export function useOfflineBook(bookId: string) {
  const [state, setState] = useState<OfflineBookState>({
    status: 'idle',
    progress: 0,
    downloadedPages: 0,
    totalPages: 0,
  });
  const abortRef = useRef(false);

  // Load persisted status on mount
  useEffect(() => {
    getOfflineBook(bookId).then((book) => {
      if (!book) return;
      setState({
        status: book.status,
        progress: book.totalPages > 0 ? (book.downloadedPages / book.totalPages) * 100 : 0,
        downloadedPages: book.downloadedPages,
        totalPages: book.totalPages,
      });
    });
  }, [bookId]);

  const download = useCallback(
    async (bookTitle: string, coverImageUrl?: string) => {
      abortRef.current = false;
      setState({ status: 'downloading', progress: 0, downloadedPages: 0, totalPages: 0 });

      try {
        const deviceId = getDeviceId();

        // Start DRM session to get token + page count
        const { data: tokenData } = await api.post<{ token: string; totalPages: number }>(
          '/api/reading/reader/token',
          { bookId, deviceId }
        );

        const { totalPages } = tokenData;
        let token = tokenData.token;

        await saveOfflineBook({
          bookId,
          bookTitle,
          totalPages,
          downloadedPages: 0,
          status: 'downloading',
          cachedAt: Date.now(),
          coverImageUrl,
        });

        // Download pages sequentially — DRM token rotates per page
        for (let page = 1; page <= totalPages; page++) {
          if (abortRef.current) {
            await saveOfflineBook({
              bookId,
              bookTitle,
              totalPages,
              downloadedPages: page - 1,
              status: 'error',
              cachedAt: Date.now(),
              coverImageUrl,
            });
            setState((s) => ({ ...s, status: 'error' }));
            return;
          }

          const { data: pageData } = await api.get<{
            pdfBase64: string;
            pageNumber: number;
            totalPages: number;
            newToken?: string;
          }>(`/api/reading/reader/${bookId}/page/${page}`, {
            params: { token, deviceId },
          });

          await saveCachedPage({
            bookId,
            pageNumber: page,
            pdfBase64: pageData.pdfBase64,
            cachedAt: Date.now(),
          });

          if (pageData.newToken) token = pageData.newToken;

          const progress = (page / totalPages) * 100;
          const isLast = page === totalPages;

          setState({
            status: isLast ? 'ready' : 'downloading',
            progress,
            downloadedPages: page,
            totalPages,
          });

          await saveOfflineBook({
            bookId,
            bookTitle,
            totalPages,
            downloadedPages: page,
            status: isLast ? 'ready' : 'downloading',
            cachedAt: Date.now(),
            coverImageUrl,
          });
        }
      } catch (err) {
        console.error('[OfflineReader] Download failed:', err);
        setState((s) => ({ ...s, status: 'error' }));
        const cur = await getOfflineBook(bookId);
        if (cur) {
          await saveOfflineBook({ ...cur, status: 'error' });
        }
      }
    },
    [bookId]
  );

  const cancel = useCallback(() => {
    abortRef.current = true;
  }, []);

  const remove = useCallback(async () => {
    await deleteOfflineBook(bookId);
    setState({ status: 'idle', progress: 0, downloadedPages: 0, totalPages: 0 });
  }, [bookId]);

  return { ...state, download, cancel, remove };
}

// ── List all offline books ─────────────────────────────────────────────────────

export function useOfflineLibrary() {
  const [books, setBooks] = useState<OfflineBook[]>([]);

  useEffect(() => {
    getOfflineBooks().then(setBooks);
  }, []);

  return books;
}

// ── Queue progress for offline sync ───────────────────────────────────────────

export async function queueProgressSync(
  bookId: string,
  currentPage: number,
  totalPages: number
): Promise<void> {
  const deviceId = getDeviceId();
  await savePendingProgress({
    bookId,
    deviceId,
    currentPage,
    totalPages,
    queuedAt: Date.now(),
  });
}
