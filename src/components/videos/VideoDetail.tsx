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
  Box,
  Skeleton,
  Alert,
  Anchor,
  SimpleGrid,
  Loader,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconDownload,
  IconAlertCircle,
  IconCheck,
  IconLoader,
  IconX,
} from "@tabler/icons-react";
import {
  getVideo,
  getVideoDownloadUrl,
  getVideoStreamUrl,
  type VideoStatusResponse,
} from "@/client/api/videosClient";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; message: string; icon: React.ElementType }
> = {
  CREATED: {
    label: "Oluşturuldu",
    color: "gray",
    message: "Video kaydı oluşturuldu, kayıt başlaması bekleniyor.",
    icon: IconLoader,
  },
  RECORDING: {
    label: "Kaydediliyor",
    color: "yellow",
    message: "Kayıt devam ediyor...",
    icon: IconLoader,
  },
  RECORDED: {
    label: "Kaydedildi",
    color: "blue",
    message: "Kayıt tamamlandı, yükleme için hazırlanıyor...",
    icon: IconLoader,
  },
  UPLOADING: {
    label: "Yükleniyor",
    color: "blue",
    message: "Video sunucuya yükleniyor...",
    icon: IconLoader,
  },
  READY: {
    label: "Hazır",
    color: "green",
    message: "Video izlenmeye ve indirilmeye hazır.",
    icon: IconCheck,
  },
  FAILED: {
    label: "Başarısız",
    color: "red",
    message: "Video işlenirken bir hata oluştu.",
    icon: IconX,
  },
};

function formatDuration(ms: number | null): string {
  if (!ms) return "Bilinmiyor";
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

function LoadingSkeleton() {
  return (
    <Stack gap="lg">
      <Skeleton height={24} width={120} />
      <Skeleton height={400} radius="lg" />
      <Skeleton height={200} radius="lg" />
    </Stack>
  );
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
          setError(result.message || "Video bulunamadı");
        }
      } catch {
        setError("Video yüklenemedi");
      } finally {
        setIsLoading(false);
      }
    }
    loadVideo();
  }, [videoId]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !video) {
    return (
      <Stack gap="lg" align="center" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="red"
          variant="light"
          radius="lg"
        >
          {error || "Video bulunamadı"}
        </Alert>
        <Anchor component={Link} href="/videos" c="teal">
          Videolara Dön
        </Anchor>
      </Stack>
    );
  }

  const statusConfig = STATUS_CONFIG[video.status] || STATUS_CONFIG.CREATED;
  const isReady = video.status === "READY";
  const isProcessing = video.status === "RECORDING" || video.status === "UPLOADING";
  const StatusIcon = statusConfig.icon;

  return (
    <Stack gap="lg">
      {/* Back link */}
      <Anchor
        component={Link}
        href="/videos"
        c="dark.5"
        size="sm"
        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
      >
        <IconArrowLeft size={16} />
        Videolara Dön
      </Anchor>

      {/* Video Player or Status */}
      <Paper
        shadow="sm"
        radius="lg"
        style={{ overflow: "hidden", background: "black" }}
      >
        {isReady ? (
          <video
            src={getVideoStreamUrl(videoId)}
            controls
            style={{ width: "100%", aspectRatio: "16/9", display: "block" }}
          />
        ) : (
          <Box
            style={{
              aspectRatio: "16/9",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            {isProcessing ? (
              <Loader size="lg" color="white" mb="md" />
            ) : (
              <Box
                mb="md"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background:
                    video.status === "FAILED"
                      ? "var(--mantine-color-red-6)"
                      : "var(--mantine-color-gray-7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <StatusIcon size={32} color="white" />
              </Box>
            )}
            <Text fz="lg" c="white">
              {statusConfig.message}
            </Text>
          </Box>
        )}
      </Paper>

      {/* Info Card */}
      <Paper shadow="sm" radius="lg" p="xl" withBorder>
        <Group justify="space-between" mb="lg">
          <Badge
            size="lg"
            variant={isProcessing ? "filled" : "light"}
            color={statusConfig.color}
            leftSection={<StatusIcon size={14} />}
          >
            {statusConfig.label}
          </Badge>
          {isReady && (
            <Button
              component="a"
              href={getVideoDownloadUrl(videoId)}
              download
              color="teal"
              leftSection={<IconDownload size={16} />}
            >
              İndir
            </Button>
          )}
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Box>
            <Text fz="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
              Oluşturulma Tarihi
            </Text>
            <Text fz="sm" c="dark.7" fw={500}>
              {formatDate(video.createdAt)}
            </Text>
          </Box>
          <Box>
            <Text fz="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
              Süre
            </Text>
            <Text fz="sm" c="dark.7" fw={500}>
              {formatDuration(video.durationMs)}
            </Text>
          </Box>
          {video.width && video.height && (
            <Box>
              <Text fz="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
                Çözünürlük
              </Text>
              <Text fz="sm" c="dark.7" fw={500}>
                {video.width} x {video.height}
              </Text>
            </Box>
          )}
          {video.fps && (
            <Box>
              <Text fz="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
                Kare Hızı
              </Text>
              <Text fz="sm" c="dark.7" fw={500}>
                {video.fps} FPS
              </Text>
            </Box>
          )}
          {video.outputFile && (
            <>
              <Box>
                <Text fz="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
                  Format
                </Text>
                <Text fz="sm" c="dark.7" fw={500}>
                  {video.outputFile.mime.replace("video/", "").toUpperCase()}
                </Text>
              </Box>
              <Box>
                <Text fz="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
                  Dosya Boyutu
                </Text>
                <Text fz="sm" c="dark.7" fw={500}>
                  {formatFileSize(video.outputFile.size)}
                </Text>
              </Box>
            </>
          )}
        </SimpleGrid>

        {/* Error message for failed videos */}
        {video.status === "FAILED" &&
          (video as { errorMessage?: string }).errorMessage && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              variant="light"
              radius="md"
              mt="lg"
            >
              Hata: {(video as { errorMessage?: string }).errorMessage}
            </Alert>
          )}
      </Paper>
    </Stack>
  );
}
