import type { Viewer, ImageryLayer } from "cesium";
import { isIonAvailable } from "./config";

export type ImageryPreset = "satellite" | "roadmap";

let currentImageryLayer: ImageryLayer | null = null;

/**
 * Set imagery preset
 */
export async function setImageryPreset(
  viewer: Viewer,
  preset: ImageryPreset,
  Cesium: typeof import("cesium")
): Promise<void> {
  try {
    // Remove current imagery layers (keep base if needed)
    const layers = viewer.imageryLayers;

    // Remove all layers
    layers.removeAll();

    let imageryProvider;

    switch (preset) {
      case "satellite":
        if (isIonAvailable()) {
          // Use Ion's Bing Maps Aerial
          imageryProvider = await Cesium.IonImageryProvider.fromAssetId(2);
        } else {
          // Fallback to OpenStreetMap
          imageryProvider = new Cesium.OpenStreetMapImageryProvider({
            url: "https://tile.openstreetmap.org/",
          });
        }
        break;

      case "roadmap":
        // OpenStreetMap for roadmap
        imageryProvider = new Cesium.OpenStreetMapImageryProvider({
          url: "https://tile.openstreetmap.org/",
        });
        break;

      default:
        // Default satellite
        if (isIonAvailable()) {
          imageryProvider = await Cesium.IonImageryProvider.fromAssetId(2);
        } else {
          imageryProvider = new Cesium.OpenStreetMapImageryProvider({
            url: "https://tile.openstreetmap.org/",
          });
        }
    }

    currentImageryLayer = layers.addImageryProvider(imageryProvider);
    console.info(`[Imagery] Set preset to: ${preset}`);
  } catch (err) {
    console.error("[Imagery] Failed to set preset:", err);

    // Fallback to basic imagery
    try {
      const fallback = new Cesium.OpenStreetMapImageryProvider({
        url: "https://tile.openstreetmap.org/",
      });
      viewer.imageryLayers.addImageryProvider(fallback);
    } catch {
      // Ignore fallback errors
    }
  }
}

/**
 * Get current imagery preset name
 */
export function getCurrentImageryPreset(): ImageryPreset {
  return "satellite"; // Default
}
