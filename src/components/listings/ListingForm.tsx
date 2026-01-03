"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Stack,
  TextInput,
  Textarea,
  Button,
  Paper,
  Text,
  Group,
  Alert,
  Loader,
  Divider,
  Box,
} from "@mantine/core";
import {
  IconCheck,
  IconAlertCircle,
  IconMapPin,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { ParcelSearchForm } from "@/components/parcel";
import ParcelPreviewCesium, { type ParcelPreviewCesiumRef } from "@/components/cesium/ParcelPreviewCesium";
import {
  listingsClient,
  type CreateListingInput,
  type ListingDetail,
} from "@/client/api/listingsClient";
import type { ParcelResult } from "@/client/api/parcelClient";

interface Props {
  listing?: ListingDetail;
  onSuccess?: (listing: ListingDetail) => void;
}

export function ListingForm({ listing, onSuccess }: Props) {
  const router = useRouter();
  const isEditing = !!listing;
  const previewRef = useRef<ParcelPreviewCesiumRef>(null);

  // Form state
  const [title, setTitle] = useState(listing?.title ?? "");
  const [description, setDescription] = useState(listing?.description ?? "");
  const [parcelResult, setParcelResult] = useState<ParcelResult | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show parcel on map when found
  useEffect(() => {
    if (parcelResult && previewRef.current) {
      previewRef.current.showParcel(parcelResult).catch(console.error);
    }
  }, [parcelResult]);

  const handleParcelFound = useCallback((parcel: ParcelResult) => {
    setParcelResult(parcel);
    // Auto-generate title if empty
    if (!title) {
      setTitle(`${parcel.mahalle ?? ""} ${parcel.ada}/${parcel.parsel}`.trim());
    }
    setError(null);
  }, [title]);

  const handleSearchStart = useCallback(() => {
    setIsSearching(true);
    setError(null);
  }, []);

  const handleSearchError = useCallback((msg: string) => {
    setIsSearching(false);
    setError(msg);
  }, []);

  // When parcel search completes
  const handleParcelComplete = useCallback((parcel: ParcelResult) => {
    handleParcelFound(parcel);
    setIsSearching(false);
  }, [handleParcelFound]);

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      setError("Başlık gerekli");
      return;
    }

    if (!isEditing && !parcelResult) {
      setError("Lütfen bir parsel seçin");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing) {
        // Update existing listing
        const updated = await listingsClient.updateListing(listing.id, {
          title: title.trim(),
          description: description.trim() || undefined,
        });
        onSuccess?.(updated);
        router.push(`/listings/${listing.id}`);
        router.refresh();
      } else {
        // Create new listing
        const input: CreateListingInput = {
          title: title.trim(),
          description: description.trim() || undefined,
          parcelInfo: {
            il: parcelResult!.il ?? "",
            ilce: parcelResult!.ilce ?? "",
            mahalle: parcelResult!.mahalle ?? "",
            ada: parcelResult!.ada,
            parsel: parcelResult!.parsel,
            alan: parcelResult!.area,
          },
          geometry: parcelResult!.geojson,
          centroid: parcelResult!.centroid,
          bbox: parcelResult!.bbox,
        };

        const created = await listingsClient.createListing(input);
        onSuccess?.(created);
        router.push(`/listings/${created.id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "İlan oluşturulamadı");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box style={{ display: "flex", gap: "var(--mantine-spacing-lg)", height: "100%" }}>
      {/* Left Panel - Form */}
      <Stack gap="md" style={{ width: 400, minWidth: 400 }}>
        <Paper shadow="sm" radius="md" p="lg" withBorder>
          <Stack gap="md">
            <Text fw={600} size="lg">
              {isEditing ? "İlan Düzenle" : "Yeni İlan Oluştur"}
            </Text>

            {error && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                color="red"
                variant="light"
                withCloseButton
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            <TextInput
              label="İlan Başlığı"
              placeholder="Örn: Merkez Mah. 101/5 Parseli"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isSubmitting}
            />

            <Textarea
              label="Açıklama (Opsiyonel)"
              placeholder="İlan hakkında notlar..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              minRows={3}
              disabled={isSubmitting}
            />

            {/* Show selected parcel info */}
            {parcelResult && (
              <>
                <Divider />
                <Paper p="sm" withBorder bg="green.0">
                  <Group gap="xs" mb="xs">
                    <IconCheck size={16} color="green" />
                    <Text size="sm" fw={500} c="green.8">
                      Parsel Seçildi
                    </Text>
                  </Group>
                  <Stack gap={4}>
                    <Group gap="xs">
                      <IconMapPin size={14} />
                      <Text size="xs">
                        {parcelResult.il} / {parcelResult.ilce} / {parcelResult.mahalle}
                      </Text>
                    </Group>
                    <Text size="xs">
                      Ada: {parcelResult.ada}, Parsel: {parcelResult.parsel}
                    </Text>
                    {parcelResult.area && (
                      <Text size="xs" c="dimmed">
                        Alan: {parcelResult.area.toLocaleString("tr-TR")} m²
                      </Text>
                    )}
                  </Stack>
                </Paper>
              </>
            )}

            <Button
              leftSection={isSubmitting ? <Loader size={16} color="white" /> : <IconCheck size={18} />}
              onClick={handleSubmit}
              disabled={isSubmitting || (!isEditing && !parcelResult)}
              fullWidth
              mt="sm"
            >
              {isSubmitting ? "Kaydediliyor..." : isEditing ? "Güncelle" : "İlan Oluştur"}
            </Button>
          </Stack>
        </Paper>

        {/* Parcel Search - only for new listings */}
        {!isEditing && (
          <ParcelSearchForm
            onParcelFound={handleParcelComplete}
            onSearchStart={handleSearchStart}
            onError={handleSearchError}
            disabled={isSubmitting}
          />
        )}
      </Stack>

      {/* Right Panel - Map Preview */}
      <Box style={{ flex: 1, minHeight: 500, borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }}>
        <ParcelPreviewCesium ref={previewRef} className="h-full w-full" />
      </Box>
    </Box>
  );
}
