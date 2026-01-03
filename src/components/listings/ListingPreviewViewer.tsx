"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Box,
  Stack,
  Text,
  Loader,
  Alert,
  ScrollArea,
  Accordion,
  Group,
  Badge,
  Select,
  Switch,
  Slider,
  Button,
  Progress,
  Paper,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconSettings,
  IconTarget,
  IconRotate360,
  IconVideo,
  IconPlayerPlay,
  IconPlayerStop,
  IconDownload,
  IconRefresh,
  IconEye,
} from "@tabler/icons-react";
import {
  initIon,
  enableTerrain,
  disableTerrain,
  configureCameraLimits,
  setImageryPreset,
  applyQualityPreset,
  setLighting,
  enableBuildings,
  disableBuildings,
  type IonStatus,
  type OrbitTarget,
} from "@/lib/cesium";
import { useOrbit } from "@/components/orbit";
import { ORBIT_PRESETS } from "@/components/orbit/orbitPresets";
import { DEFAULT_SAFETY_LIMITS } from "@/lib/cesium/orbit";
import {
  useRecordFlow,
  getOutputPreset,
  OUTPUT_PRESETS,
} from "@/components/record";
import { downloadRecording } from "@/client/recording";
import type { Viewer as CesiumViewer, GeoJsonDataSource } from "cesium";
import type { ListingDetail, ListingGeometry, Centroid, BBox } from "@/client/api/listingsClient";

/** Scene settings */
interface SceneSettings {
  terrainEnabled: boolean;
  imageryPreset: "satellite" | "roadmap";
  qualityPreset: "low" | "medium" | "high";
  buildingsEnabled: boolean;
  lightingEnabled: boolean;
}

const defaultSceneSettings: SceneSettings = {
  terrainEnabled: true,
  imageryPreset: "satellite",
  qualityPreset: "medium",
  buildingsEnabled: false,
  lightingEnabled: false,
};

interface Props {
  listing: ListingDetail;
}

