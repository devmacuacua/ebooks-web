"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Smartphone,
  CreditCard,
  Globe,
  Check,
  Loader2,
  ArrowLeft,
  MapPin,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useCart } from "@/hooks/useCart";
import { useCreateOrder, useAddresses, useSaveAddress } from "@/hooks/useOrders";
import { useToast } from "@/components/ui/toast";
import { formatMZN } from "@/lib/api";
import api from "@/lib/api";
import type { PaymentMethod, PaymentStatus, Address } from "@/types";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder"
);

type PaymentStep = "method" | "processing" | "success" | "failed";

// ─── Stripe Card Form ──────────────────────────────────────────────────────────
function StripeCardForm({
  onCheckout,
  onSuccess,
  onFailure,
  loading,
}: {
  onCheckout: (paymentMethodId: string) => Promise<{ paymentId: string; clientSecret?: string }>;
  onSuccess: (paymentId: string) => void;
  onFailure: () => void;
  loading: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [confirming, setConfirming] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });

    if (error) {
      toast({ variant: "destructive", title: "Erro no cartão", description: error.message });
      return;
    }

    setConfirming(true);
    try {
      const result = await onCheckout(paymentMethod.id);

      if (result.clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(result.clientSecret, {
          payment_method: paymentMethod.id,
        });
        if (confirmError) {
          toast({ variant: "destructive", title: "Pagamento recusado", description: confirmError.message });
          onFailure();
          return;
        }
      }

      onSuccess(result.paymentId);
    } catch {
      onFailure();
    } finally {
      setConfirming(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-gray-300 p-3 bg-white">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#1f2937",
                "::placeholder": { color: "#9ca3af" },
              },
            },
          }}
        />
      </div>
      <Button type="submit" className="w-full" loading={loading || confirming} disabled={!stripe}>
        Confirmar Pagamento
      </Button>
    </form>
  );
}

