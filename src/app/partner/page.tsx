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
  Upload,
  AlertCircle,
  Send,
  ChevronDown,
  ChevronUp,
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
  useRevenueSummary,
  useRevenueDetails,
  useRevenueMonthly,
  type Partner,
  type RevenueSale,
} from "@/hooks/usePartner";
import {
  useMySubmissions,
  useSubmitBook,
  type SubmitBookPayload,
} from "@/hooks/useBookSubmissions";
import type { BookSubmissionStatus } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatMZN } from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, DollarSign } from "lucide-react";
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

// ── Book submission status helpers ────────────────────────────────────────────

const SUBMISSION_STATUS: Record<
  BookSubmissionStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  PENDING_REVIEW: { label: "Em análise", color: "text-yellow-700 bg-yellow-50 border-yellow-200", icon: Clock },
  APPROVED: { label: "Aprovado", color: "text-green-700 bg-green-50 border-green-200", icon: CheckCircle },
  REJECTED: { label: "Rejeitado", color: "text-red-700 bg-red-50 border-red-200", icon: XCircle },
};

// ── Submit book form ──────────────────────────────────────────────────────────

const submitSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  description: z.string().min(20, "Descrição deve ter pelo menos 20 caracteres"),
  price: z.coerce.number().min(0, "Preço mínimo 0"),
  type: z.enum(["PHYSICAL", "EBOOK", "BOTH"] as const),
  language: z.string().default("Português"),
  isbn: z.string().optional(),
  publisher: z.string().optional(),
  pageCount: z.coerce.number().optional(),
  stockQuantity: z.coerce.number().optional(),
  authorIds: z.string().optional(),
  categoryIds: z.string().optional(),
});
type SubmitFormData = z.infer<typeof submitSchema>;

