import Link from "next/link";
import { BookOpen, Share2, ExternalLink, Link2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <BookOpen className="h-6 w-6 text-blue-800" />
              <span className="text-lg font-bold text-gray-900">EBooksStore</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              A sua livraria digital em Moçambique. Livros físicos e ebooks ao alcance de um clique.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" aria-label="Facebook" className="text-gray-400 hover:text-blue-600 transition-colors">
                <Share2 className="h-5 w-5" />
              </a>
              <a href="#" aria-label="Instagram" className="text-gray-400 hover:text-pink-600 transition-colors">
                <ExternalLink className="h-5 w-5" />
              </a>
              <a href="#" aria-label="Twitter/X" className="text-gray-400 hover:text-sky-500 transition-colors">
                <Link2 className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Loja */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Loja</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/catalog" className="hover:text-blue-800 transition-colors">Catálogo</Link></li>
              <li><Link href="/catalog?type=EBOOK" className="hover:text-blue-800 transition-colors">Ebooks</Link></li>
              <li><Link href="/catalog?type=PHYSICAL" className="hover:text-blue-800 transition-colors">Livros Físicos</Link></li>
              <li><Link href="/subscription" className="hover:text-blue-800 transition-colors">Subscrição</Link></li>
            </ul>
          </div>

          {/* Conta */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">A Minha Conta</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/library" className="hover:text-blue-800 transition-colors">Biblioteca</Link></li>
              <li><Link href="/orders" className="hover:text-blue-800 transition-colors">Encomendas</Link></li>
              <li><Link href="/settings" className="hover:text-blue-800 transition-colors">Definições</Link></li>
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Suporte</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/faq" className="hover:text-blue-800 transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-blue-800 transition-colors">Contacto</Link></li>
              <li><Link href="/terms" className="hover:text-blue-800 transition-colors">Termos de Uso</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-800 transition-colors">Privacidade</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} EBooksStore. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
