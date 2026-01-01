"use client";

import type { EntityInfo, BoundingInfo } from "@/lib/cesium";

interface Props {
  entities: EntityInfo[];
  selectedEntityId: string | null;
  boundingInfo: BoundingInfo | null;
  onSelectEntity: (entityId: string) => void;
}

export function TargetSelector({
  entities,
  selectedEntityId,
  boundingInfo,
  onSelectEntity,
}: Props) {
  const formatCoord = (value: number, decimals = 6) =>
    value.toFixed(decimals);

  const formatRadius = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters.toFixed(0)} m`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 w-80">
      <h3 className="font-semibold text-gray-900 mb-3">Target Selection</h3>

      {/* Entity List */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Area ({entities.length} found)
        </label>
        <div className="max-h-48 overflow-y-auto border rounded-lg">
          {entities.length === 0 ? (
            <p className="p-3 text-sm text-gray-500 text-center">
              No selectable areas found
            </p>
          ) : (
            entities.map((entity) => (
              <button
                key={entity.id}
                onClick={() => onSelectEntity(entity.id)}
                className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-50 border-b last:border-b-0 ${
                  selectedEntityId === entity.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700"
                }`}
              >
                <span className="truncate">{entity.name}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    entity.type === "polygon"
                      ? "bg-green-100 text-green-700"
                      : entity.type === "polyline"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {entity.type}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Bounding Info */}
      {boundingInfo ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Center
            </label>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 rounded px-2 py-1">
                <span className="text-gray-500">Lat:</span>{" "}
                <span className="font-mono">
                  {formatCoord(boundingInfo.center.latitude)}
                </span>
              </div>
              <div className="bg-gray-50 rounded px-2 py-1">
                <span className="text-gray-500">Lng:</span>{" "}
                <span className="font-mono">
                  {formatCoord(boundingInfo.center.longitude)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Bounding Box
            </label>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 rounded px-2 py-1">
                <span className="text-gray-500">W:</span>{" "}
                <span className="font-mono">
                  {formatCoord(boundingInfo.bbox.west)}
                </span>
              </div>
              <div className="bg-gray-50 rounded px-2 py-1">
                <span className="text-gray-500">E:</span>{" "}
                <span className="font-mono">
                  {formatCoord(boundingInfo.bbox.east)}
                </span>
              </div>
              <div className="bg-gray-50 rounded px-2 py-1">
                <span className="text-gray-500">S:</span>{" "}
                <span className="font-mono">
                  {formatCoord(boundingInfo.bbox.south)}
                </span>
              </div>
              <div className="bg-gray-50 rounded px-2 py-1">
                <span className="text-gray-500">N:</span>{" "}
                <span className="font-mono">
                  {formatCoord(boundingInfo.bbox.north)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Suggested Orbit Radius
            </label>
            <div className="bg-blue-50 text-blue-700 rounded px-3 py-2 text-center font-semibold">
              {formatRadius(boundingInfo.radius)}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500 text-center py-4">
          Select an area to see bounding info
        </div>
      )}
    </div>
  );
}
