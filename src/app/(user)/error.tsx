"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Library } from "lucide-react";
import Link from "next/link";

export default function UserError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[UserError]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Algo correu mal</h1>
        <p className="text-gray-500 text-sm mb-1">
          Ocorreu um erro nesta página. Os seus dados estão seguros.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-6 font-mono">Ref: {error.digest}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-900 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
          <Link
            href="/library"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Library className="h-4 w-4" />
            Ir à biblioteca
          </Link>
        </div>
      </div>
    </div>
  );
}
