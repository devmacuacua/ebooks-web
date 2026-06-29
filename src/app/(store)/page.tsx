"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  BookOpen,
  Smartphone,
  Globe,
  Award,
  Heart,
  Zap,
  Crown,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookCard } from "@/components/books/BookCard";
import { useFeaturedBooks, useNewArrivals } from "@/hooks/useBooks";
import { useWishlist, useToggleWishlist } from "@/hooks/useWishlist";
import { isAuthenticated } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { formatMZN } from "@/lib/api";
import type { BookSummary } from "@/types";

const CATEGORIES = [
  { name: "Romance", icon: Heart, slug: "romance", color: "bg-pink-50 text-pink-700 border-pink-200" },
  { name: "Ficção Científica", icon: Zap, slug: "ficcao-cientifica", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { name: "Negócios", icon: Award, slug: "negocios", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { name: "Tecnologia", icon: Smartphone, slug: "tecnologia", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { name: "História", icon: Globe, slug: "historia", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { name: "Auto-Ajuda", icon: Crown, slug: "auto-ajuda", color: "bg-green-50 text-green-700 border-green-200" },
  { name: "Literatura", icon: BookOpen, slug: "literatura", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { name: "Educação", icon: Award, slug: "educacao", color: "bg-red-50 text-red-700 border-red-200" },
];

const PLANS = [
  {
    name: "Mensal",
    price: 299,
    type: "MONTHLY",
    features: [
      "Acesso ilimitado a ebooks",
      "Leitura em qualquer dispositivo",
      "Novos títulos semanalmente",
      "Cancele quando quiser",
    ],
  },
  {
    name: "Anual",
    price: 2499,
    priceMonthly: 208,
    type: "ANNUAL",
    popular: true,
    features: [
      "Tudo do plano Mensal",
      "Poupe 30% vs mensal",
      "Acesso antecipado a novidades",
      "1 livro físico grátis por trimestre",
      "Suporte prioritário",
    ],
  },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { data: featured, isLoading: loadingFeatured } = useFeaturedBooks();
  const { data: newArrivals, isLoading: loadingNew } = useNewArrivals();
  const { data: wishlistItems } = useWishlist();
  const { add: addWishlist, remove: removeWishlist } = useToggleWishlist();
  const { toast } = useToast();
  const loggedIn = isAuthenticated();
  const wishlistIds = new Set((wishlistItems ?? []).map((i) => i.bookId));

  const handleWishlistToggle = async (e: React.MouseEvent, book: BookSummary) => {
    e.preventDefault();
    if (!loggedIn) { toast({ title: "Inicia sessão para usar a lista de desejos", variant: "destructive" }); return; }
    try {
      if (wishlistIds.has(book.id)) {
        await removeWishlist.mutateAsync(book.id);
        toast({ title: "Removido da lista de desejos" });
      } else {
        await addWishlist.mutateAsync({ bookId: book.id, bookSlug: book.slug, bookTitle: book.title, coverImage: book.coverImageUrl, price: book.price });
        toast({ title: "Adicionado à lista de desejos" });
      }
    } catch {
      toast({ title: "Erro ao actualizar lista de desejos", variant: "destructive" });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="flex flex-col gap-0">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-orange-400" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-2xl">
            <p className="text-orange-400 font-semibold text-sm mb-2 tracking-wide uppercase">
              A maior livraria digital de Moçambique
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-4">
              Descubra o seu próximo{" "}
              <span className="text-orange-400">livro</span>
            </h1>
            <p className="text-blue-100 text-lg mb-8 leading-relaxed">
              Milhares de ebooks e livros físicos ao seu alcance. Subscreva e leia sem limites.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="search"
                  placeholder="Procurar título, autor ou categoria..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 rounded-xl pl-12 pr-4 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-lg"
                />
              </div>
              <Button type="submit" variant="accent" size="lg" className="rounded-xl shrink-0">
                Pesquisar
              </Button>
            </form>

            <div className="flex flex-wrap gap-3">
              <Link href="/catalog">
                <Button variant="accent" size="lg">
                  Explorar Catálogo <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/subscription">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white/10"
                >
                  <Crown className="h-4 w-4" /> Ver Planos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Books ─────────────────────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Livros em Destaque</h2>
            <p className="text-gray-500 text-sm mt-1">Escolhas dos nossos editores</p>
          </div>
          <Link href="/catalog" className="text-sm font-medium text-blue-800 hover:underline flex items-center gap-1">
            Ver todos <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loadingFeatured ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-40 shrink-0 rounded-xl bg-gray-100 animate-pulse aspect-[2/3]" />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {(featured || []).map((book) => (
              <div key={book.id} className="w-44 shrink-0">
                <BookCard
                  {...book}
                  inWishlist={wishlistIds.has(book.id)}
                  onWishlistToggle={(e) => handleWishlistToggle(e, book)}
                />
              </div>
            ))}
            {(!featured || featured.length === 0) && (
              <p className="text-gray-400 text-sm py-8">Nenhum livro em destaque disponível.</p>
            )}
          </div>
        )}
      </section>

      {/* ── Subscription Plans ─────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Planos de Subscrição</h2>
            <p className="text-gray-500">Leia quantos ebooks quiser, quando quiser</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.type}
                className={`relative rounded-2xl border-2 p-6 bg-white ${
                  plan.popular
                    ? "border-blue-800 shadow-lg shadow-blue-100"
                    : "border-gray-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-800 text-white text-xs font-bold px-3 py-1 rounded-full">
                      MAIS POPULAR
                    </span>
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-extrabold text-gray-900">
                      {formatMZN(plan.price)}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {plan.type === "MONTHLY" ? "/mês" : "/ano"}
                    </span>
                    {plan.priceMonthly && (
                      <p className="text-xs text-green-600 font-medium mt-0.5">
                        ≈ {formatMZN(plan.priceMonthly)}/mês
                      </p>
                    )}
                  </div>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/subscription">
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    Começar agora
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Explorar por Categoria</h2>
          <p className="text-gray-500 text-sm mt-1">Encontre o género que mais gosta</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/catalog?categories=${cat.slug}`}
              className={`flex items-center gap-3 rounded-xl border p-4 hover:shadow-sm transition-shadow ${cat.color}`}
            >
              <cat.icon className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── New Arrivals ────────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Novidades</h2>
              <p className="text-gray-500 text-sm mt-1">Os títulos mais recentes</p>
            </div>
            <Link
              href="/catalog?sort=newest"
              className="text-sm font-medium text-blue-800 hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loadingNew ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-gray-200 animate-pulse aspect-[2/3]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {(newArrivals || []).map((book) => (
                <BookCard
                  key={book.id}
                  {...book}
                  inWishlist={wishlistIds.has(book.id)}
                  onWishlistToggle={(e) => handleWishlistToggle(e, book)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