function SubmitBookForm({ onClose }: { onClose: () => void }) {
  const submitBook = useSubmitBook();
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [ebookFile, setEbookFile] = useState<File | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, watch, formState: { errors } } = useForm<SubmitFormData>({
    resolver: zodResolver(submitSchema) as any,
    defaultValues: { type: "EBOOK", language: "Português" },
  });

  const bookType = watch("type");

  const onSubmit = async (data: SubmitFormData) => {
    const payload: SubmitBookPayload = {
      ...data,
      authorIds: data.authorIds?.split(",").map((s) => s.trim()).filter(Boolean),
      categoryIds: data.categoryIds?.split(",").map((s) => s.trim()).filter(Boolean),
      coverFile,
      ebookFile,
    };
    await submitBook.mutateAsync(payload).catch(() => null);
    if (!submitBook.isError) onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 border-t border-gray-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Título *</label>
          <Input {...register("title")} placeholder="Título do livro" />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Descrição *</label>
          <textarea
            {...register("description")}
            rows={3}
            placeholder="Sinopse do livro..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
          />
          {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tipo *</label>
          <select
            {...register("type")}
            className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
          >
            <option value="EBOOK">Ebook</option>
            <option value="PHYSICAL">Físico</option>
            <option value="BOTH">Físico + Ebook</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Preço (MZN) *</label>
          <Input type="number" step="0.01" {...register("price")} placeholder="0.00" />
          {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Idioma</label>
          <Input {...register("language")} placeholder="Português" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">ISBN</label>
          <Input {...register("isbn")} placeholder="978-..." />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Editora</label>
          <Input {...register("publisher")} placeholder="Nome da editora" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Nº páginas</label>
          <Input type="number" {...register("pageCount")} placeholder="300" />
        </div>

        {(bookType === "PHYSICAL" || bookType === "BOTH") && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Stock inicial</label>
            <Input type="number" {...register("stockQuantity")} placeholder="0" />
          </div>
        )}

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">IDs dos autores (separados por vírgula)</label>
          <Input {...register("authorIds")} placeholder="uuid-autor-1, uuid-autor-2" />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">IDs das categorias (separados por vírgula)</label>
          <Input {...register("categoryIds")} placeholder="uuid-categoria-1, uuid-categoria-2" />
        </div>
      </div>

      {/* File uploads */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Capa</label>
          <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-800 transition-colors overflow-hidden">
            {coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverPreview} alt="preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-gray-400">
                <Upload className="h-5 w-5" />
                <span className="text-xs">Carregar capa</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setCoverFile(f);
                setCoverPreview(URL.createObjectURL(f));
              }}
            />
          </label>
        </div>

        {(bookType === "EBOOK" || bookType === "BOTH") && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Ficheiro Ebook (PDF/EPUB)</label>
            <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-800 transition-colors">
              <div className="flex flex-col items-center gap-1 text-gray-400">
                <FileText className="h-5 w-5" />
                <span className="text-xs">{ebookFile ? ebookFile.name : "Carregar ficheiro"}</span>
              </div>
              <input
                type="file"
                accept=".pdf,.epub"
                className="hidden"
                onChange={(e) => setEbookFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitBook.isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitBook.isPending}>
          {submitBook.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Submeter para revisão
        </Button>
      </div>
    </form>
  );
}

// ── Books tab ─────────────────────────────────────────────────────────────────

function BooksTab({ partnerStatus }: { partnerStatus: Partner["status"] }) {
  const { data: books = [], isLoading: loadingBooks } = usePartnerBooks(partnerStatus);
  const { data: submissions = [], isLoading: loadingSubmissions } = useMySubmissions(partnerStatus === "ACTIVE");
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Submeter novo livro */}
      {partnerStatus === "ACTIVE" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Publicar novo livro</CardTitle>
              <Button
                size="sm"
                variant={showForm ? "outline" : "default"}
                onClick={() => setShowForm((v) => !v)}
              >
                {showForm ? (
                  <><ChevronUp className="h-4 w-4 mr-1" /> Fechar</>
                ) : (
                  <><Plus className="h-4 w-4 mr-1" /> Submeter livro</>
                )}
              </Button>
            </div>
            {!showForm && (
              <p className="text-xs text-gray-400 mt-1">
                Submeta livros para revisão pela equipa da EBooksStore. Após aprovação, ficam disponíveis no catálogo público.
              </p>
            )}
          </CardHeader>
          {showForm && <SubmitBookForm onClose={() => setShowForm(false)} />}
        </Card>
      )}

      {/* Histórico de submissões */}
      {partnerStatus === "ACTIVE" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              As minhas submissões ({submissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingSubmissions ? (
              <div className="p-6 text-center text-sm text-gray-400">A carregar…</div>
            ) : submissions.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                Ainda não submeteu nenhum livro.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {submissions.map((sub) => {
                  const cfg = SUBMISSION_STATUS[sub.status];
                  const Icon = cfg.icon;
                  return (
                    <div key={sub.id} className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-7 rounded bg-gray-100 shrink-0 overflow-hidden">
                          {sub.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={sub.coverUrl} alt={sub.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <BookOpen className="h-3 w-3 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-gray-900 truncate">{sub.title}</p>
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
                              <Icon className="h-3 w-3" />
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {sub.type === "EBOOK" ? "Ebook" : sub.type === "PHYSICAL" ? "Físico" : "Físico+Ebook"} · {sub.price} MZN
                          </p>
                        </div>
                      </div>
                      {sub.status === "REJECTED" && sub.parecer && (
                        <div className="mt-2 ml-10 flex items-start gap-1.5 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span><strong>Parecer:</strong> {sub.parecer}</span>
                        </div>
                      )}
                      {sub.status === "APPROVED" && sub.parecer && (
                        <div className="mt-2 ml-10 flex items-start gap-1.5 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                          <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span><strong>Nota:</strong> {sub.parecer}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Livros activos no widget */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Livros no widget ({books.length})</CardTitle>
            <Link href="/catalog">
              <Button size="sm" variant="outline">Explorar catálogo</Button>
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Livros adicionados ao seu widget via API de parceiro.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {loadingBooks ? (
            <div className="p-8 text-center text-sm text-gray-400">A carregar…</div>
          ) : books.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-1">Sem livros no catálogo do widget.</p>
              <p className="text-xs text-gray-400">Utilize as chaves API para adicionar livros ao widget.</p>
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
    </div>
  );
}

// ── Revenue tab ───────────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function RevenueTab({ partnerStatus }: { partnerStatus: Partner["status"] }) {
  const [detailPage, setDetailPage] = useState(1);
  const { data: summary, isLoading: loadingSummary } = useRevenueSummary(partnerStatus);
  const { data: details, isLoading: loadingDetails } = useRevenueDetails(detailPage, partnerStatus);
  const { data: monthly } = useRevenueMonthly(undefined, partnerStatus);

  const chartData = (monthly ?? []).map((m) => ({
    month: MONTH_NAMES[new Date(m.month).getMonth()],
    Ganhos: Number((m.partner_share ?? 0).toFixed(0)),
    Bruto: Number((m.gross ?? 0).toFixed(0)),
  }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          {
            icon: TrendingUp,
            label: "Os seus ganhos",
            value: loadingSummary ? null : summary?.allTime.yourShare,
            color: "text-green-600 bg-green-50",
          },
          {
            icon: DollarSign,
            label: "Receita bruta total",
            value: loadingSummary ? null : summary?.allTime.grossRevenue,
            color: "text-blue-700 bg-blue-50",
          },
          {
            icon: Clock,
            label: "Por liquidar",
            value: loadingSummary ? null : summary?.pending.amount,
            color: "text-yellow-600 bg-yellow-50",
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  {value == null ? (
                    <div className="h-5 w-20 bg-gray-100 animate-pulse rounded mt-0.5" />
                  ) : (
                    <p className="text-base font-bold text-gray-900">{formatMZN(value)}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Ganhos mensais — {new Date().getFullYear()}</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">Sem dados para o ano actual.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  width={36}
                />
                <Tooltip
                  formatter={(value) => formatMZN(Number(value ?? 0))}
                  labelStyle={{ fontWeight: 600 }}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="Ganhos" fill="#1e40af" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Bruto" fill="#bfdbfe" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Transaction history */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Histórico de vendas</CardTitle>
            {summary && (
              <span className="text-xs text-gray-400">
                {summary.allTime.totalSales} vendas no total
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingDetails ? (
            <div className="p-6 text-center text-sm text-gray-400">A carregar…</div>
          ) : !details?.items.length ? (
            <div className="p-8 text-center text-sm text-gray-400">Sem vendas registadas.</div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {details.items.map((sale: RevenueSale) => (
                  <div key={sale.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{sale.bookTitle}</p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(sale.createdAt), "d MMM yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-green-700">+{formatMZN(sale.partnerAmount)}</p>
                      <p className="text-xs text-gray-400">de {formatMZN(sale.grossAmount)}</p>
                    </div>
                    <div className="shrink-0">
                      {sale.settledAt ? (
                        <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full">Liquidado</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-full">Pendente</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {details.total > details.limit && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Página {details.page} de {Math.ceil(details.total / details.limit)}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={details.page <= 1} onClick={() => setDetailPage((p) => p - 1)}>
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={details.page >= Math.ceil(details.total / details.limit)}
                      onClick={() => setDetailPage((p) => p + 1)}
                    >
                      Seguinte
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main partner dashboard ────────────────────────────────────────────────────

type Tab = "overview" | "keys" | "books" | "revenue";

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
    { id: "revenue", label: "Receitas", icon: TrendingUp },
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

      {tab === "revenue" && <RevenueTab partnerStatus={partner.status} />}
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
