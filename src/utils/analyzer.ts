import { InstagramUser } from "./insta-parser";

export interface AnalysisResult {
  followers: InstagramUser[];
  following: InstagramUser[];
  nonFollowersBack: InstagramUser[];
  fans: InstagramUser[];
  mutuals: InstagramUser[];
  stats: {
    followersCount: number;
    followingCount: number;
    nonFollowersBackCount: number;
    fansCount: number;
    mutualsCount: number;
    followBackRatio: number; // Pourcentage d'abonnements qui nous suivent en retour
    followerToFollowingRatio: number; // Ratio Abonnés / Abonnements (ex: 1.42)
  };
}

export interface UsernameChange {
  oldUsername: string;
  newUsername: string;
  timestamp: number;
  url: string;
}

export interface ComparisonResult {
  incoming: InstagramUser[]; // Nouveaux abonnés (abonnés entrants)
  outgoing: InstagramUser[]; // Désabonnements (abonnés sortants)
  usernameChanges: UsernameChange[];
  stats: {
    incomingCount: number;
    outgoingCount: number;
    usernameChangesCount: number;
    netChange: number; // Évolution nette (entrants - sortants)
  };
}

/**
 * Analyse un instantané (snapshot) unique d'abonnés et d'abonnements.
 * Calcule les non-abonnés en retour, les fans et les abonnements mutuels.
 */
export function analyzeSnapshot(
  followers: InstagramUser[],
  following: InstagramUser[]
): AnalysisResult {
  const followersSet = new Set(followers.map((f) => f.username.toLowerCase()));
  const followingSet = new Set(following.map((f) => f.username.toLowerCase()));

  const nonFollowersBack: InstagramUser[] = [];
  const fans: InstagramUser[] = [];
  const mutuals: InstagramUser[] = [];

  following.forEach((user) => {
    if (!followersSet.has(user.username.toLowerCase())) {
      nonFollowersBack.push(user);
    } else {
      mutuals.push(user);
    }
  });

  followers.forEach((user) => {
    if (!followingSet.has(user.username.toLowerCase())) {
      fans.push(user);
    }
  });

  const sortAlpha = (a: InstagramUser, b: InstagramUser) =>
    a.username.localeCompare(b.username);

  nonFollowersBack.sort(sortAlpha);
  fans.sort(sortAlpha);
  mutuals.sort(sortAlpha);

  const followersCount = followers.length;
  const followingCount = following.length;
  const nonFollowersBackCount = nonFollowersBack.length;
  const fansCount = fans.length;
  const mutualsCount = mutuals.length;
  const followBackRatio =
    followingCount > 0 ? Math.round((mutualsCount / followingCount) * 100) : 0;
  const followerToFollowingRatio =
    followingCount > 0 ? Math.round((followersCount / followingCount) * 100) / 100 : 0;

  return {
    followers,
    following,
    nonFollowersBack,
    fans,
    mutuals,
    stats: {
      followersCount,
      followingCount,
      nonFollowersBackCount,
      fansCount,
      mutualsCount,
      followBackRatio,
      followerToFollowingRatio,
    },
  };
}

/**
 * Compare deux listes d'abonnés (base ancienne -> cible récente) pour en déduire
 * les abonnés entrants, sortants et les changements de pseudonyme (@username).
 *
 * Heuristique de renommage sécurisée : un compte sortant et un compte entrant
 * ne sont considérés comme un renommage que s'ils partagent un timestamp Unix
 * valide (> 10000000) ET que ce timestamp est strictement unique (fréquence === 1)
 * à la fois dans l'ancien snapshot et dans le nouveau snapshot.
 */
export function compareSnapshots(
  oldFollowers: InstagramUser[],
  newFollowers: InstagramUser[]
): ComparisonResult {
  const oldFollowersSet = new Set(oldFollowers.map((f) => f.username.toLowerCase()));
  const newFollowersSet = new Set(newFollowers.map((f) => f.username.toLowerCase()));

  const tentativeIncoming = newFollowers.filter(
    (u) => !oldFollowersSet.has(u.username.toLowerCase())
  );
  const tentativeOutgoing = oldFollowers.filter(
    (u) => !newFollowersSet.has(u.username.toLowerCase())
  );

  // Calculer la fréquence globale de chaque timestamp dans oldFollowers et newFollowers
  // pour éviter tout faux positif sur des timestamps en doublon (ex: exports HTML à la minute)
  const oldTsFreq = new Map<number, number>();
  oldFollowers.forEach((u) => {
    if (u.timestamp > 10000000) {
      oldTsFreq.set(u.timestamp, (oldTsFreq.get(u.timestamp) || 0) + 1);
    }
  });

  const newTsFreq = new Map<number, number>();
  newFollowers.forEach((u) => {
    if (u.timestamp > 10000000) {
      newTsFreq.set(u.timestamp, (newTsFreq.get(u.timestamp) || 0) + 1);
    }
  });

  // Indexer uniquement les entrants dont le timestamp est strictement unique
  const incomingByUniqueTimestamp = new Map<number, InstagramUser>();
  tentativeIncoming.forEach((u) => {
    if (u.timestamp > 10000000 && newTsFreq.get(u.timestamp) === 1) {
      incomingByUniqueTimestamp.set(u.timestamp, u);
    }
  });

  const usernameChanges: UsernameChange[] = [];
  const incoming: InstagramUser[] = [];
  const outgoing: InstagramUser[] = [];
  const matchedNewUsernames = new Set<string>();

  tentativeOutgoing.forEach((uOld) => {
    let matched = false;
    if (uOld.timestamp > 10000000 && oldTsFreq.get(uOld.timestamp) === 1) {
      const uNew = incomingByUniqueTimestamp.get(uOld.timestamp);
      if (uNew && !matchedNewUsernames.has(uNew.username.toLowerCase())) {
        usernameChanges.push({
          oldUsername: uOld.username,
          newUsername: uNew.username,
          timestamp: uOld.timestamp,
          url: uNew.url,
        });
        matchedNewUsernames.add(uNew.username.toLowerCase());
        matched = true;
      }
    }
    if (!matched) {
      outgoing.push(uOld);
    }
  });

  tentativeIncoming.forEach((uNew) => {
    if (!matchedNewUsernames.has(uNew.username.toLowerCase())) {
      incoming.push(uNew);
    }
  });

  const sortAlpha = (a: InstagramUser, b: InstagramUser) =>
    a.username.localeCompare(b.username);
  incoming.sort(sortAlpha);
  outgoing.sort(sortAlpha);
  usernameChanges.sort((a, b) => a.newUsername.localeCompare(b.newUsername));

  return {
    incoming,
    outgoing,
    usernameChanges,
    stats: {
      incomingCount: incoming.length,
      outgoingCount: outgoing.length,
      usernameChangesCount: usernameChanges.length,
      netChange: incoming.length - outgoing.length,
    },
  };
}
