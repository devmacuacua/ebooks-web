"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Package, BookOpen, Crown, Info } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AppNotification {
  id: string;
  userId: string;
  type: "ORDER_UPDATE" | "NEW_BOOK" | "SUBSCRIPTION" | "SYSTEM";
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<AppNotification["type"], React.ReactNode> = {
  ORDER_UPDATE: <Package className="h-3.5 w-3.5 text-blue-600" />,
  NEW_BOOK: <BookOpen className="h-3.5 w-3.5 text-green-600" />,
  SUBSCRIPTION: <Crown className="h-3.5 w-3.5 text-yellow-500" />,
  SYSTEM: <Info className="h-3.5 w-3.5 text-gray-500" />,
};

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["notif-unread", userId],
    queryFn: async () => {
      const { data } = await api.get<number>(
        `/api/notifications/user/${userId}/unread-count`
      );
      return data;
    },
    refetchInterval: 60_000,
    enabled: Boolean(userId),
  });

  const { data: notifications = [], isLoading } = useQuery<AppNotification[]>({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const { data } = await api.get<AppNotification[]>(
        `/api/notifications/user/${userId}`
      );
      return data.slice(0, 30);
    },
    enabled: open && Boolean(userId),
    staleTime: 30_000,
  });

  const markOne = useMutation({
    mutationFn: (id: string) => api.patch(`/api/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", userId] });
      qc.invalidateQueries({ queryKey: ["notif-unread", userId] });
    },
  });

  const markAll = useMutation({
    mutationFn: () =>
      api.patch(`/api/notifications/user/${userId}/read-all`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", userId] });
      qc.invalidateQueries({ queryKey: ["notif-unread", userId] });
    },
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        aria-label="Notificações"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notificações</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-blue-800 border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                Sem notificações
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) markOne.mutate(n.id);
                  }}
                  className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors ${
                    n.isRead ? "opacity-60" : ""
                  }`}
                >
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    {TYPE_ICON[n.type] ?? <Info className="h-3.5 w-3.5 text-gray-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-medium text-gray-900 ${!n.isRead ? "font-semibold" : ""}`}>
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{n.body}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {format(new Date(n.createdAt), "d MMM, HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
