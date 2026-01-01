import { requireAuth } from "@/server/auth";
import { LogoutButton } from "./LogoutButton";

export default async function DashboardPage() {
  const { user, tenant } = await requireAuth();

  return (
    <div className="min-h-screen bg-zinc-900 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <LogoutButton />
        </div>

        <div className="mt-8 rounded-lg border border-zinc-700 bg-zinc-800 p-6">
          <h2 className="text-xl font-semibold text-white">Welcome!</h2>
          <div className="mt-4 space-y-2 text-zinc-300">
            <p>
              <span className="text-zinc-500">Logged in as:</span>{" "}
              {user.name || user.email}
            </p>
            <p>
              <span className="text-zinc-500">Email:</span> {user.email}
            </p>
            <p>
              <span className="text-zinc-500">Role:</span> {user.role}
            </p>
            <p>
              <span className="text-zinc-500">Organization:</span>{" "}
              {tenant.name} ({tenant.slug})
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-zinc-700 bg-zinc-800 p-6">
          <h3 className="text-lg font-medium text-white">Quick Links</h3>
          <div className="mt-4 flex gap-4">
            <a
              href="/viewer"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Open Viewer
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
