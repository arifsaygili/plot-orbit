import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-900">
      <main className="text-center">
        <h1 className="text-4xl font-bold text-white">Plot Orbit</h1>
        <p className="mt-4 text-xl text-zinc-400">It works!</p>
        <Link href="/dashboard" className="mt-6 inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Go to Dashboard
        </Link>
      </main>
    </div>
  );
}
