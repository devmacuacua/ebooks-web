"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Settings,
  Sun,
  Moon,
  Minus,
  Plus,
  Loader2,
  AlertCircle,
  X,
  WifiOff,
  Bookmark,
  BookmarkCheck,
  List,
  StickyNote,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { getDeviceId } from "@/lib/auth";
import api from "@/lib/api";
import { getCachedPage, getOfflineBook } from "@/lib/offline-db";
import {
  useOnlineStatus,
  queueProgressSync,
} from "@/hooks/useOfflineReader";
import { useBookmarks, useAddBookmark, useRemoveBookmark } from "@/hooks/useBookmarks";
import { useAnnotations, useUpsertAnnotation, useDeleteAnnotation } from "@/hooks/useAnnotations";
import type { DrmTokenResponse, DrmPageResponse } from "@/types";

type Theme = "white" | "sepia" | "dark";

const THEMES: Record<Theme, { bg: string; text: string; label: string }> = {
  white: { bg: "bg-white", text: "text-gray-900", label: "Branco" },
  sepia: { bg: "bg-amber-50", text: "text-amber-900", label: "Sépia" },
  dark: { bg: "bg-gray-900", text: "text-gray-100", label: "Escuro" },
};

async function renderPdfToCanvas(
  canvas: HTMLCanvasElement,
  pdfBase64: string,
  zoom = 1
): Promise<void> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const data = atob(pdfBase64);
  const bytes = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    bytes[i] = data.charCodeAt(i);
  }

  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  const page = await pdf.getPage(1);

  const container = canvas.parentElement;
  const maxW = container ? container.clientWidth : window.innerWidth - 120;
  const maxH = container ? container.clientHeight : window.innerHeight - 112;

  const viewport = page.getViewport({ scale: 1 });
  const scale = Math.min(maxW / viewport.width, maxH / viewport.height) * zoom;
  const scaled = page.getViewport({ scale });

  canvas.width = scaled.width;
  canvas.height = scaled.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  await page.render({ canvasContext: ctx, canvas, viewport: scaled }).promise;
}

