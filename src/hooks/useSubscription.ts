import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Subscription, SubscriptionPlan, PaymentMethod } from "@/types";
import { useToast } from "@/components/ui/toast";

export function usePlans() {
  return useQuery<SubscriptionPlan[]>({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data } = await api.get<SubscriptionPlan[]>("/api/subscriptions/plans");
      return data;
    },
    staleTime: 600_000,
  });
}

export function useSubscription() {
  return useQuery<Subscription | null>({
    queryKey: ["my-subscription"],
    queryFn: async () => {
      try {
        const { data } = await api.get<Subscription>("/api/subscriptions/me");
        return data;
      } catch (e: unknown) {
        if ((e as { response?: { status?: number } }).response?.status === 404) return null;
        throw e;
      }
    },
    staleTime: 60_000,
  });
}

export function useSubscribe() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      planId,
      method,
      phoneNumber,
    }: {
      planId: string;
      method: PaymentMethod;
      phoneNumber?: string;
    }) => {
      const { data } = await api.post("/api/subscriptions/subscribe", {
        planId,
        paymentMethod: method,
        phoneNumber,
      });
      return data;
    },
    onSuccess: () => {
      toast({
        variant: "success",
        title: "Subscrição activada!",
        description: "Já tem acesso ilimitado aos ebooks.",
      });
      queryClient.invalidateQueries({ queryKey: ["my-subscription"] });
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Erro ao processar subscrição.";
      toast({ variant: "destructive", title: "Erro", description: msg });
    },
  });
}

export function useCancelSubscription() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/api/subscriptions/cancel");
      return data;
    },
    onSuccess: () => {
      toast({
        variant: "default",
        title: "Subscrição cancelada",
        description: "O acesso permanece activo até ao fim do período.",
      });
      queryClient.invalidateQueries({ queryKey: ["my-subscription"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível cancelar a subscrição." });
    },
  });
}
