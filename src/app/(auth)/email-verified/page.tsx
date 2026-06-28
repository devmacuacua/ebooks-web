"use client";

import Link from "next/link";
import { CheckCircle, XCircle } from "lucide-react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function EmailVerifiedInner() {
  const params = useSearchParams();
  const error = params.get("error");

  if (error) {
    return (
      <div className="text-center py-4">
        <div className="flex justify-center mb-4">
          <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="h-7 w-7 text-red-500" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Verificação falhou</h2>
        <p className="text-sm text-gray-500 mb-6">
          {decodeURIComponent(error)}
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-lg bg-blue-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-900 transition-colors"
        >
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center py-4">
      <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">Email verificado!</h2>
      <p className="text-sm text-gray-500 mb-6">
        A sua conta foi activada com sucesso. Já pode iniciar sessão.
      </p>
      <Link
        href="/login"
        className="inline-flex items-center justify-center rounded-lg bg-blue-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-900 transition-colors"
      >
        Iniciar sessão
      </Link>
    </div>
  );
}

export default function EmailVerifiedPage() {
  return (
    <Suspense fallback={<div className="py-8 text-center text-sm text-gray-400">A carregar…</div>}>
      <EmailVerifiedInner />
    </Suspense>
  );
}
