import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscrição",
  description:
    "Leia livros sem limites com a subscrição EBooksStore. Acesso ilimitado a centenas de ebooks por um valor fixo mensal.",
  openGraph: {
    title: "Subscrição Ilimitada | EBooksStore",
    description:
      "Acesso ilimitado a centenas de ebooks por um valor fixo mensal. Cancele quando quiser.",
  },
};

export default function SubscriptionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
