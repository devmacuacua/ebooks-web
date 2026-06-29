import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catálogo",
  description:
    "Explore milhares de livros físicos e ebooks. Filtre por categoria, preço, tipo e muito mais na maior livraria digital de Moçambique.",
  openGraph: {
    title: "Catálogo de Livros | EBooksStore",
    description:
      "Explore milhares de livros físicos e ebooks disponíveis em Moçambique.",
  },
};

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
