import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

export interface Annotation {
  id: string;
  bookId: string;
  pageNumber: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export function useAnnotations(bookId: string) {
  return useQuery<Annotation[]>({
    queryKey: ["annotations", bookId],
    queryFn: async () => {
      const { data } = await api.get<Annotation[]>(`/api/reading/annotations?bookId=${bookId}`);
      return data;
    },
    enabled: Boolean(bookId) && isAuthenticated(),
    staleTime: 60_000,
  });
}

export function useUpsertAnnotation(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { pageNumber: number; content: string }) =>
      api.put("/api/reading/annotations", { bookId, ...vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["annotations", bookId] }),
  });
}

export function useDeleteAnnotation(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/reading/annotations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["annotations", bookId] }),
  });
}
