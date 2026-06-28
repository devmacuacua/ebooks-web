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
} from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { getDeviceId } from "@/lib/auth";
import api from "@/lib/api";
import { getCachedPage, getOfflineBook } from "@/lib/offline-db";
import {
  useOnlineStatus,
  queueProgressSync,
} from "@/hooks/useOfflineReader";
import type { DrmTokenResponse, DrmPageResponse } from "@/types";

type Theme = "white" | "sepia" | "dark";

const THEMES: Record<Theme, { bg: string; text: string; label: string }> = {
  white: { bg: "bg-white", text: "text-gray-900", label: "Branco" },
  sepia: { bg: "bg-amber-50", text: "text-amber-900", label: "Sépia" },
  dark: { bg: "bg-gray-900", text: "text-gray-100", label: "Escuro" },
};

function ReaderContent() {
  const { bookId } = useParams<{ bookId: string }>();
  const router = useRouter();
  const isOnline = useOnlineStatus();

  const [drmToken, setDrmToken] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageImage, setPageImage] = useState<string | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [theme, setTheme] = useState<Theme>("white");
  const [pageInput, setPageInput] = useState("1");
  const deviceId = useRef<string>("");

  // Initialize reading session
  useEffect(() => {
    deviceId.current = getDeviceId();

    const init = async () => {
      // Try offline first if we have a cached book
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

      // Online: start DRM session
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
        // If online request fails but we have cached content, fall back
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

  // Load a page from cache (offline) or API (online)
  const fetchPage = useCallback(
    async (page: number, token: string | null) => {
      setLoadingPage(true);
      try {
        // Offline mode: read from IndexedDB
        if (offlineMode || !isOnline) {
          const cached = await getCachedPage(bookId, page);
          if (cached) {
            setPageImage(cached.imageBase64);
            setCurrentPage(page);
            setPageInput(String(page));
            // Queue progress for later sync
            await queueProgressSync(bookId, page, totalPages);
          } else {
            setError("Página não disponível offline. Ligue-se à internet.");
          }
          return;
        }

        // Online mode: fetch from DRM API
        if (!token) return;
        const response = await api.get<DrmPageResponse>(
          `/api/reading/reader/${bookId}/page/${page}`,
          { params: { token, deviceId: deviceId.current }, responseType: "json" }
        );

        setPageImage(response.data.imageBase64);

        // Cache the page in IndexedDB as we read (background)
        import("@/lib/offline-db").then(({ saveCachedPage }) =>
          saveCachedPage({
            bookId,
            pageNumber: page,
            imageBase64: response.data.imageBase64,
            cachedAt: Date.now(),
          }).catch(() => {})
        );

        const newToken = response.headers["x-new-drm-token"] || response.data.newToken;
        if (newToken) setDrmToken(newToken);

        setCurrentPage(response.data.pageNumber);
        setTotalPages(response.data.totalPages);
        setPageInput(String(response.data.pageNumber));

        // Save progress (fire-and-forget)
        api
          .post("/api/reading/progress", {
            bookId,
            currentPage: response.data.pageNumber,
            totalPages: response.data.totalPages,
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
    [bookId, offlineMode, isOnline, totalPages]
  );

  // Fetch first page once token/offlineMode is ready
  useEffect(() => {
    if (loadingInit) return;
    if (offlineMode || drmToken) {
      fetchPage(1, drmToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingInit, offlineMode, drmToken]);

  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages || loadingPage) return;
      setCurrentPage(page);
      setPageInput(String(page));
      fetchPage(page, drmToken);
    },
    [drmToken, totalPages, loadingPage, fetchPage]
  );

  // Keyboard navigation
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
          {/* Offline indicator */}
          {(offlineMode || !isOnline) && (
            <div className="flex items-center gap-1 text-xs text-amber-400">
              <WifiOff className="h-3.5 w-3.5" />
              <span className="hidden sm:block">Offline</span>
            </div>
          )}

          {/* Page input */}
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
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-md hover:bg-gray-700 transition-colors"
            aria-label="Definições"
          >
            <Settings className="h-4 w-4 text-gray-300" />
          </button>
        </div>
      </div>

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
            <p className="text-xs text-gray-500 mb-2">Tamanho do texto</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFontSize((s) => Math.max(12, s - 2))}
                className="h-7 w-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-sm font-medium text-gray-900 w-8 text-center">{fontSize}</span>
              <button
                onClick={() => setFontSize((s) => Math.min(28, s + 2))}
                className="h-7 w-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
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
          style={{ fontSize: `${fontSize}px` }}
        >
          {loadingPage ? (
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          ) : pageImage ? (
            <div className="relative h-full w-full flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${pageImage}`}
                alt={`Página ${currentPage}`}
                className={`max-h-full max-w-full object-contain rounded shadow-2xl drm-page ${themeConfig.bg}`}
                draggable={false}
              />
            </div>
          ) : null}
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
