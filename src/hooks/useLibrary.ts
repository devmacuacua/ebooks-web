import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import type { LibraryItem } from "@/types";

interface ReadingServiceEntry {
  id: string;
  bookId: string;
  bookSlug?: string;
  bookTitle: string;
  coverImage?: string;
  format?: string;
  totalPages?: number;
  accessType: string;
  grantedAt: string;
  expiresAt?: string;
  isExpired: boolean;
  lastSession?: {
    currentPage: number;
    totalPages?: number;
    progressPct: number;
    lastReadAt: string;
  } | null;
}

function adaptLibraryEntry(raw: ReadingServiceEntry): LibraryItem {
  return {
    book: {
      id: raw.bookId,
      title: raw.bookTitle,
      slug: raw.bookSlug ?? raw.bookId,
      coverImageUrl: raw.coverImage,
      price: 0,
      type: "EBOOK",
      authorNames: [],
      averageRating: 0,
      totalReviews: 0,
      subscriptionOnly: false,
      featured: false,
    },
    accessType: raw.accessType as "PURCHASED" | "SUBSCRIPTION",
    readingSession: raw.lastSession
      ? {
          id: "",
          userId: "",
          bookId: raw.bookId,
          currentPage: raw.lastSession.currentPage,
          totalPages: raw.lastSession.totalPages ?? raw.totalPages ?? 0,
          progressPercent: raw.lastSession.progressPct,
          lastReadAt: raw.lastSession.lastReadAt,
          deviceId: "",
        }
      : undefined,
    purchasedAt: raw.grantedAt,
  };
}

export function useLibrary() {
  return useQuery<LibraryItem[]>({
    queryKey: ["library"],
    queryFn: async () => {
      const { data } = await api.get<ReadingServiceEntry[]>("/api/reading/library");
      return data.map(adaptLibraryEntry);
    },
    enabled: isAuthenticated(),
    staleTime: 60_000,
  });
}

export function useBookAccess(bookId: string) {
  return useQuery<{ hasAccess: boolean; accessType?: "PURCHASED" | "SUBSCRIPTION" }>({
    queryKey: ["book-access", bookId],
    queryFn: async () => {
      const { data } = await api.get(`/api/reading/library/access?bookId=${bookId}`);
      return data;
    },
    enabled: Boolean(bookId) && isAuthenticated(),
    staleTime: 60_000,
  });
}
