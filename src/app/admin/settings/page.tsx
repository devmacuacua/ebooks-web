"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import api from "@/lib/api";

interface Settings {
  siteName: string;
  supportEmail: string;
  deliveryFee: string;
  maxItemsPerOrder: string;
  enableSubscriptions: boolean;
  enablePartnerProgram: boolean;
  enablePhysicalBooks: boolean;
  maintenanceMode: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  siteName: "EBooksStore",
  supportEmail: "suporte@ebooks.co.mz",
  deliveryFee: "150",
  maxItemsPerOrder: "10",
  enableSubscriptions: true,
  enablePartnerProgram: true,
  enablePhysicalBooks: true,
  maintenanceMode: false,
};

export default function AdminSettingsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data } = await api.get<Settings>("/api/admin/settings");
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: Settings) => {
      const { data } = await api.put<Settings>("/api/admin/settings", payload);
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(["admin-settings"], data);
      toast({ variant: "success", title: "Configurações guardadas" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao guardar configurações" });
    },
  });

  const current = settings ?? DEFAULT_SETTINGS;

  const set = (key: keyof Settings, value: string | boolean) => {
    qc.setQueryData(["admin-settings"], { ...current, [key]: value });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(current);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm mt-1">Parâmetros gerais da plataforma</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        {/* General */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Geral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da plataforma
              </label>
              <input
                type="text"
                value={current.siteName}
                onChange={(e) => set("siteName", e.target.value)}
                className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de suporte
              </label>
              <input
                type="email"
                value={current.supportEmail}
                onChange={(e) => set("supportEmail", e.target.value)}
                className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
              />
            </div>
          </CardContent>
        </Card>

        {/* Commerce */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Comércio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taxa de entrega padrão (MZN)
              </label>
              <input
                type="number"
                value={current.deliveryFee}
                onChange={(e) => set("deliveryFee", e.target.value)}
                className="w-48 h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máximo de itens por encomenda
              </label>
              <input
                type="number"
                value={current.maxItemsPerOrder}
                onChange={(e) => set("maxItemsPerOrder", e.target.value)}
                className="w-48 h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
              />
            </div>
          </CardContent>
        </Card>

        {/* Feature flags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Funcionalidades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: "enableSubscriptions" as const, label: "Subscrições", desc: "Planos mensais/anuais de acesso ilimitado" },
              { key: "enablePartnerProgram" as const, label: "Programa de Parceiros", desc: "Escritores e editoras podem vender na plataforma" },
              { key: "enablePhysicalBooks" as const, label: "Livros Físicos", desc: "Venda e entrega de livros em papel" },
              { key: "maintenanceMode" as const, label: "Modo de Manutenção", desc: "Desativa o acesso público à loja" },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={current[key] as boolean}
                    onChange={(e) => set(key, e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-10 h-6 rounded-full transition-colors ${
                      current[key] ? "bg-blue-800" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        current[key] ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-5 py-2 bg-blue-800 text-white text-sm font-medium rounded-md hover:bg-blue-900 disabled:opacity-60 transition-colors"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar configurações
          </button>
          {mutation.isSuccess && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check className="h-4 w-4" /> Guardado
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
