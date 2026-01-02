"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getVideo,
  getVideoDownloadUrl,
  getVideoStreamUrl,
  type VideoStatusResponse,
} from "@/client/api/videosClient";

const STATUS_INFO: Record<
  string,
  { label: string; color: string; message: string }
> = {
  CREATED: {
    label: "Created",
    color: "gray",
    message: "Video record created, waiting for recording to start.",
  },
  RECORDING: {
    label: "Recording",
    color: "yellow",
    message: "Recording in progress...",
  },
  RECORDED: {
    label: "Recorded",
    color: "blue",
    message: "Recording complete, preparing for upload...",
  },
  UPLOADING: {
    label: "Uploading",
    color: "blue",
    message: "Uploading video to server...",
  },
  READY: {
    label: "Ready",
    color: "green",
    message: "Video is ready to view and download.",
  },
  FAILED: {
    label: "Failed",
    color: "red",
    message: "An error occurred during video processing.",
  },
};

function formatDuration(ms: number | null): string {
  if (!ms) return "Unknown";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  videoId: string;
}

export function VideoDetail({ videoId }: Props) {
  const [video, setVideo] = useState<VideoStatusResponse["video"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVideo() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getVideo(videoId);
        if (result.ok && result.video) {
          setVideo(result.video);
        } else {
          setError(result.message || "Video not found");
        }
      } catch {
        setError("Failed to load video");
      } finally {
        setIsLoading(false);
      }
    }
    loadVideo();
  }, [videoId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">{error || "Video not found"}</div>
        <Link
          href="/videos"
          className="text-blue-600 hover:underline"
        >
          Back to Videos
        </Link>
      </div>
    );
  }

  const statusInfo = STATUS_INFO[video.status] || STATUS_INFO.CREATED;
  const isReady = video.status === "READY";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/videos"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Videos
      </Link>

      {/* Video Player or Status */}
      <div className="bg-black rounded-lg overflow-hidden mb-6">
        {isReady ? (
          <video
            src={getVideoStreamUrl(videoId)}
            controls
            className="w-full aspect-video"
            poster=""
          />
        ) : (
          <div className="aspect-video flex flex-col items-center justify-center text-white">
            {video.status === "RECORDING" || video.status === "UPLOADING" ? (
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
            ) : (
              <svg
                className="w-16 h-16 mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}
            <p className="text-lg">{statusInfo.message}</p>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium text-white bg-${statusInfo.color}-500`}
              style={{
                backgroundColor:
                  statusInfo.color === "green"
                    ? "#22c55e"
                    : statusInfo.color === "red"
                    ? "#ef4444"
                    : statusInfo.color === "blue"
                    ? "#3b82f6"
                    : statusInfo.color === "yellow"
                    ? "#eab308"
                    : "#6b7280",
              }}
            >
              {statusInfo.label}
            </span>
          </div>
          {isReady && (
            <a
              href={getVideoDownloadUrl(videoId)}
              download
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download
            </a>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Created</dt>
            <dd className="text-gray-900 font-medium">{formatDate(video.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Duration</dt>
            <dd className="text-gray-900 font-medium">{formatDuration(video.durationMs)}</dd>
          </div>
          {video.width && video.height && (
            <div>
              <dt className="text-gray-500">Resolution</dt>
              <dd className="text-gray-900 font-medium">
                {video.width} x {video.height}
              </dd>
            </div>
          )}
          {video.fps && (
            <div>
              <dt className="text-gray-500">Frame Rate</dt>
              <dd className="text-gray-900 font-medium">{video.fps} FPS</dd>
            </div>
          )}
          {video.outputFile && (
            <>
              <div>
                <dt className="text-gray-500">Format</dt>
                <dd className="text-gray-900 font-medium">
                  {video.outputFile.mime.replace("video/", "").toUpperCase()}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">File Size</dt>
                <dd className="text-gray-900 font-medium">
                  {formatFileSize(video.outputFile.size)}
                </dd>
              </div>
            </>
          )}
        </dl>

        {/* Error message for failed videos */}
        {video.status === "FAILED" && (video as { errorMessage?: string }).errorMessage && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded text-sm">
            Error: {(video as { errorMessage?: string }).errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}
