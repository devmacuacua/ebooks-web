"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import api from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type DeliveryStatus =
  | "CREATED"
  | "PICKING"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "RETURNED";

interface Delivery {
  id: string;
  orderId: string;
  trackingCode: string;
  status: DeliveryStatus;
  recipientName: string;
  province: string;
  city: string;
  estimatedDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  CREATED: "Criada",
  PICKING: "Em Recolha",
  IN_TRANSIT: "Em Trânsito",
  OUT_FOR_DELIVERY: "Em Entrega",
  DELIVERED: "Entregue",
  FAILED: "Falhada",
  RETURNED: "Devolvida",
};

const STATUS_COLORS: Record<DeliveryStatus, string> = {
  CREATED: "bg-gray-100 text-gray-700",
  PICKING: "bg-yellow-100 text-yellow-800",
  IN_TRANSIT: "bg-blue-100 text-blue-800",
  OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  RETURNED: "bg-orange-100 text-orange-700",
};

const NEXT_STATUS: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  CREATED: "PICKING",
  PICKING: "IN_TRANSIT",
  IN_TRANSIT: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

const STATUS_OPTIONS: { value: DeliveryStatus | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "CREATED", label: "Criada" },
  { value: "PICKING", label: "Em Recolha" },
  { value: "IN_TRANSIT", label: "Em Trânsito" },
  { value: "OUT_FOR_DELIVERY", label: "Em Entrega" },
  { value: "DELIVERED", label: "Entregue" },
  { value: "FAILED", label: "Falhada" },
  { value: "RETURNED", label: "Devolvida" },
];

export default function AdminDeliveriesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "">("");
  const [page, setPage] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<Delivery>>({
    queryKey: ["admin-deliveries", search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), size: "20" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const { data } = await api.get<PaginatedResponse<Delivery>>(
        `/api/admin/deliveries?${params.toString()}`
      );
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: DeliveryStatus; notes?: string }) => {
      await api.patch(`/api/admin/deliveries/${id}/status`, { status, notes });
    },
    onSuccess: () => {
      toast({ variant: "success", title: "Estado actualizado!" });
      queryClient.invalidateQueries({ queryKey: ["admin-deliveries"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível actualizar o estado." });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entregas</h1>
          {data && (
            <p className="text-sm text-gray-500 mt-0.5">{data.totalElements} entregas</p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Pesquisar por código de rastreio, destinatário..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as DeliveryStatus | ""); setPage(0); }}
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
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Rastreio</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Destinatário</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Destino</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
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
                : data?.content.map((delivery) => {
                    const nextStatus = NEXT_STATUS[delivery.status];
                    return (
                      <tr key={delivery.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs">
                          <div className="flex items-center gap-1.5">
                            <Truck className="h-3 w-3 text-gray-400" />
                            {delivery.trackingCode}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{delivery.recipientName}</td>
                        <td className="py-3 px-4 text-gray-500 text-xs">
                          {delivery.city}, {delivery.province}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[delivery.status]}`}>
                            {STATUS_LABELS[delivery.status]}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-xs">
                          {format(new Date(delivery.createdAt), "d MMM yyyy", { locale: ptBR })}
                        </td>
                        <td className="py-3 px-4">
                          {nextStatus && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateStatus.mutate({ id: delivery.id, status: nextStatus })
                              }
                              disabled={updateStatus.isPending}
                            >
                              → {STATUS_LABELS[nextStatus]}
                            </Button>
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
