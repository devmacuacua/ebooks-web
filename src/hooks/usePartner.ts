"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";

export interface Partner {
  id: string;
  userId: string;
  name: string;
  email: string;
  websiteUrl?: string;
  description?: string;
  logoUrl?: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  createdAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  publicKey: string;
  secretKey?: string;
  createdAt: string;
  lastUsedAt?: string;
  revoked: boolean;
}

export interface PartnerBook {
  id: string;
  bookId: string;
  bookTitle: string;
  coverUrl?: string;
  customPrice?: number;
  enabled: boolean;
}

export function usePartnerProfile() {
  return useQuery<Partner | null>({
    queryKey: ["partner-profile"],
    queryFn: async () => {
      try {
        const { data } = await api.get<Partner>("/api/partner/me");
        return data;
      } catch (e: unknown) {
        const status = (e as { response?: { status?: number } }).response?.status;
        if (status === 404 || status === 401) return null;
        throw e;
      }
    },
    enabled: isAuthenticated(),
    staleTime: 60_000,
  });
}

export function useRegisterPartner() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: { name: string; email: string; websiteUrl?: string; description?: string }) => {
      const { data } = await api.post<Partner>("/api/partner", payload);
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(["partner-profile"], data);
      toast({ variant: "success", title: "Candidatura enviada!", description: "A sua conta de parceiro está pendente de aprovação." });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message || "Erro ao registar como parceiro.";
      toast({ variant: "destructive", title: "Erro", description: msg });
    },
  });
}

export function useUpdatePartner() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: Partial<Partner>) => {
      const { data } = await api.patch<Partner>("/api/partner/me", payload);
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(["partner-profile"], data);
      toast({ variant: "success", title: "Perfil actualizado" });
    },
    onError: () => toast({ variant: "destructive", title: "Erro ao actualizar perfil" }),
  });
}

export function useApiKeys(partnerStatus?: Partner["status"]) {
  return useQuery<ApiKey[]>({
    queryKey: ["partner-api-keys"],
    queryFn: async () => {
      const { data } = await api.get<ApiKey[]>("/api/partner/me/api-keys");
      return data;
    },
    enabled: isAuthenticated() && partnerStatus === "ACTIVE",
    staleTime: 30_000,
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post<ApiKey>("/api/partner/me/api-keys", { name });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-api-keys"] });
      toast({ variant: "success", title: "Chave API criada" });
    },
    onError: () => toast({ variant: "destructive", title: "Erro ao criar chave API" }),
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (keyId: string) => {
      await api.patch(`/api/partner/me/api-keys/${keyId}/revoke`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-api-keys"] });
      toast({ title: "Chave revogada" });
    },
    onError: () => toast({ variant: "destructive", title: "Erro ao revogar chave" }),
  });
}

export function usePartnerBooks(partnerStatus?: Partner["status"]) {
  return useQuery<PartnerBook[]>({
    queryKey: ["partner-books"],
    queryFn: async () => {
      const { data } = await api.get<PartnerBook[]>("/api/partner/me/books");
      return data;
    },
    enabled: isAuthenticated() && partnerStatus === "ACTIVE",
    staleTime: 60_000,
  });
}

// ── Revenue ───────────────────────────────────────────────────────────────────

export interface RevenueSale {
  id: string;
  orderId: string;
  bookTitle: string;
  grossAmount: number;
  partnerAmount: number;
  platformAmount: number;
  currency: string;
  settledAt: string | null;
  createdAt: string;
}

export interface RevenueSummary {
  allTime: { totalSales: number; grossRevenue: number; yourShare: number; platformShare: number };
  pending: { sales: number; amount: number };
  recentSales: RevenueSale[];
}

export interface RevenueDetails {
  items: RevenueSale[];
  total: number;
  page: number;
  limit: number;
}

export interface RevenueMonthPoint {
  month: string;
  sales: number;
  gross: number;
  partner_share: number;
}

export function useRevenueSummary(partnerStatus?: Partner["status"]) {
  return useQuery<RevenueSummary>({
    queryKey: ["partner-revenue-summary"],
    queryFn: async () => {
      const { data } = await api.get<RevenueSummary>("/api/partner/me/revenue");
      return data;
    },
    enabled: isAuthenticated() && partnerStatus === "ACTIVE",
    staleTime: 60_000,
  });
}

export function useRevenueDetails(page = 1, partnerStatus?: Partner["status"]) {
  return useQuery<RevenueDetails>({
    queryKey: ["partner-revenue-details", page],
    queryFn: async () => {
      const { data } = await api.get<RevenueDetails>(
        `/api/partner/me/revenue/details?page=${page}&limit=15`
      );
      return data;
    },
    enabled: isAuthenticated() && partnerStatus === "ACTIVE",
    staleTime: 30_000,
  });
}

export function useRevenueMonthly(year?: number, partnerStatus?: Partner["status"]) {
  const y = year ?? new Date().getFullYear();
  return useQuery<RevenueMonthPoint[]>({
    queryKey: ["partner-revenue-monthly", y],
    queryFn: async () => {
      const { data } = await api.get<RevenueMonthPoint[]>(
        `/api/partner/me/revenue/monthly?year=${y}`
      );
      return data;
    },
    enabled: isAuthenticated() && partnerStatus === "ACTIVE",
    staleTime: 120_000,
  });
}
