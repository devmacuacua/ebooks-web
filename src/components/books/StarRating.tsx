import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number; // 0-5
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  totalReviews?: number;
}

export function StarRating({
  rating,
  maxStars = 5,
  size = "sm",
  showValue = false,
  totalReviews,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: maxStars }).map((_, i) => {
          const filled = i < Math.floor(rating);
          const half = !filled && i < rating;
          return (
            <Star
              key={i}
              className={cn(
                sizeClasses[size],
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : half
                  ? "fill-yellow-200 text-yellow-400"
                  : "fill-gray-100 text-gray-300"
              )}
            />
          );
        })}
      </div>
      {showValue && (
        <span className="text-xs text-gray-500">
          {rating.toFixed(1)}
          {totalReviews !== undefined && (
            <span className="ml-1">({totalReviews})</span>
          )}
        </span>
      )}
    </div>
  );
}
