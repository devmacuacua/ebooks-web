import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | EBooksStore",
    default: "EBooksStore | Livros Físicos e Digitais",
  },
  description:
    "A maior livraria digital de Moçambique. Compre livros físicos, ebooks e aceda a milhares de títulos com a nossa subscrição.",
  keywords: ["livros", "ebooks", "Moçambique", "livraria online", "livros digitais"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EBooksStore",
  },
  openGraph: {
    type: "website",
    locale: "pt_MZ",
    siteName: "EBooksStore",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://ebooksstore.co.mz",
  },
  twitter: {
    card: "summary_large_image",
    site: "@ebooksstore_mz",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e3a5f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-MZ" className={inter.variable}>
      <head>
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <Providers>{children}</Providers>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
