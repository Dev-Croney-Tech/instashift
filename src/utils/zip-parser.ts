import JSZip from "jszip";

export interface ExtractedFile {
  name: string;
  content: string;
  format: "json" | "html";
}

export interface ExtractedData {
  followersFiles: ExtractedFile[];
  followingFiles: ExtractedFile[];
  totalFilesCount: number;
  fileSizeKb: number;
}

const FOLLOWERS_PATTERN = /(?:^|\/)(followers(?:_\d+)?)\.(json|html)$/i;
const FOLLOWING_PATTERN = /(?:^|\/)(following(?:_\d+)?)\.(json|html)$/i;

/**
 * Lit une archive ZIP d'export Instagram à la volée et extrait
 * tous les fichiers contenant les abonnés et les abonnements, triés par nom.
 */
export async function extractInstaFiles(zipFile: File): Promise<ExtractedData> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(zipFile);

  const followersFiles: ExtractedFile[] = [];
  const followingFiles: ExtractedFile[] = [];

  const filePaths = Object.keys(loadedZip.files).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  for (const relativePath of filePaths) {
    const file = loadedZip.files[relativePath];
    if (file.dir) continue;

    const normalizedPath = relativePath.replace(/\\/g, "/");
    const fileName = normalizedPath.split("/").pop()?.toLowerCase() || "";

    if (FOLLOWERS_PATTERN.test(normalizedPath)) {
      const content = await file.async("text");
      const format = fileName.endsWith(".html") ? ("html" as const) : ("json" as const);
      followersFiles.push({ name: normalizedPath, content, format });
    } else if (FOLLOWING_PATTERN.test(normalizedPath) && !fileName.includes("followers")) {
      const content = await file.async("text");
      const format = fileName.endsWith(".html") ? ("html" as const) : ("json" as const);
      followingFiles.push({ name: normalizedPath, content, format });
    }
  }

  return {
    followersFiles,
    followingFiles,
    totalFilesCount: followersFiles.length + followingFiles.length,
    fileSizeKb: Math.round((zipFile.size / 1024) * 10) / 10,
  };
}

/**
 * Lit une sélection directe de fichiers individuels (.json ou .html) décompressés.
 */
export async function extractLooseInstaFiles(files: FileList | File[]): Promise<ExtractedData> {
  const fileArray = Array.from(files).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true })
  );

  const followersFiles: ExtractedFile[] = [];
  const followingFiles: ExtractedFile[] = [];
  let totalBytes = 0;

  for (const file of fileArray) {
    totalBytes += file.size;
    const lowerName = file.name.toLowerCase();
    const isHtml = lowerName.endsWith(".html") || lowerName.endsWith(".htm");
    const isJson = lowerName.endsWith(".json");

    if (!isHtml && !isJson) continue;

    const format = isHtml ? ("html" as const) : ("json" as const);
    const content = await file.text();

    if (lowerName.includes("followers")) {
      followersFiles.push({ name: file.name, content, format });
    } else if (lowerName.includes("following")) {
      followingFiles.push({ name: file.name, content, format });
    }
  }

  return {
    followersFiles,
    followingFiles,
    totalFilesCount: followersFiles.length + followingFiles.length,
    fileSizeKb: Math.round((totalBytes / 1024) * 10) / 10,
  };
}
