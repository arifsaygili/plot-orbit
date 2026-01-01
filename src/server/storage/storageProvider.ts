import { Readable } from "stream";

export interface SaveResult {
  storageKey: string;
  size: number;
  mime: string;
}

export interface StorageProvider {
  save(
    buffer: Buffer,
    options: { tenantId: string; fileId: string; mime: string }
  ): Promise<SaveResult>;

  getStream(storageKey: string): Promise<Readable>;

  delete(storageKey: string): Promise<void>;

  exists(storageKey: string): Promise<boolean>;
}
