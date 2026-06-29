"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, BookOpen, Trash2 } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { useWishlist, useToggleWishlist, type WishlistItem } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/components/ui/toast";
import { formatMZN } from "@/lib/api";

function WishlistContent() {
  const { data: items, isLoading } = useWishlist();
  const { remove } = useToggleWishlist();
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleRemove = async (bookId: string) => {
    try {
      await remove.mutateAsync(bookId);
      toast({ title: "Removido da lista de desejos" });
    } catch {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  const handleAddToCart = (item: WishlistItem) => {
    addItem({
      id: item.bookId,
      bookId: item.bookId,
      title: item.bookTitle,
      slug: item.bookSlug ?? item.bookId,
      price: item.price ?? 0,
      quantity: 1,
      type: "EBOOK",
    });
    toast({ title: "Adicionado ao carrinho" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">A carregar lista de desejos…</p>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="h-6 w-6 text-red-500 fill-red-500" />
        <h1 className="text-2xl font-bold text-gray-900">Lista de Desejos</h1>
        {items && items.length > 0 && (
          <span className="text-sm text-gray-500">({items.length} {items.length === 1 ? "livro" : "livros"})</span>
        )}
      </div>

      {!items || items.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">A sua lista de desejos está vazia</h2>
          <p className="text-gray-500 mb-6">Adicione livros que gostaria de ler ou comprar mais tarde.</p>
          <Button asChild>
            <Link href="/catalog">Explorar catálogo</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              {/* Cover */}
              <Link href={`/books/${item.bookSlug ?? item.bookId}`} className="shrink-0">
                <div className="relative h-28 w-20 rounded-lg overflow-hidden bg-gray-100">
                  {item.coverImage ? (
                    <Image src={item.coverImage} alt={item.bookTitle} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BookOpen className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                </div>
              </Link>

              {/* Info */}
              <div className="flex flex-1 flex-col justify-between gap-2">
                <div>
                  <Link
                    href={`/books/${item.bookSlug ?? item.bookId}`}
                    className="text-base font-semibold text-gray-900 hover:text-blue-800 transition-colors line-clamp-2"
                  >
                    {item.bookTitle}
                  </Link>
                  {item.price != null && (
                    <p className="text-sm font-bold text-blue-800 mt-1">{formatMZN(item.price)}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    Adicionado em {new Date(item.addedAt).toLocaleDateString("pt-MZ")}
                  </p>
                </div>

                <div className="flex gap-2">
                  {item.price != null && (
                    <Button size="sm" onClick={() => handleAddToCart(item)}>
                      Adicionar ao carrinho
                    </Button>
                  )}
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/books/${item.bookSlug ?? item.bookId}`}>Ver livro</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemove(item.bookId)}
                    className="text-red-500 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default function WishlistPage() {
  return (
    <AuthGuard>
      <WishlistContent />
    </AuthGuard>
  );
}
