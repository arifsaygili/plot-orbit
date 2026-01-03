"use client";

import Link from "next/link";
import {
  Paper,
  Text,
  Group,
  Stack,
  Button,
  Skeleton,
  Badge,
  UnstyledButton,
} from "@mantine/core";
import {
  IconFiles,
  IconMovie,
  IconArrowRight,
  IconPlus,
} from "@tabler/icons-react";
import { EmptyStateCard } from "./EmptyStateCard";

export interface RecentItem {
  id: string;
  name: string;
  createdAt: string;
  status?: string;
}

interface RecentItemsCardProps {
  title: string;
  type: "kml" | "video";
  items: RecentItem[];
  isLoading?: boolean;
  viewAllHref: string;
  createHref?: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ItemRow({ item, type }: { item: RecentItem; type: "kml" | "video" }) {
  const Icon = type === "kml" ? IconFiles : IconMovie;
  const href = type === "kml" ? `/kml/preview/${item.id}` : `/videos/${item.id}`;

  return (
    <UnstyledButton
      component={Link}
      href={href}
      p="sm"
      w="100%"
      styles={{
        root: {
          display: "block",
          borderRadius: "var(--mantine-radius-md)",
          textDecoration: "none",
          transition: "background 0.15s ease",
          "&:hover": {
            background: "var(--mantine-color-gray-0)",
          },
        },
      }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap">
          <Icon size={18} color="var(--mantine-color-dimmed)" />
          <div>
            <Text fz="sm" fw={500} c="dark.7" truncate maw={200}>
              {item.name}
            </Text>
            <Text fz="xs" c="dimmed">
              {formatDate(item.createdAt)}
            </Text>
          </div>
        </Group>
        {item.status && (
          <Badge
            size="sm"
            variant="light"
            color={item.status === "READY" ? "green" : "gray"}
          >
            {item.status === "READY" ? "Hazır" : item.status}
          </Badge>
        )}
      </Group>
    </UnstyledButton>
  );
}

function LoadingSkeleton() {
  return (
    <Stack gap="sm">
      {[1, 2, 3].map((i) => (
        <Group key={i} gap="sm" p="sm">
          <Skeleton height={18} width={18} radius="sm" />
          <Stack gap={4} style={{ flex: 1 }}>
            <Skeleton height={14} width="60%" />
            <Skeleton height={10} width="40%" />
          </Stack>
        </Group>
      ))}
    </Stack>
  );
}

export function RecentItemsCard({
  title,
  type,
  items,
  isLoading = false,
  viewAllHref,
  createHref,
}: RecentItemsCardProps) {
  const Icon = type === "kml" ? IconFiles : IconMovie;

  if (isLoading) {
    return (
      <Paper shadow="sm" radius="lg" p="lg" withBorder>
        <Group justify="space-between" mb="md">
          <Skeleton height={20} width={100} />
          <Skeleton height={20} width={80} />
        </Group>
        <LoadingSkeleton />
      </Paper>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyStateCard
        icon={Icon}
        title={type === "kml" ? "Henüz KML yok" : "Henüz video yok"}
        description={
          type === "kml"
            ? "İlk KML dosyanı yükleyerek başla"
            : "Bir video oluşturmak için KML yükle"
        }
        actionLabel={type === "kml" ? "KML Yükle" : "Video Oluştur"}
        actionHref={createHref || (type === "kml" ? "/kml" : "/kml")}
      />
    );
  }

  return (
    <Paper shadow="sm" radius="lg" p="lg" withBorder>
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <Icon size={18} color="var(--mantine-color-teal-6)" />
          <Text fz="md" fw={600} c="dark.7">
            {title}
          </Text>
        </Group>
        <Button
          variant="subtle"
          color="teal"
          size="xs"
          rightSection={<IconArrowRight size={14} />}
          component={Link}
          href={viewAllHref}
        >
          Tümünü Gör
        </Button>
      </Group>

      <Stack gap={0}>
        {items.slice(0, 5).map((item) => (
          <ItemRow key={item.id} item={item} type={type} />
        ))}
      </Stack>

      {createHref && (
        <Button
          variant="light"
          color="teal"
          size="sm"
          fullWidth
          mt="md"
          leftSection={<IconPlus size={14} />}
          component={Link}
          href={createHref}
        >
          {type === "kml" ? "Yeni KML Yükle" : "Yeni Video"}
        </Button>
      )}
    </Paper>
  );
}
