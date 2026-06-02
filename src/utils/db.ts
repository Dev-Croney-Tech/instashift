import { InstagramUser } from "./insta-parser";

export interface SavedSnapshot {
  id: string; // Identifiant unique (ex: timestamp de création)
  date: string; // Date ISO de création
  label: string; // Nom donné par l'utilisateur (ex: "Fin Mai 2026")
  followersCount: number;
  followingCount: number;
  followers: InstagramUser[];
  following: InstagramUser[];
}

const DB_NAME = "InstaShiftDB";
const STORE_NAME = "snapshots";
const DB_VERSION = 1;

/**
 * Ouvre la connexion à la base de données IndexedDB.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject("IndexedDB n'est disponible que côté client");
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

/**
 * Enregistre un instantané dans la base locale.
 */
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

/**
 * Récupère tous les instantanés sauvegardés, triés par date décroissante.
 */
export async function getAllSnapshots(): Promise<SavedSnapshot[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const results = request.result as SavedSnapshot[];
      // Trier du plus récent au plus ancien
      results.sort((a, b) => b.id.localeCompare(a.id));
      resolve(results);
    };
  });
}

/**
 * Supprime un instantané spécifique de la base locale.
 */
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

/**
 * Récupère un instantané par son ID.
 */
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
