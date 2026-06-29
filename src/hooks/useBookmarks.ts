import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

export interface Bookmark {
  id: string;
  bookId: string;
  pageNumber: number;
  label?: string | null;
  createdAt: string;
}

export function useBookmarks(bookId: string) {
  return useQuery<Bookmark[]>({
    queryKey: ["bookmarks", bookId],
    queryFn: async () => {
      const { data } = await api.get<Bookmark[]>(`/api/reading/bookmarks?bookId=${bookId}`);
      return data;
    },
    enabled: Boolean(bookId) && isAuthenticated(),
    staleTime: 60_000,
  });
}

export function useAddBookmark(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { pageNumber: number; label?: string }) =>
      api.post("/api/reading/bookmarks", { bookId, ...vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookmarks", bookId] }),
  });
}

export function useRemoveBookmark(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/reading/bookmarks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookmarks", bookId] }),
  });
}
