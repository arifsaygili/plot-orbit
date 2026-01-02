import type { Viewer, TerrainProvider } from "cesium";
import { isIonAvailable } from "./config";

let currentTerrainProvider: TerrainProvider | null = null;

/**
 * Enable world terrain from Cesium Ion
 */
export async function enableTerrain(
  viewer: Viewer,
  Cesium: typeof import("cesium")
): Promise<boolean> {
  if (!isIonAvailable()) {
    console.warn("[Terrain] Ion token not available, terrain disabled");
    return false;
  }

  try {
    const terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(1, {
      requestVertexNormals: true,
      requestWaterMask: true,
    });

    viewer.terrainProvider = terrainProvider;
    currentTerrainProvider = terrainProvider;

    // Configure camera collision
    viewer.scene.globe.depthTestAgainstTerrain = true;
    viewer.scene.screenSpaceCameraController.enableCollisionDetection = true;

    console.info("[Terrain] World terrain enabled");
    return true;
  } catch (err) {
    console.error("[Terrain] Failed to enable terrain:", err);
    return false;
  }
}

/**
 * Disable terrain (revert to ellipsoid)
 */
export async function disableTerrain(
  viewer: Viewer,
  Cesium: typeof import("cesium")
): Promise<void> {
  try {
    viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
    viewer.scene.globe.depthTestAgainstTerrain = false;
    currentTerrainProvider = null;
    console.info("[Terrain] Terrain disabled");
  } catch (err) {
    console.error("[Terrain] Failed to disable terrain:", err);
  }
}

/**
 * Configure camera limits to prevent going underground
 */
export function configureCameraLimits(
  viewer: Viewer,
  Cesium: typeof import("cesium")
): void {
  const controller = viewer.scene.screenSpaceCameraController;

  // Minimum zoom distance (don't go too close to ground)
  controller.minimumZoomDistance = 10; // 10 meters

  // Maximum zoom distance
  controller.maximumZoomDistance = 50000000; // 50,000 km

  // Tilt range for better control
  controller.minimumCollisionTerrainHeight = 15000; // Below this height, check terrain collision

  // Enable collision detection
  controller.enableCollisionDetection = true;
}

/**
 * Check if terrain is currently enabled
 */
export function isTerrainEnabled(): boolean {
  return currentTerrainProvider !== null;
}
