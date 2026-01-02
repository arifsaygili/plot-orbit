import type { Viewer, Cesium3DTileset } from "cesium";
import { isIonAvailable } from "./config";

let currentBuildingsTileset: Cesium3DTileset | null = null;

/**
 * Enable 3D buildings (OSM Buildings from Cesium Ion)
 */
export async function enableBuildings(
  viewer: Viewer,
  Cesium: typeof import("cesium")
): Promise<boolean> {
  if (!isIonAvailable()) {
    console.warn("[Buildings] Ion token not available, buildings disabled");
    return false;
  }

  // Remove existing buildings if any
  if (currentBuildingsTileset) {
    viewer.scene.primitives.remove(currentBuildingsTileset);
    currentBuildingsTileset = null;
  }

  try {
    // Cesium OSM Buildings asset ID
    const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(96188);

    viewer.scene.primitives.add(tileset);
    currentBuildingsTileset = tileset;

    console.info("[Buildings] 3D buildings enabled");
    return true;
  } catch (err) {
    console.error("[Buildings] Failed to enable buildings:", err);
    return false;
  }
}

/**
 * Disable 3D buildings
 */
export function disableBuildings(viewer: Viewer): void {
  if (currentBuildingsTileset) {
    viewer.scene.primitives.remove(currentBuildingsTileset);
    currentBuildingsTileset = null;
    console.info("[Buildings] 3D buildings disabled");
  }
}

/**
 * Check if buildings are currently enabled
 */
export function areBuildingsEnabled(): boolean {
  return currentBuildingsTileset !== null;
}
