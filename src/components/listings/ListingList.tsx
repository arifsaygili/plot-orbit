"use client";

import { useState, useEffect, useCallback } from "react";
import {
  SimpleGrid,
  Stack,
  Text,
  Loader,
  Alert,
  Button,
  Group,
  TextInput,
  Center,
} from "@mantine/core";
import { IconPlus, IconSearch, IconAlertCircle, IconMapPin } from "@tabler/icons-react";
import { useDebouncedValue } from "@mantine/hooks";
import Link from "next/link";
import { listingsClient, type ListingDetail } from "@/client/api/listingsClient";
import { ListingCard } from "./ListingCard";

interface Props {
  initialListings?: ListingDetail[];
}

export function ListingList({ initialListings }: Props) {
  const [listings, setListings] = useState<ListingDetail[]>(initialListings || []);
  const [isLoading, setIsLoading] = useState(!initialListings);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);

  const fetchListings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await listingsClient.getListings();
      setListings(response.items as unknown as ListingDetail[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "İlanlar yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialListings) {
      fetchListings();
    }
  }, [initialListings, fetchListings]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu ilanı silmek istediğinize emin misiniz?")) return;

    try {
      await listingsClient.deleteListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "İlan silinemedi");
    }
  };

  const filteredListings = debouncedSearch
    ? listings.filter(
        (l) =>
          l.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          l.parcelInfo.il.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          l.parcelInfo.ilce.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          l.parcelInfo.mahalle.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : listings;

  if (isLoading) {
    return (
      <Center h={200}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">İlanlar yükleniyor...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="red" title="Hata">
        {error}
        <Button size="xs" variant="light" mt="sm" onClick={fetchListings}>
          Tekrar Dene
        </Button>
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <TextInput
          placeholder="İlan ara..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 300 }}
        />
        <Button
          component={Link}
          href="/listings/new"
          leftSection={<IconPlus size={16} />}
        >
          Yeni İlan
        </Button>
      </Group>

      {filteredListings.length === 0 ? (
        <Center h={200}>
          <Stack align="center" gap="md">
            <IconMapPin size={48} style={{ color: "var(--mantine-color-gray-5)" }} />
            <Text c="dimmed">
              {search ? "Arama sonucu bulunamadı" : "Henüz ilan eklenmemiş"}
            </Text>
            {!search && (
              <Button
                component={Link}
                href="/listings/new"
                leftSection={<IconPlus size={16} />}
              >
                İlk İlanı Ekle
              </Button>
            )}
          </Stack>
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onDelete={handleDelete}
            />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
