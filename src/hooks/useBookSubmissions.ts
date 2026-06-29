"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import type { BookSubmission, BookSubmissionStatus, BookType, PaginatedResponse } from "@/types";

// ── Partner: list my submissions ──────────────────────────────────────────────

export function useMySubmissions(enabled = true) {
  return useQuery<BookSubmission[]>({
    queryKey: ["my-book-submissions"],
    queryFn: async () => {
      const { data } = await api.get<BookSubmission[]>("/api/partner/books/submissions");
      return data;
    },
    enabled: enabled && isAuthenticated(),
    staleTime: 30_000,
  });
}

// ── Partner: submit a new book ────────────────────────────────────────────────

export interface SubmitBookPayload {
  title: string;
  description: string;
  price: number;
  type: BookType;
  language: string;
  isbn?: string;
  publisher?: string;
  pageCount?: number;
  stockQuantity?: number;
  authorIds?: string[];
  categoryIds?: string[];
  coverFile?: File | null;
  ebookFile?: File | null;
}

export function useSubmitBook() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: SubmitBookPayload) => {
      const { coverFile, ebookFile, ...meta } = payload;

      const { data: submission } = await api.post<BookSubmission>(
        "/api/partner/books/submissions",
        meta
      );

      if (coverFile) {
        const fd = new FormData();
        fd.append("file", coverFile);
        await api.post(`/api/media/submissions/${submission.id}/cover`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (ebookFile && (meta.type === "EBOOK" || meta.type === "BOTH")) {
        const fd = new FormData();
        fd.append("file", ebookFile);
        await api.post(`/api/media/submissions/${submission.id}/ebook`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      return submission;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-book-submissions"] });
      toast({
        variant: "success",
        title: "Livro submetido!",
        description: "A equipa irá analisar a submissão e dar um parecer em breve.",
      });
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Erro ao submeter o livro.";
      toast({ variant: "destructive", title: "Erro", description: msg });
    },
  });
}

// ── Admin: list submissions ───────────────────────────────────────────────────

export function useAdminSubmissions(status?: BookSubmissionStatus, page = 0) {
  return useQuery<PaginatedResponse<BookSubmission>>({
    queryKey: ["admin-submissions", status, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), size: "20" });
      if (status) params.set("status", status);
      const { data } = await api.get<PaginatedResponse<BookSubmission>>(
        `/api/admin/books/submissions?${params}`
      );
      return data;
    },
    staleTime: 15_000,
  });
}

// ── Admin: review a submission ────────────────────────────────────────────────

export function useReviewSubmission() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      action,
      parecer,
    }: {
      id: string;
      action: "APPROVE" | "REJECT";
      parecer?: string;
    }) => {
      await api.post(`/api/admin/books/submissions/${id}/review`, { action, parecer });
    },
    onSuccess: (_, { action }) => {
      qc.invalidateQueries({ queryKey: ["admin-submissions"] });
      toast({
        variant: "success",
        title: action === "APPROVE" ? "Livro aprovado e publicado!" : "Submissão rejeitada.",
      });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao processar a revisão." });
    },
  });
}
