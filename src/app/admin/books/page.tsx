"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api, { formatMZN } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useAdminSubmissions, useReviewSubmission } from "@/hooks/useBookSubmissions";
import type { BookSummary, BookSubmission, BookSubmissionStatus, PaginatedResponse } from "@/types";

// ── Catalogue tab ─────────────────────────────────────────────────────────────

function CatalogTab() {
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
    <>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="search"
          placeholder="Pesquisar por título, autor, ISBN..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Livro</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Preço</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Avaliação</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}><td colSpan={5} className="py-3 px-4"><div className="h-8 bg-gray-100 animate-pulse rounded" /></td></tr>
                  ))
                : data?.content.map((book) => (
                    <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-7 rounded bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {book.coverImageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={book.coverImageUrl} alt={book.title} className="h-full w-full object-cover" />
                            ) : (
                              <BookOpen className="h-4 w-4 text-gray-300" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1">{book.title}</p>
                            <p className="text-xs text-gray-400">{book.authorNames.slice(0, 2).join(", ")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={book.type === "EBOOK" ? "ebook" : book.type === "PHYSICAL" ? "physical" : "both"}>
                          {TYPE_LABELS[book.type]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium">{formatMZN(book.price)}</td>
                      <td className="py-3 px-4 text-gray-600">
                        ★ {book.averageRating.toFixed(1)}
                        <span className="text-gray-400 text-xs ml-1">({book.totalReviews})</span>
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
        {(data?.totalPages || 0) > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Página {page + 1} de {data?.totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={page >= (data?.totalPages || 1) - 1} onClick={() => setPage((p) => p + 1)}>Seguinte</Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Submission review panel ───────────────────────────────────────────────────

const STATUS_CFG: Record<BookSubmissionStatus, { label: string; color: string; icon: React.ElementType }> = {
  PENDING_REVIEW: { label: "Em análise", color: "text-yellow-700 bg-yellow-50 border-yellow-200", icon: Clock },
  APPROVED: { label: "Aprovado", color: "text-green-700 bg-green-50 border-green-200", icon: CheckCircle },
  REJECTED: { label: "Rejeitado", color: "text-red-700 bg-red-50 border-red-200", icon: XCircle },
};

const TYPE_LABELS = { EBOOK: "Ebook", PHYSICAL: "Físico", BOTH: "Físico+Ebook" };

function ReviewPanel({
  submission,
  onClose,
}: {
  submission: BookSubmission;
  onClose: () => void;
}) {
  const [parecer, setParecer] = useState("");
  const review = useReviewSubmission();

  const handleAction = async (action: "APPROVE" | "REJECT") => {
    if (action === "REJECT" && !parecer.trim()) {
      alert("Escreva um parecer antes de rejeitar.");
      return;
    }
    await review.mutateAsync({ id: submission.id, action, parecer: parecer.trim() || undefined });
    onClose();
  };

  const cfg = STATUS_CFG[submission.status];
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg bg-white shadow-xl overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Revisão de submissão</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Cover + title */}
          <div className="flex gap-4">
            <div className="h-28 w-20 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
              {submission.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={submission.coverUrl} alt={submission.title} className="h-full w-full object-cover" />
              ) : (
                <BookOpen className="h-8 w-8 text-gray-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-lg leading-snug">{submission.title}</h3>
              {submission.partnerName && (
                <p className="text-sm text-gray-500 mt-0.5">por <strong>{submission.partnerName}</strong></p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
                  <Icon className="h-3 w-3" />
                  {cfg.label}
                </span>
                <Badge variant={submission.type === "EBOOK" ? "ebook" : submission.type === "PHYSICAL" ? "physical" : "both"}>
                  {TYPE_LABELS[submission.type]}
                </Badge>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-0.5">Preço</p>
              <p className="font-semibold text-gray-900">{formatMZN(submission.price)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-0.5">Idioma</p>
              <p className="font-semibold text-gray-900">{submission.language}</p>
            </div>
            {submission.publisher && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">Editora</p>
                <p className="font-semibold text-gray-900">{submission.publisher}</p>
              </div>
            )}
            {submission.isbn && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">ISBN</p>
                <p className="font-semibold text-gray-900">{submission.isbn}</p>
              </div>
            )}
            {submission.pageCount && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">Páginas</p>
                <p className="font-semibold text-gray-900">{submission.pageCount}</p>
              </div>
            )}
            {submission.stockQuantity != null && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">Stock</p>
                <p className="font-semibold text-gray-900">{submission.stockQuantity}</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Descrição</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{submission.description}</p>
          </div>

          {/* Existing review feedback */}
          {submission.parecer && (
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Parecer anterior</p>
              <p className="text-sm text-gray-700">{submission.parecer}</p>
            </div>
          )}

          {/* Parecer textarea — only for pending */}
          {submission.status === "PENDING_REVIEW" && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Parecer / comentário para o parceiro
              </label>
              <textarea
                value={parecer}
                onChange={(e) => setParecer(e.target.value)}
                rows={3}
                placeholder="Escreva um comentário para o parceiro (obrigatório para rejeitar)..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        {submission.status === "PENDING_REVIEW" && (
          <div className="p-4 border-t border-gray-200 flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              disabled={review.isPending}
              onClick={() => handleAction("REJECT")}
            >
              <XCircle className="h-4 w-4 mr-1.5" />
              Rejeitar
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={review.isPending}
              onClick={() => handleAction("APPROVE")}
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Aprovar e publicar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Submissions tab ───────────────────────────────────────────────────────────

function SubmissionsTab() {
  const [statusFilter, setStatusFilter] = useState<BookSubmissionStatus | "">("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<BookSubmission | null>(null);

  const { data, isLoading } = useAdminSubmissions(
    statusFilter || undefined,
    page
  );

  const pendingCount = data?.content.filter((s) => s.status === "PENDING_REVIEW").length ?? 0;

  return (
    <>
      {selected && <ReviewPanel submission={selected} onClose={() => setSelected(null)} />}

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["", "PENDING_REVIEW", "APPROVED", "REJECTED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(0); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === s
                ? "bg-blue-800 text-white border-blue-800"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-800"
            }`}
          >
            {s === "" ? "Todas" : STATUS_CFG[s].label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Livro</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Parceiro</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} className="py-3 px-4"><div className="h-8 bg-gray-100 animate-pulse rounded" /></td></tr>
                  ))
                : data?.content.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                      Sem submissões {statusFilter ? `com estado "${STATUS_CFG[statusFilter].label}"` : ""}.
                    </td>
                  </tr>
                )
                : data?.content.map((sub) => {
                    const cfg = STATUS_CFG[sub.status];
                    const Icon = cfg.icon;
                    return (
                      <tr
                        key={sub.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setSelected(sub)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-7 rounded bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                              {sub.coverUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={sub.coverUrl} alt={sub.title} className="h-full w-full object-cover" />
                              ) : (
                                <BookOpen className="h-4 w-4 text-gray-300" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 line-clamp-1">{sub.title}</p>
                              <p className="text-xs text-gray-400">{formatMZN(sub.price)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={sub.type === "EBOOK" ? "ebook" : sub.type === "PHYSICAL" ? "physical" : "both"}>
                            {TYPE_LABELS[sub.type]}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{sub.partnerName ?? "—"}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">
                          {new Date(sub.submittedAt).toLocaleDateString("pt-MZ")}
                        </td>
                        <td className="py-3 px-4">
                          {sub.status === "PENDING_REVIEW" && (
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
        {(data?.totalPages || 0) > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Página {page + 1} de {data?.totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= (data?.totalPages || 1) - 1} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {pendingCount > 0 && (
        <p className="mt-3 text-xs text-yellow-700 flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5" />
          {pendingCount} submissão(ões) a aguardar revisão nesta página.
        </p>
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type AdminBooksTab = "catalog" | "submissions";

export default function AdminBooksPage() {
  const [tab, setTab] = useState<AdminBooksTab>("catalog");

  const { data: pending } = useAdminSubmissions("PENDING_REVIEW", 0);
  const pendingTotal = pending?.totalElements ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Livros</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestão do catálogo e publicação de novas obras</p>
        </div>
        {tab === "catalog" && (
          <Link href="/admin/books/new">
            <Button>
              <Plus className="h-4 w-4" /> Novo Livro
            </Button>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab("catalog")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === "catalog" ? "border-blue-800 text-blue-800" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Catálogo
        </button>
        <button
          onClick={() => setTab("submissions")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === "submissions" ? "border-blue-800 text-blue-800" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Submissões de parceiros
          {pendingTotal > 0 && (
            <span className="h-5 min-w-5 px-1.5 rounded-full bg-yellow-500 text-white text-xs font-bold flex items-center justify-center">
              {pendingTotal}
            </span>
          )}
        </button>
      </div>

      {tab === "catalog" ? <CatalogTab /> : <SubmissionsTab />}
    </div>
  );
}
