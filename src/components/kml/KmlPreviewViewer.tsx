"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getFileDownloadUrl } from "@/client/api/filesClient";
import {
  getEntitiesInfo,
  getEntityBoundingInfo,
  getDataSourceBoundingInfo,
  highlightEntity,
  unhighlightEntity,
  type EntityInfo,
  type BoundingInfo,
} from "@/lib/cesium";
import { TargetSelector } from "./TargetSelector";
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
  const [error, setError] = useState<string | null>(null);
  const [entities, setEntities] = useState<EntityInfo[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [boundingInfo, setBoundingInfo] = useState<BoundingInfo | null>(null);

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

  useEffect(() => {
    let mounted = true;

    async function initViewer() {
      if (!containerRef.current) return;

      try {
        // Dynamically import Cesium
        const Cesium = await import("cesium");
        cesiumRef.current = Cesium;

        // Set Cesium base URL
        (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = "/cesium";

        // Load CSS dynamically
        if (!document.getElementById("cesium-css")) {
          const link = document.createElement("link");
          link.id = "cesium-css";
          link.rel = "stylesheet";
          link.href = "/cesium/Widgets/widgets.css";
          document.head.appendChild(link);
        }

        if (!mounted) return;

        // Create viewer
        const viewer = new Cesium.Viewer(containerRef.current, {
          terrain: Cesium.Terrain.fromWorldTerrain(),
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

      {/* Target Selection Panel */}
      {!isLoading && !error && (
        <div className="absolute top-4 right-4 z-20">
          <TargetSelector
            entities={entities}
            selectedEntityId={selectedEntityId}
            boundingInfo={boundingInfo}
            onSelectEntity={handleSelectEntity}
          />
        </div>
      )}
    </div>
  );
}
