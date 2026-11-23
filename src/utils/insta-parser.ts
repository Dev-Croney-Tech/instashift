export interface InstagramUser {
  username: string;
  timestamp: number; // en secondes Unix (0 si inconnu)
  url: string;
}

const INSTAGRAM_USERNAME_REGEX = /^[a-zA-Z0-9._]{1,30}$/;

/**
 * Décode le Mojibake UTF-8 généré par les exports JSON de Meta/Instagram
 * (ex: "\u00c3\u00a9" -> "é") lorsque des séquences d'octets UTF-8 ont été sérialisées en Latin-1.
 */
export function decodeMetaMojibake(str: string): string {
  if (!str) return "";
  try {
    // Vérifie si la chaîne contient des caractères dans la plage Latin-1 typique du Mojibake (0x80 - 0xFF)
    if (/[\u0080-\u00ff]/.test(str)) {
      const bytes = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code > 0xff) return str; // Déjà de l'Unicode valide au-delà de Latin-1
        bytes[i] = code;
      }
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    }
  } catch {
    // En cas d'échec, retourne la chaîne originale intacte
  }
  return str;
}

/**
 * Vérifie qu'un identifiant correspond strictement à un pseudonyme Instagram valide
 * et n'est pas un segment réservé d'URL Instagram.
 */
export function isValidInstagramUsername(username: string): boolean {
  if (!username) return false;
  const reserved = new Set([
    "instagram",
    "explore",
    "accounts",
    "about",
    "legal",
    "privacy",
    "help",
    "direct",
    "stories",
    "reels",
    "p",
    "tv",
    "_u",
    "_",
  ]);
  if (reserved.has(username.toLowerCase())) return false;
  return INSTAGRAM_USERNAME_REGEX.test(username);
}

/**
 * Nettoie et extrait un nom d'utilisateur Instagram à partir de son texte et de son lien.
 */
