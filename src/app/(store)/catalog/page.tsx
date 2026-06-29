"use client";

import React, { Suspense, useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Filter, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { BookCard } from "@/components/books/BookCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBooks } from "@/hooks/useBooks";
import { useWishlist, useToggleWishlist } from "@/hooks/useWishlist";
import { isAuthenticated } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import type { BookType, CatalogFilters } from "@/types";

const CATEGORIES = [
  { id: "romance", name: "Romance" },
  { id: "ficcao-cientifica", name: "Ficção Científica" },
  { id: "negocios", name: "Negócios" },
  { id: "tecnologia", name: "Tecnologia" },
  { id: "historia", name: "História" },
  { id: "auto-ajuda", name: "Auto-Ajuda" },
  { id: "literatura", name: "Literatura" },
  { id: "educacao", name: "Educação" },
];

const TYPE_OPTIONS: { value: BookType | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "PHYSICAL", label: "Físico" },
  { value: "EBOOK", label: "Ebook" },
  { value: "BOTH", label: "Físico + Ebook" },
];

interface SidebarProps {
  filters: CatalogFilters;
  updateFilter: <K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) => void;
  toggleCategory: (id: string) => void;
  clearFilters: () => void;
}

function Sidebar({ filters, updateFilter, toggleCategory, clearFilters }: SidebarProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Filtros</h3>
        <button
          onClick={clearFilters}
          className="text-xs text-blue-800 hover:underline"
        >
          Limpar tudo
        </button>
      </div>

      {/* Type */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Tipo</p>
        <div className="space-y-2">
          {TYPE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value={opt.value}
                checked={(filters.type || "") === opt.value}
                onChange={() => updateFilter("type", opt.value as BookType || undefined)}
                className="text-blue-800 focus:ring-blue-800"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Categorias</p>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.categories?.includes(cat.id) || false}
                onChange={() => toggleCategory(cat.id)}
                className="rounded text-blue-800 focus:ring-blue-800"
              />
              <span className="text-sm text-gray-700">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Preço (MZN)</p>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            min={0}
            value={filters.minPrice || ""}
            onChange={(e) => updateFilter("minPrice", e.target.value ? Number(e.target.value) : undefined)}
            className="w-full h-8 rounded-md border border-gray-300 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-800"
          />
          <span className="text-gray-400 text-sm">—</span>
          <input
            type="number"
            placeholder="Max"
            min={0}
            value={filters.maxPrice || ""}
            onChange={(e) => updateFilter("maxPrice", e.target.value ? Number(e.target.value) : undefined)}
            className="w-full h-8 rounded-md border border-gray-300 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-800"
          />
        </div>
      </div>

      {/* Subscription only */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.subscriptionOnly || false}
            onChange={(e) => updateFilter("subscriptionOnly", e.target.checked || undefined)}
            className="rounded text-blue-800 focus:ring-blue-800"
          />
          <span className="text-sm text-gray-700">Apenas subscrição</span>
        </label>
      </div>
    </div>
  );
}

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [filters, setFilters] = useState<CatalogFilters>({
    search: searchParams.get("search") || undefined,
    type: (searchParams.get("type") as BookType) || undefined,
    categories: searchParams.get("categories")?.split(",").filter(Boolean) || [],
    minPrice: undefined,
    maxPrice: undefined,
    subscriptionOnly: false,
    page: 0,
    size: 20,
    sort: searchParams.get("sort") || "title",
  });

  // Sync active filters to URL so pages are shareable and back-button works
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.type) params.set("type", filters.type);
    if (filters.categories?.length) params.set("categories", filters.categories.join(","));
    if (filters.sort && filters.sort !== "title") params.set("sort", filters.sort);
    const qs = params.toString();
    router.replace(qs ? `/catalog?${qs}` : "/catalog", { scroll: false });
  }, [filters.search, filters.type, filters.categories, filters.sort, router]);

  const { data, isLoading, isError } = useBooks(filters);
  const loggedIn = isAuthenticated();
  const { data: wishlistItems } = useWishlist();
  const { add: addWishlist, remove: removeWishlist } = useToggleWishlist();
  const { toast } = useToast();

  const wishlistIds = new Set((wishlistItems ?? []).map((i) => i.bookId));

  const handleWishlistToggle = async (
    e: React.MouseEvent,
    book: { id: string; slug: string; title: string; coverImageUrl?: string; price: number },
  ) => {
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

  const updateFilter = useCallback(<K extends keyof CatalogFilters>(
    key: K,
    value: CatalogFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 0 }));
  }, []);

  const toggleCategory = (id: string) => {
    setFilters((prev) => {
      const current = prev.categories || [];
      const next = current.includes(id)
        ? current.filter((c) => c !== id)
        : [...current, id];
      return { ...prev, categories: next, page: 0 };
    });
  };

  const clearFilters = () => {
    setFilters({ page: 0, size: 20, sort: "title" });
  };

  const totalPages = data?.totalPages || 0;
  const currentPage = filters.page || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo</h1>
          {data && (
            <p className="text-sm text-gray-500 mt-0.5">
              {data.totalElements} livros encontrados
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Sort */}
          <select
            value={filters.sort || "title"}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
          >
            <option value="title">Nome A-Z</option>
            <option value="price_asc">Preço: menor</option>
            <option value="price_desc">Preço: maior</option>
            <option value="newest">Mais recentes</option>
            <option value="rating">Melhor avaliação</option>
          </select>

          {/* Mobile filter toggle */}
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Active filters */}
      {(filters.type || filters.categories?.length || filters.subscriptionOnly) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.type && (
            <Badge variant="secondary" className="gap-1">
              {TYPE_OPTIONS.find((t) => t.value === filters.type)?.label}
              <button
                onClick={() => updateFilter("type", undefined)}
                className="ml-1 hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.categories?.map((c) => (
            <Badge key={c} variant="secondary" className="gap-1">
              {CATEGORIES.find((cat) => cat.id === c)?.name}
              <button
                onClick={() => toggleCategory(c)}
                className="ml-1 hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          ))}
          {filters.subscriptionOnly && (
            <Badge variant="accent" className="gap-1">
              Subscrição
              <button
                onClick={() => updateFilter("subscriptionOnly", undefined)}
                className="ml-1 hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}

      <div className="flex gap-8">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-20 rounded-xl border border-gray-200 bg-white p-5">
            <Sidebar
              filters={filters}
              updateFilter={updateFilter}
              toggleCategory={toggleCategory}
              clearFilters={clearFilters}
            />
          </div>
        </aside>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div
              className="fixed inset-0 bg-black/30"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative bg-white w-72 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" /> Filtros
                </h3>
                <button onClick={() => setSidebarOpen(false)} className="text-gray-500">
                  ×
                </button>
              </div>
              <Sidebar
                filters={filters}
                updateFilter={updateFilter}
                toggleCategory={toggleCategory}
                clearFilters={clearFilters}
              />
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-gray-100 animate-pulse aspect-[2/3]" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg mb-2">Erro ao carregar catálogo</p>
              <p className="text-gray-300 text-sm mb-6">Verifique a sua ligação e tente novamente</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Tentar novamente
              </Button>
            </div>
          ) : data?.content.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg mb-2">Nenhum livro encontrado</p>
              <p className="text-gray-300 text-sm mb-6">Tente alterar os filtros de pesquisa</p>
              <Button variant="outline" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                {data?.content.map((book) => (
                  <BookCard
                    key={book.id}
                    {...book}
                    inWishlist={wishlistIds.has(book.id)}
                    onWishlistToggle={(e) => handleWishlistToggle(e, { id: book.id, slug: book.slug, title: book.title, coverImageUrl: book.coverImageUrl, price: book.price })}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 0}
                    onClick={() => updateFilter("page", currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    Página {currentPage + 1} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => updateFilter("page", currentPage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-gray-100 animate-pulse aspect-[2/3]" />
            ))}
          </div>
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
