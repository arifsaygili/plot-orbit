import { prisma } from "@/lib/prisma";
import { storageProvider } from "@/server/storage";
import { FileType } from "@prisma/client";
import { Readable } from "stream";

export interface CreateFileInput {
  tenantId: string;
  userId: string;
  buffer: Buffer;
  originalName: string;
  name?: string;
  type: FileType;
  mime: string;
}

export interface FileInfo {
  id: string;
  type: FileType;
  name: string;
  originalName: string;
  size: number;
  createdAt: Date;
}

export async function createFile(input: CreateFileInput): Promise<FileInfo> {
  const { tenantId, userId, buffer, originalName, name, type, mime } = input;

  // Generate file ID first
  const fileId = crypto.randomUUID();

  // Save to storage
  const saveResult = await storageProvider.save(buffer, {
    tenantId,
    fileId,
    mime,
  });

  // Create DB record
  const file = await prisma.file.create({
    data: {
      id: fileId,
      tenantId,
      createdByUserId: userId,
      type,
      name: name || originalName,
      originalName,
      mime,
      size: saveResult.size,
      storageKey: saveResult.storageKey,
    },
  });

  return {
    id: file.id,
    type: file.type,
    name: file.name,
    originalName: file.originalName,
    size: file.size,
    createdAt: file.createdAt,
  };
}

export async function listFiles(
  tenantId: string,
  options?: { type?: FileType }
): Promise<FileInfo[]> {
  const files = await prisma.file.findMany({
    where: {
      tenantId,
      ...(options?.type && { type: options.type }),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      name: true,
      originalName: true,
      size: true,
      createdAt: true,
    },
  });

  return files;
}

export async function getFileById(
  fileId: string,
  tenantId: string
): Promise<{
  id: string;
  name: string;
  originalName: string;
  mime: string;
  size: number;
  storageKey: string;
} | null> {
  const file = await prisma.file.findFirst({
    where: {
      id: fileId,
      tenantId, // Tenant isolation
    },
    select: {
      id: true,
      name: true,
      originalName: true,
      mime: true,
      size: true,
      storageKey: true,
    },
  });

  return file;
}

export async function getFileStream(storageKey: string): Promise<Readable> {
  return storageProvider.getStream(storageKey);
}

export async function deleteFile(fileId: string, tenantId: string): Promise<boolean> {
  const file = await prisma.file.findFirst({
    where: { id: fileId, tenantId },
  });

  if (!file) {
    return false;
  }

  // Delete from storage
  await storageProvider.delete(file.storageKey);

  // Delete from DB
  await prisma.file.delete({
    where: { id: fileId },
  });

  return true;
}
