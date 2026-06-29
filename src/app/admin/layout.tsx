"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Package,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  Truck,
  Handshake,
  BarChart3,
  Star,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useLogout } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/books", label: "Livros", icon: BookOpen },
  { href: "/admin/orders", label: "Encomendas", icon: Package },
  { href: "/admin/deliveries", label: "Entregas", icon: Truck },
  { href: "/admin/partners", label: "Parceiros", icon: Handshake },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/reviews", label: "Avaliações", icon: Star },
  { href: "/admin/users", label: "Utilizadores", icon: Users },
  { href: "/admin/settings", label: "Configurações", icon: Settings },
];

interface AdminSidebarProps {
  pathname: string;
  onNavClick: () => void;
  onLogout: () => void;
}

function AdminSidebar({ pathname, onNavClick, onLogout }: AdminSidebarProps) {
  return (
    <nav className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-200">
        <BookOpen className="h-6 w-6 text-blue-800" />
        <span className="font-bold text-gray-900">Admin Panel</span>
      </div>

      <div className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-50 text-blue-800"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className={`h-4 w-4 ${active ? "text-blue-800" : "text-gray-400"}`} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Terminar Sessão
        </button>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-gray-400 hover:text-gray-600 transition-colors mt-1"
        >
          ← Voltar à loja
        </Link>
      </div>
    </nav>
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const logout = useLogout();

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-gray-200 bg-white">
        <AdminSidebar pathname={pathname} onNavClick={() => {}} onLogout={logout} />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-60 bg-white">
            <button
              className="absolute top-4 right-4 text-gray-400"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <AdminSidebar
              pathname={pathname}
              onNavClick={() => setSidebarOpen(false)}
              onLogout={logout}
            />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-gray-900">Admin Panel</span>
        </header>

        <main className="flex-1 p-6 bg-gray-50 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAdmin>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthGuard>
  );
}
