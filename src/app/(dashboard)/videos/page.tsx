import { VideoList } from "@/components/videos";

export default function VideosPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Video Gallery</h1>
        <p className="text-gray-600 mt-1">
          Manage and download your recorded videos
        </p>
      </div>

      <VideoList />
    </div>
  );
}
