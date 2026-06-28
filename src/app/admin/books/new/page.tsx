"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Upload, BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import api from "@/lib/api";
import type { BookType } from "@/types";

const bookSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  isbn: z.string().optional(),
  price: z.coerce.number().min(0, "Preço mínimo 0"),
  type: z.enum(["PHYSICAL", "EBOOK", "BOTH"]),
  language: z.string().default("Português"),
  publisher: z.string().optional(),
  pageCount: z.coerce.number().optional(),
  authorIds: z.string().optional(),
  categoryIds: z.string().optional(),
  subscriptionOnly: z.boolean().default(false),
  featured: z.boolean().default(false),
  stockQuantity: z.coerce.number().optional(),
});

type BookFormData = z.infer<typeof bookSchema>;

function parseIds(raw?: string): string[] | undefined {
  if (!raw?.trim()) return undefined;
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export default function NewBookPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [ebookFile, setEbookFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<BookFormData>({ resolver: zodResolver(bookSchema) as any,
    defaultValues: { type: "EBOOK", language: "Português", subscriptionOnly: false, featured: false },
  });

  const bookType = watch("type") as BookType;

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleEbookChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEbookFile(file);
  };

  const onSubmit = async (data: BookFormData) => {
    setSaving(true);
    try {
      const payload = {
        title: data.title,
        description: data.description,
        price: data.price,
        type: data.type,
        language: data.language,
        subscriptionOnly: data.subscriptionOnly,
        featured: data.featured,
        ...(data.isbn && { isbn: data.isbn }),
        ...(data.publisher && { publisher: data.publisher }),
        ...(data.pageCount && { pageCount: data.pageCount }),
        ...(data.stockQuantity && { stockQuantity: data.stockQuantity }),
        ...(parseIds(data.authorIds) && { authorIds: parseIds(data.authorIds) }),
        ...(parseIds(data.categoryIds) && { categoryIds: parseIds(data.categoryIds) }),
      };

      const { data: created } = await api.post<{ id: string }>("/api/admin/books", payload);

      const mediaUpdates: Record<string, unknown> = {};

      if (coverFile && created.id) {
        const formData = new FormData();
        formData.append("file", coverFile);
        const { data: coverData } = await api.post<{ url: string; objectKey: string }>(
          `/api/media/books/${created.id}/cover`, formData
        );
        mediaUpdates.coverImage = coverData.url;
      }

      if (ebookFile && created.id && (data.type === "EBOOK" || data.type === "BOTH")) {
        const formData = new FormData();
        formData.append("file", ebookFile);
        const { data: ebookData } = await api.post<{ objectKey: string; sizeBytes: number; format: string }>(
          `/api/media/books/${created.id}/ebook`, formData
        );
        mediaUpdates.fileKey = ebookData.objectKey;
        mediaUpdates.format = ebookData.format;
      }

      if (Object.keys(mediaUpdates).length > 0) {
        await api.put(`/api/admin/books/${created.id}`, mediaUpdates);
      }

      toast({ variant: "success", title: "Livro criado com sucesso!" });
      router.push("/admin/books");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Erro ao criar livro.";
      toast({ variant: "destructive", title: "Erro", description: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/books">
          <button className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Novo Livro</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Cover upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Capa</label>
          <div className="flex items-start gap-4">
            <div className="relative h-32 w-24 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverPreview} alt="Capa" className="h-full w-full object-cover" />
              ) : (
                <BookOpen className="h-8 w-8 text-gray-300" />
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Upload className="h-4 w-4" />
                {coverFile ? coverFile.name : "Seleccionar imagem"}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverChange}
              />
            </label>
          </div>
        </div>

        {(bookType === "EBOOK" || bookType === "BOTH") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ficheiro Ebook</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Upload className="h-4 w-4" />
                {ebookFile ? ebookFile.name : "Seleccionar PDF ou EPUB"}
              </div>
              <input
                type="file"
                accept=".pdf,.epub,application/pdf,application/epub+zip"
                className="hidden"
                onChange={handleEbookChange}
              />
            </label>
            {ebookFile && (
              <p className="text-xs text-gray-500 mt-1">{(ebookFile.size / 1024 / 1024).toFixed(1)} MB</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <Input
            label="Título *"
            placeholder="Título do livro"
            error={errors.title?.message}
            {...register("title")}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição *
            </label>
            <textarea
              rows={4}
              placeholder="Sinopse do livro..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 resize-none"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select
              className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
              {...register("type")}
            >
              <option value="EBOOK">Ebook</option>
              <option value="PHYSICAL">Físico</option>
              <option value="BOTH">Físico + Ebook</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preço (MZN) *
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
              {...register("price")}
            />
            {errors.price && (
              <p className="text-xs text-red-600 mt-1">{errors.price.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="ISBN" placeholder="978-..." {...register("isbn")} />
          <Input label="Editora" placeholder="Nome da editora" {...register("publisher")} />
          <Input label="Páginas" type="number" placeholder="200" {...register("pageCount")} />
          <Input label="Idioma" placeholder="Português" {...register("language")} />
        </div>

        {(bookType === "PHYSICAL" || bookType === "BOTH") && (
          <Input
            label="Stock disponível"
            type="number"
            placeholder="0"
            {...register("stockQuantity")}
          />
        )}

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded text-blue-800" {...register("featured")} />
            <span className="text-sm text-gray-700">Em Destaque</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded text-blue-800" {...register("subscriptionOnly")} />
            <span className="text-sm text-gray-700">Apenas Subscrição</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="IDs dos Autores (separados por vírgula)"
            placeholder="uuid1, uuid2"
            {...register("authorIds")}
          />
          <Input
            label="IDs das Categorias (separados por vírgula)"
            placeholder="uuid1, uuid2"
            {...register("categoryIds")}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={saving} size="lg">
            Criar Livro
          </Button>
          <Link href="/admin/books">
            <Button type="button" variant="outline" size="lg">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
