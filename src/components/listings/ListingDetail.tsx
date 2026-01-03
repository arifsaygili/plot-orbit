"use client";

import { useState } from "react";
import {
  Stack,
  Paper,
  Text,
  Title,
  Group,
  Badge,
  Button,
  Divider,
  Alert,
  Loader,
  Textarea,
} from "@mantine/core";
import {
  IconMapPin,
  IconVideo,
  IconWand,
  IconEdit,
  IconTrash,
  IconCopy,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listingsClient, type ListingDetail as ListingType } from "@/client/api/listingsClient";

interface Props {
  listing: ListingType;
}

export function ListingDetail({ listing }: Props) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiDescription, setAiDescription] = useState(listing.aiDescription);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateDescription = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      const result = await listingsClient.generateDescription(listing.id);
      setAiDescription(result.aiDescription);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI açıklama oluşturulamadı");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bu ilanı silmek istediğinize emin misiniz?")) return;

    try {
      await listingsClient.deleteListing(listing.id);
      router.push("/listings");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "İlan silinemedi");
    }
  };

  const handleCopyDescription = () => {
    if (aiDescription) {
      navigator.clipboard.writeText(aiDescription);
    }
  };

  const videoCount = listing._count?.videos ?? 0;

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between" align="flex-start">
        <Stack gap="xs">
          <Title order={2}>{listing.title}</Title>
          <Group gap="xs">
            <IconMapPin size={16} style={{ color: "var(--mantine-color-blue-6)" }} />
            <Text size="sm" c="dimmed">
              {listing.parcelInfo.il} / {listing.parcelInfo.ilce} / {listing.parcelInfo.mahalle}
            </Text>
          </Group>
        </Stack>
        <Group gap="xs">
          <Button
            component={Link}
            href={`/listings/${listing.id}/video`}
            leftSection={<IconVideo size={16} />}
          >
            Video Oluştur
          </Button>
          <Button
            component={Link}
            href={`/listings/${listing.id}/edit`}
            variant="light"
            leftSection={<IconEdit size={16} />}
          >
            Düzenle
          </Button>
          <Button
            color="red"
            variant="light"
            leftSection={<IconTrash size={16} />}
            onClick={handleDelete}
          >
            Sil
          </Button>
        </Group>
      </Group>

      {error && (
        <Alert color="red" title="Hata">
          {error}
        </Alert>
      )}

      <Group align="flex-start" gap="lg">
        {/* Left Column - Details */}
        <Stack gap="md" style={{ flex: 1 }}>
          {/* Parcel Info */}
          <Paper shadow="xs" p="md" withBorder>
            <Text fw={600} mb="sm">Parsel Bilgileri</Text>
            <Stack gap="xs">
              {listing.parcelInfo.il && (
                <Group gap="xs">
                  <Text size="sm" c="dimmed" w={100}>İl:</Text>
                  <Text size="sm">{listing.parcelInfo.il}</Text>
                </Group>
              )}
              {listing.parcelInfo.ilce && (
                <Group gap="xs">
                  <Text size="sm" c="dimmed" w={100}>İlçe:</Text>
                  <Text size="sm">{listing.parcelInfo.ilce}</Text>
                </Group>
              )}
              {listing.parcelInfo.mahalle && (
                <Group gap="xs">
                  <Text size="sm" c="dimmed" w={100}>Mahalle:</Text>
                  <Text size="sm">{listing.parcelInfo.mahalle}</Text>
                </Group>
              )}
              <Divider my="xs" />
              <Group gap="xs">
                <Text size="sm" c="dimmed" w={100}>Ada No:</Text>
                <Text size="sm" fw={500}>{listing.parcelInfo.ada}</Text>
              </Group>
              <Group gap="xs">
                <Text size="sm" c="dimmed" w={100}>Parsel No:</Text>
                <Text size="sm" fw={500}>{listing.parcelInfo.parsel}</Text>
              </Group>
              {listing.parcelInfo.alan && (
                <Group gap="xs">
                  <Text size="sm" c="dimmed" w={100}>Alan:</Text>
                  <Text size="sm">{listing.parcelInfo.alan} m²</Text>
                </Group>
              )}
              {listing.parcelInfo.mevkii && (
                <Group gap="xs">
                  <Text size="sm" c="dimmed" w={100}>Mevkii:</Text>
                  <Text size="sm">{listing.parcelInfo.mevkii}</Text>
                </Group>
              )}
              {listing.parcelInfo.nitelik && (
                <Group gap="xs">
                  <Text size="sm" c="dimmed" w={100}>Nitelik:</Text>
                  <Text size="sm">{listing.parcelInfo.nitelik}</Text>
                </Group>
              )}
            </Stack>
          </Paper>

          {/* Description */}
          {listing.description && (
            <Paper shadow="xs" p="md" withBorder>
              <Text fw={600} mb="sm">Açıklama</Text>
              <Text size="sm">{listing.description}</Text>
            </Paper>
          )}

          {/* Videos */}
          <Paper shadow="xs" p="md" withBorder>
            <Group justify="space-between" mb="sm">
              <Text fw={600}>Videolar</Text>
              <Badge variant="light">{videoCount}</Badge>
            </Group>
            {videoCount === 0 ? (
              <Text size="sm" c="dimmed">
                Henüz video oluşturulmamış.
              </Text>
            ) : (
              <Button
                component={Link}
                href={`/videos?listingId=${listing.id}`}
                variant="light"
                size="xs"
              >
                Videoları Görüntüle
              </Button>
            )}
          </Paper>
        </Stack>

        {/* Right Column - AI Description */}
        <Paper shadow="xs" p="md" withBorder style={{ flex: 1 }}>
          <Group justify="space-between" mb="md">
            <Text fw={600}>AI Açıklaması</Text>
            {aiDescription && (
              <Button
                size="xs"
                variant="subtle"
                leftSection={<IconCopy size={14} />}
                onClick={handleCopyDescription}
              >
                Kopyala
              </Button>
            )}
          </Group>

          {aiDescription ? (
            <Textarea
              value={aiDescription}
              readOnly
              autosize
              minRows={5}
              styles={{
                input: { cursor: "default" },
              }}
            />
          ) : (
            <Text size="sm" c="dimmed" mb="md">
              Bu ilan için henüz AI açıklaması oluşturulmamış.
            </Text>
          )}

          <Button
            mt="md"
            leftSection={isGenerating ? <Loader size={14} /> : <IconWand size={16} />}
            onClick={handleGenerateDescription}
            disabled={isGenerating}
            fullWidth
          >
            {aiDescription ? "Yeniden Oluştur" : "AI Açıklama Oluştur"}
          </Button>
        </Paper>
      </Group>

      {/* Meta */}
      <Text size="xs" c="dimmed">
        Oluşturulma: {new Date(listing.createdAt).toLocaleString("tr-TR")} |
        Güncelleme: {new Date(listing.updatedAt).toLocaleString("tr-TR")}
      </Text>
    </Stack>
  );
}
