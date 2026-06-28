"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2, Upload, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import api from "@/lib/api";
import type { Book } from "@/types";

const editSchema = z.object({
  title: z.string().min(1, "Obrigatório"),
  description: z.string().min(10),
  price: z.coerce.number().min(0),
  language: z.string(),
  publisher: z.string().optional(),
  pageCount: z.coerce.number().optional(),
  stockQuantity: z.coerce.number().optional(),
  subscriptionOnly: z.boolean(),
  featured: z.boolean(),
});

type EditFormData = z.infer<typeof editSchema>;

export default function EditBookPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [book, setBook] = useState<Book | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [ebookFile, setEbookFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<EditFormData>({ resolver: zodResolver(editSchema) as any });

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const { data } = await api.get<Book>(`/api/admin/books/${id}`);
        setBook(data);
        reset({
          title: data.title,
          description: data.description,
          price: data.price,
          language: data.language,
          publisher: data.publisher,
          pageCount: data.pageCount,
          stockQuantity: data.stockQuantity,
          subscriptionOnly: data.subscriptionOnly,
          featured: data.featured,
        });
      } catch {
        toast({ variant: "destructive", title: "Erro", description: "Livro não encontrado." });
        router.push("/admin/books");
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id, reset, router, toast]);

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

  const onSubmit = async (data: EditFormData) => {
    setSaving(true);
    try {
      await api.put(`/api/admin/books/${id}`, data);

      if (coverFile) {
        const formData = new FormData();
        formData.append("file", coverFile);
        const { data: coverData } = await api.post<{ url: string; objectKey: string }>(
          `/api/media/books/${id}/cover`, formData
        );
        await api.put(`/api/admin/books/${id}`, { coverImage: coverData.url });
      }

      if (ebookFile && (book?.type === "EBOOK" || book?.type === "BOTH")) {
        const formData = new FormData();
        formData.append("file", ebookFile);
        const { data: ebookData } = await api.post<{ objectKey: string; format: string }>(
          `/api/media/books/${id}/ebook`, formData
        );
        await api.put(`/api/admin/books/${id}`, { fileKey: ebookData.objectKey, format: ebookData.format });
      }

      toast({ variant: "success", title: "Livro actualizado!" });
      router.push("/admin/books");
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível guardar as alterações." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/books">
          <button className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Livro</h1>
          <p className="text-sm text-gray-500 truncate">{book?.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Cover upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Capa</label>
          <div className="flex items-start gap-4">
            <div className="relative h-32 w-24 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">
              {coverPreview || book?.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverPreview ?? book!.coverImageUrl!} alt="Capa" className="h-full w-full object-cover" />
              ) : (
                <BookOpen className="h-8 w-8 text-gray-300" />
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Upload className="h-4 w-4" />
                {coverFile ? coverFile.name : "Substituir imagem"}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            </label>
          </div>
        </div>

        {/* Ebook file upload */}
        {(book?.type === "EBOOK" || book?.type === "BOTH") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ficheiro Ebook</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Upload className="h-4 w-4" />
                {ebookFile ? ebookFile.name : "Substituir PDF ou EPUB"}
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

        <Input
          label="Título *"
          error={errors.title?.message}
          {...register("title")}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
          <textarea
            rows={4}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 resize-none"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-xs text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço (MZN)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
              {...register("price", )}
            />
          </div>
          <Input label="Idioma" {...register("language")} />
          <Input label="Editora" {...register("publisher")} />
          <Input label="Páginas" type="number" {...register("pageCount", )} />
        </div>

        {(book?.type === "PHYSICAL" || book?.type === "BOTH") && (
          <Input
            label="Stock"
            type="number"
            {...register("stockQuantity", )}
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

        <div className="flex gap-3">
          <Button type="submit" loading={saving} size="lg">
            <Save className="h-4 w-4" /> Guardar Alterações
          </Button>
          <Link href="/admin/books">
            <Button type="button" variant="outline" size="lg">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
