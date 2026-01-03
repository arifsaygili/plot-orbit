"use client";

import { useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Container, Grid, Stack, Title, Text, Paper, Alert, Group, Badge } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconMap, IconInfoCircle } from "@tabler/icons-react";
import { ParcelSearchForm } from "@/components/parcel";
import type { ParcelResult } from "@/client/api/parcelClient";
import type { ParcelPreviewCesiumRef } from "@/components/cesium";

// Dynamically import Cesium to avoid SSR issues
const ParcelPreviewCesium = dynamic(
  () => import("@/components/cesium/ParcelPreviewCesium"),
  { ssr: false }
);

export default function ParcelSearchPage() {
  const cesiumRef = useRef<ParcelPreviewCesiumRef>(null);
  const [mapReady, setMapReady] = useState(false);
  const [currentParcel, setCurrentParcel] = useState<ParcelResult | null>(null);
  const [searching, setSearching] = useState(false);

  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);

  const handleMapError = useCallback((error: string) => {
    notifications.show({
      title: "Map Error",
      message: error,
      color: "red",
    });
  }, []);

  const handleParcelFound = useCallback(async (parcel: ParcelResult) => {
    setCurrentParcel(parcel);
    setSearching(false);

    if (cesiumRef.current) {
      try {
        await cesiumRef.current.showParcel(parcel);
        notifications.show({
          title: "Parcel Found",
          message: parcel.label,
          color: "green",
        });
      } catch (err) {
        notifications.show({
          title: "Display Error",
          message: err instanceof Error ? err.message : "Failed to display parcel",
          color: "red",
        });
      }
    }
  }, []);

  const handleSearchStart = useCallback(() => {
    setSearching(true);
    setCurrentParcel(null);
  }, []);

  const handleSearchError = useCallback((error: string) => {
    setSearching(false);
    notifications.show({
      title: "Search Error",
      message: error,
      color: "red",
    });
  }, []);

  return (
    <Container fluid p="md" h="100%">
      <Grid h="100%" gutter="md">
        {/* Left Panel - Search Form */}
        <Grid.Col span={{ base: 12, md: 4, lg: 3 }}>
          <Stack gap="md">
            <Group gap="xs">
              <IconMap size={24} />
              <Title order={2}>Parcel Search</Title>
            </Group>

            <Text c="dimmed" size="sm">
              Search for land parcels by selecting province, district, neighborhood, and entering block/lot numbers.
            </Text>

            <ParcelSearchForm
              onParcelFound={handleParcelFound}
              onSearchStart={handleSearchStart}
              onError={handleSearchError}
              disabled={!mapReady}
            />

            {/* Parcel Info Card */}
            {currentParcel && (
              <Paper shadow="sm" radius="md" p="md" withBorder>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text fw={600}>Parcel Details</Text>
                    <Badge color="green" size="sm">Found</Badge>
                  </Group>
                  
                  <Text size="sm" c="dimmed">{currentParcel.label}</Text>
                  
                  <Grid gutter="xs">
                    <Grid.Col span={6}>
                      <Text size="xs" c="dimmed">Block (Ada)</Text>
                      <Text size="sm" fw={500}>{currentParcel.ada}</Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="xs" c="dimmed">Lot (Parsel)</Text>
                      <Text size="sm" fw={500}>{currentParcel.parsel}</Text>
                    </Grid.Col>
                    {currentParcel.area && (
                      <Grid.Col span={12}>
                        <Text size="xs" c="dimmed">Area</Text>
                        <Text size="sm" fw={500}>{currentParcel.area.toLocaleString()} m²</Text>
                      </Grid.Col>
                    )}
                    <Grid.Col span={12}>
                      <Text size="xs" c="dimmed">Center</Text>
                      <Text size="sm" fw={500}>
                        {currentParcel.centroid.lat.toFixed(6)}, {currentParcel.centroid.lng.toFixed(6)}
                      </Text>
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Paper>
            )}

            <Alert
              icon={<IconInfoCircle size={16} />}
              title="Data Source"
              color="blue"
              variant="light"
            >
              Parcel data is provided by TKGM (General Directorate of Land Registry and Cadastre).
            </Alert>
          </Stack>
        </Grid.Col>

        {/* Right Panel - Cesium Map */}
        <Grid.Col span={{ base: 12, md: 8, lg: 9 }}>
          <Paper
            shadow="sm"
            radius="md"
            withBorder
            h="100%"
            style={{ minHeight: "500px", overflow: "hidden" }}
          >
            <ParcelPreviewCesium
              ref={cesiumRef}
              className="h-full w-full"
              onReady={handleMapReady}
              onError={handleMapError}
            />
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
