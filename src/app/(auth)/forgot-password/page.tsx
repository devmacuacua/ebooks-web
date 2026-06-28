"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForgotPassword } from "@/hooks/useAuth";

const schema = z.object({
  email: z.string().email("Email inválido"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const forgotPassword = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    forgotPassword.mutate(data.email, {
      onSuccess: () => {
        setSentEmail(data.email);
        setSent(true);
      },
    });
  };

  if (sent) {
    return (
      <div className="text-center py-4">
        <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Email enviado!</h2>
        <p className="text-sm text-gray-500 mb-2">
          Enviámos instruções de recuperação de senha para:
        </p>
        <p className="text-sm font-semibold text-gray-800 mb-6">{sentEmail}</p>
        <p className="text-xs text-gray-400 mb-6">
          Se não receber o email em alguns minutos, verifique a pasta de spam.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-blue-800 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Recuperar senha</h1>
        <p className="text-sm text-gray-500 mt-1">
          Introduza o seu email e enviaremos as instruções de recuperação.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <Button type="submit" className="w-full" size="lg" loading={forgotPassword.isPending}>
          Enviar instruções
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </Link>
      </div>
    </>
  );
}
