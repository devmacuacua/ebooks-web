"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import api from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PaginatedResponse } from "@/types";

interface AdminReview {
  id: string;
  bookId: string;
  bookTitle: string;
  bookSlug: string;
  userId: string;
  userName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

const RATING_OPTIONS = [
  { value: "", label: "Todas as avaliações" },
  { value: "5", label: "5 estrelas" },
  { value: "4", label: "4 estrelas" },
  { value: "3", label: "3 estrelas" },
  { value: "2", label: "2 estrelas" },
  { value: "1", label: "1 estrela" },
];

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [page, setPage] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<AdminReview>>({
    queryKey: ["admin-reviews", search, ratingFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), size: "20" });
      if (search) params.set("search", search);
      if (ratingFilter) params.set("rating", ratingFilter);
      const { data } = await api.get<PaginatedResponse<AdminReview>>(
        `/api/admin/reviews?${params.toString()}`
      );
      return data;
    },
  });

  const deleteReview = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/reviews/${id}`),
    onMutate: (id) => setDeletingId(id),
    onSettled: () => setDeletingId(null),
    onSuccess: () => {
      toast({ variant: "success", title: "Avaliação eliminada." });
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível eliminar a avaliação." });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avaliações</h1>
          {data && (
            <p className="text-sm text-gray-500 mt-0.5">{data.totalElements} avaliações</p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Pesquisar por livro ou utilizador..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
          />
        </div>
        <select
          value={ratingFilter}
          onChange={(e) => { setRatingFilter(e.target.value); setPage(0); }}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
        >
          {RATING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Livro</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Utilizador</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Avaliação</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Comentário</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="py-3 px-4">
                        <div className="h-6 bg-gray-100 animate-pulse rounded" />
                      </td>
                    </tr>
                  ))
                : data?.content.length === 0
                ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                        Sem avaliações encontradas.
                      </td>
                    </tr>
                  )
                : data?.content.map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <a
                          href={`/books/${review.bookSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-gray-900 hover:text-blue-800 hover:underline"
                        >
                          {review.bookTitle}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{review.userName}</td>
                      <td className="py-3 px-4">
                        <StarDisplay rating={review.rating} />
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        {review.comment ? (
                          <p className="text-gray-600 text-xs line-clamp-2">{review.comment}</p>
                        ) : (
                          <span className="text-gray-300 text-xs italic">Sem comentário</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">
                        {format(new Date(review.createdAt), "d MMM yyyy", { locale: ptBR })}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => {
                            if (confirm("Eliminar esta avaliação?")) {
                              deleteReview.mutate(review.id);
                            }
                          }}
                          disabled={deletingId === review.id}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {(data?.totalPages || 0) > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Página {page + 1} de {data?.totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= (data?.totalPages || 1) - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Seguinte
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
