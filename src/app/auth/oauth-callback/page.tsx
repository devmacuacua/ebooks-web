"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Loader2, XCircle } from "lucide-react";
import { setTokens } from "@/lib/auth";

function Spinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-3 text-blue-800">
        <BookOpen className="h-8 w-8" />
        <span className="text-xl font-bold">EBooksStore</span>
      </div>
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        A autenticar…
      </div>
    </div>
  );
}

function OAuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = params.get("token");
    const refreshToken = params.get("refreshToken");
    const error = params.get("error");

    if (error) {
      setErrorMsg(decodeURIComponent(error));
      return;
    }
    if (!token || !refreshToken) {
      setErrorMsg("Resposta inválida do servidor de autenticação.");
      return;
    }

    setTokens(token, refreshToken);
    router.replace("/library");
  }, [params, router]);

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-7 w-7 text-red-500" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Autenticação falhou</h1>
          <p className="text-sm text-gray-500 mb-6">{errorMsg}</p>
          <button
            onClick={() => router.replace("/login")}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-900 transition-colors"
          >
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  return <Spinner />;
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <OAuthCallbackInner />
    </Suspense>
  );
}
