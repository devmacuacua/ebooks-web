"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Lock, Bell, Camera, Loader2 } from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";
import { useQueryClient } from "@tanstack/react-query";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser, useProfile } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/toast";
import api from "@/lib/api";

const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Campo obrigatório"),
    newPassword: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Deve conter uma maiúscula")
      .regex(/[0-9]/, "Deve conter um número"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface NotificationPrefs {
  orderUpdates: boolean;
  newBooks: boolean;
  subscriptionAlerts: boolean;
  promotions: boolean;
}

function SettingsContent() {
  const user = useCurrentUser();
  const { data: profile } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    orderUpdates: true,
    newBooks: true,
    subscriptionAlerts: true,
    promotions: false,
  });

  // Load persisted notification prefs
  useEffect(() => {
    api.get<NotificationPrefs>("/api/users/notifications")
      .then(({ data }) => setNotifPrefs(data))
      .catch(() => {}); // keep defaults on error
  }, []);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", phone: "" },
  });

  // Populate form once profile loads from API (includes phone not in JWT)
  useEffect(() => {
    if (profile) {
      profileForm.reset({ name: profile.name, phone: profile.phone || "" });
    }
  }, [profile, profileForm]);

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post<{ url: string }>("/api/media/users/avatar", formData);
      await api.put("/api/users/profile", { avatar: data.url });
      await queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast({ variant: "success", title: "Foto actualizada!" });
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível actualizar a foto." });
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const onSaveProfile = async (data: ProfileFormData) => {
    setSavingProfile(true);
    try {
      await api.put("/api/users/profile", data);
      toast({ variant: "success", title: "Perfil actualizado!" });
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível guardar as alterações." });
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (data: PasswordFormData) => {
    setSavingPassword(true);
    try {
      await api.put("/api/users/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast({ variant: "success", title: "Senha alterada com sucesso!" });
      passwordForm.reset();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Senha actual incorrecta.";
      toast({ variant: "destructive", title: "Erro", description: msg });
    } finally {
      setSavingPassword(false);
    }
  };

  const onSaveNotifications = async () => {
    try {
      await api.put("/api/users/notifications", notifPrefs);
      toast({ variant: "success", title: "Preferências guardadas!" });
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível guardar as preferências." });
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Definições</h1>

      <Tabs.Root defaultValue="profile">
        <Tabs.List className="flex gap-1 rounded-lg bg-gray-100 p-1 mb-6">
          <Tabs.Trigger
            value="profile"
            className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-800 text-gray-600 transition-all"
          >
            <User className="h-4 w-4" /> Perfil
          </Tabs.Trigger>
          <Tabs.Trigger
            value="security"
            className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-800 text-gray-600 transition-all"
          >
            <Lock className="h-4 w-4" /> Segurança
          </Tabs.Trigger>
          <Tabs.Trigger
            value="notifications"
            className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-800 text-gray-600 transition-all"
          >
            <Bell className="h-4 w-4" /> Notificações
          </Tabs.Trigger>
        </Tabs.List>

        {/* Profile Tab */}
        <Tabs.Content value="profile">
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {profile?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar} alt="Avatar" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-blue-800 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {avatarUploading
                    ? <Loader2 className="h-3 w-3 animate-spin text-gray-600" />
                    : <Camera className="h-3 w-3 text-gray-600" />}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>

            <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
              <Input
                label="Nome completo"
                type="text"
                placeholder="O seu nome"
                error={profileForm.formState.errors.name?.message}
                {...profileForm.register("name")}
              />
              <Input
                label="Telemóvel"
                type="tel"
                placeholder="8X XXX XXXX"
                error={profileForm.formState.errors.phone?.message}
                {...profileForm.register("phone")}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="h-10 flex items-center px-3 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-500">
                  {user?.email}
                  <span className="ml-2 text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">
                    Verificado
                  </span>
                </p>
              </div>
              <Button type="submit" loading={savingProfile}>
                Guardar alterações
              </Button>
            </form>
          </div>
        </Tabs.Content>

        {/* Security Tab */}
        <Tabs.Content value="security">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Alterar Senha</h2>
            <form
              onSubmit={passwordForm.handleSubmit(onChangePassword)}
              className="space-y-4"
            >
              <Input
                label="Senha actual"
                type="password"
                placeholder="••••••••"
                error={passwordForm.formState.errors.currentPassword?.message}
                {...passwordForm.register("currentPassword")}
              />
              <Input
                label="Nova senha"
                type="password"
                placeholder="Mínimo 8 caracteres"
                error={passwordForm.formState.errors.newPassword?.message}
                {...passwordForm.register("newPassword")}
              />
              <Input
                label="Confirmar nova senha"
                type="password"
                placeholder="Repita a nova senha"
                error={passwordForm.formState.errors.confirmPassword?.message}
                {...passwordForm.register("confirmPassword")}
              />
              <Button type="submit" loading={savingPassword}>
                Alterar senha
              </Button>
            </form>
          </div>
        </Tabs.Content>

        {/* Notifications Tab */}
        <Tabs.Content value="notifications">
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Preferências de Notificações</h2>

            {(
              [
                { key: "orderUpdates", label: "Actualizações de encomendas", description: "Receba notificações sobre o estado das suas encomendas" },
                { key: "newBooks", label: "Novos livros", description: "Seja notificado quando novos títulos chegarem ao catálogo" },
                { key: "subscriptionAlerts", label: "Alertas de subscrição", description: "Renovação, expiração e actualizações do plano" },
                { key: "promotions", label: "Promoções e ofertas", description: "Descontos e ofertas especiais da EBooksStore" },
              ] as { key: keyof NotificationPrefs; label: string; description: string }[]
            ).map(({ key, label, description }) => (
              <div
                key={key}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500">{description}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={notifPrefs[key]}
                  onClick={() =>
                    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
                  }
                  className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2 ${
                    notifPrefs[key] ? "bg-blue-800" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-0.5 ml-0.5 ${
                      notifPrefs[key] ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}

            <Button onClick={onSaveNotifications} className="mt-4">
              Guardar preferências
            </Button>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}
