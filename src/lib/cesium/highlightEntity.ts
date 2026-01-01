import type { Entity, Color, Property } from "cesium";

interface OriginalStyle {
  polygonMaterial?: Property | undefined;
  polygonOutlineColor?: Property | undefined;
  polygonOutlineWidth?: Property | undefined;
  polylineMaterial?: Property | undefined;
  polylineWidth?: Property | undefined;
}

const originalStyles = new WeakMap<Entity, OriginalStyle>();

/**
 * Highlight an entity with a distinctive style
 */
export function highlightEntity(
  entity: Entity,
  Cesium: typeof import("cesium")
): void {
  // Save original style
  const original: OriginalStyle = {};

  if (entity.polygon) {
    original.polygonMaterial = entity.polygon.material;
    original.polygonOutlineColor = entity.polygon.outlineColor;
    original.polygonOutlineWidth = entity.polygon.outlineWidth;

    // Apply highlight style using ColorMaterialProperty
    entity.polygon.material = new Cesium.ColorMaterialProperty(
      Cesium.Color.YELLOW.withAlpha(0.4)
    );
    entity.polygon.outline = new Cesium.ConstantProperty(true);
    entity.polygon.outlineColor = new Cesium.ConstantProperty(Cesium.Color.YELLOW);
    entity.polygon.outlineWidth = new Cesium.ConstantProperty(3);
  }

  if (entity.polyline) {
    original.polylineMaterial = entity.polyline.material;
    original.polylineWidth = entity.polyline.width;

    // Apply highlight style
    entity.polyline.material = new Cesium.ColorMaterialProperty(
      Cesium.Color.YELLOW
    );
    entity.polyline.width = new Cesium.ConstantProperty(4);
  }

  originalStyles.set(entity, original);
}

/**
 * Remove highlight from an entity, restoring original style
 */
export function unhighlightEntity(
  entity: Entity,
  Cesium: typeof import("cesium")
): void {
  const original = originalStyles.get(entity);
  if (!original) return;

  if (entity.polygon) {
    if (original.polygonMaterial !== undefined) {
      entity.polygon.material = original.polygonMaterial as typeof entity.polygon.material;
    }
    if (original.polygonOutlineColor !== undefined) {
      entity.polygon.outlineColor = original.polygonOutlineColor as typeof entity.polygon.outlineColor;
    }
    if (original.polygonOutlineWidth !== undefined) {
      entity.polygon.outlineWidth = original.polygonOutlineWidth as typeof entity.polygon.outlineWidth;
    }
  }

  if (entity.polyline) {
    if (original.polylineMaterial !== undefined) {
      entity.polyline.material = original.polylineMaterial as typeof entity.polyline.material;
    }
    if (original.polylineWidth !== undefined) {
      entity.polyline.width = original.polylineWidth as typeof entity.polyline.width;
    }
  }

  originalStyles.delete(entity);
}
