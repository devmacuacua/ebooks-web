"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Package, DollarSign, Users, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMZN } from "@/lib/api";
import api from "@/lib/api";

interface DashboardStats {
  totalBooks: number;
  ordersToday: number;
  revenueToday: number;
  revenueMonth: number;
  activeSubscriptions: number;
  totalUsers: number;
  pendingOrders: number;
}

const STAT_CARDS = [
  {
    key: "totalBooks" as const,
    label: "Total de Livros",
    icon: BookOpen,
    color: "text-blue-800",
    bg: "bg-blue-50",
    format: (v: number) => v.toLocaleString("pt-MZ"),
  },
  {
    key: "ordersToday" as const,
    label: "Encomendas Hoje",
    icon: Package,
    color: "text-orange-600",
    bg: "bg-orange-50",
    format: (v: number) => v.toLocaleString("pt-MZ"),
  },
  {
    key: "revenueMonth" as const,
    label: "Receita do Mês",
    icon: DollarSign,
    color: "text-green-600",
    bg: "bg-green-50",
    format: (v: number) => formatMZN(v),
  },
  {
    key: "activeSubscriptions" as const,
    label: "Subscrições Activas",
    icon: TrendingUp,
    color: "text-purple-600",
    bg: "bg-purple-50",
    format: (v: number) => v.toLocaleString("pt-MZ"),
  },
  {
    key: "totalUsers" as const,
    label: "Utilizadores",
    icon: Users,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    format: (v: number) => v.toLocaleString("pt-MZ"),
  },
  {
    key: "pendingOrders" as const,
    label: "Encomendas Pendentes",
    icon: AlertCircle,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    format: (v: number) => v.toLocaleString("pt-MZ"),
  },
];

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>("/api/admin/stats");
      return data;
    },
    refetchInterval: 60_000,
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral da EBooksStore</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {STAT_CARDS.map(({ key, label, icon: Icon, color, bg, format }) => (
          <Card key={key}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  {isLoading ? (
                    <div className="h-6 w-20 bg-gray-100 animate-pulse rounded mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {stats ? format(stats[key]) : "—"}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Acções Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/admin/books/new"
              className="block text-sm text-blue-800 hover:underline"
            >
              + Adicionar novo livro
            </Link>
            <Link
              href="/admin/orders"
              className="block text-sm text-blue-800 hover:underline"
            >
              → Ver encomendas pendentes
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Receita Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-32 bg-gray-100 animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold text-green-600">
                {stats ? formatMZN(stats.revenueToday) : "—"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
