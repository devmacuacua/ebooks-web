"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";

type Status = "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de verificação não encontrado.");
      return;
    }

    const verify = async () => {
      try {
        await api.get(`/api/auth/verify-email?token=${token}`);
        setStatus("success");
      } catch (e: unknown) {
        setStatus("error");
        const msg =
          (e as { response?: { data?: { message?: string } } }).response?.data?.message ||
          "O link de verificação é inválido ou expirou.";
        setMessage(msg);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="text-center py-4">
      {status === "loading" && (
        <>
          <Loader2 className="h-14 w-14 text-blue-800 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">A verificar o seu email...</h2>
          <p className="text-sm text-gray-500">Por favor aguarde.</p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Email verificado!</h2>
          <p className="text-sm text-gray-500 mb-6">
            A sua conta foi activada com sucesso. Já pode iniciar sessão.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-blue-800 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900 transition-colors"
          >
            Iniciar sessão
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="h-14 w-14 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Verificação falhada</h2>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
          <div className="flex flex-col gap-3 items-center">
            <Link href="/register" className="text-sm text-blue-800 hover:underline">
              Criar nova conta
            </Link>
            <Link href="/login" className="text-sm text-gray-500 hover:underline">
              Voltar ao login
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-4">
          <Loader2 className="h-14 w-14 text-blue-800 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">A carregar...</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
