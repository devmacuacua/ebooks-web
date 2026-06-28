import Link from "next/link";
import { BookOpen, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <BookOpen className="h-20 w-20 text-gray-200" />
            <span className="absolute inset-0 flex items-center justify-center text-3xl font-black text-gray-300">
              404
            </span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Página não encontrada
        </h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          A página que procura não existe ou foi movida. Verifique o endereço ou
          explore o nosso catálogo.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-900 transition-colors"
          >
            <Home className="h-4 w-4" />
            Página inicial
          </Link>
          <Link
            href="/catalog"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Search className="h-4 w-4" />
            Ver catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}
