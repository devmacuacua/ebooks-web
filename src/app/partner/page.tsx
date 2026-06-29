"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Handshake,
  Key,
  BookOpen,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Globe,
  Mail,
  FileText,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  usePartnerProfile,
  useRegisterPartner,
  useUpdatePartner,
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
  usePartnerBooks,
  type Partner,
} from "@/hooks/usePartner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ── Registration form ─────────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  websiteUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  description: z.string().max(1000).optional(),
});
type RegisterData = z.infer<typeof registerSchema>;

function RegisterForm() {
  const registerPartner = useRegisterPartner();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="h-16 w-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <Handshake className="h-8 w-8 text-blue-800" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Torne-se um Parceiro</h1>
        <p className="text-gray-500 text-sm mt-2">
          Venda os seus livros na EBooksStore e alcance milhares de leitores em Moçambique.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit((d) => registerPartner.mutate(d))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome / Editora *</label>
              <Input {...register("name")} placeholder="Ex: Editora Ndzidzi" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email de contacto *</label>
              <Input type="email" {...register("email")} placeholder="parceiro@editora.co.mz" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <Input {...register("websiteUrl")} placeholder="https://www.editora.co.mz" />
              {errors.websiteUrl && <p className="text-xs text-red-500 mt-1">{errors.websiteUrl.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                {...register("description")}
                rows={3}
                placeholder="Breve descrição da sua editora ou catálogo..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
              />
            </div>
            <Button type="submit" className="w-full" disabled={registerPartner.isPending}>
              {registerPartner.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Candidatar-me como Parceiro
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 grid grid-cols-3 gap-4 text-center text-sm text-gray-500">
        {[
          { icon: BookOpen, label: "Catálogo próprio", desc: "Adicione os seus livros ao catálogo" },
          { icon: Key, label: "API de integração", desc: "Integre o nosso widget no seu site" },
          { icon: Handshake, label: "Aprovação rápida", desc: "Resposta em até 48 horas" },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Icon className="h-5 w-5 text-gray-500" />
            </div>
            <p className="font-medium text-gray-700">{label}</p>
            <p className="text-xs">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PENDING: { label: "Pendente", icon: Clock, color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  ACTIVE: { label: "Activo", icon: CheckCircle, color: "text-green-600 bg-green-50 border-green-200" },
  SUSPENDED: { label: "Suspenso", icon: XCircle, color: "text-red-600 bg-red-50 border-red-200" },
};

// ── API Keys tab ──────────────────────────────────────────────────────────────

function ApiKeysTab({ partnerStatus }: { partnerStatus: Partner["status"] }) {
  const { data: keys = [], isLoading } = useApiKeys(partnerStatus);
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();
  const { toast } = useToast();
  const [newKeyName, setNewKeyName] = useState("");
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [newlyCreated, setNewlyCreated] = useState<{ id: string; secretKey: string } | null>(null);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    const result = await createKey.mutateAsync(newKeyName.trim()).catch(() => null);
    if (result?.secretKey) {
      setNewlyCreated({ id: result.id, secretKey: result.secretKey });
    }
    setNewKeyName("");
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() =>
      toast({ title: "Copiado para a área de transferência" })
    );
  };

  return (
    <div className="space-y-6">
      {newlyCreated && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm font-medium text-yellow-800 mb-2">
            ⚠️ Guarde esta chave secreta agora — não será mostrada novamente.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white border border-yellow-200 rounded px-3 py-2 font-mono truncate">
              {newlyCreated.secretKey}
            </code>
            <button onClick={() => copy(newlyCreated.secretKey)} className="shrink-0 p-2 hover:bg-yellow-100 rounded">
              <Copy className="h-4 w-4 text-yellow-700" />
            </button>
          </div>
          <button
            onClick={() => setNewlyCreated(null)}
            className="text-xs text-yellow-600 mt-2 hover:underline"
          >
            Já guardei a chave
          </button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Criar nova chave API</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Nome da chave (ex: Website principal)"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button onClick={handleCreate} disabled={createKey.isPending || !newKeyName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Chaves existentes ({keys.filter(k => !k.revoked).length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-gray-400">A carregar…</div>
          ) : keys.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">Sem chaves API criadas.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {keys.map((k) => (
                <div key={k.id} className={`flex items-center gap-3 px-4 py-3 ${k.revoked ? "opacity-50" : ""}`}>
                  <Key className="h-4 w-4 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{k.name}</p>
                    <p className="text-xs text-gray-400 font-mono truncate">{k.publicKey}</p>
                  </div>
                  {k.revoked ? (
                    <Badge variant="physical" className="text-xs">Revogada</Badge>
                  ) : (
                    <button
                      onClick={() => revokeKey.mutate(k.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Revogar chave"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Books tab ─────────────────────────────────────────────────────────────────

function BooksTab({ partnerStatus }: { partnerStatus: Partner["status"] }) {
  const { data: books = [], isLoading } = usePartnerBooks(partnerStatus);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Os meus livros ({books.length})</CardTitle>
          <Link href="/catalog">
            <Button size="sm" variant="outline">Explorar catálogo</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">A carregar…</div>
        ) : books.length === 0 ? (
          <div className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-3">Sem livros no seu catálogo de parceiro.</p>
            <p className="text-xs text-gray-400">Utilize a API para adicionar livros ao seu widget.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {books.map((book) => (
              <div key={book.id} className="flex items-center gap-3 px-4 py-3">
                <div className="h-10 w-7 rounded bg-gray-100 shrink-0 overflow-hidden">
                  {book.coverUrl ? (
                    <Image src={book.coverUrl} alt={book.bookTitle} width={28} height={40} className="object-cover h-full w-full" />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <BookOpen className="h-3 w-3 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{book.bookTitle}</p>
                  {book.customPrice != null && (
                    <p className="text-xs text-gray-500">Preço personalizado: {book.customPrice} MZN</p>
                  )}
                </div>
                <Badge variant={book.enabled ? "ebook" : "physical"} className="text-xs">
                  {book.enabled ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main partner dashboard ────────────────────────────────────────────────────

type Tab = "overview" | "keys" | "books";

function PartnerDashboard() {
  const { data: partner } = usePartnerProfile();
  const updatePartner = useUpdatePartner();
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: partner?.name ?? "", email: partner?.email ?? "", websiteUrl: partner?.websiteUrl ?? "", description: partner?.description ?? "" });

  if (!partner) return null;

  const statusCfg = STATUS_CONFIG[partner.status];
  const StatusIcon = statusCfg.icon;

  const handleSave = () => {
    updatePartner.mutate(form, { onSuccess: () => setEditing(false) });
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Perfil", icon: Handshake },
    { id: "keys", label: "Chaves API", icon: Key },
    { id: "books", label: "Livros", icon: BookOpen },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
          <Handshake className="h-7 w-7 text-blue-800" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{partner.name}</h1>
          <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
            <StatusIcon className="h-3 w-3" />
            {statusCfg.label}
          </div>
        </div>
      </div>

      {partner.status === "PENDING" && (
        <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          A sua candidatura está a ser analisada. Receberá uma notificação quando for aprovada.
        </div>
      )}
      {partner.status === "SUSPENDED" && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          A sua conta foi suspensa. Contacte <strong>suporte@ebooks.co.mz</strong> para mais informações.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === id
                ? "border-blue-800 text-blue-800"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Informações do parceiro</CardTitle>
              {!editing && (
                <Button size="sm" variant="outline" onClick={() => {
                  setForm({ name: partner.name, email: partner.email, websiteUrl: partner.websiteUrl ?? "", description: partner.description ?? "" });
                  setEditing(true);
                }}>
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
                  <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
                  <Input value={form.websiteUrl} onChange={(e) => setForm(f => ({ ...f, websiteUrl: e.target.value }))} placeholder="https://" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={updatePartner.isPending}>
                    {updatePartner.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Guardar
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
                </div>
              </>
            ) : (
              <dl className="space-y-3 text-sm">
                {[
                  { icon: Mail, label: "Email", value: partner.email },
                  { icon: Globe, label: "Website", value: partner.websiteUrl },
                  { icon: FileText, label: "Descrição", value: partner.description },
                ].map(({ icon: Icon, label, value }) =>
                  value ? (
                    <div key={label} className="flex items-start gap-3">
                      <Icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <dt className="text-xs text-gray-400">{label}</dt>
                        <dd className="text-gray-900">{value}</dd>
                      </div>
                    </div>
                  ) : null
                )}
              </dl>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "keys" && <ApiKeysTab partnerStatus={partner.status} />}
      {tab === "books" && <BooksTab partnerStatus={partner.status} />}
    </div>
  );
}

// ── Page shell ────────────────────────────────────────────────────────────────

function PartnerContent() {
  const { data: profile, isLoading } = usePartnerProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      {profile ? <PartnerDashboard /> : <RegisterForm />}
    </main>
  );
}

export default function PartnerPage() {
  return (
    <AuthGuard>
      <PartnerContent />
    </AuthGuard>
  );
}
