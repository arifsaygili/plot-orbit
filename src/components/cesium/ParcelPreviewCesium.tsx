"use client";

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import type { ParcelResult } from "@/client/api/parcelClient";

function loadCesiumCSS() {
  if (document.getElementById("cesium-css")) return;
  const link = document.createElement("link");
  link.id = "cesium-css";
  link.rel = "stylesheet";
  link.href = "/cesium/Widgets/widgets.css";
  document.head.appendChild(link);
}

export interface ParcelPreviewCesiumRef {
  showParcel: (parcel: ParcelResult) => Promise<void>;
  clearParcels: () => void;
}

interface ParcelPreviewCesiumProps {
  className?: string;
  onReady?: () => void;
  onError?: (error: string) => void;
}

const ParcelPreviewCesium = forwardRef<ParcelPreviewCesiumRef, ParcelPreviewCesiumProps>(
  function ParcelPreviewCesium({ className = "", onReady, onError }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<import("cesium").Viewer | null>(null);
    const cesiumRef = useRef<typeof import("cesium") | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize Cesium
    useEffect(() => {
      if (!containerRef.current || viewerRef.current) return;

      let isMounted = true;

      async function initCesium() {
        try {
          loadCesiumCSS();
          window.CESIUM_BASE_URL = "/cesium";

          const Cesium = await import("cesium");
          cesiumRef.current = Cesium;

          if (!isMounted || !containerRef.current) return;

          const viewer = new Cesium.Viewer(containerRef.current, {
            animation: false,
            baseLayerPicker: false,
            fullscreenButton: false,
            vrButton: false,
            geocoder: false,
            homeButton: false,
            infoBox: true,
            sceneModePicker: false,
            selectionIndicator: true,
            timeline: false,
            navigationHelpButton: false,
            creditContainer: document.createElement("div"),
            terrain: Cesium.Terrain.fromWorldTerrain(),
          });

          // Set default camera to Turkey
          viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(35.0, 39.0, 2000000),
          });

          viewerRef.current = viewer;
          setIsLoading(false);
          onReady?.();
        } catch (err) {
          console.error("Failed to initialize Cesium:", err);
          const errorMsg = err instanceof Error ? err.message : "Failed to load Cesium";
          setError(errorMsg);
          setIsLoading(false);
          onError?.(errorMsg);
        }
      }

      initCesium();

      return () => {
        isMounted = false;
        if (viewerRef.current) {
          viewerRef.current.destroy();
          viewerRef.current = null;
        }
      };
    }, [onReady, onError]);

    // Show parcel on map
    const showParcel = useCallback(async (parcel: ParcelResult) => {
      if (!viewerRef.current || !cesiumRef.current) {
        throw new Error("Cesium viewer not ready");
      }

      const { showParcel: showParcelLayer } = await import("./ParcelLayer");
      await showParcelLayer(cesiumRef.current, viewerRef.current, parcel, {
        clearPrevious: true,
        flyDuration: 2,
      });
    }, []);

    // Clear all parcels
    const clearParcels = useCallback(() => {
      if (!viewerRef.current) return;
      
      import("./ParcelLayer").then(({ clearParcelLayers }) => {
        if (viewerRef.current) {
          clearParcelLayers(viewerRef.current);
        }
      });
    }, []);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      showParcel,
      clearParcels,
    }), [showParcel, clearParcels]);

    if (error) {
      return (
        <div className={`flex items-center justify-center bg-zinc-900 ${className}`}>
          <div className="text-center text-red-500">
            <p className="text-xl font-bold">Error loading map</p>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900">
            <p className="text-xl text-white">Loading map...</p>
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>
    );
  }
);

export default ParcelPreviewCesium;
