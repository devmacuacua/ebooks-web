import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ebooksstore.co.mz";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/catalog", "/books/", "/subscription"],
        disallow: [
          "/admin/",
          "/library",
          "/reader/",
          "/orders",
          "/wishlist",
          "/settings",
          "/notifications",
          "/partner",
          "/api/",
          "/checkout/",
          "/cart",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
