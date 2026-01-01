"use client";

import { useState, useEffect, useCallback } from "react";
import { listKmlFiles, type FileInfo } from "@/client/api/filesClient";
import { KmlUploadForm, KmlFileList } from "@/components/kml";

export default function KmlPage() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFiles = useCallback(async () => {
    try {
      const result = await listKmlFiles();
      setFiles(result.items);
    } catch (err) {
      console.error("Failed to load files:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleUploadSuccess = (file: FileInfo) => {
    setFiles((prev) => [file, ...prev]);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">KML Files</h1>
        <p className="text-gray-600 mt-1">
          Upload and manage your KML/KMZ files for plot visualization
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Upload New File
        </h2>
        <KmlUploadForm onUploadSuccess={handleUploadSuccess} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Your Files
        </h2>
        <KmlFileList files={files} isLoading={isLoading} />
      </div>
    </div>
  );
}
