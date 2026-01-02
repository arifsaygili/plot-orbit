import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ParselShot - Giriş",
  description: "ParselShot hesabınıza giriş yapın veya yeni hesap oluşturun.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
