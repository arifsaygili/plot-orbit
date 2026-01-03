"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Box,
  Group,
  Text,
  Badge,
  Anchor,
  Loader,
  Stack,
  Alert,
  Button,
} from "@mantine/core";
import { IconArrowLeft, IconAlertCircle } from "@tabler/icons-react";
import { listKmlFiles, type FileInfo } from "@/client/api/filesClient";

// Dynamic import to avoid SSR issues with Cesium
const KmlPreviewViewer = dynamic(
  () => import("@/components/kml/KmlPreviewViewer").then((m) => m.KmlPreviewViewer),
  {
    ssr: false,
    loading: () => (
      <Box
        style={{
          width: "100%",
          height: "100%",
          minHeight: 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--mantine-color-dark-9)",
        }}
      >
        <Loader size="lg" color="teal" />
      </Box>
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
          setError("Dosya bulunamadı");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Dosya yüklenemedi");
      } finally {
        setIsLoading(false);
      }
    }

    loadFile();
  }, [fileId]);

  if (isLoading) {
    return (
      <Box
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <Loader size="lg" color="teal" />
      </Box>
    );
  }

  if (error || !file) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: "100vh" }} gap="lg">
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="red"
          variant="light"
          radius="lg"
        >
          {error || "Dosya bulunamadı"}
        </Alert>
        <Button
          variant="light"
          color="teal"
          onClick={() => router.push("/kml")}
        >
          Dosyalara Dön
        </Button>
      </Stack>
    );
  }

  return (
    <Box style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header */}
      <Box
        px="md"
        py="sm"
        style={{
          background: "white",
          borderBottom: "1px solid var(--mantine-color-gray-2)",
        }}
      >
        <Group justify="space-between">
          <Group gap="md">
            <Anchor
              component={Link}
              href="/kml"
              c="dark.5"
              style={{ display: "flex", alignItems: "center" }}
            >
              <IconArrowLeft size={20} />
            </Anchor>
            <div>
              <Text fw={600} c="dark.7">
                {file.name}
              </Text>
              {file.name !== file.originalName && (
                <Text fz="xs" c="dimmed">
                  {file.originalName}
                </Text>
              )}
            </div>
          </Group>
          <Badge
            size="lg"
            variant="light"
            color={file.type === "KMZ" ? "violet" : "teal"}
          >
            {file.type}
          </Badge>
        </Group>
      </Box>

      {/* Viewer - Full height remaining */}
      <Box style={{ flex: 1, minHeight: 0 }}>
        <KmlPreviewViewer fileId={fileId} fileName={file.name} />
      </Box>
    </Box>
  );
}