// ─── Main Checkout ─────────────────────────────────────────────────────────────
function CheckoutContent() {
  const router = useRouter();
  const { items, subtotal, deliveryFee, total, clearCart } = useCart();
  const { data: addresses } = useAddresses();
  const createOrder = useCreateOrder();
  const saveAddress = useSaveAddress();
  const { toast } = useToast();

  const [step, setStep] = useState<PaymentStep>("method");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<Omit<Address, "id" | "userId">>({
    label: "Casa",
    street: "",
    city: "",
    province: "",
    country: "Moçambique",
    isDefault: false,
  });
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PENDING");
  const [pollCount, setPollCount] = useState(0);

  // Redirect if empty cart
  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart");
    }
  }, [items, router]);

  // Set default address
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses, selectedAddressId]);

  // Poll payment status for M-Pesa / E-mola
  const pollPaymentStatus = useCallback(async (pid: string) => {
    try {
      const { data } = await api.get<{ status: PaymentStatus }>(`/api/commerce/payments/${pid}`);
      setPaymentStatus(data.status);

      if (data.status === "COMPLETED") {
        setStep("success");
        clearCart();
      } else if (data.status === "FAILED" || data.status === "CANCELLED") {
        setStep("failed");
      } else {
        // Continue polling
        setPollCount((c) => c + 1);
      }
    } catch {
      setPollCount((c) => c + 1);
    }
  }, [clearCart]);

  useEffect(() => {
    if (!paymentId || step !== "processing") return;
    if (pollCount > 40) {
      // ~2 min timeout
      setStep("failed");
      toast({ variant: "destructive", title: "Tempo esgotado", description: "O pagamento não foi confirmado. Tente novamente." });
      return;
    }

    const timer = setTimeout(() => {
      pollPaymentStatus(paymentId);
    }, 3000);

    return () => clearTimeout(timer);
  }, [paymentId, step, pollCount, pollPaymentStatus, toast]);

  const PAYMENT_METHODS: {
    id: PaymentMethod;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      id: "MPESA",
      label: "M-Pesa",
      description: "Pagamento via M-Pesa",
      icon: <Smartphone className="h-5 w-5 text-red-500" />,
      color: "border-red-200 hover:border-red-400",
    },
    {
      id: "EMOLA",
      label: "e-Mola",
      description: "Pagamento via e-Mola",
      icon: <Smartphone className="h-5 w-5 text-blue-500" />,
      color: "border-blue-200 hover:border-blue-400",
    },
    {
      id: "VISA",
      label: "Visa / Mastercard",
      description: "Cartão bancário",
      icon: <CreditCard className="h-5 w-5 text-gray-700" />,
      color: "border-gray-200 hover:border-gray-400",
    },
    {
      id: "PAYPAL",
      label: "PayPal",
      description: "Redireccionado para o PayPal",
      icon: <Globe className="h-5 w-5 text-blue-600" />,
      color: "border-blue-200 hover:border-blue-400",
    },
  ];

  const handleMobilePayment = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      toast({ variant: "destructive", title: "Número inválido", description: "Introduza um número válido." });
      return;
    }

    try {
      const result = await createOrder.mutateAsync({
        items,
        addressId: selectedAddressId || undefined,
        paymentMethod: selectedMethod!,
        phoneNumber,
      });
      setPaymentId(result.paymentId);
      setStep("processing");
      setPollCount(0);
    } catch {
      // Error toast handled by hook
    }
  };

  const handleStripeCheckout = async (paymentMethodId: string) => {
    return createOrder.mutateAsync({
      items,
      addressId: selectedAddressId || undefined,
      paymentMethod: "VISA",
      stripePaymentMethodId: paymentMethodId,
    });
  };

  const handleStripeSuccess = (pid: string) => {
    setPaymentId(pid);
    setStep("processing");
    setPollCount(0);
  };

  const handlePayPal = async () => {
    try {
      const result = await createOrder.mutateAsync({
        items,
        addressId: selectedAddressId || undefined,
        paymentMethod: "PAYPAL",
      });
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        toast({ variant: "destructive", title: "Erro", description: "PayPal não retornou um URL de redireccionamento." });
      }
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível iniciar o pagamento com PayPal." });
    }
  };

  // ── Success ────────────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento confirmado!</h1>
        <p className="text-gray-500 mb-8">
          A sua encomenda foi processada com sucesso. Receberá um email de confirmação.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/orders">
            <Button className="w-full" size="lg">Ver as minhas encomendas</Button>
          </Link>
          <Link href="/library">
            <Button variant="outline" className="w-full" size="lg">Ir para a biblioteca</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Failed ─────────────────────────────────────────────────────────────────
  if (step === "failed") {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <XCircle className="h-20 w-20 text-red-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento falhado</h1>
        <p className="text-gray-500 mb-8">
          Não foi possível processar o pagamento. Por favor tente novamente.
        </p>
        <Button size="lg" onClick={() => setStep("method")}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  // ── Processing (M-Pesa/E-mola polling) ─────────────────────────────────────
  if (step === "processing") {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="relative">
          <Loader2 className="h-20 w-20 text-blue-800 animate-spin mx-auto mb-6" />
          <Clock className="h-8 w-8 text-orange-500 absolute top-6 left-1/2 -translate-x-1/2" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">A aguardar confirmação</h1>
        <p className="text-gray-600 mb-2">
          Foi enviado um pedido de pagamento para:
        </p>
        <p className="text-lg font-bold text-gray-900 mb-4">{phoneNumber}</p>
        <p className="text-sm text-gray-500 mb-8">
          Confirme o pagamento no seu telemóvel ({selectedMethod}). O sistema verificará
          automaticamente a confirmação.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 mb-6">
          <p>Total a pagar: <strong>{formatMZN(total)}</strong></p>
          <p className="mt-1 text-xs text-gray-400">Verificação a cada 3 segundos...</p>
        </div>
        <button
          onClick={() => setStep("method")}
          className="text-sm text-red-600 hover:underline"
        >
          Cancelar pagamento
        </button>
      </div>
    );
  }

  // ── Method selection ────────────────────────────────────────────────────────
  const hasPhysical = items.some((i) => i.type === "PHYSICAL" || i.type === "BOTH");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link
        href="/cart"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao carrinho
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Finalizar Compra</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* Left: address + payment */}
        <div className="space-y-6">
          {/* Delivery address (only for physical items) */}
          {hasPhysical && (
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-blue-800" /> Endereço de Entrega
              </h2>

              {addresses && addresses.length > 0 && (
                <div className="space-y-2 mb-4">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedAddressId === addr.id
                          ? "border-blue-800 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{addr.label}</p>
                        <p className="text-xs text-gray-500">
                          {addr.street}, {addr.city}, {addr.province}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowAddAddress(!showAddAddress)}
                className="flex items-center gap-1 text-sm text-blue-800 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar novo endereço
              </button>

              {showAddAddress && (
                <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Etiqueta"
                      placeholder="Ex: Casa, Trabalho"
                      value={newAddress.label}
                      onChange={(e) => setNewAddress((p) => ({ ...p, label: e.target.value }))}
                    />
                    <Input
                      label="País"
                      placeholder="Moçambique"
                      value={newAddress.country}
                      onChange={(e) => setNewAddress((p) => ({ ...p, country: e.target.value }))}
                    />
                  </div>
                  <Input
                    label="Rua / Endereço"
                    placeholder="Av. 25 de Setembro, 123"
                    value={newAddress.street}
                    onChange={(e) => setNewAddress((p) => ({ ...p, street: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Cidade"
                      placeholder="Maputo"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress((p) => ({ ...p, city: e.target.value }))}
                    />
                    <Input
                      label="Província"
                      placeholder="Maputo"
                      value={newAddress.province}
                      onChange={(e) => setNewAddress((p) => ({ ...p, province: e.target.value }))}
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      saveAddress.mutate(newAddress, {
                        onSuccess: (saved) => {
                          setSelectedAddressId(saved.id);
                          setShowAddAddress(false);
                        },
                      });
                    }}
                    loading={saveAddress.isPending}
                  >
                    Guardar endereço
                  </Button>
                </div>
              )}
            </section>
          )}

          {/* Payment method */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-blue-800" /> Método de Pagamento
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    selectedMethod === method.id
                      ? "border-blue-800 bg-blue-50"
                      : `border-gray-200 hover:border-gray-300 ${method.color}`
                  }`}
                >
                  {method.icon}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{method.label}</p>
                    <p className="text-xs text-gray-500 hidden sm:block">{method.description}</p>
                  </div>
                  {selectedMethod === method.id && (
                    <Check className="h-4 w-4 text-blue-800 ml-auto shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Method-specific UI */}
            {(selectedMethod === "MPESA" || selectedMethod === "EMOLA") && (
              <div className="space-y-4">
                <Input
                  label={`Número ${selectedMethod === "MPESA" ? "M-Pesa" : "e-Mola"}`}
                  type="tel"
                  placeholder="8X XXX XXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  leftIcon={<Smartphone className="h-4 w-4" />}
                />
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleMobilePayment}
                  loading={createOrder.isPending}
                  disabled={!phoneNumber}
                >
                  Confirmar Pagamento — {formatMZN(total)}
                </Button>
                <p className="text-xs text-gray-400 text-center">
                  Receberá um pedido de confirmação no seu telemóvel.
                </p>
              </div>
            )}

            {(selectedMethod === "VISA" || selectedMethod === "MASTERCARD") && (
              <Elements stripe={stripePromise}>
                <StripeCardForm
                  onCheckout={handleStripeCheckout}
                  onSuccess={handleStripeSuccess}
                  onFailure={() => setStep("failed")}
                  loading={createOrder.isPending}
                />
              </Elements>
            )}

            {selectedMethod === "PAYPAL" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                  Será redireccionado para o PayPal para concluir o pagamento.
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePayPal}
                >
                  Pagar com PayPal — {formatMZN(total)}
                </Button>
              </div>
            )}

            {!selectedMethod && (
              <p className="text-sm text-gray-400 text-center py-2">
                Seleccione um método de pagamento
              </p>
            )}
          </section>
        </div>

        {/* Right: Order summary */}
        <div>
          <div className="sticky top-20 rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo</h2>

            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.bookId} className="flex items-center gap-3">
                  <div className="relative h-12 w-8 rounded bg-gray-100 shrink-0 overflow-hidden">
                    {item.coverImageUrl && (
                      <Image src={item.coverImageUrl} alt={item.title} fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 line-clamp-2">{item.title}</p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-gray-400">× {item.quantity}</p>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-900 shrink-0">
                    {formatMZN(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatMZN(subtotal)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Entrega</span>
                  <span>{formatMZN(deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>Total</span>
                <span className="text-blue-800">{formatMZN(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <AuthGuard>
      <CheckoutContent />
    </AuthGuard>
  );
}
