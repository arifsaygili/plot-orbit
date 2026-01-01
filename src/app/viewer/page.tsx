"use client";

import dynamic from "next/dynamic";

const CesiumViewer = dynamic(() => import("@/components/CesiumViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-900">
      <p className="text-xl text-white">Loading Cesium...</p>
    </div>
  ),
});

export default function ViewerPage() {
  return <CesiumViewer />;
}
