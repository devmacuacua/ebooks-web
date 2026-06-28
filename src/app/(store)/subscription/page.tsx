"use client";

import React, { useState } from "react";
import { Check, Crown, Calendar, Smartphone, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { usePlans, useSubscription, useSubscribe, useCancelSubscription } from "@/hooks/useSubscription";
import { formatMZN } from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PaymentMethod } from "@/types";

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "MPESA", label: "M-Pesa" },
  { id: "EMOLA", label: "e-Mola" },
  { id: "VISA", label: "Visa / Mastercard" },
  { id: "PAYPAL", label: "PayPal" },
];

function SubscriptionContent() {
  const { data: plans, isLoading: loadingPlans } = usePlans();
  const { data: subscription } = useSubscription();
  const subscribe = useSubscribe();
  const cancelSubscription = useCancelSubscription();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("MPESA");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showCancel, setShowCancel] = useState(false);

  const handleSubscribe = () => {
    if (!selectedPlan) return;
    subscribe.mutate({
      planId: selectedPlan,
      method: selectedMethod,
      phoneNumber: ["MPESA", "EMOLA"].includes(selectedMethod) ? phoneNumber : undefined,
    });
  };

  const isActive = subscription?.status === "ACTIVE";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <div className="flex justify-center mb-3">
          <Crown className="h-10 w-10 text-yellow-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscrição EBooksStore</h1>
        <p className="text-gray-500">Leia sem limites. Cancele quando quiser.</p>
      </div>

      {/* Active subscription */}
      {isActive && subscription && (
        <div className="mb-10 rounded-2xl border-2 border-green-200 bg-green-50 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-bold text-green-900">Subscrição Activa</h2>
                <p className="text-sm text-green-700">
                  Plano {subscription.plan.name} —{" "}
                  {formatMZN(subscription.plan.price)}/
                  {subscription.plan.type === "MONTHLY" ? "mês" : "ano"}
                </p>
              </div>
            </div>
            <Badge variant="success">ACTIVA</Badge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-green-600 text-xs">Início</p>
              <p className="font-medium text-green-900">
                {format(new Date(subscription.startDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <div>
              <p className="text-green-600 text-xs flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Válida até
              </p>
              <p className="font-medium text-green-900">
                {format(new Date(subscription.endDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-green-200 pt-4">
            <button
              onClick={() => setShowCancel(!showCancel)}
              className="text-sm text-red-600 hover:underline"
            >
              Cancelar subscrição
            </button>

            {showCancel && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">
                    Se cancelar, manterá acesso até{" "}
                    {format(new Date(subscription.endDate), "d MMM yyyy", { locale: ptBR })}
                    . Após essa data, perderá o acesso aos ebooks.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => cancelSubscription.mutate()}
                    loading={cancelSubscription.isPending}
                  >
                    Confirmar cancelamento
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCancel(false)}
                  >
                    Manter subscrição
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plans comparison */}
      {!isActive && (
        <>
          {loadingPlans ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              {[1, 2].map((i) => (
                <div key={i} className="h-80 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              {(plans || []).map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`text-left rounded-2xl border-2 p-6 transition-all ${
                    selectedPlan === plan.id
                      ? "border-blue-800 bg-blue-50 shadow-lg shadow-blue-100"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    {selectedPlan === plan.id && (
                      <div className="h-6 w-6 rounded-full bg-blue-800 flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-extrabold text-gray-900">
                      {formatMZN(plan.price)}
                    </span>
                    <span className="text-gray-500 text-sm">
                      /{plan.type === "MONTHLY" ? "mês" : "ano"}
                    </span>
                    {plan.type === "ANNUAL" && (
                      <p className="text-xs text-green-600 font-medium mt-0.5">
                        Poupe 30% vs mensal
                      </p>
                    )}
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          )}

          {/* Payment method */}
          {selectedPlan && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Método de Pagamento</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      selectedMethod === m.id
                        ? "border-blue-800 bg-blue-50 text-blue-800"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {(selectedMethod === "MPESA" || selectedMethod === "EMOLA") && (
                <div className="max-w-xs">
                  <Input
                    label={`Número ${selectedMethod}`}
                    type="tel"
                    placeholder="8X XXX XXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    leftIcon={<Smartphone className="h-4 w-4" />}
                  />
                </div>
              )}

              <Button
                className="mt-6 w-full sm:w-auto px-8"
                size="lg"
                onClick={handleSubscribe}
                loading={subscribe.isPending}
              >
                <Crown className="h-4 w-4" /> Activar Subscrição
              </Button>
            </div>
          )}
        </>
      )}

      {/* Features table */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Comparação de Planos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Funcionalidade</th>
                <th className="text-center py-3 px-4 text-gray-900 font-semibold">Mensal</th>
                <th className="text-center py-3 px-4 text-blue-800 font-semibold">
                  Anual <span className="text-xs text-green-600 ml-1">-30%</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ["Ebooks ilimitados", true, true],
                ["Leitura multi-dispositivo", true, true],
                ["Novidades semanais", true, true],
                ["Acesso antecipado", false, true],
                ["1 livro físico/trimestre", false, true],
                ["Suporte prioritário", false, true],
              ].map(([feature, monthly, annual]) => (
                <tr key={String(feature)}>
                  <td className="py-3 px-4 text-gray-700">{String(feature)}</td>
                  <td className="py-3 px-4 text-center">
                    {monthly ? (
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {annual ? (
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <AuthGuard>
      <SubscriptionContent />
    </AuthGuard>
  );
}
