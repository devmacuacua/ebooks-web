"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ShoppingCart,
  Search,
  User,
  LogOut,
  Library,
  Package,
  Settings,
  ChevronDown,
  Menu,
  X,
  Crown,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Avatar from "@radix-ui/react-avatar";
import { getCurrentUser, isAuthenticated, clearTokens } from "@/lib/auth";
import { useCart } from "@/hooks/useCart";
import { useProfile } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { cn } from "@/lib/utils";
import type { User as UserType } from "@/types";

interface SuggestItem {
  text: string;
  slug: string;
  coverImage?: string;
}

const NAV_LINKS = [
  { href: "/", label: "Início" },
  { href: "/catalog", label: "Catálogo" },
  { href: "/subscription", label: "Subscrição" },
];

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { count } = useCart();
  const { data: profile } = useProfile();

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    try {
      const res = await fetch(`/api/catalog/books/search/suggest?q=${encodeURIComponent(q)}&limit=6`);
      if (!res.ok) return;
      const data: { suggestions: SuggestItem[] } = await res.json();
      setSuggestions(data.suggestions ?? []);
      setShowSuggestions(true);
    } catch { /* ignore */ }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(q), 300);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      router.push(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (item: SuggestItem) => {
    setShowSuggestions(false);
    setSearchQuery(item.text);
    router.push(`/books/${item.slug}`);
  };

  const handleLogout = () => {
    clearTokens();
    setUser(null);
    router.push("/login");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <BookOpen className="h-7 w-7 text-blue-800" />
            <span className="hidden sm:block font-bold text-xl text-gray-900">
              EBooksStore
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-blue-800 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md">
            <div className="relative w-full" ref={searchContainerRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
              <input
                type="search"
                placeholder="Pesquisar livros..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onKeyDown={(e) => e.key === "Escape" && setShowSuggestions(false)}
                autoComplete="off"
                className="w-full h-9 rounded-full border border-gray-300 bg-gray-50 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  {suggestions.map((item) => (
                    <button
                      key={item.slug}
                      type="button"
                      onClick={() => handleSuggestionClick(item)}
                      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                    >
                      {item.coverImage ? (
                        <img
                          src={item.coverImage}
                          alt=""
                          className="h-9 w-6 object-cover rounded shrink-0 bg-gray-100"
                        />
                      ) : (
                        <div className="h-9 w-6 rounded bg-gray-100 shrink-0" />
                      )}
                      <span className="truncate text-gray-800">{item.text}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Link
              href="/cart"
              className="relative inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Carrinho"
            >
              <ShoppingCart className="h-5 w-5 text-gray-700" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Link>

            {/* Notification bell — only for logged-in users */}
            {isAuthenticated() && user && (
              <NotificationBell userId={user.id} />
            )}

            {/* User menu */}
            {isAuthenticated() && user ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center gap-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2">
                    <Avatar.Root className="h-8 w-8 rounded-full bg-blue-800 flex items-center justify-center overflow-hidden">
                      <Avatar.Image
                        src={profile?.avatar ?? user.avatarUrl}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />
                      <Avatar.Fallback className="text-xs font-semibold text-white">
                        {initials}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <ChevronDown className="h-3 w-3 text-gray-500 hidden sm:block" />
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="z-50 min-w-[200px] rounded-lg border border-gray-200 bg-white p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
                    sideOffset={8}
                    align="end"
                  >
                    <div className="px-3 py-2 border-b border-gray-100 mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>

                    <DropdownMenu.Item asChild>
                      <Link
                        href="/library"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 cursor-pointer outline-none"
                      >
                        <Library className="h-4 w-4" /> A Minha Biblioteca
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link
                        href="/orders"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 cursor-pointer outline-none"
                      >
                        <Package className="h-4 w-4" /> As Minhas Encomendas
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link
                        href="/subscription"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 cursor-pointer outline-none"
                      >
                        <Crown className="h-4 w-4 text-yellow-500" /> Subscrição
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 cursor-pointer outline-none"
                      >
                        <Settings className="h-4 w-4" /> Definições
                      </Link>
                    </DropdownMenu.Item>

                    {user.role === "ADMIN" && (
                      <>
                        <DropdownMenu.Separator className="my-1 border-t border-gray-100" />
                        <DropdownMenu.Item asChild>
                          <Link
                            href="/admin/dashboard"
                            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-800 font-medium rounded-md hover:bg-blue-50 cursor-pointer outline-none"
                          >
                            <Settings className="h-4 w-4" /> Painel Admin
                          </Link>
                        </DropdownMenu.Item>
                      </>
                    )}

                    <DropdownMenu.Separator className="my-1 border-t border-gray-100" />
                    <DropdownMenu.Item
                      onSelect={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 cursor-pointer outline-none"
                    >
                      <LogOut className="h-4 w-4" /> Terminar Sessão
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-blue-800 transition-colors"
                >
                  <User className="h-4 w-4" />
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-md bg-blue-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-900 transition-colors"
                >
                  Registar
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden h-9 w-9 flex items-center justify-center rounded-md hover:bg-gray-100"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Pesquisar livros..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full h-9 rounded-md border border-gray-300 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                />
              </div>
            </form>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-2 py-2 text-sm font-medium text-gray-700 hover:text-blue-800 rounded-md hover:bg-gray-50"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
