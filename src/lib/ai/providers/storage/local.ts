import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { StorageProvider } from "@/lib/ai/ports";

function root() {
  return path.resolve(process.env.STORAGE_DIR ?? "./data");
}

export const localStorageProvider: StorageProvider = {
  status: () => ({
    id: "local-storage",
    kind: "storage",
    label: "Local disk storage",
    configured: true,
    notes: "S3-shaped port. Swap the adapter to move objects to object storage later.",
  }),
  async save(relPath, bytes) {
    const full = path.join(root(), relPath);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, bytes);
    return relPath;
  },
  resolve(relPath) {
    return path.join(root(), relPath);
  },
};
