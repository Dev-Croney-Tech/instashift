import { InstagramUser } from "./insta-parser";

export interface SavedSnapshot {
  id: string;
  date: string; // Date ISO de création
  label: string;
  followersCount: number;
  followingCount: number;
  followers: InstagramUser[];
  following: InstagramUser[];
}

const DB_NAME = "InstaShiftDB";
const STORE_NAME = "snapshots";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("IndexedDB n'est disponible que côté client"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export async function saveSnapshot(snapshot: SavedSnapshot): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(snapshot);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getAllSnapshots(): Promise<SavedSnapshot[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const results = (request.result as SavedSnapshot[]) || [];
      results.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      resolve(results);
    };
  });
}

export async function deleteSnapshot(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function clearAllSnapshots(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getSnapshot(id: string): Promise<SavedSnapshot | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

/**
 * Calcule la taille approximative en Ko occupée par les snapshots en mémoire/IndexedDB.
 */
export function estimateSnapshotsSizeKb(snapshots: SavedSnapshot[]): number {
  if (!snapshots || snapshots.length === 0) return 0;
  try {
    const serialized = JSON.stringify(snapshots);
    return Math.round((new Blob([serialized]).size / 1024) * 10) / 10;
  } catch {
    return 0;
  }
}

/**
 * Importe un tableau de snapshots depuis un fichier JSON exporté.
 */
export async function importSnapshotsFromJson(jsonText: string): Promise<number> {
  const parsed = JSON.parse(jsonText);
  const list: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
  let importedCount = 0;

  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Partial<SavedSnapshot>;
    if (
      typeof candidate.id === "string" &&
      typeof candidate.label === "string" &&
      Array.isArray(candidate.followers) &&
      Array.isArray(candidate.following)
    ) {
      await saveSnapshot({
        id: candidate.id,
        date: candidate.date || new Date().toISOString(),
        label: candidate.label,
        followersCount: candidate.followers.length,
        followingCount: candidate.following.length,
        followers: candidate.followers,
        following: candidate.following,
      });
      importedCount++;
    }
  }

  return importedCount;
}
