"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCheck,
  Package,
  BookOpen,
  Crown,
  CreditCard,
  Truck,
  Info,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCurrentUser } from "@/hooks/useAuth";
import api from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type NotificationType =
  | "SUBSCRIPTION_EXPIRING"
  | "SUBSCRIPTION_EXPIRED"
  | "SUBSCRIPTION_ACTIVATED"
  | "ORDER_STATUS_CHANGED"
  | "DELIVERY_UPDATE"
  | "NEW_BOOK"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_FAILED";

interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsPage {
  content: AppNotification[];
  totalElements: number;
  totalPages: number;
}

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  ORDER_STATUS_CHANGED: <Package className="h-4 w-4 text-blue-600" />,
  NEW_BOOK: <BookOpen className="h-4 w-4 text-green-600" />,
  SUBSCRIPTION_EXPIRING: <Crown className="h-4 w-4 text-yellow-500" />,
  SUBSCRIPTION_EXPIRED: <Crown className="h-4 w-4 text-red-500" />,
  SUBSCRIPTION_ACTIVATED: <Crown className="h-4 w-4 text-green-600" />,
  DELIVERY_UPDATE: <Truck className="h-4 w-4 text-purple-600" />,
  PAYMENT_CONFIRMED: <CreditCard className="h-4 w-4 text-green-600" />,
  PAYMENT_FAILED: <CreditCard className="h-4 w-4 text-red-500" />,
};

const TYPE_FILTER_OPTIONS: { value: NotificationType | ""; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "ORDER_STATUS_CHANGED", label: "Encomendas" },
  { value: "DELIVERY_UPDATE", label: "Entregas" },
  { value: "PAYMENT_CONFIRMED", label: "Pagamentos confirmados" },
  { value: "PAYMENT_FAILED", label: "Pagamentos falhados" },
  { value: "SUBSCRIPTION_ACTIVATED", label: "Subscrição activada" },
  { value: "SUBSCRIPTION_EXPIRING", label: "Subscrição a expirar" },
  { value: "SUBSCRIPTION_EXPIRED", label: "Subscrição expirada" },
  { value: "NEW_BOOK", label: "Novos livros" },
];

function NotificationsContent({ userId }: { userId: string }) {
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState<NotificationType | "">("");
  const [readFilter, setReadFilter] = useState<"" | "unread" | "read">("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<NotificationsPage>({
    queryKey: ["notifications-page", userId, page, typeFilter, readFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), size: "20" });
      if (typeFilter) params.set("type", typeFilter);
      if (readFilter === "unread") params.set("isRead", "false");
      if (readFilter === "read") params.set("isRead", "true");
      const { data } = await api.get<NotificationsPage>(
        `/api/notifications/user/${userId}?${params.toString()}`
      );
      return data;
    },
  });

  const markOne = useMutation({
    mutationFn: (id: string) => api.patch(`/api/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications-page", userId] });
      qc.invalidateQueries({ queryKey: ["notif-unread", userId] });
    },
  });

  const markAll = useMutation({
    mutationFn: () => api.patch(`/api/notifications/user/${userId}/read-all`),
    onSuccess: () => {
      toast({ title: "Todas as notificações marcadas como lidas." });
      qc.invalidateQueries({ queryKey: ["notifications-page", userId] });
      qc.invalidateQueries({ queryKey: ["notif-unread", userId] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao marcar notificações." });
    },
  });

  const unreadCount = data?.content.filter((n) => !n.isRead).length ?? 0;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Bell className="h-5 w-5 text-blue-800" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notificações</h1>
            {data && (
              <p className="text-sm text-gray-500">{data.totalElements} no total</p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-1.5" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value as NotificationType | ""); setPage(0); }}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
        >
          {TYPE_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={readFilter}
          onChange={(e) => { setReadFilter(e.target.value as "" | "unread" | "read"); setPage(0); }}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
        >
          <option value="">Todas</option>
          <option value="unread">Não lidas</option>
          <option value="read">Lidas</option>
        </select>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-4">
                <div className="h-9 w-9 bg-gray-100 animate-pulse rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 animate-pulse rounded w-3/4" />
                  <div className="h-3 bg-gray-100 animate-pulse rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : !data?.content.length ? (
          <div className="py-16 text-center">
            <Bell className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Sem notificações</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.content.map((n) => (
              <button
                key={n.id}
                onClick={() => { if (!n.isRead) markOne.mutate(n.id); }}
                className={`w-full text-left flex gap-4 px-4 py-4 hover:bg-gray-50 transition-colors ${
                  n.isRead ? "opacity-60" : ""
                }`}
              >
                <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full bg-gray-100">
                  {TYPE_ICON[n.type] ?? <Info className="h-4 w-4 text-gray-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-sm text-gray-900 ${!n.isRead ? "font-semibold" : "font-medium"}`}>
                      {n.title}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {format(new Date(n.createdAt), "d MMM, HH:mm", { locale: ptBR })}
                      </span>
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
                </div>
              </button>
            ))}
          </div>
        )}

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
    </main>
  );
}

export default function NotificationsPage() {
  const user = useCurrentUser();
  return (
    <AuthGuard>
      {user ? <NotificationsContent userId={user.id} /> : null}
    </AuthGuard>
  );
}
