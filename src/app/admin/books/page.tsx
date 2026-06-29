"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, BookOpen } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api, { formatMZN } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import type { BookSummary, PaginatedResponse } from "@/types";

export default function AdminBooksPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<BookSummary>>({
    queryKey: ["admin-books", search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), size: "20", adminMode: "true" });
      if (search) params.set("search", search);
      const { data } = await api.get<PaginatedResponse<BookSummary>>(
        `/api/admin/books?${params.toString()}`
      );
      return data;
    },
  });

  const deleteBook = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/admin/books/${id}`);
    },
    onSuccess: () => {
      toast({ variant: "success", title: "Livro eliminado!" });
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível eliminar o livro." });
    },
  });

  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`Eliminar "${title}"? Esta acção é irreversível.`)) return;
    deleteBook.mutate(id);
  };

  const TYPE_LABELS = { EBOOK: "Ebook", PHYSICAL: "Físico", BOTH: "Físico+Ebook" };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Livros</h1>
          {data && (
            <p className="text-sm text-gray-500 mt-0.5">
              {data.totalElements} livros no catálogo
            </p>
          )}
        </div>
        <Link href="/admin/books/new">
          <Button>
            <Plus className="h-4 w-4" /> Novo Livro
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="search"
          placeholder="Pesquisar por título, autor, ISBN..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Livro
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Preço
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Avaliação
                </th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="py-3 px-4">
                        <div className="h-8 bg-gray-100 animate-pulse rounded" />
                      </td>
                    </tr>
                  ))
                : data?.content.map((book) => (
                    <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-7 rounded bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {book.coverImageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={book.coverImageUrl}
                                alt={book.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <BookOpen className="h-4 w-4 text-gray-300" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1">{book.title}</p>
                            <p className="text-xs text-gray-400">
                              {book.authorNames.slice(0, 2).join(", ")}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            book.type === "EBOOK"
                              ? "ebook"
                              : book.type === "PHYSICAL"
                              ? "physical"
                              : "both"
                          }
                        >
                          {TYPE_LABELS[book.type]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium">{formatMZN(book.price)}</td>
                      <td className="py-3 px-4 text-gray-600">
                        ★ {book.averageRating.toFixed(1)}
                        <span className="text-gray-400 text-xs ml-1">
                          ({book.totalReviews})
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/books/${book.id}/edit`}>
                            <button className="p-1.5 rounded-md text-gray-400 hover:text-blue-800 hover:bg-blue-50 transition-colors">
                              <Pencil className="h-4 w-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(book.id, book.title)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(data?.totalPages || 0) > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Página {page + 1} de {data?.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
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
