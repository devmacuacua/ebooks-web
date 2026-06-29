import Link from "next/link";
import Image from "next/image";
import { BookOpen, Package, Heart } from "lucide-react";
import { StarRating } from "./StarRating";
import { Badge } from "@/components/ui/badge";
import { formatMZN } from "@/lib/api";
import type { BookType } from "@/types";
import { cn } from "@/lib/utils";

interface BookCardProps {
  id: string;
  title: string;
  slug: string;
  coverImageUrl?: string;
  price: number;
  type: BookType;
  authorNames: string[];
  averageRating: number;
  totalReviews?: number;
  subscriptionOnly?: boolean;
  className?: string;
  inWishlist?: boolean;
  onWishlistToggle?: (e: React.MouseEvent) => void;
}

const TYPE_BADGE: Record<BookType, { label: string; variant: "ebook" | "physical" | "both" }> = {
  EBOOK: { label: "Ebook", variant: "ebook" },
  PHYSICAL: { label: "Físico", variant: "physical" },
  BOTH: { label: "Físico + Ebook", variant: "both" },
};

export function BookCard({
  title,
  slug,
  coverImageUrl,
  price,
  type,
  authorNames,
  averageRating,
  totalReviews,
  subscriptionOnly,
  className,
  inWishlist,
  onWishlistToggle,
}: BookCardProps) {
  const typeBadge = TYPE_BADGE[type];

  return (
    <Link
      href={`/books/${slug}`}
      className={cn(
        "group flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200",
        className
      )}
    >
      {/* Cover */}
      <div className="relative aspect-[2/3] bg-gray-100 overflow-hidden">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-12 w-12 text-gray-300" />
          </div>
        )}
        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
          {subscriptionOnly && (
            <Badge variant="accent">Subscrição</Badge>
          )}
        </div>
        {/* Wishlist button */}
        {onWishlistToggle && (
          <button
            onClick={onWishlistToggle}
            aria-label={inWishlist ? "Remover da lista de desejos" : "Adicionar à lista de desejos"}
            className="absolute top-2 right-2 rounded-full bg-white/80 p-1.5 shadow hover:bg-white transition-colors"
          >
            <Heart
              className={cn("h-4 w-4", inWishlist ? "fill-red-500 text-red-500" : "text-gray-400")}
            />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 p-3 flex-1">
        {/* Authors */}
        <p className="text-xs text-gray-500 truncate">
          {authorNames.length > 0 ? authorNames.join(", ") : "Autor desconhecido"}
        </p>

        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-800 transition-colors">
          {title}
        </h3>

        {/* Rating */}
        <StarRating rating={averageRating} showValue totalReviews={totalReviews} />

        {/* Price & type icon */}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="text-base font-bold text-blue-800">
            {subscriptionOnly ? "Subscrição" : formatMZN(price)}
          </span>
          {type === "PHYSICAL" || type === "BOTH" ? (
            <Package className="h-4 w-4 text-gray-400" />
          ) : (
            <BookOpen className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>
    </Link>
  );
}
