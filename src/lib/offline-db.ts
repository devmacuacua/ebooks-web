// IndexedDB schema version
const DB_NAME = 'ebooks-offline';
const DB_VERSION = 1;

export interface OfflineBook {
  bookId: string;
  bookTitle: string;
  totalPages: number;
  downloadedPages: number;
  status: 'downloading' | 'ready' | 'error';
  cachedAt: number;
  coverImageUrl?: string;
}

export interface CachedPage {
  bookId: string;
  pageNumber: number;
  imageBase64: string;
  cachedAt: number;
}

export interface PendingProgress {
  bookId: string;
  deviceId: string;
  currentPage: number;
  totalPages: number;
  queuedAt: number;
}

// ── DB open ────────────────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB_NAME, DB_VERSION);

    r.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('offline-books')) {
        db.createObjectStore('offline-books', { keyPath: 'bookId' });
      }

      if (!db.objectStoreNames.contains('book-pages')) {
        const s = db.createObjectStore('book-pages', {
          keyPath: ['bookId', 'pageNumber'],
        });
        s.createIndex('by-book', 'bookId', { unique: false });
      }

      if (!db.objectStoreNames.contains('pending-progress')) {
        db.createObjectStore('pending-progress', {
          keyPath: ['bookId', 'deviceId'],
        });
      }
    };

    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── Offline books ──────────────────────────────────────────────────────────────

export async function getOfflineBooks(): Promise<OfflineBook[]> {
  const db = await openDB();
  return idbRequest<OfflineBook[]>(
    db.transaction('offline-books', 'readonly').objectStore('offline-books').getAll()
  );
}

export async function getOfflineBook(bookId: string): Promise<OfflineBook | undefined> {
  const db = await openDB();
  return idbRequest<OfflineBook | undefined>(
    db.transaction('offline-books', 'readonly').objectStore('offline-books').get(bookId)
  );
}

export async function saveOfflineBook(book: OfflineBook): Promise<void> {
  const db = await openDB();
  await idbRequest(
    db.transaction('offline-books', 'readwrite').objectStore('offline-books').put(book)
  );
}

export async function deleteOfflineBook(bookId: string): Promise<void> {
  const db = await openDB();

  await idbRequest(
    db.transaction('offline-books', 'readwrite').objectStore('offline-books').delete(bookId)
  );

  // Delete all cached pages for this book
  const pagesTx = db.transaction('book-pages', 'readwrite');
  const pagesStore = pagesTx.objectStore('book-pages');
  const idx = pagesStore.index('by-book');
  const keys = await idbRequest<IDBValidKey[]>(idx.getAllKeys(IDBKeyRange.only(bookId)));
  await Promise.all(keys.map((k) => idbRequest(pagesStore.delete(k))));
}

// ── Cached pages ───────────────────────────────────────────────────────────────

export async function getCachedPage(
  bookId: string,
  pageNumber: number
): Promise<CachedPage | undefined> {
  const db = await openDB();
  return idbRequest<CachedPage | undefined>(
    db
      .transaction('book-pages', 'readonly')
      .objectStore('book-pages')
      .get([bookId, pageNumber])
  );
}

export async function saveCachedPage(page: CachedPage): Promise<void> {
  const db = await openDB();
  await idbRequest(
    db.transaction('book-pages', 'readwrite').objectStore('book-pages').put(page)
  );
}

export async function countCachedPages(bookId: string): Promise<number> {
  const db = await openDB();
  const store = db.transaction('book-pages', 'readonly').objectStore('book-pages');
  return idbRequest<number>(store.index('by-book').count(IDBKeyRange.only(bookId)));
}

// ── Pending reading progress ───────────────────────────────────────────────────

export async function savePendingProgress(progress: PendingProgress): Promise<void> {
  const db = await openDB();
  await idbRequest(
    db
      .transaction('pending-progress', 'readwrite')
      .objectStore('pending-progress')
      .put(progress)
  );
}

export async function deletePendingProgress(bookId: string, deviceId: string): Promise<void> {
  const db = await openDB();
  await idbRequest(
    db
      .transaction('pending-progress', 'readwrite')
      .objectStore('pending-progress')
      .delete([bookId, deviceId])
  );
}

export async function getAllPendingProgress(): Promise<PendingProgress[]> {
  const db = await openDB();
  return idbRequest<PendingProgress[]>(
    db
      .transaction('pending-progress', 'readonly')
      .objectStore('pending-progress')
      .getAll()
  );
}
