import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Order, Address, CartItem, PaymentMethod, PaginatedResponse } from "@/types";
import { useToast } from "@/components/ui/toast";
import { isAuthenticated } from "@/lib/auth";

export function useOrders(page = 0, size = 10) {
  return useQuery<PaginatedResponse<Order>>({
    queryKey: ["orders", page, size],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Order>>(
        `/api/commerce/orders?page=${page}&size=${size}`
      );
      return data;
    },
    staleTime: 30_000,
    enabled: isAuthenticated(),
  });
}

export function useOrder(id: string) {
  return useQuery<Order>({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data } = await api.get<Order>(`/api/commerce/orders/${id}`);
      return data;
    },
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCreateOrder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      items: CartItem[];
      addressId?: string;
      paymentMethod: PaymentMethod;
      phoneNumber?: string;
      stripePaymentMethodId?: string;
    }) => {
      const body = {
        items: payload.items.map((i) => ({
          bookId: i.bookId,
          bookTitle: i.title,
          bookType: i.type,
          bookCover: i.coverImageUrl,
          price: i.price,
          quantity: i.quantity,
        })),
        addressId: payload.addressId,
        paymentMethod: payload.paymentMethod,
        phoneNumber: payload.phoneNumber,
        stripePaymentMethodId: payload.stripePaymentMethodId,
      };
      const { data } = await api.post<{
        orderId: string;
        paymentId: string;
        status: string;
        clientSecret?: string;
        redirectUrl?: string;
        instructions?: string;
        method?: string;
      }>("/api/commerce/orders", body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Erro ao criar encomenda.";
      toast({ variant: "destructive", title: "Erro", description: msg });
    },
  });
}

export function useAddresses() {
  return useQuery<Address[]>({
    queryKey: ["addresses"],
    queryFn: async () => {
      const { data } = await api.get<Address[]>("/api/commerce/addresses");
      return data;
    },
    staleTime: 120_000,
    enabled: isAuthenticated(),
  });
}

export function useSaveAddress() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (address: Omit<Address, "id" | "userId">) => {
      const { data } = await api.post<Address>("/api/commerce/addresses", address);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast({ variant: "success", title: "Endereço guardado!" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível guardar o endereço." });
    },
  });
}
