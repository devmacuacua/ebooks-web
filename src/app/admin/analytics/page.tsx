"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, BookOpen, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMZN } from "@/lib/api";
import api from "@/lib/api";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

interface TopBook {
  bookId: string;
  bookTitle: string;
  count: number;
  revenue: number;
}

interface DashboardData {
  revenue: { today: number; thisMonth: number; allTime: number; todayOrders: number; monthOrders: number };
  users: { today: number; total: number };
  subscriptions: { active: number; thisMonth: number };
  deliveries: { pending: number };
}

const RANGE_OPTIONS = [
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
];

export default function AdminAnalyticsPage() {
  const [rangeDays, setRangeDays] = useState(30);

  const from = format(subDays(new Date(), rangeDays), "yyyy-MM-dd");
  const to = format(new Date(), "yyyy-MM-dd");

  const { data: dashboard, isLoading: dashLoading } = useQuery<DashboardData>({
    queryKey: ["analytics-dashboard"],
    queryFn: async () => {
      const { data } = await api.get<DashboardData>("/api/analytics/dashboard");
      return data;
    },
    refetchInterval: 120_000,
  });

  const { data: revenueSeries } = useQuery<RevenuePoint[]>({
    queryKey: ["analytics-revenue", from, to],
    queryFn: async () => {
      const { data } = await api.get<RevenuePoint[]>(
        `/api/analytics/revenue/series?from=${from}&to=${to}`
      );
      return data;
    },
  });

  const { data: topBooks } = useQuery<TopBook[]>({
    queryKey: ["analytics-top-books"],
    queryFn: async () => {
      const { data } = await api.get<TopBook[]>("/api/analytics/books/top?limit=10");
      return data;
    },
  });

  const chartData = (revenueSeries ?? []).map((p) => ({
    date: format(new Date(p.date), "d MMM", { locale: ptBR }),
    Receita: p.revenue,
    Encomendas: p.orders,
  }));

  const topBooksData = (topBooks ?? []).map((b) => ({
    title: b.bookTitle.length > 18 ? b.bookTitle.slice(0, 18) + "…" : b.bookTitle,
    Vendas: b.count,
    Receita: b.revenue,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Métricas de receita, utilizadores e livros</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Receita Hoje",
            value: dashboard?.revenue.today,
            icon: CreditCard,
            color: "text-green-600",
            bg: "bg-green-50",
            fmt: formatMZN,
          },
          {
            label: "Receita do Mês",
            value: dashboard?.revenue.thisMonth,
            icon: TrendingUp,
            color: "text-blue-800",
            bg: "bg-blue-50",
            fmt: formatMZN,
          },
          {
            label: "Novos Utilizadores (hoje)",
            value: dashboard?.users.today,
            icon: Users,
            color: "text-purple-600",
            bg: "bg-purple-50",
            fmt: (v: number) => v.toLocaleString("pt-MZ"),
          },
          {
            label: "Total de Receita",
            value: dashboard?.revenue.allTime,
            icon: BookOpen,
            color: "text-orange-600",
            bg: "bg-orange-50",
            fmt: formatMZN,
          },
        ].map(({ label, value, icon: Icon, color, bg, fmt }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  {dashLoading ? (
                    <div className="h-5 w-20 bg-gray-100 animate-pulse rounded mt-1" />
                  ) : (
                    <p className="text-lg font-bold text-gray-900">
                      {value != null ? fmt(value) : "—"}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue area chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Receita por Dia</CardTitle>
              <div className="flex gap-1">
                {RANGE_OPTIONS.map(({ label, days }) => (
                  <button
                    key={days}
                    onClick={() => setRangeDays(days)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      rangeDays === days
                        ? "bg-blue-800 text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e40af" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#1e40af" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    interval={Math.floor(chartData.length / 6)}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    width={36}
                  />
                  <Tooltip
                    formatter={(value) => [formatMZN(Number(value ?? 0)), "Receita"]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Receita"
                    stroke="#1e40af"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top books bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top 10 Livros (vendas)</CardTitle>
          </CardHeader>
          <CardContent>
            {topBooksData.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={topBooksData}
                  layout="vertical"
                  margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis
                    type="category"
                    dataKey="title"
                    tick={{ fontSize: 10 }}
                    width={110}
                  />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Vendas" fill="#1e40af" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Today summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: "Receita", value: dashboard?.revenue.today, fmt: formatMZN },
                { label: "Encomendas", value: dashboard?.revenue.todayOrders, fmt: (v: number) => v.toString() },
                { label: "Novos utilizadores", value: dashboard?.users.today, fmt: (v: number) => v.toString() },
                { label: "Subscrições (mês)", value: dashboard?.subscriptions.thisMonth, fmt: (v: number) => v.toString() },
              ].map(({ label, value, fmt }) => (
                <div key={label}>
                  <dt className="text-gray-500 text-xs">{label}</dt>
                  <dd className="font-semibold text-gray-900 mt-0.5">
                    {dashLoading ? (
                      <div className="h-4 w-16 bg-gray-100 animate-pulse rounded" />
                    ) : (
                      value != null ? fmt(value) : "—"
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        {/* All-time summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Acumulado</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: "Receita total", value: dashboard?.revenue.allTime, fmt: formatMZN },
                { label: "Encomendas (mês)", value: dashboard?.revenue.monthOrders, fmt: (v: number) => v.toLocaleString("pt-MZ") },
                { label: "Utilizadores", value: dashboard?.users.total, fmt: (v: number) => v.toLocaleString("pt-MZ") },
                { label: "Subscrições activas", value: dashboard?.subscriptions.active, fmt: (v: number) => v.toLocaleString("pt-MZ") },
              ].map(({ label, value, fmt }) => (
                <div key={label}>
                  <dt className="text-gray-500 text-xs">{label}</dt>
                  <dd className="font-semibold text-gray-900 mt-0.5">
                    {dashLoading ? (
                      <div className="h-4 w-16 bg-gray-100 animate-pulse rounded" />
                    ) : (
                      value != null ? fmt(value) : "—"
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
