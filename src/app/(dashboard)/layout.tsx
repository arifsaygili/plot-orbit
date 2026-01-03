import { requireAuth } from "@/server/auth";
import { DashboardShell } from "@/components/dashboard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will redirect to /login if not authenticated
  await requireAuth();

  return <DashboardShell>{children}</DashboardShell>;
}
