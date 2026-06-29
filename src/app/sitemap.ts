import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ebooksstore.co.mz";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
  { url: `${BASE}/catalog`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
  { url: `${BASE}/subscription`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  { url: `${BASE}/login`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  { url: `${BASE}/register`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
];

interface BookSlug {
  slug: string;
  updatedAt?: string;
}

interface PageResponse {
  content: BookSlug[];
  totalPages: number;
}

async function fetchAllBookSlugs(): Promise<BookSlug[]> {
  const slugs: BookSlug[] = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    try {
      const res = await fetch(
        `${API}/api/catalog/books?page=${page}&size=100&fields=slug,updatedAt`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) break;
      const data: PageResponse = await res.json();
      slugs.push(...(data.content ?? []));
      totalPages = data.totalPages ?? 1;
      page++;
    } catch {
      break;
    }
  }

  return slugs;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const books = await fetchAllBookSlugs();
  const bookRoutes: MetadataRoute.Sitemap = books.map((b) => ({
    url: `${BASE}/books/${b.slug}`,
    lastModified: b.updatedAt ? new Date(b.updatedAt) : new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...STATIC_ROUTES, ...bookRoutes];
}