export function ListingPreviewViewer({ listing }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<CesiumViewer | null>(null);
  const dataSourceRef = useRef<GeoJsonDataSource | null>(null);
  const cesiumRef = useRef<typeof import("cesium") | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isTerrainLoading, setIsTerrainLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ionStatus, setIonStatus] = useState<IonStatus>({
    initialized: false,
    enabled: false,
    error: null,
  });
  const [sceneSettings, setSceneSettings] = useState<SceneSettings>(defaultSceneSettings);

  // Parse listing geometry data
  const geometry = listing.geometry as ListingGeometry;
  const centroid = listing.centroid as Centroid;
  const bbox = listing.bbox as BBox;

  // Convert listing to OrbitTarget
  const orbitTarget = useMemo<OrbitTarget | null>(() => {
    if (!centroid || !bbox) return null;
    
    // Calculate radius from bbox
    const [west, south, east, north] = bbox;
    const latDiff = north - south;
    const lngDiff = east - west;
    const avgLatDiff = (latDiff + lngDiff) / 2;
    const radiusMeters = avgLatDiff * 111000; // rough conversion
    
    return {
      longitude: centroid.lng,
      latitude: centroid.lat,
      height: 0,
      suggestedRadiusMeters: Math.max(radiusMeters * 1.5, 100),
    };
  }, [centroid, bbox]);

  // Orbit hook
  const {
    orbitState,
    config: orbitConfig,
    presetId,
    setPreset,
    updateConfig,
    startOrbit,
    startPreview,
    stopOrbit,
  } = useOrbit(viewerRef.current, cesiumRef.current, orbitTarget);

  // Record flow hook
  const {
    flowState,
    progress: recordProgress,
    elapsedMs: recordElapsedMs,
    error: recordError,
    result: recordResult,
    isSupported: isRecordingSupported,
    outputPreset,
    startRecording,
    stopRecording,
    reset: resetRecording,
    setOutputPreset,
  } = useRecordFlow(
    viewerRef.current,
    cesiumRef.current,
    orbitTarget,
    orbitConfig,
    listing.id
  );

  const currentPreset = getOutputPreset(outputPreset);
  const limits = DEFAULT_SAFETY_LIMITS;

  const handleSettingsChange = useCallback(
    async (key: keyof SceneSettings, value: SceneSettings[keyof SceneSettings]) => {
      const Cesium = cesiumRef.current;
      const viewer = viewerRef.current;
      if (!Cesium || !viewer) return;

      const newSettings = { ...sceneSettings, [key]: value };

      if (key === "terrainEnabled") {
        setIsTerrainLoading(true);
        if (value) {
          await enableTerrain(viewer, Cesium);
        } else {
          await disableTerrain(viewer, Cesium);
        }
        setIsTerrainLoading(false);
      }

      if (key === "imageryPreset") {
        await setImageryPreset(viewer, value as "satellite" | "roadmap", Cesium);
      }

      if (key === "qualityPreset") {
        applyQualityPreset(viewer, value as "low" | "medium" | "high", Cesium);
      }

      if (key === "buildingsEnabled") {
        if (value) {
          await enableBuildings(viewer, Cesium);
        } else {
          disableBuildings(viewer);
        }
      }

      if (key === "lightingEnabled") {
        setLighting(viewer, value as boolean);
      }

      setSceneSettings(newSettings);
    },
    [sceneSettings]
  );

  const formatRadius = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
    return `${meters.toFixed(0)} m`;
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDownload = () => {
    if (recordResult) {
      downloadRecording(
        { blob: recordResult.blob, durationMs: recordResult.durationMs, mimeType: "video/webm", objectUrl: recordResult.objectUrl },
        `listing-video-${listing.id}.webm`
      );
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initViewer() {
      if (!containerRef.current) return;

      try {
        const Cesium = await import("cesium");
        cesiumRef.current = Cesium;

        (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = "/cesium";

        if (!document.getElementById("cesium-css")) {
          const link = document.createElement("link");
          link.id = "cesium-css";
          link.rel = "stylesheet";
          link.href = "/cesium/Widgets/widgets.css";
          document.head.appendChild(link);
        }

        const status = await initIon(Cesium);
        setIonStatus(status);

        if (!mounted) return;

        const viewer = new Cesium.Viewer(containerRef.current, {
          animation: false,
          timeline: false,
          baseLayerPicker: false,
          geocoder: false,
          homeButton: true,
          sceneModePicker: false,
          navigationHelpButton: false,
          fullscreenButton: false,
        });

        viewerRef.current = viewer;
        configureCameraLimits(viewer, Cesium);

        await setImageryPreset(viewer, defaultSceneSettings.imageryPreset, Cesium);
        applyQualityPreset(viewer, defaultSceneSettings.qualityPreset, Cesium);

        if (status.enabled && defaultSceneSettings.terrainEnabled) {
          setIsTerrainLoading(true);
          await enableTerrain(viewer, Cesium);
          setIsTerrainLoading(false);
        }

        // Load GeoJSON from listing geometry
        const dataSource = await Cesium.GeoJsonDataSource.load(geometry, {
          stroke: Cesium.Color.ORANGE,
          fill: Cesium.Color.YELLOW.withAlpha(0.4),
          strokeWidth: 3,
          clampToGround: true,
        });

        if (!mounted) return;

        dataSourceRef.current = dataSource;
        await viewer.dataSources.add(dataSource);

        // Fly to the geometry
        await viewer.flyTo(dataSource);

        setIsLoading(false);
      } catch (err) {
        console.error("Listing preview error:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load viewer");
          setIsLoading(false);
        }
      }
    }

    initViewer();

    return () => {
      mounted = false;
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch {
          // Ignore cleanup errors
        }
        viewerRef.current = null;
      }
      dataSourceRef.current = null;
      cesiumRef.current = null;
    };
  }, [geometry]);

  const isRecording = flowState === "recording";
  const isProcessing = flowState === "processing" || flowState === "uploading";
  const isComplete = flowState === "complete";
  const isError = flowState === "error";
  const isIdle = flowState === "idle";

  return (
    <Box style={{ display: "flex", height: "100%", background: "var(--mantine-color-gray-1)" }}>
      {/* Left Panel */}
      <Box
        style={{
          width: "320px",
          minWidth: "320px",
          height: "100%",
          borderRight: "1px solid var(--mantine-color-gray-3)",
          background: "white",
        }}
      >
        <ScrollArea h="100%" type="auto">
          <Stack gap={0} p="md">
            {/* Listing Info */}
            <Paper shadow="xs" p="sm" mb="md" withBorder>
              <Text fw={600} size="sm" mb="xs">{listing.title}</Text>
              {(listing.parcelInfo.il || listing.parcelInfo.ilce || listing.parcelInfo.mahalle) && (
                <Text size="xs" c="dimmed">
                  {[listing.parcelInfo.il, listing.parcelInfo.ilce, listing.parcelInfo.mahalle].filter(Boolean).join(" / ")}
                </Text>
              )}
              <Text size="xs" c="dimmed">
                Ada: {listing.parcelInfo.ada}, Parsel: {listing.parcelInfo.parsel}
              </Text>
            </Paper>

            <Accordion
              multiple
              defaultValue={["scene", "orbit", "record"]}
              styles={{
                item: { borderBottom: "1px solid var(--mantine-color-gray-2)" },
                control: { padding: "var(--mantine-spacing-sm)" },
                panel: { padding: "var(--mantine-spacing-sm)" },
              }}
            >
              {/* Scene Settings */}
              <Accordion.Item value="scene">
                <Accordion.Control icon={<IconSettings size={16} />}>
                  <Group gap="xs">
                    <Text size="sm" fw={500}>Scene Settings</Text>
                    {isTerrainLoading && <Loader size="xs" />}
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="sm">
                    <Switch
                      label="Terrain"
                      checked={sceneSettings.terrainEnabled}
                      onChange={(e) => handleSettingsChange("terrainEnabled", e.target.checked)}
                      disabled={!ionStatus.enabled || isRecording}
                    />
                    <Select
                      label="Imagery"
                      size="xs"
                      value={sceneSettings.imageryPreset}
                      onChange={(v) => v && handleSettingsChange("imageryPreset", v as "satellite" | "roadmap")}
                      data={[
                        { value: "satellite", label: "Satellite" },
                        { value: "roadmap", label: "Road Map" },
                      ]}
                      disabled={isRecording}
                    />
                    <Select
                      label="Quality"
                      size="xs"
                      value={sceneSettings.qualityPreset}
                      onChange={(v) => v && handleSettingsChange("qualityPreset", v as "low" | "medium" | "high")}
                      data={[
                        { value: "low", label: "Low" },
                        { value: "medium", label: "Medium" },
                        { value: "high", label: "High" },
                      ]}
                      disabled={isRecording}
                    />
                    <Switch
                      label="3D Buildings"
                      checked={sceneSettings.buildingsEnabled}
                      onChange={(e) => handleSettingsChange("buildingsEnabled", e.target.checked)}
                      disabled={!ionStatus.enabled || isRecording}
                    />
                    <Switch
                      label="Dynamic Lighting"
                      checked={sceneSettings.lightingEnabled}
                      onChange={(e) => handleSettingsChange("lightingEnabled", e.target.checked)}
                      disabled={isRecording}
                    />
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>

              {/* Orbit Settings */}
              <Accordion.Item value="orbit">
                <Accordion.Control icon={<IconRotate360 size={16} />}>
                  <Group gap="xs">
                    <Text size="sm" fw={500}>Orbit Animation</Text>
                    {orbitState.isRunning && <Badge size="xs" color="green">Active</Badge>}
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="sm">
                    <Select
                      label="Preset"
                      size="xs"
                      value={presetId}
                      onChange={(v) => v && setPreset(v)}
                      data={ORBIT_PRESETS.map((p) => ({ value: p.id, label: p.name }))}
                      disabled={orbitState.isRunning || isRecording}
                    />
                    <Text size="xs" fw={500}>Radius: {formatRadius(orbitConfig.radiusMeters)}</Text>
                    <Slider
                      value={orbitConfig.radiusMeters}
                      onChange={(v) => updateConfig({ radiusMeters: v })}
                      min={limits.minRadiusMeters}
                      max={limits.maxRadiusMeters}
                      step={10}
                      disabled={orbitState.isRunning || isRecording}
                    />
                    <Text size="xs" fw={500}>Pitch: {orbitConfig.pitchDeg}°</Text>
                    <Slider
                      value={orbitConfig.pitchDeg}
                      onChange={(v) => updateConfig({ pitchDeg: v })}
                      min={limits.minPitchDeg}
                      max={limits.maxPitchDeg}
                      step={1}
                      disabled={orbitState.isRunning || isRecording}
                    />
                    <Text size="xs" fw={500}>Duration: {orbitConfig.durationSec}s</Text>
                    <Slider
                      value={orbitConfig.durationSec}
                      onChange={(v) => updateConfig({ durationSec: v })}
                      min={limits.minDurationSec}
                      max={limits.maxDurationSec}
                      step={1}
                      disabled={orbitState.isRunning || isRecording}
                    />

                    {orbitState.isRunning ? (
                      <Button
                        leftSection={<IconPlayerStop size={16} />}
                        color="red"
                        onClick={stopOrbit}
                        fullWidth
                      >
                        Stop Orbit
                      </Button>
                    ) : (
                      <Group grow>
                        <Button
                          leftSection={<IconEye size={16} />}
                          variant="light"
                          onClick={startPreview}
                          disabled={!orbitTarget || isRecording}
                        >
                          Preview
                        </Button>
                        <Button
                          leftSection={<IconRotate360 size={16} />}
                          onClick={startOrbit}
                          disabled={!orbitTarget || isRecording}
                        >
                          Full Orbit
                        </Button>
                      </Group>
                    )}

                    {orbitState.isRunning && (
                      <Progress value={orbitState.progress * 100} size="sm" />
                    )}
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>

              {/* Recording */}
              <Accordion.Item value="record">
                <Accordion.Control icon={<IconVideo size={16} />}>
                  <Group gap="xs">
                    <Text size="sm" fw={500}>Record Video</Text>
                    {isRecording && <Badge size="xs" color="red">Recording</Badge>}
                    {isComplete && <Badge size="xs" color="green">Complete</Badge>}
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="sm">
                    {!isRecordingSupported && (
                      <Alert color="yellow" title="Not Supported">
                        Video recording is not supported in this browser.
                      </Alert>
                    )}

                    <Select
                      label="Output Format"
                      size="xs"
                      value={outputPreset}
                      onChange={(v) => v && setOutputPreset(v as typeof outputPreset)}
                      data={OUTPUT_PRESETS.map((p) => ({ value: p.id, label: p.name }))}
                      disabled={!isIdle}
                    />

                    <Text size="xs" c="dimmed">
                      {currentPreset.aspectRatio} @ {currentPreset.defaultFps}fps
                    </Text>

                    {isIdle && (
                      <Button
                        leftSection={<IconPlayerPlay size={16} />}
                        color="red"
                        onClick={startRecording}
                        disabled={!orbitTarget || !isRecordingSupported}
                        fullWidth
                      >
                        Start Recording
                      </Button>
                    )}

                    {isRecording && (
                      <>
                        <Progress value={recordProgress} size="sm" animated />
                        <Text size="xs" ta="center">{formatTime(recordElapsedMs)}</Text>
                        <Button
                          leftSection={<IconPlayerStop size={16} />}
                          color="red"
                          variant="outline"
                          onClick={stopRecording}
                          fullWidth
                        >
                          Stop Recording
                        </Button>
                      </>
                    )}

                    {isProcessing && (
                      <Group justify="center" p="md">
                        <Loader size="sm" />
                        <Text size="sm">Processing...</Text>
                      </Group>
                    )}

                    {isComplete && recordResult && (
                      <Stack gap="xs">
                        <Alert color="green" title="Recording Complete">
                          Duration: {formatTime(recordResult.durationMs)}
                        </Alert>
                        <Group grow>
                          <Button
                            leftSection={<IconDownload size={16} />}
                            onClick={handleDownload}
                          >
                            Download
                          </Button>
                          <Button
                            leftSection={<IconRefresh size={16} />}
                            variant="light"
                            onClick={resetRecording}
                          >
                            New Recording
                          </Button>
                        </Group>
                      </Stack>
                    )}

                    {isError && (
                      <Alert color="red" title="Error">
                        {recordError || "Recording failed"}
                        <Button
                          size="xs"
                          variant="light"
                          mt="xs"
                          onClick={resetRecording}
                        >
                          Try Again
                        </Button>
                      </Alert>
                    )}
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Stack>
        </ScrollArea>
      </Box>

      {/* Right Panel - Cesium Viewer */}
      <Box style={{ flex: 1, position: "relative" }}>
        {isLoading && (
          <Box
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--mantine-color-dark-7)",
              zIndex: 10,
            }}
          >
            <Stack align="center" gap="md">
              <Loader size="lg" color="white" />
              <Text c="white">Loading map...</Text>
            </Stack>
          </Box>
        )}

        {error && (
          <Box
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--mantine-color-dark-7)",
              zIndex: 10,
            }}
          >
            <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
              {error}
            </Alert>
          </Box>
        )}

        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </Box>
    </Box>
  );
}
