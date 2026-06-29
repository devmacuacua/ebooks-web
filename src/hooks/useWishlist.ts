import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

export interface WishlistItem {
  id: string;
  bookId: string;
  bookSlug?: string;
  bookTitle: string;
  coverImage?: string;
  price?: number;
  addedAt: string;
}

export function useWishlist() {
  return useQuery<WishlistItem[]>({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const { data } = await api.get<WishlistItem[]>("/api/reading/wishlist");
      return data;
    },
    staleTime: 60_000,
    enabled: isAuthenticated(),
  });
}

export function useWishlistCheck(bookId: string) {
  return useQuery<{ inWishlist: boolean }>({
    queryKey: ["wishlist-check", bookId],
    queryFn: async () => {
      const { data } = await api.get<{ inWishlist: boolean }>(
        `/api/reading/wishlist/${bookId}/check`
      );
      return data;
    },
    enabled: Boolean(bookId) && isAuthenticated(),
    staleTime: 60_000,
  });
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();

  const add = useMutation({
    mutationFn: (item: { bookId: string; bookSlug?: string; bookTitle: string; coverImage?: string; price?: number }) =>
      api.post("/api/reading/wishlist", item),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.setQueryData(["wishlist-check", variables.bookId], { inWishlist: true });
    },
  });

  const remove = useMutation({
    mutationFn: (bookId: string) => api.delete(`/api/reading/wishlist/${bookId}`),
    onSuccess: (_, bookId) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.setQueryData(["wishlist-check", bookId], { inWishlist: false });
    },
  });

  return { add, remove };
}