export function extractInstagramUsername(usernameStr: string, hrefStr: string): string {
  let candidate = decodeMetaMojibake(usernameStr).trim();

  if (
    !candidate ||
    candidate.includes("instagram.com") ||
    candidate.includes("/") ||
    candidate.startsWith("http")
  ) {
    candidate = decodeMetaMojibake(hrefStr).trim();
  }

  if (candidate) {
    if (
      candidate.includes("instagram.com") ||
      candidate.startsWith("http://") ||
      candidate.startsWith("https://") ||
      candidate.includes("/")
    ) {
      let path = candidate.replace(/^https?:\/\//i, "");
      path = path.replace(/^www\./i, "");
      path = path.replace(/^instagram\.com\//i, "");
      path = path.replace(/^\//, "");

      const segments = path.split("/").filter(Boolean);

      if ((segments[0] === "_" || segments[0] === "_u") && segments.length > 1) {
        candidate = segments[1];
      } else if (segments.length > 0) {
        candidate = segments[0];
      }

      candidate = candidate.split("?")[0].split("#")[0];
    }
  }

  if (candidate.startsWith("@")) {
    candidate = candidate.substring(1);
  }

  return candidate.trim();
}

/**
 * Parse un fichier JSON d'abonnés ou d'abonnements Instagram.
 * Gère de manière résiliente les variantes de schémas Meta (string_list_data, title, etc.).
 */
export function parseInstagramJSON(jsonContent: string): InstagramUser[] {
  try {
    const parsed = JSON.parse(jsonContent);
    const users: InstagramUser[] = [];

    function searchForUsers(obj: unknown): void {
      if (!obj || typeof obj !== "object") return;

      if (Array.isArray(obj)) {
        for (const item of obj) {
          searchForUsers(item);
        }
        return;
      }

      const record = obj as Record<string, unknown>;

      if (Array.isArray(record.string_list_data) && record.string_list_data.length > 0) {
        const firstEntry = record.string_list_data[0] as Record<string, unknown> | undefined;
        if (firstEntry && typeof firstEntry === "object") {
          const rawValue = typeof firstEntry.value === "string" ? firstEntry.value : "";
          const rawTitle = typeof record.title === "string" ? record.title : "";
          const rawHref = typeof firstEntry.href === "string" ? firstEntry.href : "";

          const username = extractInstagramUsername(rawValue || rawTitle, rawHref);
          if (isValidInstagramUsername(username)) {
            const rawTs = firstEntry.timestamp;
            const timestamp =
              typeof rawTs === "number" && Number.isFinite(rawTs) && rawTs > 0
                ? Math.floor(rawTs)
                : 0;

            users.push({
              username,
              timestamp,
              url: `https://www.instagram.com/${username}`,
            });
          }
        }
        return;
      }

      for (const key of Object.keys(record)) {
        searchForUsers(record[key]);
      }
    }

    searchForUsers(parsed);

    const seen = new Set<string>();
    return users.filter((u) => {
      const lower = u.username.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });
  } catch (error) {
    console.error("Erreur de parsing JSON Instagram:", error);
    return [];
  }
}

/**
 * Traduit une date d'export HTML Instagram (en français ou anglais, ex: "juin 01, 2026 10:19 pm"
 * ou "fév 27, 2026") en timestamp Unix en secondes. Retourne 0 si la date est invalide.
 */
export function parseExportDate(dateStr: string): number {
  if (!dateStr) return 0;
  let cleaned = decodeMetaMojibake(dateStr).toLowerCase().trim();

  const monthMap: Record<string, string> = {
    "janvier": "january",
    "janv.": "jan",
    "janv": "jan",
    "février": "february",
    "févr.": "feb",
    "févr": "feb",
    "fevrier": "february",
    "fevr.": "feb",
    "fevr": "feb",
    "fév.": "feb",
    "fév": "feb",
    "fev.": "feb",
    "fev": "feb",
    "mars": "march",
    "avril": "april",
    "avr.": "apr",
    "avr": "apr",
    "mai": "may",
    "juin": "june",
    "juillet": "july",
    "juil.": "jul",
    "juil": "jul",
    "août": "august",
    "aout": "august",
    "août.": "aug",
    "aout.": "aug",
    "septembre": "september",
    "sept.": "sep",
    "sept": "sep",
    "octobre": "october",
    "oct.": "oct",
    "oct": "oct",
    "novembre": "november",
    "nov.": "nov",
    "nov": "nov",
    "décembre": "december",
    "déc.": "dec",
    "decembre": "december",
    "déc": "dec",
    "dec": "dec",
  };

  for (const [frMonth, enMonth] of Object.entries(monthMap)) {
    if (cleaned.startsWith(frMonth)) {
      const pattern = new RegExp(`^${frMonth.replace(".", "\\.")}\\b`, "i");
      cleaned = cleaned.replace(pattern, enMonth);
      break;
    }
  }

  const parsed = Date.parse(cleaned);
  if (!Number.isNaN(parsed) && parsed > 0) {
    return Math.floor(parsed / 1000);
  }
  return 0;
}

/**
 * Parse un fichier HTML d'abonnés ou d'abonnements Instagram en utilisant DOMParser.
 * Filtre strictement les liens pointant vers instagram.com et valide le format des handles.
 */
export function parseInstagramHTML(htmlContent: string): InstagramUser[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const links = doc.querySelectorAll("a");
    const users: InstagramUser[] = [];
    const seen = new Set<string>();

    links.forEach((link) => {
      const href = (link.getAttribute("href") || "").trim();
      const text = (link.textContent || "").trim();

      // Ne retenir que les liens pointant vers un profil Instagram ou ayant un handle valide
      const isInstaHref = href.toLowerCase().includes("instagram.com/");
      if (!isInstaHref && !INSTAGRAM_USERNAME_REGEX.test(text.replace(/^@/, ""))) {
        return;
      }

      const username = extractInstagramUsername(text, href);

      if (isValidInstagramUsername(username) && !seen.has(username.toLowerCase())) {
        seen.add(username.toLowerCase());

        // Recherche de la date associée (sans jamais retomber sur Date.now() !)
        let timestamp = 0;
        let sibling = link.nextElementSibling;

        if (!sibling && link.parentElement) {
          sibling = link.parentElement.nextElementSibling;
        }

        if (sibling && sibling.textContent) {
          timestamp = parseExportDate(sibling.textContent);
        }

        users.push({
          username,
          timestamp,
          url: `https://www.instagram.com/${username}`,
        });
      }
    });

    return users;
  } catch (error) {
    console.error("Erreur de parsing HTML Instagram:", error);
    return [];
  }
}

/**
 * Point d'entrée principal pour parser le contenu d'un fichier extrait (JSON ou HTML).
 */
export function parseInstaFile(
  content: string,
  format: "json" | "html"
): InstagramUser[] {
  if (format === "json") {
    return parseInstagramJSON(content);
  }
  return parseInstagramHTML(content);
}
