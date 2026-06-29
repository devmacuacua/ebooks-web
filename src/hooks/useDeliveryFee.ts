import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface DeliveryFeeResponse {
  province: string;
  fee: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

export function useDeliveryFee(province?: string) {
  return useQuery<DeliveryFeeResponse>({
    queryKey: ["delivery-fee", province],
    queryFn: async () => {
      const { data } = await api.get<DeliveryFeeResponse>(
        `/api/deliveries/fee?province=${encodeURIComponent(province!)}`
      );
      return data;
    },
    enabled: Boolean(province && province.trim()),
    staleTime: 5 * 60_000,
    retry: false,
  });
}
