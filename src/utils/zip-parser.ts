import JSZip from "jszip";

export interface ExtractedFile {
  name: string;
  content: string;
  format: "json" | "html";
}

export interface ExtractedData {
  followersFiles: ExtractedFile[];
  followingFiles: ExtractedFile[];
}

// Patterns pour détecter les fichiers d'abonnés et d'abonnements
// On matche les noms de fichiers uniquement (pas les dossiers)
const FOLLOWERS_PATTERN = /\/?(followers(_\d+)?)\.(json|html)$/i;
const FOLLOWING_PATTERN = /\/?(following(_\d+)?)\.(json|html)$/i;

/**
 * Lit une archive ZIP d'export Instagram à la volée et extrait
 * automatiquement TOUS les fichiers contenant les abonnés et les abonnements.
 * Gère les exports fragmentés (followers_1.json, followers_2.json, following_1.json, etc.)
 */
export async function extractInstaFiles(zipFile: File): Promise<ExtractedData> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(zipFile);

  const followersFiles: ExtractedFile[] = [];
  const followingFiles: ExtractedFile[] = [];

  for (const relativePath in loadedZip.files) {
    const file = loadedZip.files[relativePath];
    if (file.dir) continue;

    // Extraire uniquement le nom du fichier (pas le chemin complet)
    const fileName = relativePath.split("/").pop()?.toLowerCase() || "";

    // Vérifier si c'est un fichier de followers
    if (FOLLOWERS_PATTERN.test(relativePath)) {
      const content = await file.async("text");
      const format = fileName.endsWith(".html") ? "html" as const : "json" as const;
      followersFiles.push({ name: relativePath, content, format });
    }

    // Vérifier si c'est un fichier de following
    // IMPORTANT: ne pas matcher "followers_and_following" (c'est un dossier)
    if (FOLLOWING_PATTERN.test(relativePath) && !fileName.includes("followers")) {
      const content = await file.async("text");
      const format = fileName.endsWith(".html") ? "html" as const : "json" as const;
      followingFiles.push({ name: relativePath, content, format });
    }
  }

  return { followersFiles, followingFiles };
}
