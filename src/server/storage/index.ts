export type { StorageProvider, SaveResult } from "./storageProvider";
export { LocalStorageProvider, localStorageProvider } from "./localStorageProvider";

// Use local storage provider by default
// In production, this can be swapped with S3StorageProvider
import { localStorageProvider } from "./localStorageProvider";
export const storageProvider = localStorageProvider;
