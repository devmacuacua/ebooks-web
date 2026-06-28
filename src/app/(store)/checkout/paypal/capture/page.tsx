"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";

type CaptureState = "loading" | "success" | "error";

export default function PayPalCapturePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const attempted = useRef(false);
  const [state, setState] = useState<CaptureState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    const token = searchParams.get("token");
    if (!token) {
      setState("error");
      setErrorMessage("Token PayPal em falta.");
      return;
    }

    api
      .post(`/api/commerce/payments/capture/paypal?orderId=${encodeURIComponent(token)}`)
      .then(() => {
        setState("success");
        setTimeout(() => router.push("/orders"), 2500);
      })
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string } } }).response?.data
            ?.message || "Não foi possível confirmar o pagamento.";
        setState("error");
        setErrorMessage(msg);
      });
  }, [searchParams, router]);

  if (state === "loading") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground">A confirmar o pagamento com o PayPal...</p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">✓</div>
        <h1 className="text-2xl font-bold">Pagamento confirmado!</h1>
        <p className="text-muted-foreground">A redireccioná-lo para as suas encomendas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="text-5xl text-destructive">✕</div>
      <h1 className="text-2xl font-bold">Erro no pagamento</h1>
      <p className="text-muted-foreground">{errorMessage}</p>
      <button
        onClick={() => router.push("/checkout")}
        className="mt-4 px-6 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90"
      >
        Tentar novamente
      </button>
    </div>
  );
}
