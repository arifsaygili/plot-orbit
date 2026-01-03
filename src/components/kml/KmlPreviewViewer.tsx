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
import { getFileDownloadUrl } from "@/client/api/filesClient";
import {
  getEntitiesInfo,
  getEntityBoundingInfo,
  getDataSourceBoundingInfo,
  highlightEntity,
  unhighlightEntity,
  initIon,
  enableTerrain,
  disableTerrain,
  configureCameraLimits,
  setImageryPreset,
  applyQualityPreset,
  setLighting,
  enableBuildings,
  disableBuildings,
  type EntityInfo,
  type BoundingInfo,
  type IonStatus,
  type OrbitTarget,
} from "@/lib/cesium";
import {
  defaultSceneSettings,
  type SceneSettings,
} from "./SceneSettingsPanel";
import { useOrbit } from "@/components/orbit";
import { ORBIT_PRESETS } from "@/components/orbit/orbitPresets";
import { DEFAULT_SAFETY_LIMITS } from "@/lib/cesium/orbit";
import {
  useRecordFlow,
  getOutputPreset,
  OUTPUT_PRESETS,
} from "@/components/record";
import { downloadRecording } from "@/client/recording";
import type { Viewer as CesiumViewer, KmlDataSource, Entity } from "cesium";

interface Props {
  fileId: string;
  fileName: string;
}

