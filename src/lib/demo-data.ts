import { InstagramUser } from "@/utils/insta-parser";
import { SavedSnapshot } from "@/utils/db";

/**
 * Génère un jeu de données de démonstration réaliste et déterministe
 * permettant aux recruteurs, développeurs et visiteurs de tester immédiatement
 * toutes les fonctionnalités du Workbench (KPIs, Graphique, Recherche, Export, Diff IndexedDB)
 * sans avoir besoin d'un export ZIP personnel sous la main.
 */
export function generateDemoDataset(): {
  currentFollowers: InstagramUser[];
  currentFollowing: InstagramUser[];
  previousSnapshot: SavedSnapshot;
  fileSizeKb: number;
  parseTimeMs: number;
} {
  // Base temporelle : sur les 14 derniers mois
  const baseTimestamp = 1775000000; // ~2026
  const daySec = 86400;

  const techHandles = [
    "rauchg", "shadcn", "leeerob", "dan_abramov", "kentcdodds", "t3dotgg",
    "fireship_dev", "theo_browne", "karpathy", "levelsio", "sama", "MIT_CSAIL",
    "vercel", "linear", "raycastapp", "supabase", "tailwindlabs", "gsap_greensock",
    "cloudflare", "github", "typescript", "nextjs_dev", "figma", "stripe_dev",
    "prisma", "turso_db", "astrodotbuild", "vite_js", "biomejs", "bunjavascript",
    "shadcn_ui", "radix_ui", "lucide_icons", "framer", "threejs_org", "webgl_daily",
    "joshwcomeau", "emilkowalski_", "pacocoursey", "rauno_freiberg", "aco_design",
    "adamwathan", "samselikoff", "delba_oliveira", "timneutkens", "sebmarkbage",
    "rich_harris", "evanyou", "ryandahl", "addyosmani", "paul_irish", "jakearchibald",
    "una_kravets", "argyleink", "bramus_dev", "sarasoueidan", "lea_verou", "jensimmons",
    "chriscoyier", "dave_rupert", "wesbos", "stolinski", "syntaxfm", "changelog",
  ];

  const creatorHandles = [
    "alex.studio.fr", "claire_design_ux", "thomas.b_photo", "lucas_motion_3d",
    "marine.arch", "hugo_minimal", "sarah.typographie", "antoine_dev_lyon",
    "camille.artdirection", "julien_fullstack", "chloe.keramik", "maxime_sound",
    "lea.illustrations", "nicolas_vfx", "manon.editorial", "romain_indiehacker",
    "pauline.ui", "valentin_rust", "elise_creative", "mathieu.saas",
    "charlotte_branding", "alexandre.ai", "oceane_print", "quentin_shaders",
    "justine.photo", "baptiste_maker", "laura.webflow", "florian_nextjs",
    "margaux.studio", "kevin_cybersec", "noemie.archi", "arthur_devops",
    "celia.kinetic", "guillaume_cloud", "inestypo", "bastien_audio",
    "amelie.product", "victor_golang", "louise.uxresearch", "simon_webgl",
    "clara.packaging", "theo_embedded", "maelle.lettering", "damien_linux",
    "eva.sceno", "adrien_kotlin", "zoey.digital", "robin_gamedev",
    "jade.lighting", "clement_sysadmin", " Morgane_3d", "yann_fintech",
    "agathe.patterns", "loic_hardware", "solene.curator", "tristan_mlops",
    "helios.labs", "nordic_interface", "obsidian.work", "geist.systems",
    "monolith.studio", "kuro.design", "swiss.grid", "kinetic.type",
    "brutalist.web", "modular.synth", "analog.archive", "vector.foundry",
    "pixel.craft.fr", "limoges.tech", "nouvelle.aquitaine.dev", "frenchtech.limousin",
  ];

  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "");

  const currentFollowers: InstagramUser[] = [];
  const currentFollowing: InstagramUser[] = [];
  const oldFollowers: InstagramUser[] = [];
  const oldFollowing: InstagramUser[] = [];

  // 1. Mutuels : les 68 profils de creatorHandles (suivis réciproquement)
  creatorHandles.forEach((rawHandle, index) => {
    const username = normalize(rawHandle);
    // Répartition sur 12 mois avec précision à la seconde unique
    const ts = baseTimestamp - (creatorHandles.length - index) * (daySec * 4) + index * 137;
    const user: InstagramUser = {
      username,
      timestamp: ts,
      url: `https://www.instagram.com/${username}`,
    };
    currentFollowers.push(user);
    currentFollowing.push({ ...user, timestamp: ts + 60 });
    oldFollowers.push(user);
    oldFollowing.push({ ...user, timestamp: ts + 60 });
  });

  // 2. Sans retour (Don't Follow Back) : 34 comptes tech/studios que l'on suit mais qui ne suivent pas en retour
  techHandles.slice(0, 34).forEach((rawHandle, index) => {
    const username = normalize(rawHandle);
    const ts = baseTimestamp - (40 - index) * (daySec * 6) + index * 251;
    const user: InstagramUser = {
      username,
      timestamp: ts,
      url: `https://www.instagram.com/${username}`,
    };
    currentFollowing.push(user);
    oldFollowing.push(user);
  });

  // 3. Fans (Nous suivent mais on ne les suit pas en retour) : 30 comptes restants + profils communautaires
  const fanHandles = [
    ...techHandles.slice(34),
    "marc.entrepreneur87", "sophie_artisanat", "atelier.porcelaine", "studio.graphique.bx",
    "vincent_backoffice", "emilie.ecom", "david_photographe", "nina.direction",
    "collectif.numerique", "open.source.fr", "dev.hebdo", "ui.inspiration.daily",
  ];

  fanHandles.forEach((rawHandle, index) => {
    const username = normalize(rawHandle);
    const ts = baseTimestamp - (fanHandles.length - index) * (daySec * 3) + index * 89;
    const user: InstagramUser = {
      username,
      timestamp: ts,
      url: `https://www.instagram.com/${username}`,
    };
    currentFollowers.push(user);
    // Les 8 derniers sont de NOUVEaux abonnés (absents de l'ancien snapshot)
    if (index < fanHandles.length - 8) {
      oldFollowers.push(user);
    }
  });

  // 4. Désabonnés récents (présents dans oldFollowers mais partis dans currentFollowers)
  const unfollowedHandles = [
    "crypto.growth.hack", "agency_scale_fast", "bot.automation.ig",
    "dropship.empire.fr", "coach_mindset_vip",
  ];
  unfollowedHandles.forEach((username, index) => {
    const ts = baseTimestamp - 180 * daySec + index * 512;
    oldFollowers.push({
      username,
      timestamp: ts,
      url: `https://www.instagram.com/${username}`,
    });
  });

  // 5. Changements de pseudonyme (@old -> @new avec le MÊME timestamp unique !)
  const renamedPairs = [
    { oldName: "studio_alpha_2025", newName: "alpha.design.systems", ts: baseTimestamp - 95 * daySec + 19 },
    { oldName: "maxime_freelance_js", newName: "maxime.cto", ts: baseTimestamp - 62 * daySec + 43 },
  ];
  renamedPairs.forEach((pair) => {
    oldFollowers.push({
      username: pair.oldName,
      timestamp: pair.ts,
      url: `https://www.instagram.com/${pair.oldName}`,
    });
    currentFollowers.push({
      username: pair.newName,
      timestamp: pair.ts,
      url: `https://www.instagram.com/${pair.newName}`,
    });
    oldFollowing.push({
      username: pair.oldName,
      timestamp: pair.ts,
      url: `https://www.instagram.com/${pair.oldName}`,
    });
    currentFollowing.push({
      username: pair.newName,
      timestamp: pair.ts,
      url: `https://www.instagram.com/${pair.newName}`,
    });
  });

  const previousSnapshot: SavedSnapshot = {
    id: "demo-snapshot-baseline",
    date: new Date(Date.now() - 14 * daySec * 1000).toISOString(),
    label: "Audit Mensuel (J-14 · Démo)",
    followersCount: oldFollowers.length,
    followingCount: oldFollowing.length,
    followers: oldFollowers,
    following: oldFollowing,
  };

  return {
    currentFollowers,
    currentFollowing,
    previousSnapshot,
    fileSizeKb: 148.4,
    parseTimeMs: 14,
  };
}
