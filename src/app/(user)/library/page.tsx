"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Package,
  Play,
  Clock,
  Library,
  Download,
  WifiOff,
  CheckCircle,
  Loader2,
  XCircle,
} from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";
import * as Progress from "@radix-ui/react-progress";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useLibrary } from "@/hooks/useLibrary";
import { useOfflineBook, useOnlineStatus } from "@/hooks/useOfflineReader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LibraryItem } from "@/types";

function ProgressBar({ value }: { value: number }) {
  return (
    <Progress.Root
      className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-200"
      value={value}
    >
      <Progress.Indicator
        className="h-full bg-blue-800 transition-all duration-300"
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </Progress.Root>
  );
}

function OfflineButton({ item }: { item: LibraryItem }) {
  const { status, progress, downloadedPages, totalPages, download, cancel, remove } =
    useOfflineBook(item.book.id);
  const isOnline = useOnlineStatus();

  if (status === "ready") {
    return (
      <button
        onClick={remove}
        title="Remover leitura offline"
        className="flex items-center gap-1 text-xs text-green-700 hover:text-red-600 transition-colors"
      >
        <CheckCircle className="h-3.5 w-3.5" />
        <span className="hidden sm:block">Offline</span>
      </button>
    );
  }

  if (status === "downloading") {
    return (
      <div className="flex flex-col gap-1 min-w-[60px]">
        <div className="flex items-center gap-1">
          <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin shrink-0" />
          <span className="text-xs text-blue-600">
            {downloadedPages}/{totalPages}
          </span>
          <button
            onClick={cancel}
            className="ml-auto text-gray-400 hover:text-gray-600"
            title="Cancelar"
          >
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <button
        onClick={() => download(item.book.title, item.book.coverImageUrl)}
        disabled={!isOnline}
        className="flex items-center gap-1 text-xs text-red-600 hover:text-blue-600 transition-colors disabled:opacity-40"
        title="Erro — clique para tentar novamente"
      >
        <XCircle className="h-3.5 w-3.5" />
        <span className="hidden sm:block">Erro</span>
      </button>
    );
  }

  // idle
  return (
    <button
      onClick={() => download(item.book.title, item.book.coverImageUrl)}
      disabled={!isOnline}
      title={isOnline ? "Baixar para leitura offline" : "Sem ligação"}
      className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {isOnline ? (
        <Download className="h-3.5 w-3.5" />
      ) : (
        <WifiOff className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:block">Offline</span>
    </button>
  );
}

function EbookCard({ item }: { item: LibraryItem }) {
  const { book, readingSession, accessType } = item;

  return (
    <div className="group flex flex-col">
      {/* Cover */}
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-100 mb-2 shadow-sm">
        {book.coverImageUrl ? (
          <Image src={book.coverImageUrl} alt={book.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-10 w-10 text-gray-300" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Link href={`/reader/${book.id}`}>
            <Button size="sm" variant="accent" className="gap-1">
              <Play className="h-3.5 w-3.5" />
              {readingSession ? "Continuar" : "Ler"}
            </Button>
          </Link>
        </div>

        {/* Access badge */}
        <div className="absolute top-2 left-2">
          <Badge variant={accessType === "SUBSCRIPTION" ? "accent" : "ebook"} className="text-xs">
            {accessType === "SUBSCRIPTION" ? "Subscrição" : "Comprado"}
          </Badge>
        </div>
      </div>

      {/* Info */}
      <p className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">{book.title}</p>

      {/* Progress + offline button */}
      <div className="flex items-center justify-between gap-2">
        {readingSession ? (
          <div className="flex-1 space-y-0.5">
            <ProgressBar value={readingSession.progressPercent} />
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {readingSession.progressPercent}%
              </span>
              <span>
                p. {readingSession.currentPage}/{readingSession.totalPages}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}
        <OfflineButton item={item} />
      </div>
    </div>
  );
}

function LibraryContent() {
  const { data: items, isLoading } = useLibrary();
  const [activeTab, setActiveTab] = useState("ebooks");

  const ebooks = (items || []).filter(
    (i) => i.book.type === "EBOOK" || i.book.type === "BOTH"
  );
  const physical = (items || []).filter(
    (i) => i.book.type === "PHYSICAL" || i.book.type === "BOTH"
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-gray-100 animate-pulse aspect-[2/3]" />
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Library className="h-16 w-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">A sua biblioteca está vazia</h2>
        <p className="text-gray-500 mb-6">Compre livros ou active a subscrição para começar a ler.</p>
        <Link href="/catalog">
          <Button>Explorar catálogo</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">A Minha Biblioteca</h1>
        <p className="text-gray-500 text-sm mt-1">
          {items.length} {items.length === 1 ? "livro" : "livros"} na sua colecção
        </p>
      </div>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex gap-1 rounded-lg bg-gray-100 p-1 w-fit mb-6">
          <Tabs.Trigger
            value="ebooks"
            className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-800 text-gray-600 transition-all"
          >
            <BookOpen className="h-4 w-4" />
            Ebooks
            {ebooks.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-1.5 py-0.5">
                {ebooks.length}
              </span>
            )}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="physical"
            className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-800 text-gray-600 transition-all"
          >
            <Package className="h-4 w-4" />
            Livros Físicos
            {physical.length > 0 && (
              <span className="text-xs bg-purple-100 text-purple-800 rounded-full px-1.5 py-0.5">
                {physical.length}
              </span>
            )}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="ebooks">
          {ebooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {ebooks.map((item) => (
                <EbookCard key={item.book.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <BookOpen className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p>Nenhum ebook ainda. Explore o catálogo!</p>
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="physical">
          {physical.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {physical.map(({ book, purchasedAt }) => (
                <div key={book.id} className="flex flex-col">
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-100 mb-2 shadow-sm">
                    {book.coverImageUrl ? (
                      <Image
                        src={book.coverImageUrl}
                        alt={book.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-10 w-10 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">
                    {book.title}
                  </p>
                  {purchasedAt && (
                    <p className="text-xs text-gray-400">
                      Comprado em {new Date(purchasedAt).toLocaleDateString("pt-MZ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Package className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p>Nenhum livro físico ainda.</p>
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <AuthGuard>
      <LibraryContent />
    </AuthGuard>
  );
}
