"use client";

import Link from "next/link";
import {
  Table,
  Text,
  Badge,
  Button,
  Group,
  Stack,
  Skeleton,
  Box,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconEye,
  IconFiles,
  IconTrash,
  IconDownload,
} from "@tabler/icons-react";
import type { FileInfo } from "@/client/api/filesClient";

interface Props {
  files: FileInfo[];
  isLoading?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LoadingSkeleton() {
  return (
    <Stack gap="sm">
      {[1, 2, 3].map((i) => (
        <Group key={i} gap="sm" p="sm">
          <Skeleton height={20} width="30%" />
          <Skeleton height={20} width="15%" />
          <Skeleton height={20} width="15%" />
          <Skeleton height={20} width="20%" />
          <Skeleton height={32} width="80px" />
        </Group>
      ))}
    </Stack>
  );
}

function EmptyState() {
  return (
    <Box py="xl" ta="center">
      <Box
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "var(--mantine-color-gray-1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto",
          marginBottom: 16,
        }}
      >
        <IconFiles size={28} color="var(--mantine-color-gray-5)" />
      </Box>
      <Text fz="md" fw={500} c="dark.6" mb={4}>
        Henüz dosya yok
      </Text>
      <Text fz="sm" c="dimmed">
        İlk KML dosyanı yukarıdan yükleyerek başla
      </Text>
    </Box>
  );
}

function FileRow({ file }: { file: FileInfo }) {
  return (
    <Table.Tr>
      <Table.Td>
        <div>
          <Text fz="sm" fw={500} c="dark.7">
            {file.name}
          </Text>
          {file.name !== file.originalName && (
            <Text fz="xs" c="dimmed">
              {file.originalName}
            </Text>
          )}
        </div>
      </Table.Td>
      <Table.Td>
        <Badge
          size="sm"
          variant="light"
          color={file.type === "KMZ" ? "violet" : "teal"}
        >
          {file.type}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text fz="sm" c="dark.5">
          {formatFileSize(file.size)}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text fz="sm" c="dark.5">
          {formatDate(file.createdAt)}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" justify="flex-end">
          <Button
            size="xs"
            variant="filled"
            color="teal"
            leftSection={<IconEye size={14} />}
            component={Link}
            href={`/kml/preview/${file.id}`}
          >
            Önizle
          </Button>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}

export function KmlFileList({ files, isLoading }: Props) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (files.length === 0) {
    return <EmptyState />;
  }

  return (
    <Table.ScrollContainer minWidth={600}>
      <Table
        highlightOnHover
        horizontalSpacing="md"
        verticalSpacing="sm"
        styles={{
          th: {
            color: "var(--mantine-color-dark-4)",
            fontWeight: 600,
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          },
          tr: {
            transition: "background 0.15s ease",
          },
        }}
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Dosya Adı</Table.Th>
            <Table.Th>Tür</Table.Th>
            <Table.Th>Boyut</Table.Th>
            <Table.Th>Yüklenme Tarihi</Table.Th>
            <Table.Th ta="right">İşlemler</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {files.map((file) => (
            <FileRow key={file.id} file={file} />
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
