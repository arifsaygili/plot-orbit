/**
 * Video API client
 */

export interface CreateIntentResponse {
  ok: boolean;
  videoId?: string;
  uploadPath?: string;
  videosCreatedLifetime?: number;
  code?: string;
  message?: string;
}

export interface VideoStatusResponse {
  ok: boolean;
  video?: {
    id: string;
    status: string;
    durationMs: number | null;
    fps: number | null;
    width: number | null;
    height: number | null;
    createdAt: string;
    outputFile?: {
      id: string;
      name: string;
      mime: string;
      size: number;
    } | null;
  };
  code?: string;
  message?: string;
}

export interface UploadResponse {
  ok: boolean;
  fileId?: string;
  code?: string;
  message?: string;
}

/**
 * Create a video intent (reserves quota and creates Video record)
 */
export async function createVideoIntent(
  sourceKmlFileId?: string
): Promise<CreateIntentResponse> {
  const body = sourceKmlFileId ? JSON.stringify({ sourceKmlFileId }) : undefined;

  const response = await fetch("/api/videos/create-intent", {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : {},
    body,
  });

  return response.json();
}

/**
 * Update video status
 */
export async function updateVideoStatus(
  videoId: string,
  status: string,
  metadata?: {
    durationMs?: number;
    fps?: number;
    width?: number;
    height?: number;
    errorMessage?: string;
  }
): Promise<{ ok: boolean }> {
  const response = await fetch(`/api/videos/${videoId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, ...metadata }),
  });

  return response.json();
}

/**
 * Get video details
 */
export async function getVideo(videoId: string): Promise<VideoStatusResponse> {
  const response = await fetch(`/api/videos/${videoId}`);
  return response.json();
}

/**
 * Upload video file
 */
export async function uploadVideo(
  videoId: string,
  blob: Blob,
  filename: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", blob, filename);

  const response = await fetch(`/api/videos/${videoId}/upload`, {
    method: "POST",
    body: formData,
  });

  return response.json();
}

/**
 * Get video download URL
 */
export function getVideoDownloadUrl(videoId: string): string {
  return `/api/videos/${videoId}/download`;
}

/**
 * Get video stream URL (for player)
 */
export function getVideoStreamUrl(videoId: string): string {
  return `/api/videos/${videoId}/stream`;
}

/**
 * Video list item
 */
export interface VideoListItem {
  id: string;
  status: string;
  durationMs: number | null;
  fps: number | null;
  width: number | null;
  height: number | null;
  createdAt: string;
  output: {
    fileId: string;
    type: string;
    mime: string;
    size: number;
  } | null;
  sourceKml: {
    id: string;
    name: string;
  } | null;
}

/**
 * Video list response
 */
export interface VideoListResponse {
  ok: boolean;
  items: VideoListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * List videos for the current tenant
 */
export async function listVideos(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<VideoListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const query = searchParams.toString();
  const response = await fetch(`/api/videos${query ? `?${query}` : ""}`);
  return response.json();
}
