import { Readable } from "stream";
import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import type { StorageProvider, SaveResult } from "./storageProvider";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export class LocalStorageProvider implements StorageProvider {
  async save(
    buffer: Buffer,
    options: { tenantId: string; fileId: string; mime: string }
  ): Promise<SaveResult> {
    const { tenantId, fileId, mime } = options;

    // Create tenant directory if needed
    const tenantDir = path.join(UPLOADS_DIR, tenantId);
    await fs.mkdir(tenantDir, { recursive: true });

    // Determine extension from mime
    const ext = mime === "application/vnd.google-earth.kmz" ? "kmz" : "kml";
    const fileName = `${fileId}.${ext}`;
    const filePath = path.join(tenantDir, fileName);

    // Write file
    await fs.writeFile(filePath, buffer);

    // Storage key is relative path from uploads dir
    const storageKey = `${tenantId}/${fileName}`;

    return {
      storageKey,
      size: buffer.length,
      mime,
    };
  }

  async getStream(storageKey: string): Promise<Readable> {
    const filePath = path.join(UPLOADS_DIR, storageKey);

    // Check if file exists
    const exists = await this.exists(storageKey);
    if (!exists) {
      throw new Error(`File not found: ${storageKey}`);
    }

    return fsSync.createReadStream(filePath);
  }

  async delete(storageKey: string): Promise<void> {
    const filePath = path.join(UPLOADS_DIR, storageKey);
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  async exists(storageKey: string): Promise<boolean> {
    const filePath = path.join(UPLOADS_DIR, storageKey);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const localStorageProvider = new LocalStorageProvider();
