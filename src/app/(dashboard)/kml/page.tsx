"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Stack,
  Title,
  Text,
  Paper,
  Group,
  SimpleGrid,
} from "@mantine/core";
import { IconFiles, IconUpload } from "@tabler/icons-react";
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
    <Container size="lg" py="xl">
      <Stack gap="lg">
        {/* Page Header */}
        <div>
          <Group gap="sm" mb={4}>
            <IconFiles size={28} color="var(--mantine-color-teal-6)" />
            <Title order={2} c="dark.7">
              KML Dosyaları
            </Title>
          </Group>
          <Text fz="md" c="dark.4">
            KML/KMZ dosyalarını yükle ve parsel görselleştirmesi için yönet
          </Text>
        </div>

        {/* Upload Section */}
        <Paper shadow="sm" radius="lg" p="xl" withBorder>
          <Group gap="xs" mb="md">
            <IconUpload size={18} color="var(--mantine-color-teal-6)" />
            <Text fz="md" fw={600} c="dark.7">
              Yeni Dosya Yükle
            </Text>
          </Group>
          <KmlUploadForm onUploadSuccess={handleUploadSuccess} />
        </Paper>

        {/* Files List Section */}
        <Paper shadow="sm" radius="lg" p="xl" withBorder>
          <Group justify="space-between" mb="md">
            <Group gap="xs">
              <IconFiles size={18} color="var(--mantine-color-teal-6)" />
              <Text fz="md" fw={600} c="dark.7">
                Dosyalarım
              </Text>
            </Group>
            <Text fz="sm" c="dimmed">
              {files.length} dosya
            </Text>
          </Group>
          <KmlFileList files={files} isLoading={isLoading} />
        </Paper>
      </Stack>
    </Container>
  );
}
