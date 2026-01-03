"use client";

import { useState, useRef } from "react";
import {
  Box,
  Text,
  Stack,
  Group,
  Loader,
  Alert,
} from "@mantine/core";
import { IconUpload, IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { uploadKmlFile, type FileInfo } from "@/client/api/filesClient";

interface Props {
  onUploadSuccess: (file: FileInfo) => void;
}

export function KmlUploadForm({ onUploadSuccess }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (ext !== ".kml" && ext !== ".kmz") {
      setError("Sadece .kml ve .kmz dosyaları kabul edilir");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadSuccess(false);

    try {
      const result = await uploadKmlFile(file);
      onUploadSuccess(result.file);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme başarısız");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <Stack gap="sm">
      <Box
        style={{
          border: `2px dashed ${
            dragActive
              ? "var(--mantine-color-teal-5)"
              : uploadSuccess
              ? "var(--mantine-color-green-5)"
              : "var(--mantine-color-gray-3)"
          }`,
          borderRadius: "var(--mantine-radius-lg)",
          padding: "var(--mantine-spacing-xl)",
          textAlign: "center",
          cursor: isUploading ? "default" : "pointer",
          transition: "all 0.2s ease",
          background: dragActive
            ? "var(--mantine-color-teal-0)"
            : uploadSuccess
            ? "var(--mantine-color-green-0)"
            : "var(--mantine-color-gray-0)",
          opacity: isUploading ? 0.6 : 1,
          pointerEvents: isUploading ? "none" : "auto",
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".kml,.kmz"
          onChange={handleChange}
          style={{ display: "none" }}
          disabled={isUploading}
        />

        {isUploading ? (
          <Stack align="center" gap="sm">
            <Loader size="md" color="teal" />
            <Text fz="sm" c="dark.5">
              Yükleniyor...
            </Text>
          </Stack>
        ) : uploadSuccess ? (
          <Stack align="center" gap="sm">
            <Box
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "var(--mantine-color-green-1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconCheck size={24} color="var(--mantine-color-green-6)" />
            </Box>
            <Text fz="sm" c="green.7" fw={500}>
              Dosya başarıyla yüklendi!
            </Text>
          </Stack>
        ) : (
          <Stack align="center" gap="sm">
            <Box
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: dragActive
                  ? "var(--mantine-color-teal-1)"
                  : "var(--mantine-color-gray-1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s ease",
              }}
            >
              <IconUpload
                size={24}
                color={
                  dragActive
                    ? "var(--mantine-color-teal-6)"
                    : "var(--mantine-color-gray-5)"
                }
              />
            </Box>
            <div>
              <Text fz="sm" c="dark.6" fw={500}>
                KML/KMZ dosyasını buraya sürükle veya tıkla
              </Text>
              <Text fz="xs" c="dimmed" mt={4}>
                Maksimum 20MB
              </Text>
            </div>
          </Stack>
        )}
      </Box>

      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="red"
          variant="light"
          radius="md"
        >
          {error}
        </Alert>
      )}
    </Stack>
  );
}
