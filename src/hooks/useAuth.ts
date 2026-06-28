"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { setTokens, clearTokens, getCurrentUser, getAccessToken } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import type { AuthTokens, LoginRequest, RegisterRequest, User } from "@/types";
import React from "react";

export function useCurrentUser(): User | null {
  const [user, setUser] = React.useState<User | null>(null);
  React.useEffect(() => {
    setUser(getCurrentUser());
  }, []);
  return user;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
}

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data } = await api.get<UserProfile>("/api/users/me");
      return data;
    },
    enabled: !!getAccessToken(),
    staleTime: 300_000,
  });
}

export function useLogin() {
  const router = useRouter();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const { data } = await api.post<AuthTokens>("/api/auth/login", credentials);
      return data;
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      toast({ variant: "success", title: "Bem-vindo!", description: "Sessão iniciada com sucesso." });
      router.push("/library");
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Email ou senha incorretos.";
      toast({ variant: "destructive", title: "Erro de autenticação", description: msg });
    },
  });
}

export function useRegister() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const { data: response } = await api.post("/api/auth/register", data);
      return response;
    },
    onSuccess: () => {
      toast({
        variant: "success",
        title: "Conta criada!",
        description: "Verifique o seu email para activar a conta.",
      });
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Erro ao criar conta. Tente novamente.";
      toast({ variant: "destructive", title: "Erro", description: msg });
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return React.useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // ignore
    } finally {
      clearTokens();
      queryClient.clear();
      router.push("/login");
    }
  }, [router, queryClient]);
}

export function useResetPassword() {
  const router = useRouter();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      const { data } = await api.post("/api/auth/reset-password", { token, newPassword: password });
      return data;
    },
    onSuccess: () => {
      toast({
        variant: "success",
        title: "Senha redefinida",
        description: "A sua senha foi alterada com sucesso. Faça login.",
      });
      router.push("/login");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Link inválido ou expirado. Solicite um novo.",
      });
    },
  });
}

export function useForgotPassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await api.post("/api/auth/forgot-password", { email });
      return data;
    },
    onSuccess: () => {
      toast({
        variant: "success",
        title: "Email enviado",
        description: "Verifique a sua caixa de entrada para redefinir a senha.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível enviar o email. Tente novamente.",
      });
    },
  });
}
