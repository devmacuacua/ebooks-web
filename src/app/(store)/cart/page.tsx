"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Package,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { formatMZN } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, deliveryFee, total, count } = useCart();
  const router = useRouter();

  const handleCheckout = () => {
    if (!isAuthenticated()) {
      router.push("/login?redirect=/checkout");
      return;
    }
    router.push("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <ShoppingCart className="h-16 w-16 text-gray-200 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">O seu carrinho está vazio</h1>
        <p className="text-gray-500 mb-8">Adicione livros ao carrinho para continuar</p>
        <Link href="/catalog">
          <Button size="lg">
            Explorar Catálogo <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Carrinho ({count} {count === 1 ? "item" : "itens"})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Items list */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.bookId}
              className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4"
            >
              {/* Cover */}
              <div className="relative h-24 w-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {item.coverImageUrl ? (
                  <Image
                    src={item.coverImageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen className="h-6 w-6 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/books/${item.slug}`}
                      className="text-sm font-semibold text-gray-900 hover:text-blue-800 line-clamp-2"
                    >
                      {item.title}
                    </Link>
                    <Badge
                      variant={
                        item.type === "EBOOK"
                          ? "ebook"
                          : item.type === "PHYSICAL"
                          ? "physical"
                          : "both"
                      }
                      className="mt-1 text-xs"
                    >
                      {item.type === "EBOOK"
                        ? "Ebook"
                        : item.type === "PHYSICAL"
                        ? "Físico"
                        : "Físico + Ebook"}
                    </Badge>
                  </div>
                  <button
                    onClick={() => removeItem(item.bookId)}
                    className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    aria-label="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3">
                  {/* Quantity */}
                  {item.type !== "EBOOK" ? (
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-1">
                      <button
                        onClick={() => updateQuantity(item.bookId, item.quantity - 1)}
                        className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.bookId, item.quantity + 1)}
                        className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Licença digital</span>
                  )}

                  {/* Price */}
                  <div className="text-right">
                    <p className="text-base font-bold text-gray-900">
                      {formatMZN(item.price * item.quantity)}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-gray-400">{formatMZN(item.price)} cada</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div>
          <div className="sticky top-20 rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo da Encomenda</h2>

            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatMZN(subtotal)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" /> Entrega
                  </span>
                  <span className="font-medium">{formatMZN(deliveryFee)}</span>
                </div>
              )}
              {deliveryFee === 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Entrega</span>
                  <span className="text-green-600 font-medium">Grátis (digital)</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-blue-800">{formatMZN(total)}</span>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={handleCheckout}>
              Proceder ao Pagamento <ArrowRight className="h-4 w-4" />
            </Button>

            <p className="text-xs text-gray-400 text-center mt-4">
              Pagamento seguro. Os seus dados estão protegidos.
            </p>

            <Link
              href="/catalog"
              className="block text-center text-sm text-blue-800 hover:underline mt-3"
            >
              Continuar a comprar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
