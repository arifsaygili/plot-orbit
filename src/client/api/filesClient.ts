export interface FileInfo {
  id: string;
  type: "KML" | "KMZ";
  name: string;
  originalName: string;
  size: number;
  createdAt: string;
}

export interface UploadResult {
  file: FileInfo;
}

export interface ListFilesResult {
  items: FileInfo[];
}

export async function uploadKmlFile(
  file: File,
  name?: string
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (name) {
    formData.append("name", name);
  }

  const response = await fetch("/api/files/kml", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Upload failed");
  }

  return response.json();
}

export async function listKmlFiles(): Promise<ListFilesResult> {
  const response = await fetch("/api/files/kml");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to list files");
  }

  return response.json();
}

export async function downloadFile(fileId: string): Promise<Blob> {
  const response = await fetch(`/api/files/${fileId}/download`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Download failed");
  }

  return response.blob();
}

export function getFileDownloadUrl(fileId: string): string {
  return `/api/files/${fileId}/download`;
}
