"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import api from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type PartnerStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED";

interface Partner {
  id: string;
  name: string;
  website: string;
  email: string;
  contactName: string;
  description: string;
  status: PartnerStatus;
  revenueSharePct: number;
  createdAt: string;
}

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

const STATUS_COLORS: Record<PartnerStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ACTIVE: "bg-green-100 text-green-700",
  SUSPENDED: "bg-orange-100 text-orange-700",
  REJECTED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<PartnerStatus, string> = {
  PENDING: "Pendente",
  ACTIVE: "Activo",
  SUSPENDED: "Suspenso",
  REJECTED: "Rejeitado",
};

const STATUS_OPTIONS: { value: PartnerStatus | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "PENDING", label: "Pendentes" },
  { value: "ACTIVE", label: "Activos" },
  { value: "SUSPENDED", label: "Suspensos" },
  { value: "REJECTED", label: "Rejeitados" },
];

export default function AdminPartnersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PartnerStatus | "">("");
  const [page, setPage] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<Partner>>({
    queryKey: ["admin-partners", search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), size: "20" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const { data } = await api.get<PaginatedResponse<Partner>>(
        `/api/admin/partners?${params.toString()}`
      );
      return data;
    },
  });

  const changeStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PartnerStatus }) => {
      await api.patch(`/api/admin/partners/${id}/status`, { status });
    },
    onSuccess: (_data, { status }) => {
      const label = STATUS_LABELS[status];
      toast({ variant: "success", title: `Parceiro ${label.toLowerCase()}!` });
      queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível actualizar o parceiro." });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parceiros</h1>
          {data && (
            <p className="text-sm text-gray-500 mt-0.5">{data.totalElements} parceiros</p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Pesquisar por nome, email, website..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as PartnerStatus | ""); setPage(0); }}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Parceiro</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Contacto</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Comissão</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Desde</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="py-3 px-4">
                        <div className="h-6 bg-gray-100 animate-pulse rounded" />
                      </td>
                    </tr>
                  ))
                : data?.content.map((partner) => (
                    <tr key={partner.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{partner.name}</p>
                          <a
                            href={partner.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-700 hover:underline flex items-center gap-1"
                          >
                            {partner.website}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs">
                        <p>{partner.contactName}</p>
                        <p className="text-gray-400">{partner.email}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-700 font-medium">
                        {partner.revenueSharePct}%
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[partner.status]}`}>
                          {STATUS_LABELS[partner.status]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">
                        {format(new Date(partner.createdAt), "d MMM yyyy", { locale: ptBR })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {partner.status === "PENDING" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-700 border-green-300 hover:bg-green-50"
                                onClick={() => changeStatus.mutate({ id: partner.id, status: "ACTIVE" })}
                                disabled={changeStatus.isPending}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-700 border-red-300 hover:bg-red-50"
                                onClick={() => changeStatus.mutate({ id: partner.id, status: "REJECTED" })}
                                disabled={changeStatus.isPending}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Rejeitar
                              </Button>
                            </>
                          )}
                          {partner.status === "ACTIVE" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-orange-700 border-orange-300 hover:bg-orange-50"
                              onClick={() => changeStatus.mutate({ id: partner.id, status: "SUSPENDED" })}
                              disabled={changeStatus.isPending}
                            >
                              Suspender
                            </Button>
                          )}
                          {partner.status === "SUSPENDED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-700 border-green-300 hover:bg-green-50"
                              onClick={() => changeStatus.mutate({ id: partner.id, status: "ACTIVE" })}
                              disabled={changeStatus.isPending}
                            >
                              Reactivar
                            </Button>
                          )}
                        </div>
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
