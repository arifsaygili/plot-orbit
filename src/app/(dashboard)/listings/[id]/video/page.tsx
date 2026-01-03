"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { Center, Loader, Stack, Text } from "@mantine/core";
import { ListingPreviewViewer } from "@/components/listings";
import { listingsClient, type ListingDetail } from "@/client/api/listingsClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ListingVideoPage({ params }: Props) {
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { id } = await params;
        const data = await listingsClient.getListing(id);
        setListing(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load listing");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [params]);

  if (isLoading) {
    return (
      <Center h="100%">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">İlan yükleniyor...</Text>
        </Stack>
      </Center>
    );
  }

  if (error || !listing) {
    notFound();
  }

  return (
    <div style={{ height: "calc(100vh - 60px)", margin: "-1rem" }}>
      <ListingPreviewViewer listing={listing} />
    </div>
  );
}
