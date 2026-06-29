"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { OrderStatusBadge } from "@/components/ui/badge";
import { useOrders } from "@/hooks/useOrders";
import { formatMZN } from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Order, DeliveryTrackingStep } from "@/types";

const TRACKING_ICONS: Record<string, React.ReactNode> = {
  ORDERED: <Clock className="h-4 w-4" />,
  PAID: <CheckCircle className="h-4 w-4" />,
  PROCESSING: <Package className="h-4 w-4" />,
  SHIPPED: <Truck className="h-4 w-4" />,
  DELIVERED: <CheckCircle className="h-4 w-4" />,
};

function TrackingTimeline({ steps }: { steps: DeliveryTrackingStep[] }) {
  return (
    <div className="pl-4 py-3 space-y-4 border-l-2 border-gray-200">
      {steps.map((step, i) => (
        <div key={i} className="relative flex gap-3">
          <div
            className={`absolute -left-[calc(1rem+1px)] flex h-5 w-5 items-center justify-center rounded-full ${
              step.completed
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-400"
            }`}
          >
            {TRACKING_ICONS[step.status] || <AlertCircle className="h-3 w-3" />}
          </div>
          <div className="ml-2">
            <p
              className={`text-sm font-medium ${
                step.completed ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {step.description}
            </p>
            {step.timestamp && (
              <p className="text-xs text-gray-400">
                {format(new Date(step.timestamp), "d MMM yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Package className="h-5 w-5 text-blue-800" />
          </div>
          <div>
            <p className="text-xs text-gray-500">
              Encomenda #{order.id.slice(-8).toUpperCase()}
            </p>
            <p className="text-sm font-medium text-gray-900">
              {format(new Date(order.createdAt), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">{formatMZN(order.total)}</p>
            <OrderStatusBadge status={order.status} />
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-5">
          {/* Items */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Itens
            </h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative h-14 w-10 rounded bg-gray-100 shrink-0 overflow-hidden">
                    {item.coverImageUrl ? (
                      <Image
                        src={item.coverImageUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-4 w-4 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.type === "EBOOK" ? "Ebook" : "Físico"} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-900 shrink-0">
                    {formatMZN(item.totalPrice)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="text-sm space-y-1 border-t pt-3">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatMZN(order.subtotal)}</span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Entrega</span>
                <span>{formatMZN(order.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 pt-1 border-t">
              <span>Total</span>
              <span>{formatMZN(order.total)}</span>
            </div>
          </div>

          {/* Delivery address */}
          {order.address && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Endereço de Entrega
              </h3>
              <p className="text-sm text-gray-700">
                {order.address.street}, {order.address.city},{" "}
                {order.address.province}
              </p>
            </div>
          )}

          {/* Tracking timeline */}
          {order.deliveryTracking && order.deliveryTracking.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Rastreamento
              </h3>
              <TrackingTimeline steps={order.deliveryTracking} />
            </div>
          )}

          {/* Ebook access */}
          {order.items.some((i) => i.type === "EBOOK") &&
            (order.status === "PAID" || order.status === "DELIVERED") && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  Ebooks disponíveis na sua biblioteca
                </p>
                <Link href="/library">
                  <span className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline">
                    Ir para a biblioteca <ChevronRight className="h-3 w-3" />
                  </span>
                </Link>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

function OrdersContent() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError } = useOrders(page);

  if (isError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-red-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Não foi possível carregar as encomendas.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm text-blue-700 hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">As Minhas Encomendas</h1>

      {!data?.content.length ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">Ainda não tem encomendas.</p>
          <Link href="/catalog" className="mt-4 inline-block text-sm text-blue-800 hover:underline">
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {data.content.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>

          {(data.totalPages || 0) > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="text-sm px-3 py-1.5 rounded-md border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                Anterior
              </button>
              <span className="text-sm px-3 py-1.5 text-gray-500">
                {page + 1} / {data.totalPages}
              </span>
              <button
                disabled={page >= (data.totalPages || 1) - 1}
                onClick={() => setPage((p) => p + 1)}
                className="text-sm px-3 py-1.5 rounded-md border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                Seguinte
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <AuthGuard>
      <OrdersContent />
    </AuthGuard>
  );
}
