"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  ShoppingCart,
  BookOpen,
  Package,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Star,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/books/StarRating";
import { BookCard } from "@/components/books/BookCard";
import { useBook } from "@/hooks/useBooks";
import { useBookAccess } from "@/hooks/useLibrary";
import { useCart } from "@/hooks/useCart";
import { useCurrentUser } from "@/hooks/useAuth";
import { formatMZN } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/api";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

export default function BookDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: book, isLoading, error } = useBook(slug);
  const { data: access } = useBookAccess(book?.id || "");
  const { addItem } = useCart();
  const user = useCurrentUser();
  const { toast } = useToast();
  const [previewIndex, setPreviewIndex] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } =
    useForm<ReviewFormData>({ resolver: zodResolver(reviewSchema), defaultValues: { rating: 0 } });
  const currentRating = watch("rating");

  const handleAddToCart = () => {
    if (!book) return;
    addItem({
      id: book.id,
      bookId: book.id,
      title: book.title,
      slug: book.slug,
      coverImageUrl: book.coverImageUrl,
      price: book.price,
      type: book.type,
    });
    toast({ variant: "success", title: "Adicionado ao carrinho!", description: book.title });
  };

  const onSubmitReview = async (data: ReviewFormData) => {
    if (!book) return;
    setSubmittingReview(true);
    try {
      await api.post(`/api/catalog/books/${book.id}/reviews`, data);
      toast({ variant: "success", title: "Avaliação enviada!", description: "Obrigado pela sua opinião." });
      reset();
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível enviar a avaliação." });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
          <div className="aspect-[2/3] rounded-xl bg-gray-200" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-20 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400 text-lg mb-4">Livro não encontrado</p>
        <Link href="/catalog">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
          </Button>
        </Link>
      </div>
    );
  }

  const TYPE_LABELS = { PHYSICAL: "Físico", EBOOK: "Ebook", BOTH: "Físico + Ebook" };
  const TYPE_VARIANTS = {
    EBOOK: "ebook" as const,
    PHYSICAL: "physical" as const,
    BOTH: "both" as const,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-blue-800">Início</Link>
        <span>/</span>
        <Link href="/catalog" className="hover:text-blue-800">Catálogo</Link>
        <span>/</span>
        <span className="text-gray-900 truncate max-w-[200px]">{book.title}</span>
      </nav>

      {/* Main detail grid */}
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 mb-12">
        {/* Left: Cover + Preview */}
        <div className="space-y-4">
          <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg bg-gray-100">
            {book.coverImageUrl ? (
              <Image
                src={book.coverImageUrl}
                alt={book.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <BookOpen className="h-20 w-20 text-gray-300" />
              </div>
            )}
          </div>

          {/* Preview carousel */}
          {book.previewImages.length > 0 && (
            <div className="relative">
              <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-100 shadow">
                <Image
                  src={book.previewImages[previewIndex]}
                  alt={`Pré-visualização ${previewIndex + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              {book.previewImages.length > 1 && (
                <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                    disabled={previewIndex === 0}
                    className="rounded-full bg-black/50 p-1 text-white disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-white text-xs bg-black/50 rounded px-2 py-0.5">
                    {previewIndex + 1}/{book.previewImages.length}
                  </span>
                  <button
                    onClick={() => setPreviewIndex((i) => Math.min(book.previewImages.length - 1, i + 1))}
                    disabled={previewIndex === book.previewImages.length - 1}
                    className="rounded-full bg-black/50 p-1 text-white disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-400 text-center mt-1">Pré-visualização</p>
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div>
          {/* Type badge */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant={TYPE_VARIANTS[book.type]}>{TYPE_LABELS[book.type]}</Badge>
            {book.subscriptionOnly && <Badge variant="accent">Subscrição</Badge>}
            {book.categories.map((c) => (
              <Badge key={c.id} variant="secondary">{c.name}</Badge>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>

          {/* Authors */}
          <p className="text-gray-600 mb-3">
            por{" "}
            {book.authors.map((a, i) => (
              <React.Fragment key={a.id}>
                {i > 0 && ", "}
                <span className="font-medium text-gray-800">{a.name}</span>
              </React.Fragment>
            ))}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <StarRating rating={book.averageRating} size="md" showValue totalReviews={book.totalReviews} />
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 text-sm">
            {book.pageCount && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Páginas</p>
                <p className="font-semibold text-gray-900">{book.pageCount}</p>
              </div>
            )}
            {book.publisher && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Editora</p>
                <p className="font-semibold text-gray-900 truncate">{book.publisher}</p>
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500 text-xs">Idioma</p>
              <p className="font-semibold text-gray-900">{book.language}</p>
            </div>
          </div>

          {/* Price & CTA */}
          <div className="border border-gray-200 rounded-xl p-5 mb-6 bg-gray-50">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-extrabold text-gray-900">{formatMZN(book.price)}</span>
              {book.type !== "EBOOK" && (
                <span className="text-sm text-gray-500">
                  + entrega 150,00 MZN
                </span>
              )}
            </div>

            <div className="space-y-2">
              {/* Physical book CTA */}
              {(book.type === "PHYSICAL" || book.type === "BOTH") && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {book.type === "BOTH" ? "Comprar Livro Físico" : "Adicionar ao Carrinho"}
                </Button>
              )}

              {/* Ebook CTAs */}
              {(book.type === "EBOOK" || book.type === "BOTH") && (
                <>
                  {access?.hasAccess ? (
                    <Link href={`/reader/${book.id}`} className="block">
                      <Button className="w-full" size="lg" variant="accent">
                        <BookOpen className="h-4 w-4" /> Ler Agora
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Button
                        className="w-full"
                        size="lg"
                        variant={book.type === "BOTH" ? "outline" : "default"}
                        onClick={handleAddToCart}
                      >
                        <BookOpen className="h-4 w-4" />
                        Comprar Ebook — {formatMZN(book.price)}
                      </Button>
                      {!book.subscriptionOnly && (
                        <Link href="/subscription">
                          <Button
                            className="w-full"
                            size="lg"
                            variant="ghost"
                          >
                            Aceder via Subscrição
                          </Button>
                        </Link>
                      )}
                    </>
                  )}
                </>
              )}

              {book.type === "PHYSICAL" && book.stockQuantity !== undefined && (
                <p className="text-xs text-gray-500 text-center">
                  {book.stockQuantity > 0 ? (
                    <span className="text-green-600 flex items-center justify-center gap-1">
                      <Check className="h-3 w-3" /> Em stock ({book.stockQuantity} disponíveis)
                    </span>
                  ) : (
                    <span className="text-red-500">Esgotado</span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Descrição</h2>
            <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">
              {book.description}
            </p>
          </div>
        </div>
      </div>

      {/* Related Books */}
      {book.relatedBooks.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Livros Relacionados</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {book.relatedBooks.map((b) => (
              <div key={b.id} className="w-44 shrink-0">
                <BookCard {...b} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Avaliações ({book.totalReviews})
        </h2>

        {/* Add review */}
        {user && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Escrever avaliação</h3>
              <form onSubmit={handleSubmit(onSubmitReview)} className="space-y-3">
                {/* Star picker */}
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setValue("rating", s)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 transition-colors ${
                          s <= (hoverRating || currentRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-100 text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {errors.rating && (
                  <p className="text-xs text-red-600">Seleccione uma classificação</p>
                )}

                <textarea
                  placeholder="Partilhe a sua opinião sobre o livro... (opcional)"
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 resize-none"
                  {...register("comment")}
                />

                <Button type="submit" size="sm" loading={submittingReview}>
                  Publicar avaliação
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Reviews list */}
        <div className="space-y-4">
          {book.reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-blue-800 flex items-center justify-center text-xs text-white font-bold">
                      {review.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{review.userName}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString("pt-MZ")}
                      </p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-600">{review.comment}</p>
                )}
              </CardContent>
            </Card>
          ))}
          {book.reviews.length === 0 && (
            <p className="text-gray-400 text-sm py-6 text-center">
              Ainda não há avaliações. Seja o primeiro!
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
