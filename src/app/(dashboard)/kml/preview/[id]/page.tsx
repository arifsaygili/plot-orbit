"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { listKmlFiles, type FileInfo } from "@/client/api/filesClient";

// Dynamic import to avoid SSR issues with Cesium
const KmlPreviewViewer = dynamic(
  () => import("@/components/kml/KmlPreviewViewer").then((m) => m.KmlPreviewViewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-gray-900">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

export default function KmlPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const fileId = params.id as string;

  const [file, setFile] = useState<FileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFile() {
      try {
        const result = await listKmlFiles();
        const found = result.items.find((f) => f.id === fileId);
        if (found) {
          setFile(found);
        } else {
          setError("File not found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load file");
      } finally {
        setIsLoading(false);
      }
    }

    loadFile();
  }, [fileId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 mb-4">{error || "File not found"}</p>
        <button
          onClick={() => router.push("/kml")}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Files
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
        <div className="flex items-center gap-4">
          <Link
            href="/kml"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </Link>
          <div>
            <h1 className="font-semibold text-gray-900">{file.name}</h1>
            <p className="text-sm text-gray-500">{file.originalName}</p>
          </div>
        </div>
        <span
          className={`px-2 py-1 text-xs font-semibold rounded ${
            file.type === "KMZ"
              ? "bg-purple-100 text-purple-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {file.type}
        </span>
      </div>

      {/* Viewer */}
      <div className="flex-1">
        <KmlPreviewViewer fileId={fileId} fileName={file.name} />
      </div>
    </div>
  );
}