export function KmlPreviewViewer({ fileId, fileName }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<CesiumViewer | null>(null);
  const dataSourceRef = useRef<KmlDataSource | null>(null);
  const cesiumRef = useRef<typeof import("cesium") | null>(null);
  const selectedEntityRef = useRef<Entity | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isTerrainLoading, setIsTerrainLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entities, setEntities] = useState<EntityInfo[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [boundingInfo, setBoundingInfo] = useState<BoundingInfo | null>(null);
  const [ionStatus, setIonStatus] = useState<IonStatus>({
    initialized: false,
    enabled: false,
    error: null,
  });
  const [sceneSettings, setSceneSettings] =
    useState<SceneSettings>(defaultSceneSettings);

  // Convert boundingInfo to OrbitTarget
  const orbitTarget = useMemo<OrbitTarget | null>(() => {
    if (!boundingInfo) return null;
    return {
      longitude: boundingInfo.center.longitude,
      latitude: boundingInfo.center.latitude,
      height: boundingInfo.center.height,
      suggestedRadiusMeters: boundingInfo.radius,
    };
  }, [boundingInfo]);

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
    fileId
  );

  // Get current preset info for aspect ratio
  const currentPreset = getOutputPreset(outputPreset);
  const isReelsMode = outputPreset === "REELS_9_16";
  const limits = DEFAULT_SAFETY_LIMITS;

  const handleSelectEntity = useCallback((entityId: string) => {
    const Cesium = cesiumRef.current;
    const dataSource = dataSourceRef.current;
    if (!Cesium || !dataSource) return;

    // Unhighlight previous
    if (selectedEntityRef.current) {
      unhighlightEntity(selectedEntityRef.current, Cesium);
    }

    // Find and highlight new entity
    const entity = dataSource.entities.getById(entityId);
    if (entity) {
      highlightEntity(entity, Cesium);
      selectedEntityRef.current = entity;

      // Calculate bounding info
      const info = getEntityBoundingInfo(entity, Cesium);
      setBoundingInfo(info);

      // Fly to entity
      if (viewerRef.current) {
        viewerRef.current.flyTo(entity);
      }
    }

    setSelectedEntityId(entityId);
  }, []);

  // Handle settings change
  const handleSettingsChange = useCallback(
    async (key: keyof SceneSettings, value: SceneSettings[keyof SceneSettings]) => {
      const Cesium = cesiumRef.current;
      const viewer = viewerRef.current;
      if (!Cesium || !viewer) return;

      const newSettings = { ...sceneSettings, [key]: value };

      // Terrain toggle
      if (key === "terrainEnabled") {
        setIsTerrainLoading(true);
        if (value) {
          await enableTerrain(viewer, Cesium);
        } else {
          await disableTerrain(viewer, Cesium);
        }
        setIsTerrainLoading(false);
      }

      // Imagery preset
      if (key === "imageryPreset") {
        await setImageryPreset(viewer, value as "satellite" | "roadmap", Cesium);
      }

      // Quality preset
      if (key === "qualityPreset") {
        applyQualityPreset(viewer, value as "low" | "medium" | "high", Cesium);
      }

      // Buildings toggle
      if (key === "buildingsEnabled") {
        if (value) {
          await enableBuildings(viewer, Cesium);
        } else {
          disableBuildings(viewer);
        }
      }

      // Lighting toggle
      if (key === "lightingEnabled") {
        setLighting(viewer, value as boolean);
      }

      setSceneSettings(newSettings);
    },
    [sceneSettings]
  );

  const formatCoord = (value: number) => value.toFixed(6);
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
        `orbit-video-${recordResult.videoId}.webm`
      );
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initViewer() {
      if (!containerRef.current) return;

      try {
        // Dynamically import Cesium
        const Cesium = await import("cesium");
        cesiumRef.current = Cesium;

        // Set Cesium base URL
        (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL =
          "/cesium";

        // Load CSS dynamically
        if (!document.getElementById("cesium-css")) {
          const link = document.createElement("link");
          link.id = "cesium-css";
          link.rel = "stylesheet";
          link.href = "/cesium/Widgets/widgets.css";
          document.head.appendChild(link);
        }

        // Initialize Ion
        const status = await initIon(Cesium);
        setIonStatus(status);

        if (!mounted) return;

        // Create viewer without terrain first (we'll add it based on settings)
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

        // Configure camera limits
        configureCameraLimits(viewer, Cesium);

        // Apply initial settings
        await setImageryPreset(viewer, defaultSceneSettings.imageryPreset, Cesium);
        applyQualityPreset(viewer, defaultSceneSettings.qualityPreset, Cesium);

        // Enable terrain if Ion is available and setting is on
        if (status.enabled && defaultSceneSettings.terrainEnabled) {
          setIsTerrainLoading(true);
          await enableTerrain(viewer, Cesium);
          setIsTerrainLoading(false);
        }

        // Load KML
        const url = getFileDownloadUrl(fileId);
        const dataSource = await Cesium.KmlDataSource.load(url, {
          camera: viewer.scene.camera,
          canvas: viewer.scene.canvas,
          clampToGround: true,
        });

        if (!mounted) {
          return;
        }

        dataSourceRef.current = dataSource;
        await viewer.dataSources.add(dataSource);
        await viewer.flyTo(dataSource);

        // Extract entities info
        const entitiesInfo = getEntitiesInfo(dataSource, Cesium);
        setEntities(entitiesInfo);

        // Auto-select first polygon (largest by area)
        const firstPolygon = entitiesInfo.find((e) => e.type === "polygon");
        if (firstPolygon) {
          const entity = dataSource.entities.getById(firstPolygon.id);
          if (entity) {
            highlightEntity(entity, Cesium);
            selectedEntityRef.current = entity;
            setSelectedEntityId(firstPolygon.id);

            const info = getEntityBoundingInfo(entity, Cesium);
            setBoundingInfo(info);
          }
        } else if (entitiesInfo.length > 0) {
          // Fallback to data source bounding
          const info = getDataSourceBoundingInfo(dataSource, Cesium);
          setBoundingInfo(info);
        }

        setIsLoading(false);
      } catch (err) {
        console.error("KML preview error:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "KML yüklenemedi");
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
      selectedEntityRef.current = null;
    };
  }, [fileId]);

  const isRecording = flowState === "recording";
  const isProcessing = flowState === "processing" || flowState === "uploading";
  const isComplete = flowState === "complete";
  const isError = flowState === "error";
  const isIdle = flowState === "idle";

  return (
    <Box style={{ display: "flex", height: "100%", background: "var(--mantine-color-gray-1)" }}>
      {/* Left Panel - Controls (320px fixed width) */}
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
            <Accordion
              multiple
              defaultValue={["target", "scene", "orbit", "record"]}
              styles={{
                item: {
                  borderBottom: "1px solid var(--mantine-color-gray-2)",
                },
                control: {
                  padding: "var(--mantine-spacing-sm)",
                },
                panel: {
                  padding: "var(--mantine-spacing-sm)",
                },
              }}
            >
              {/* Target Selection */}
              <Accordion.Item value="target">
                <Accordion.Control icon={<IconTarget size={18} color="var(--mantine-color-teal-6)" />}>
                  <Text fw={600} fz="sm" c="dark.7">Hedef Seçimi</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="sm">
                    <Text fz="xs" c="dimmed">
                      {entities.length} alan bulundu
                    </Text>
                    <Box
                      style={{
                        maxHeight: 150,
                        overflowY: "auto",
                        border: "1px solid var(--mantine-color-gray-3)",
                        borderRadius: "var(--mantine-radius-md)",
                      }}
                    >
                      {entities.length === 0 ? (
                        <Text fz="sm" c="dimmed" ta="center" p="md">
                          Seçilebilir alan bulunamadı
                        </Text>
                      ) : (
                        entities.map((entity) => (
                          <Box
                            key={entity.id}
                            onClick={() => handleSelectEntity(entity.id)}
                            p="xs"
                            style={{
                              cursor: "pointer",
                              borderBottom: "1px solid var(--mantine-color-gray-2)",
                              background: selectedEntityId === entity.id ? "var(--mantine-color-teal-0)" : undefined,
                            }}
                          >
                            <Group justify="space-between">
                              <Text fz="sm" c={selectedEntityId === entity.id ? "teal.7" : "dark.6"} truncate maw={180}>
                                {entity.name}
                              </Text>
                              <Badge size="xs" variant="light" color={entity.type === "polygon" ? "teal" : "violet"}>
                                {entity.type}
                              </Badge>
                            </Group>
                          </Box>
                        ))
                      )}
                    </Box>

                    {boundingInfo && (
                      <Stack gap="xs">
                        <Text fz="xs" c="dimmed" tt="uppercase" fw={600}>Merkez</Text>
                        <Group gap="xs">
                          <Badge variant="light" color="gray" size="sm">
                            Lat: {formatCoord(boundingInfo.center.latitude)}
                          </Badge>
                          <Badge variant="light" color="gray" size="sm">
                            Lng: {formatCoord(boundingInfo.center.longitude)}
                          </Badge>
                        </Group>
                        <Badge variant="light" color="teal" size="md">
                          Önerilen Yarıçap: {formatRadius(boundingInfo.radius)}
                        </Badge>
                      </Stack>
                    )}
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>

              {/* Scene Settings */}
              <Accordion.Item value="scene">
                <Accordion.Control icon={<IconSettings size={18} color="var(--mantine-color-teal-6)" />}>
                  <Text fw={600} fz="sm" c="dark.7">Sahne Ayarları</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="md">
                    {/* Ion Status */}
                    <Group gap="xs">
                      <Box
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: ionStatus.enabled ? "var(--mantine-color-green-5)" : "var(--mantine-color-yellow-5)",
                        }}
                      />
                      <Text fz="xs" c="dimmed">
                        {ionStatus.enabled ? "Ion aktif" : "Ion devre dışı"}
                      </Text>
                    </Group>

                    <Switch
                      label="Arazi"
                      checked={sceneSettings.terrainEnabled}
                      onChange={(e) => handleSettingsChange("terrainEnabled", e.currentTarget.checked)}
                      disabled={!ionStatus.enabled || isTerrainLoading}
                      color="teal"
                      size="sm"
                    />

                    <Select
                      label="Görüntü"
                      size="xs"
                      value={sceneSettings.imageryPreset}
                      onChange={(v) => v && handleSettingsChange("imageryPreset", v as "satellite" | "roadmap")}
                      data={[
                        { value: "satellite", label: "Uydu" },
                        { value: "roadmap", label: "Yol Haritası" },
                      ]}
                    />

                    <Select
                      label="Kalite"
                      size="xs"
                      value={sceneSettings.qualityPreset}
                      onChange={(v) => v && handleSettingsChange("qualityPreset", v as "low" | "medium" | "high")}
                      data={[
                        { value: "low", label: "Düşük (Performans)" },
                        { value: "medium", label: "Orta" },
                        { value: "high", label: "Yüksek (Kalite)" },
                      ]}
                    />

                    <Switch
                      label="3D Binalar"
                      checked={sceneSettings.buildingsEnabled}
                      onChange={(e) => handleSettingsChange("buildingsEnabled", e.currentTarget.checked)}
                      disabled={!ionStatus.enabled}
                      color="teal"
                      size="sm"
                    />

                    <Switch
                      label="Aydınlatma"
                      checked={sceneSettings.lightingEnabled}
                      onChange={(e) => handleSettingsChange("lightingEnabled", e.currentTarget.checked)}
                      color="teal"
                      size="sm"
                    />
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>

              {/* Orbit Controls */}
              <Accordion.Item value="orbit">
                <Accordion.Control icon={<IconRotate360 size={18} color="var(--mantine-color-teal-6)" />}>
                  <Text fw={600} fz="sm" c="dark.7">Orbit Kontrolü</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="md">
                    {orbitState.isRunning && (
                      <Box>
                        <Group justify="space-between" mb={4}>
                          <Text fz="xs" c="dimmed">
                            {orbitState.isPreviewMode ? "Önizleme" : "Orbit"} İlerlemesi
                          </Text>
                          <Text fz="xs" c="dimmed">{Math.round(orbitState.progress * 100)}%</Text>
                        </Group>
                        <Progress value={orbitState.progress * 100} color="teal" size="sm" radius="md" />
                      </Box>
                    )}

                    <Select
                      label="Preset"
                      size="xs"
                      value={presetId}
                      onChange={(v) => v && setPreset(v)}
                      disabled={orbitState.isRunning || !orbitTarget || flowState !== "idle"}
                      data={ORBIT_PRESETS.map((p) => ({ value: p.id, label: p.name }))}
                    />

                    <Box>
                      <Group justify="space-between" mb={4}>
                        <Text fz="xs" c="dark.5">Süre</Text>
                        <Text fz="xs" c="dark.5">{orbitConfig.durationSec}s</Text>
                      </Group>
                      <Slider
                        value={orbitConfig.durationSec}
                        onChange={(v) => updateConfig({ durationSec: v })}
                        min={limits.minDurationSec}
                        max={limits.maxDurationSec}
                        disabled={orbitState.isRunning || !orbitTarget || flowState !== "idle"}
                        color="teal"
                        size="sm"
                      />
                    </Box>

                    <Box>
                      <Group justify="space-between" mb={4}>
                        <Text fz="xs" c="dark.5">FPS</Text>
                        <Text fz="xs" c="dark.5">{orbitConfig.fps}</Text>
                      </Group>
                      <Slider
                        value={orbitConfig.fps}
                        onChange={(v) => updateConfig({ fps: v })}
                        min={limits.minFps}
                        max={limits.maxFps}
                        step={5}
                        disabled={orbitState.isRunning || !orbitTarget || flowState !== "idle"}
                        color="teal"
                        size="sm"
                      />
                    </Box>

                    <Box>
                      <Group justify="space-between" mb={4}>
                        <Text fz="xs" c="dark.5">Yarıçap</Text>
                        <Text fz="xs" c="dark.5">{Math.round(orbitConfig.radiusMeters)}m</Text>
                      </Group>
                      <Slider
                        value={orbitConfig.radiusMeters}
                        onChange={(v) => updateConfig({ radiusMeters: v })}
                        min={limits.minRadiusMeters}
                        max={Math.min(limits.maxRadiusMeters, orbitConfig.radiusMeters * 3)}
                        step={50}
                        disabled={orbitState.isRunning || !orbitTarget || flowState !== "idle"}
                        color="teal"
                        size="sm"
                      />
                    </Box>

                    <Box>
                      <Group justify="space-between" mb={4}>
                        <Text fz="xs" c="dark.5">Eğim</Text>
                        <Text fz="xs" c="dark.5">{orbitConfig.pitchDeg}°</Text>
                      </Group>
                      <Slider
                        value={orbitConfig.pitchDeg}
                        onChange={(v) => updateConfig({ pitchDeg: v })}
                        min={limits.minPitchDeg}
                        max={limits.maxPitchDeg}
                        step={5}
                        disabled={orbitState.isRunning || !orbitTarget || flowState !== "idle"}
                        color="teal"
                        size="sm"
                      />
                    </Box>

                    <Group gap="xs">
                      {orbitState.isRunning ? (
                        <Button
                          fullWidth
                          color="red"
                          leftSection={<IconPlayerStop size={16} />}
                          onClick={stopOrbit}
                        >
                          Durdur
                        </Button>
                      ) : (
                        <>
                          <Button
                            flex={1}
                            variant="light"
                            color="teal"
                            leftSection={<IconEye size={16} />}
                            onClick={startPreview}
                            disabled={!orbitTarget || flowState !== "idle"}
                          >
                            Önizle
                          </Button>
                          <Button
                            flex={1}
                            color="teal"
                            leftSection={<IconPlayerPlay size={16} />}
                            onClick={startOrbit}
                            disabled={!orbitTarget || flowState !== "idle"}
                          >
                            Başlat
                          </Button>
                        </>
                      )}
                    </Group>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>

              {/* Record */}
              <Accordion.Item value="record">
                <Accordion.Control icon={<IconVideo size={18} color="var(--mantine-color-red-6)" />}>
                  <Group gap="xs">
                    <Text fw={600} fz="sm" c="dark.7">Video Kayıt</Text>
                    {isRecording && (
                      <Box
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "var(--mantine-color-red-5)",
                          animation: "pulse 1s infinite",
                        }}
                      />
                    )}
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="md">
                    {!isRecordingSupported && (
                      <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" radius="md">
                        Bu tarayıcıda video kaydı desteklenmiyor. Chrome, Edge veya Firefox kullanın.
                      </Alert>
                    )}

                    {isError && recordError && (
                      <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" radius="md">
                        {recordError}
                      </Alert>
                    )}

                    {isIdle && (
                      <Select
                        label="Çıktı Formatı"
                        size="xs"
                        value={outputPreset}
                        onChange={(v) => v && setOutputPreset(v as typeof outputPreset)}
                        disabled={!orbitTarget || orbitState.isRunning}
                        data={OUTPUT_PRESETS.map((p) => ({ value: p.id, label: p.name }))}
                      />
                    )}

                    {(isRecording || flowState === "creating") && (
                      <Box>
                        <Group justify="space-between" mb={4}>
                          <Text fz="xs" c="dimmed">{formatTime(recordElapsedMs)}</Text>
                          <Text fz="xs" c="dimmed">{formatTime(orbitConfig.durationSec * 1000)}</Text>
                        </Group>
                        <Progress value={recordProgress} color="red" size="sm" radius="md" />
                      </Box>
                    )}

                    {isProcessing && (
                      <Group justify="center" py="md">
                        <Loader size="sm" color="teal" />
                        <Text fz="sm" c="dimmed">
                          {flowState === "uploading" ? "Yükleniyor..." : "İşleniyor..."}
                        </Text>
                      </Group>
                    )}

                    {isComplete && recordResult && (
                      <Stack gap="sm">
                        <video
                          src={recordResult.objectUrl}
                          controls
                          style={{ width: "100%", borderRadius: "var(--mantine-radius-md)", maxHeight: 150 }}
                        />
                        <Button
                          color="green"
                          leftSection={<IconDownload size={16} />}
                          onClick={handleDownload}
                          fullWidth
                        >
                          İndir
                        </Button>
                      </Stack>
                    )}

                    <Group gap="xs">
                      {isIdle && (
                        <Button
                          fullWidth
                          color="red"
                          leftSection={<Box style={{ width: 10, height: 10, borderRadius: "50%", background: "white" }} />}
                          onClick={startRecording}
                          disabled={!orbitTarget || orbitState.isRunning || !isRecordingSupported}
                        >
                          Kaydet
                        </Button>
                      )}

                      {isRecording && (
                        <Button
                          fullWidth
                          variant="light"
                          color="gray"
                          leftSection={<IconPlayerStop size={16} />}
                          onClick={stopRecording}
                        >
                          Durdur
                        </Button>
                      )}

                      {(isComplete || isError) && (
                        <Button
                          fullWidth
                          variant="light"
                          color="gray"
                          leftSection={<IconRefresh size={16} />}
                          onClick={resetRecording}
                        >
                          Yeni Kayıt
                        </Button>
                      )}
                    </Group>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Stack>
        </ScrollArea>
      </Box>

      {/* Right Panel - Map (flex: 1) */}
      <Box style={{ flex: 1, position: "relative", background: "var(--mantine-color-dark-9)" }}>
        {isLoading && (
          <Box
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--mantine-color-dark-9)",
              zIndex: 10,
            }}
          >
            <Loader size="lg" color="teal" mb="md" />
            <Text c="white">{fileName} yükleniyor...</Text>
          </Box>
        )}

        {error && (
          <Box
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--mantine-color-dark-9)",
              zIndex: 10,
            }}
          >
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              variant="filled"
              radius="lg"
            >
              <Text fw={500}>KML Yüklenemedi</Text>
              <Text fz="sm">{error}</Text>
            </Alert>
          </Box>
        )}

        {/* Viewer container with aspect ratio based on preset */}
        <Box
          ref={containerRef}
          style={{
            width: isReelsMode ? undefined : "100%",
            height: "100%",
            ...(isReelsMode
              ? {
                  aspectRatio: currentPreset.aspectRatio,
                  maxWidth: "100%",
                  margin: "0 auto",
                }
              : {}),
          }}
        />
      </Box>
    </Box>
  );
}
