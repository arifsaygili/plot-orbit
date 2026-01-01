"use client";

import { useEffect, useRef, useState } from "react";

function loadCesiumCSS() {
  if (document.getElementById("cesium-css")) return;
  const link = document.createElement("link");
  link.id = "cesium-css";
  link.rel = "stylesheet";
  link.href = "/cesium/Widgets/widgets.css";
  document.head.appendChild(link);
}

export default function CesiumViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    let isMounted = true;

    async function initCesium() {
      try {
        // Load Cesium CSS
        loadCesiumCSS();

        // Set CESIUM_BASE_URL before importing Cesium
        window.CESIUM_BASE_URL = "/cesium";

        // Dynamic import to avoid SSR issues
        const Cesium = await import("cesium");

        if (!isMounted || !containerRef.current) return;

        // Create viewer
        const viewer = new Cesium.Viewer(containerRef.current, {
          animation: false,
          baseLayerPicker: false,
          fullscreenButton: false,
          vrButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          navigationHelpButton: false,
          creditContainer: document.createElement("div"),
        });

        viewerRef.current = viewer;
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to initialize Cesium:", err);
        setError(err instanceof Error ? err.message : "Failed to load Cesium");
        setIsLoading(false);
      }
    }

    initCesium();

    return () => {
      isMounted = false;
      if (viewerRef.current) {
        (viewerRef.current as { destroy: () => void }).destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-900">
        <div className="text-center text-red-500">
          <p className="text-xl font-bold">Error loading Cesium</p>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900">
          <p className="text-xl text-white">Loading Cesium...</p>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
