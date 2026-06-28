import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">{children}</main>
      <Footer />
    </>
  );
}
