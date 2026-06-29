import type { Metadata } from "next";
import BookDetailClient from "./BookDetailClient";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ebooksstore.co.mz";

interface BookMeta {
  title: string;
  description?: string;
  coverImage?: string;
  coverImageUrl?: string;
  authorNames?: string[];
  averageRating?: number;
  price?: number;
  slug: string;
}

async function fetchBookMeta(slug: string): Promise<BookMeta | null> {
  try {
    const res = await fetch(`${API}/api/catalog/books/slug/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = await fetchBookMeta(slug);

  if (!book) {
    return { title: "Livro não encontrado" };
  }

  const coverUrl = book.coverImageUrl ?? book.coverImage;
  const authors = book.authorNames?.join(", ");
  const description =
    book.description
      ? book.description.slice(0, 160)
      : `${book.title}${authors ? ` de ${authors}` : ""} — disponível na EBooksStore.`;

  return {
    title: book.title,
    description,
    openGraph: {
      title: book.title,
      description,
      url: `${BASE}/books/${slug}`,
      type: "book",
      ...(coverUrl && {
        images: [{ url: coverUrl, width: 400, height: 600, alt: book.title }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: book.title,
      description,
      ...(coverUrl && { images: [coverUrl] }),
    },
  };
}

export default function BookDetailPage() {
  return <BookDetailClient />;
}
