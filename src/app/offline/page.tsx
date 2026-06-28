import Link from "next/link";
import { WifiOff, BookOpen } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 text-center">
      <WifiOff className="h-16 w-16 text-gray-500 mb-6" />
      <h1 className="text-2xl font-bold text-white mb-2">Sem ligação à internet</h1>
      <p className="text-gray-400 mb-8 max-w-sm">
        Pode continuar a ler os livros que descarregou para leitura offline.
      </p>
      <Link
        href="/library"
        className="inline-flex items-center gap-2 bg-blue-800 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        <BookOpen className="h-5 w-5" />
        Ir para a Biblioteca
      </Link>
    </div>
  );
}
