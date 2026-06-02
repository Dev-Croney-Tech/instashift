export interface InstagramUser {
  username: string;
  timestamp: number; // en secondes
  url: string;
}

/**
 * Parse un fichier JSON d'abonnés ou d'abonnements Instagram.
 * Gère de manière résiliente différentes variantes de schémas.
 */
export function parseInstagramJSON(jsonContent: string, isFollowers: boolean): InstagramUser[] {
  try {
    const parsed = JSON.parse(jsonContent);
    const users: InstagramUser[] = [];

    // Fonction récursive pour chercher des structures contenant href et value
    // qui correspondent à un profil Instagram
    function searchForUsers(obj: any) {
      if (!obj || typeof obj !== "object") return;

      if (Array.isArray(obj)) {
        for (const item of obj) {
          searchForUsers(item);
        }
        return;
      }

      // Si l'objet a 'string_list_data' (Format standard Instagram)
      if (Array.isArray(obj.string_list_data) && obj.string_list_data.length > 0) {
        const data = obj.string_list_data[0];
        const username = data.value || obj.title;
        if (username && typeof username === "string") {
          users.push({
            username: username,
            timestamp: typeof data.timestamp === "number" ? data.timestamp : Math.floor(Date.now() / 1000),
            url: data.href || `https://www.instagram.com/${username}`,
          });
        }
        return;
      }

      // Recherche dans tous les champs de l'objet
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          searchForUsers(obj[key]);
        }
      }
    }

    // Lancer la recherche récursive
    searchForUsers(parsed);
    
    // Éliminer les doublons éventuels
    const seen = new Set<string>();
    return users.filter(u => {
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
 * Traduit une date au format français (ex: "juin 01, 2026" ou "fév 27, 2026")
 * en anglais pour que Date.parse() puisse l'analyser correctement.
 */
export function parseFrenchDate(dateStr: string): number | null {
  let cleaned = dateStr.toLowerCase().trim();
  const monthMap: { [key: string]: string } = {
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
    "dec": "dec"
  };

  for (const [frMonth, enMonth] of Object.entries(monthMap)) {
    if (cleaned.startsWith(frMonth)) {
      const pattern = new RegExp(`^${frMonth.replace(".", "\\.")}`, "i");
      cleaned = cleaned.replace(pattern, enMonth);
      break;
    }
  }

  const parsed = Date.parse(cleaned);
  if (!isNaN(parsed)) {
    return Math.floor(parsed / 1000);
  }
  return null;
}

/**
 * Nettoie et extrait un nom d'utilisateur Instagram à partir de son texte et de son lien.
 */
export function extractInstagramUsername(usernameStr: string, hrefStr: string): string {
  let candidate = usernameStr.trim();
  
  // Si le texte est vide ou ressemble à une URL, on utilise l'URL href comme source d'extraction
  if (!candidate || candidate.includes("instagram.com") || candidate.includes("/") || candidate.startsWith("http")) {
    candidate = hrefStr.trim();
  }

  if (candidate) {
    if (candidate.includes("instagram.com") || candidate.startsWith("http://") || candidate.startsWith("https://") || candidate.includes("/")) {
      // Nettoyer le protocole et le domaine
      let path = candidate.replace(/^https?:\/\//i, "");
      path = path.replace(/^www\./i, "");
      path = path.replace(/^instagram\.com\//i, "");
      path = path.replace(/^\//, "");
      
      const segments = path.split("/");
      
      // Instagram utilise des chemins de type /_u/username ou /_/username
      if (segments[0] === "_" && segments.length > 1) {
        candidate = segments[1];
      } else if (segments[0] === "_u" && segments.length > 1) {
        candidate = segments[1];
      } else if (segments.length > 0) {
        candidate = segments[0];
      }
      
      // Supprimer les paramètres de requête de l'URL
      candidate = candidate.split("?")[0];
    }
  }

  // Enlever le caractère '@' s'il est au début
  if (candidate.startsWith("@")) {
    candidate = candidate.substring(1);
  }

  return candidate.trim();
}

/**
 * Parse un fichier HTML d'abonnés ou d'abonnements Instagram en utilisant DOMParser.
 */
export function parseInstagramHTML(htmlContent: string): InstagramUser[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const links = doc.querySelectorAll("a");
    const users: InstagramUser[] = [];
    const seen = new Set<string>();

    links.forEach((link) => {
      const href = link.getAttribute("href") || "";
      const text = link.textContent || "";
      const username = extractInstagramUsername(text, href);

      if (username && !seen.has(username.toLowerCase()) && !username.includes("Instagram")) {
        seen.add(username.toLowerCase());
        
        // Recherche de la date associée. Généralement, Instagram met la date
        // dans le div qui suit immédiatement le lien ou dans un parent.
        let timestamp = Math.floor(Date.now() / 1000);
        let sibling = link.nextElementSibling;
        
        // Si pas de div direct, on cherche le div ou l'élément suivant dans le parent
        if (!sibling && link.parentElement) {
          sibling = link.parentElement.nextElementSibling;
        }

        if (sibling && sibling.textContent) {
          const dateStr = sibling.textContent.trim();
          const ts = parseFrenchDate(dateStr);
          if (ts !== null) {
            timestamp = ts;
          }
        }

        users.push({
          username,
          timestamp,
          url: href || `https://www.instagram.com/${username}`,
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
export function parseInstaFile(content: string, format: "json" | "html", isFollowers: boolean): InstagramUser[] {
  if (format === "json") {
    return parseInstagramJSON(content, isFollowers);
  } else {
    return parseInstagramHTML(content);
  }
}