function ReaderContent() {
  const { bookId } = useParams<{ bookId: string }>();
  const router = useRouter();
  const isOnline = useOnlineStatus();

  const [drmToken, setDrmToken] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [pageReady, setPageReady] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [theme, setTheme] = useState<Theme>("white");

  const { data: bookmarks = [] } = useBookmarks(bookId);
  const addBookmark = useAddBookmark(bookId);
  const removeBookmark = useRemoveBookmark(bookId);
  const currentPageBookmark = bookmarks.find((b) => b.pageNumber === currentPage);

  const [showAnnotation, setShowAnnotation] = useState(false);
  const [annotationText, setAnnotationText] = useState("");
  const { data: annotations = [] } = useAnnotations(bookId);
  const upsertAnnotation = useUpsertAnnotation(bookId);
  const deleteAnnotation = useDeleteAnnotation(bookId);
  const currentAnnotation = annotations.find((a) => a.pageNumber === currentPage);
  const [pageInput, setPageInput] = useState("1");
  const deviceId = useRef<string>("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const initialPageFetched = useRef(false);
  const lastPdfBase64 = useRef<string | null>(null);

  // Initialize reading session
  useEffect(() => {
    deviceId.current = getDeviceId();

    const init = async () => {
      const offlineBook = await getOfflineBook(bookId);

      if (!isOnline) {
        if (offlineBook?.status === "ready") {
          setOfflineMode(true);
          setTotalPages(offlineBook.totalPages);
          setCurrentPage(1);
          setPageInput("1");
          setLoadingInit(false);
          return;
        }
        setError("Sem ligação à internet e este livro não está disponível offline.");
        setLoadingInit(false);
        return;
      }

      try {
        const { data } = await api.post<DrmTokenResponse>("/api/reading/reader/token", {
          bookId,
          deviceId: deviceId.current,
        });
        setDrmToken(data.token);
        setTotalPages(data.totalPages);
        setCurrentPage(1);
        setPageInput("1");
      } catch (e: unknown) {
        if (offlineBook?.status === "ready") {
          setOfflineMode(true);
          setTotalPages(offlineBook.totalPages);
          setCurrentPage(1);
          setPageInput("1");
        } else {
          const msg =
            (e as { response?: { data?: { message?: string } } }).response?.data?.message ||
            "Não foi possível iniciar a sessão de leitura.";
          setError(msg);
        }
      } finally {
        setLoadingInit(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  const fetchPage = useCallback(
    async (page: number, token: string | null, zoomOverride?: number) => {
      setLoadingPage(true);
      setPageReady(false);
      try {
        if (offlineMode || !isOnline) {
          const cached = await getCachedPage(bookId, page);
          if (cached && canvasRef.current) {
            lastPdfBase64.current = cached.pdfBase64;
            await renderPdfToCanvas(canvasRef.current, cached.pdfBase64, zoomOverride ?? zoom);
            setPageReady(true);
            setCurrentPage(page);
            setPageInput(String(page));
            await queueProgressSync(bookId, page, totalPages);
          } else {
            setError("Página não disponível offline. Ligue-se à internet.");
          }
          return;
        }

        if (!token) return;
        const response = await api.get<DrmPageResponse>(
          `/api/reading/reader/${bookId}/page/${page}`,
          { params: { token, deviceId: deviceId.current } }
        );

        lastPdfBase64.current = response.data.pdfBase64;

        if (canvasRef.current) {
          await renderPdfToCanvas(canvasRef.current, response.data.pdfBase64, zoomOverride ?? zoom);
          setPageReady(true);
        }

        // Cache the page in IndexedDB as we read (background)
        import("@/lib/offline-db").then(({ saveCachedPage }) =>
          saveCachedPage({
            bookId,
            pageNumber: page,
            pdfBase64: response.data.pdfBase64,
            cachedAt: Date.now(),
          }).catch(() => {})
        );

        if (response.data.newToken) setDrmToken(response.data.newToken);

        setCurrentPage(response.data.pageNumber);
        setTotalPages(response.data.totalPages);
        setPageInput(String(response.data.pageNumber));

        api
          .post(`/api/reading/reader/${bookId}/progress`, {
            currentPage: response.data.pageNumber,
            deviceId: deviceId.current,
          })
          .catch(() => {});
      } catch (e: unknown) {
        const status = (e as { response?: { status?: number } }).response?.status;
        if (status === 403) setError("Acesso negado. Este livro não está disponível para leitura.");
        else if (status === 401) setError("A sessão expirou. Por favor reinicie o leitor.");
        else setError("Erro ao carregar a página. Tente novamente.");
      } finally {
        setLoadingPage(false);
      }
    },
    [bookId, offlineMode, isOnline, totalPages, zoom]
  );

  useEffect(() => {
    if (loadingInit) return;
    if (initialPageFetched.current) return;
    if (offlineMode || drmToken) {
      initialPageFetched.current = true;
      fetchPage(1, drmToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingInit, offlineMode, drmToken]);

  // Sync annotation textarea when page changes
  useEffect(() => {
    setAnnotationText(currentAnnotation?.content ?? "");
    setShowAnnotation(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Re-render current page with new zoom without refetching from the API
  useEffect(() => {
    if (!lastPdfBase64.current || !canvasRef.current || !pageReady) return;
    renderPdfToCanvas(canvasRef.current, lastPdfBase64.current, zoom).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages || loadingPage) return;
      setCurrentPage(page);
      setPageInput(String(page));
      fetchPage(page, drmToken);
    },
    [drmToken, totalPages, loadingPage, fetchPage]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && ["s", "p", "a", "c"].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        return;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goToPage(currentPage + 1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") goToPage(currentPage - 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goToPage, currentPage]);

  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
  const themeConfig = THEMES[theme];

  if (loadingInit) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="h-10 w-10 animate-spin mb-4" />
        <p className="text-gray-300">
          {isOnline ? "A iniciar sessão de leitura segura..." : "A carregar modo offline..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center text-white px-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-xl font-bold mb-2">Erro de Acesso</h2>
        <p className="text-gray-400 mb-6 max-w-md">{error}</p>
        <button
          onClick={() => router.push("/library")}
          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar à biblioteca
        </button>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 flex flex-col ${theme === "dark" ? "bg-gray-900" : "bg-gray-800"}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/90 text-white shrink-0">
        <button
          onClick={() => router.push("/library")}
          className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:block">Biblioteca</span>
        </button>

        <div className="flex items-center gap-4">
          {(offlineMode || !isOnline) && (
            <div className="flex items-center gap-1 text-xs text-amber-400">
              <WifiOff className="h-3.5 w-3.5" />
              <span className="hidden sm:block">Offline</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-300">
            <span>Pág.</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={() => {
                const p = parseInt(pageInput, 10);
                if (!isNaN(p)) goToPage(p);
                else setPageInput(String(currentPage));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const p = parseInt(pageInput, 10);
                  if (!isNaN(p)) goToPage(p);
                }
              }}
              className="w-14 bg-gray-700 border border-gray-600 rounded px-2 py-0.5 text-center text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span>de {totalPages}</span>
          </div>

          <span className="text-xs text-gray-400 hidden sm:block">{progress.toFixed(0)}%</span>

          <button
            onClick={() => {
              if (currentPageBookmark) {
                removeBookmark.mutate(currentPageBookmark.id);
              } else {
                addBookmark.mutate({ pageNumber: currentPage });
              }
            }}
            disabled={addBookmark.isPending || removeBookmark.isPending}
            className="p-1.5 rounded-md hover:bg-gray-700 transition-colors"
            aria-label={currentPageBookmark ? "Remover marcador" : "Adicionar marcador"}
          >
            {currentPageBookmark
              ? <BookmarkCheck className="h-4 w-4 text-orange-400" />
              : <Bookmark className="h-4 w-4 text-gray-300" />
            }
          </button>

          <button
            onClick={() => setShowBookmarks(!showBookmarks)}
            className="p-1.5 rounded-md hover:bg-gray-700 transition-colors relative"
            aria-label="Lista de marcadores"
          >
            <List className="h-4 w-4 text-gray-300" />
            {bookmarks.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-orange-400 text-[9px] font-bold text-white">
                {bookmarks.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setAnnotationText(currentAnnotation?.content ?? "");
              setShowAnnotation(!showAnnotation);
            }}
            className="p-1.5 rounded-md hover:bg-gray-700 transition-colors relative"
            aria-label="Nota da página"
          >
            <StickyNote className={`h-4 w-4 ${currentAnnotation ? "text-yellow-400" : "text-gray-300"}`} />
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-md hover:bg-gray-700 transition-colors"
            aria-label="Definições"
          >
            <Settings className="h-4 w-4 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Annotation panel */}
      {showAnnotation && (
        <div className="absolute top-12 right-4 z-50 bg-white rounded-xl shadow-2xl p-4 w-72 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Nota — Página {currentPage}</h3>
            <button onClick={() => setShowAnnotation(false)}>
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <textarea
            value={annotationText}
            onChange={(e) => setAnnotationText(e.target.value)}
            placeholder="Escreve uma nota para esta página..."
            rows={4}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex justify-between mt-3 gap-2">
            {currentAnnotation && (
              <button
                onClick={() => {
                  deleteAnnotation.mutate(currentAnnotation.id);
                  setAnnotationText("");
                  setShowAnnotation(false);
                }}
                className="text-xs text-red-500 hover:underline"
              >
                Apagar
              </button>
            )}
            <button
              onClick={() => {
                if (annotationText.trim()) {
                  upsertAnnotation.mutate({ pageNumber: currentPage, content: annotationText.trim() });
                }
                setShowAnnotation(false);
              }}
              disabled={upsertAnnotation.isPending}
              className="ml-auto text-xs bg-blue-800 text-white px-3 py-1.5 rounded-lg hover:bg-blue-900 disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Bookmarks panel */}
      {showBookmarks && (
        <div className="absolute top-12 right-4 z-50 bg-white rounded-xl shadow-2xl p-4 w-64 border border-gray-200 max-h-80 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Marcadores ({bookmarks.length})</h3>
            <button onClick={() => setShowBookmarks(false)}>
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          {bookmarks.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">Sem marcadores neste livro.</p>
          ) : (
            <ul className="overflow-y-auto space-y-1">
              {bookmarks.map((bm) => (
                <li key={bm.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50">
                  <button
                    className="flex items-center gap-2 flex-1 text-left"
                    onClick={() => { goToPage(bm.pageNumber); setShowBookmarks(false); }}
                  >
                    <BookmarkCheck className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                    <span className="text-xs text-gray-700">
                      {bm.label || `Página ${bm.pageNumber}`}
                    </span>
                  </button>
                  <button
                    onClick={() => removeBookmark.mutate(bm.id)}
                    className="text-gray-300 hover:text-red-400 shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <div className="absolute top-12 right-4 z-50 bg-white rounded-xl shadow-2xl p-4 w-64 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Definições de Leitura</h3>
            <button onClick={() => setShowSettings(false)}>
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Zoom</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))))}
                disabled={zoom <= 0.5}
                className="h-7 w-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-sm font-medium text-gray-900 w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(2, parseFloat((z + 0.25).toFixed(2))))}
                disabled={zoom >= 2}
                className="h-7 w-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">Tema</p>
            <div className="flex gap-2">
              {(Object.entries(THEMES) as [Theme, (typeof THEMES)[Theme]][]).map(
                ([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={`flex-1 py-1.5 rounded-lg border-2 text-xs font-medium transition-all ${
                      theme === key
                        ? "border-blue-800 ring-1 ring-blue-800"
                        : "border-gray-200"
                    } ${cfg.bg} ${cfg.text}`}
                  >
                    {key === "white" && <Sun className="h-3 w-3 mx-auto mb-0.5" />}
                    {key === "dark" && <Moon className="h-3 w-3 mx-auto mb-0.5" />}
                    {key === "sepia" && <span className="block text-center">A</span>}
                    {cfg.label}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main reading area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1 || loadingPage}
          className="absolute left-2 z-10 h-12 w-10 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div
          className="relative h-full max-h-[calc(100vh-7rem)] flex items-center justify-center mx-14"
        >
          {loadingPage ? (
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          ) : (
            <div className="relative h-full w-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className={`max-h-full max-w-full object-contain rounded shadow-2xl drm-page ${themeConfig.bg} ${pageReady ? "block" : "hidden"}`}
                draggable={false}
              />
              {!pageReady && !loadingPage && (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages || loadingPage}
          className="absolute right-2 z-10 h-12 w-10 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Próxima página"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Bottom progress bar */}
      <div className="shrink-0 bg-gray-900/90 px-4 py-2">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="shrink-0">1</span>
          <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="shrink-0">{totalPages}</span>
        </div>
      </div>
    </div>
  );
}

export default function ReaderPage() {
  return (
    <AuthGuard>
      <ReaderContent />
    </AuthGuard>
  );
}
