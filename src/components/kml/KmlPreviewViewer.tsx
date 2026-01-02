"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { getFileDownloadUrl } from "@/client/api/filesClient";
import {
  getEntitiesInfo,
  getEntityBoundingInfo,
  getDataSourceBoundingInfo,
  highlightEntity,
  unhighlightEntity,
  initIon,
  getIonStatus,
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
import { TargetSelector } from "./TargetSelector";
import {
  SceneSettingsPanel,
  defaultSceneSettings,
  type SceneSettings,
} from "./SceneSettingsPanel";
import { OrbitPanel, useOrbit } from "@/components/orbit";
import { RecordPanel, useRecordFlow } from "@/components/record";
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
    resetConfig,
  } = useOrbit(viewerRef.current, cesiumRef.current, orbitTarget);

  // Record flow hook
  const {
    flowState,
    progress: recordProgress,
    elapsedMs: recordElapsedMs,
    error: recordError,
    result: recordResult,
    isSupported: isRecordingSupported,
    startRecording,
    stopRecording,
    reset: resetRecording,
  } = useRecordFlow(
    viewerRef.current,
    cesiumRef.current,
    orbitTarget,
    orbitConfig,
    fileId
  );

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
    async (newSettings: SceneSettings) => {
      const Cesium = cesiumRef.current;
      const viewer = viewerRef.current;
      if (!Cesium || !viewer) return;

      // Terrain toggle
      if (newSettings.terrainEnabled !== sceneSettings.terrainEnabled) {
        setIsTerrainLoading(true);
        if (newSettings.terrainEnabled) {
          await enableTerrain(viewer, Cesium);
        } else {
          await disableTerrain(viewer, Cesium);
        }
        setIsTerrainLoading(false);
      }

      // Imagery preset
      if (newSettings.imageryPreset !== sceneSettings.imageryPreset) {
        await setImageryPreset(viewer, newSettings.imageryPreset, Cesium);
      }

      // Quality preset
      if (newSettings.qualityPreset !== sceneSettings.qualityPreset) {
        applyQualityPreset(viewer, newSettings.qualityPreset, Cesium);
      }

      // Buildings toggle
      if (newSettings.buildingsEnabled !== sceneSettings.buildingsEnabled) {
        if (newSettings.buildingsEnabled) {
          await enableBuildings(viewer, Cesium);
        } else {
          disableBuildings(viewer);
        }
      }

      // Lighting toggle
      if (newSettings.lightingEnabled !== sceneSettings.lightingEnabled) {
        setLighting(viewer, newSettings.lightingEnabled);
      }

      setSceneSettings(newSettings);
    },
    [sceneSettings]
  );

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
          setError(err instanceof Error ? err.message : "Failed to load KML");
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

  return (
    <div className="relative w-full h-full min-h-[500px]">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white">Loading {fileName}...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
          <div className="text-red-400 text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-lg font-medium">Failed to load KML</p>
            <p className="text-sm text-gray-400 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" />

      {/* Panels */}
      {!isLoading && !error && (
        <>
          {/* Target Selection Panel - Right */}
          <div className="absolute top-4 right-4 z-20">
            <TargetSelector
              entities={entities}
              selectedEntityId={selectedEntityId}
              boundingInfo={boundingInfo}
              onSelectEntity={handleSelectEntity}
            />
          </div>

          {/* Scene Settings Panel - Left */}
          <div className="absolute top-4 left-4 z-20 space-y-4">
            <SceneSettingsPanel
              ionStatus={ionStatus}
              settings={sceneSettings}
              onSettingsChange={handleSettingsChange}
              isTerrainLoading={isTerrainLoading}
            />

            {/* Orbit Controls Panel - Below Scene Settings */}
            <OrbitPanel
              config={orbitConfig}
              orbitState={orbitState}
              presetId={presetId}
              onPresetChange={setPreset}
              onConfigChange={updateConfig}
              onStart={startOrbit}
              onPreview={startPreview}
              onStop={stopOrbit}
              onReset={resetConfig}
              disabled={!orbitTarget || flowState !== "idle"}
            />

            {/* Record Panel - Below Orbit Controls */}
            <RecordPanel
              flowState={flowState}
              progress={recordProgress}
              elapsedMs={recordElapsedMs}
              durationMs={orbitConfig.durationSec * 1000}
              error={recordError}
              result={recordResult}
              isSupported={isRecordingSupported}
              onStart={startRecording}
              onStop={stopRecording}
              onReset={resetRecording}
              disabled={!orbitTarget || orbitState.isRunning}
            />
          </div>
        </>
      )}
    </div>
  );
}
