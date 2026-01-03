"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Paper,
  Text,
  Group,
  Stack,
  Badge,
  Button,
  Select,
  SimpleGrid,
  Skeleton,
  Alert,
  Box,
  Pagination,
  Card,
  ThemeIcon,
} from "@mantine/core";
import {
  IconMovie,
  IconDownload,
  IconEye,
  IconAlertCircle,
  IconBrandInstagram,
  IconPlayerPlay,
} from "@tabler/icons-react";
import {
  listVideos,
  getVideoDownloadUrl,
  type VideoListItem,
} from "@/client/api/videosClient";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  CREATED: { label: "Oluşturuldu", color: "gray" },
  RECORDING: { label: "Kaydediliyor", color: "yellow" },
  RECORDED: { label: "Kaydedildi", color: "blue" },
  UPLOADING: { label: "Yükleniyor", color: "blue" },
  READY: { label: "Hazır", color: "green" },
  FAILED: { label: "Başarısız", color: "red" },
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

function LoadingSkeleton() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} height={280} radius="lg" />
      ))}
    </SimpleGrid>
  );
}

function EmptyState() {
  return (
    <Paper shadow="sm" radius="lg" p="xl" withBorder ta="center">
      <Box
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "var(--mantine-color-gray-1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto",
          marginBottom: 16,
        }}
      >
        <IconMovie size={36} color="var(--mantine-color-gray-5)" />
      </Box>
      <Text fz="lg" fw={500} c="dark.6" mb={4}>
        Henüz video yok
      </Text>
      <Text fz="sm" c="dimmed" mb="lg">
        İlk videonuzu oluşturmak için bir KML önizlemesinden kayıt yapın
      </Text>
      <Button
        component={Link}
        href="/kml"
        color="teal"
        leftSection={<IconPlayerPlay size={16} />}
      >
        KML Dosyalarına Git
      </Button>
    </Paper>
  );
}

function VideoCard({ video }: { video: VideoListItem }) {
  const status = STATUS_CONFIG[video.status] || STATUS_CONFIG.CREATED;
  const isReady = video.status === "READY";
  const isProcessing = video.status === "RECORDING" || video.status === "UPLOADING";

  // Detect Reels (9:16 portrait) format
  const isReels = video.width && video.height && video.height > video.width;

  return (
    <Card shadow="sm" radius="lg" withBorder p={0}>
      {/* Thumbnail area */}
      <Box
        style={{
          aspectRatio: isReels ? "9/16" : "16/9",
          maxHeight: isReels ? 280 : undefined,
          background: isReels
            ? "linear-gradient(135deg, var(--mantine-color-violet-6) 0%, var(--mantine-color-pink-6) 100%)"
            : "var(--mantine-color-gray-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {isReels ? (
          <IconBrandInstagram size={40} color="rgba(255,255,255,0.8)" />
        ) : (
          <IconPlayerPlay size={40} color="var(--mantine-color-gray-5)" />
        )}

        {/* Status badge */}
        <Badge
          size="sm"
          variant={isProcessing ? "filled" : "light"}
          color={status.color}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
          }}
        >
          {status.label}
        </Badge>

        {/* Reels badge */}
        {isReels && (
          <Badge
            size="sm"
            variant="gradient"
            gradient={{ from: "violet", to: "pink" }}
            style={{
              position: "absolute",
              top: 12,
              left: 12,
            }}
          >
            Reels
          </Badge>
        )}
      </Box>

      {/* Info */}
      <Box p="md">
        <Group justify="space-between" mb="xs">
          <Text fz="sm" c="dark.5">
            {formatDate(video.createdAt)}
          </Text>
          <Text fz="sm" c="dark.5">
            {formatDuration(video.durationMs)}
          </Text>
        </Group>

        {video.sourceKml && (
          <Text fz="sm" c="dark.6" truncate mb="xs">
            Kaynak: {video.sourceKml.name}
          </Text>
        )}

        {video.output && (
          <Text fz="xs" c="dimmed">
            {video.output.type.replace("VIDEO_", "")} • {formatFileSize(video.output.size)}
          </Text>
        )}

        {/* Actions */}
        <Group gap="xs" mt="md">
          <Button
            size="xs"
            variant="light"
            color="teal"
            flex={1}
            leftSection={<IconEye size={14} />}
            component={Link}
            href={`/videos/${video.id}`}
          >
            Görüntüle
          </Button>
          {isReady && (
            <Button
              size="xs"
              variant="filled"
              color="teal"
              flex={1}
              leftSection={<IconDownload size={14} />}
              component="a"
              href={getVideoDownloadUrl(video.id)}
              download
            >
              İndir
            </Button>
          )}
        </Group>
      </Box>
    </Card>
  );
}

export function VideoList() {
  const [videos, setVideos] = useState<VideoListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

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
          setError("Videolar yüklenemedi");
        }
      } catch {
        setError("Videolar yüklenemedi");
      } finally {
        setIsLoading(false);
      }
    }
    loadVideos();
  }, [page, statusFilter]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        color="red"
        variant="light"
        radius="lg"
      >
        {error}
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      {/* Filter */}
      <Paper shadow="sm" radius="lg" p="md" withBorder>
        <Group gap="md">
          <Text fz="sm" c="dark.6" fw={500}>
            Duruma göre filtrele:
          </Text>
          <Select
            size="sm"
            placeholder="Tümü"
            clearable
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            data={[
              { value: "READY", label: "Hazır" },
              { value: "UPLOADING", label: "Yükleniyor" },
              { value: "RECORDING", label: "Kaydediliyor" },
              { value: "FAILED", label: "Başarısız" },
            ]}
            styles={{
              input: {
                minWidth: 160,
              },
            }}
          />
        </Group>
      </Paper>

      {/* Empty state */}
      {videos.length === 0 && <EmptyState />}

      {/* Video grid */}
      {videos.length > 0 && (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </SimpleGrid>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Group justify="center">
          <Pagination
            total={totalPages}
            value={page}
            onChange={setPage}
            color="teal"
            radius="md"
          />
        </Group>
      )}
    </Stack>
  );
}
