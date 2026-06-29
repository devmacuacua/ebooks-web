"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, ShieldOff, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  avatar?: string;
}

interface PagedResponse {
  content: User[];
  totalElements: number;
  totalPages: number;
  number: number;
}

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800",
  CUSTOMER: "bg-gray-100 text-gray-700",
  PARTNER: "bg-blue-100 text-blue-700",
};

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<PagedResponse>({
    queryKey: ["admin-users", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), size: "20", sort: "createdAt,desc" });
      if (search) params.set("search", search);
      const { data } = await api.get<PagedResponse>(
        `/api/admin/users?${params.toString()}`
      );
      return data;
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ id, newRole }: { id: string; newRole: string }) => {
      await api.patch(`/api/admin/users/${id}/role?newRole=${newRole}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const filtered = data?.content ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Utilizadores</h1>
        <p className="text-gray-500 text-sm mt-1">Gestão de contas e permissões</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm">
              {data ? `${data.totalElements} utilizadores` : "A carregar..."}
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Filtrar..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="w-full h-8 rounded-md border border-gray-200 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400 text-sm">A carregar...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Utilizador</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Função</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Email verificado</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Acções</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-800 shrink-0">
                            {user.name?.slice(0, 2).toUpperCase() || "??"}
                          </div>
                          <span className="font-medium text-gray-900 truncate max-w-[140px]">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_BADGE[user.role] ?? "bg-gray-100 text-gray-600"}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${user.emailVerified ? "text-green-600" : "text-gray-400"}`}>
                          {user.emailVerified ? "Sim" : "Não"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.role === "ADMIN" ? (
                          <button
                            onClick={() => roleMutation.mutate({ id: user.id, newRole: "CUSTOMER" })}
                            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 transition-colors"
                            title="Remover admin"
                          >
                            <ShieldOff className="h-3.5 w-3.5" />
                            Remover admin
                          </button>
                        ) : (
                          <button
                            onClick={() => roleMutation.mutate({ id: user.id, newRole: "ADMIN" })}
                            className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 transition-colors"
                            title="Tornar admin"
                          >
                            <Shield className="h-3.5 w-3.5" />
                            Tornar admin
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 text-sm rounded-md border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                Anterior
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">
                {page + 1} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                disabled={page >= data.totalPages - 1}
                className="px-3 py-1 text-sm rounded-md border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                Seguinte
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
