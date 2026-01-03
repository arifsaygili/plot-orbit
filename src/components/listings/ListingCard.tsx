"use client";

import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  ActionIcon,
  Menu,
} from "@mantine/core";
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconVideo,
  IconMapPin,
} from "@tabler/icons-react";
import Link from "next/link";
import type { ListingDetail as ListingType } from "@/client/api/listingsClient";

interface Props {
  listing: ListingType;
  onDelete?: (id: string) => void;
}

export function ListingCard({ listing, onDelete }: Props) {
  const { parcelInfo } = listing;
  const videoCount = listing._count?.videos ?? 0;

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Group gap="xs">
            <IconMapPin size={16} style={{ color: "var(--mantine-color-blue-6)" }} />
            <Text fw={600} size="sm" lineClamp={1}>
              {listing.title}
            </Text>
          </Group>
          <Menu shadow="md" position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                component={Link}
                href={`/listings/${listing.id}/video`}
                leftSection={<IconVideo size={14} />}
              >
                Yeni Video
              </Menu.Item>
              <Menu.Item
                component={Link}
                href={`/listings/${listing.id}/edit`}
                leftSection={<IconEdit size={14} />}
              >
                Düzenle
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={() => onDelete?.(listing.id)}
              >
                Sil
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Card.Section>

      <Stack gap="xs" mt="md">
        <Group gap="xs">
          <Text size="xs" c="dimmed">Konum:</Text>
          <Text size="xs">
            {parcelInfo.il} / {parcelInfo.ilce} / {parcelInfo.mahalle}
          </Text>
        </Group>
        <Group gap="xs">
          <Text size="xs" c="dimmed">Ada/Parsel:</Text>
          <Text size="xs">
            {parcelInfo.ada} / {parcelInfo.parsel}
          </Text>
        </Group>

        {listing.description && (
          <Text size="xs" c="dimmed" lineClamp={2}>
            {listing.description}
          </Text>
        )}

        <Group gap="xs" mt="xs">
          <Badge size="sm" variant="light" color="blue">
            {videoCount} Video
          </Badge>
          {listing.aiDescription && (
            <Badge size="sm" variant="light" color="green">
              AI Açıklama
            </Badge>
          )}
        </Group>
      </Stack>

      <Card.Section withBorder inheritPadding py="xs" mt="md">
        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            {new Date(listing.createdAt).toLocaleDateString("tr-TR")}
          </Text>
          <Link href={`/listings/${listing.id}`}>
            <Text size="xs" c="blue" fw={500}>
              Detaylar →
            </Text>
          </Link>
        </Group>
      </Card.Section>
    </Card>
  );
}
