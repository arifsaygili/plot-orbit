"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  listVideos,
  getVideoDownloadUrl,
  type VideoListItem,
} from "@/client/api/videosClient";

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  CREATED: { label: "Created", className: "bg-gray-500" },
  RECORDING: { label: "Recording", className: "bg-yellow-500 animate-pulse" },
  RECORDED: { label: "Recorded", className: "bg-blue-500" },
  UPLOADING: { label: "Uploading", className: "bg-blue-500 animate-pulse" },
  READY: { label: "Ready", className: "bg-green-500" },
  FAILED: { label: "Failed", className: "bg-red-500" },
};

function formatDuration(ms: number | null): string {
  if (!ms) return "-";
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
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function VideoList() {
  const [videos, setVideos] = useState<VideoListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    async function loadVideos() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await listVideos({
          status: statusFilter || undefined,
          page,
          limit: 12,
        });
        if (result.ok) {
          setVideos(result.items);
          setTotalPages(result.totalPages);
        } else {
          setError("Failed to load videos");
        }
      } catch (err) {
        setError("Failed to load videos");
      } finally {
        setIsLoading(false);
      }
    }
    loadVideos();
  }, [page, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Filter */}
      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm text-gray-600">Filter by status:</label>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
        >
          <option value="">All</option>
          <option value="READY">Ready</option>
          <option value="UPLOADING">Uploading</option>
          <option value="RECORDING">Recording</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Empty state */}
      {videos.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-500 text-lg">No videos yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Record your first video from a KML preview
          </p>
          <Link
            href="/kml"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to KML Files
          </Link>
        </div>
      )}

      {/* Video grid */}
      {videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function VideoCard({ video }: { video: VideoListItem }) {
  const badge = STATUS_BADGES[video.status] || STATUS_BADGES.CREATED;
  const isReady = video.status === "READY";

  // Detect Reels (9:16 portrait) format
  const isReels = video.width && video.height && video.height > video.width;

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${isReels ? "ring-2 ring-purple-400/50" : ""}`}>
      {/* Thumbnail placeholder */}
      <div
        className={`${isReels ? "aspect-[9/16] max-h-80" : "aspect-video"} bg-gray-200 flex items-center justify-center relative`}
        style={isReels ? {
          background: "linear-gradient(135deg, #9333ea 0%, #db2777 100%)"
        } : undefined}
      >
        {isReels ? (
          // Reels icon
          <svg
            className="w-12 h-12 text-white/80"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        ) : (
          // Standard video icon
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}

        {/* Status badge */}
        <span
          className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs text-white ${badge.className}`}
        >
          {badge.label}
        </span>

        {/* Reels badge */}
        {isReels && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs text-white bg-gradient-to-r from-purple-600 to-pink-600">
            Reels
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">
            {formatDate(video.createdAt)}
          </span>
          <span className="text-sm text-gray-500">
            {formatDuration(video.durationMs)}
          </span>
        </div>

        {video.sourceKml && (
          <p className="text-sm text-gray-600 truncate mb-2">
            From: {video.sourceKml.name}
          </p>
        )}

        {video.output && (
          <p className="text-xs text-gray-400">
            {video.output.type.replace("VIDEO_", "")} •{" "}
            {formatFileSize(video.output.size)}
          </p>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Link
            href={`/videos/${video.id}`}
            className="flex-1 text-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
          >
            View
          </Link>
          {isReady && (
            <a
              href={getVideoDownloadUrl(video.id)}
              download
              className="flex-1 text-center px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Download
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
