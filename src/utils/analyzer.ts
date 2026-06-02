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
  };
}

export interface UsernameChange {
  oldUsername: string;
  newUsername: string;
  timestamp: number;
  url: string;
}

export interface ComparisonResult {
  incoming: InstagramUser[];  // Nouveaux abonnés (abonnés entrants)
  outgoing: InstagramUser[];  // Désabonnements (abonnés sortants)
  usernameChanges?: UsernameChange[];
  stats: {
    incomingCount: number;
    outgoingCount: number;
    usernameChangesCount?: number;
    netChange: number; // Évolution nette (entrants - sortants)
  };
}

/**
 * Analyse un instantané (snapshot) unique d'abonnés et d'abonnements.
 * Calcule les non-abonnés en retour, les fans et les abonnements mutuels.
 */
export function analyzeSnapshot(followers: InstagramUser[], following: InstagramUser[]): AnalysisResult {
  const followersSet = new Set(followers.map(f => f.username.toLowerCase()));
  const followingSet = new Set(following.map(f => f.username.toLowerCase()));

  const nonFollowersBack: InstagramUser[] = [];
  const fans: InstagramUser[] = [];
  const mutuals: InstagramUser[] = [];

  // 1. Détecter les non-abonnés en retour & abonnés mutuels (qui je suis, mais qui ne me suit pas en retour)
  following.forEach(user => {
    if (!followersSet.has(user.username.toLowerCase())) {
      nonFollowersBack.push(user);
    } else {
      mutuals.push(user);
    }
  });

  // 2. Détecter les fans (qui me suit, mais que je ne suis pas en retour)
  followers.forEach(user => {
    if (!followingSet.has(user.username.toLowerCase())) {
      fans.push(user);
    }
  });

  // Tri alphabétique par défaut pour les listes
  const sortAlpha = (a: InstagramUser, b: InstagramUser) => a.username.localeCompare(b.username);
  
  nonFollowersBack.sort(sortAlpha);
  fans.sort(sortAlpha);
  mutuals.sort(sortAlpha);

  const followersCount = followers.length;
  const followingCount = following.length;
  const nonFollowersBackCount = nonFollowersBack.length;
  const fansCount = fans.length;
  const mutualsCount = mutuals.length;
  const followBackRatio = followingCount > 0 ? Math.round((mutualsCount / followingCount) * 100) : 0;

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
    }
  };
}

/**
 * Compare deux listes d'abonnés de deux moments différents pour en déduire
 * les abonnés entrants (nouveaux) et sortants (désabonnements).
 */
export function compareSnapshots(oldFollowers: InstagramUser[], newFollowers: InstagramUser[]): ComparisonResult {
  const oldFollowersSet = new Set(oldFollowers.map(f => f.username.toLowerCase()));
  const newFollowersSet = new Set(newFollowers.map(f => f.username.toLowerCase()));

  const tentativeIncoming = newFollowers.filter(u => !oldFollowersSet.has(u.username.toLowerCase()));
  const tentativeOutgoing = oldFollowers.filter(u => !newFollowersSet.has(u.username.toLowerCase()));

  const usernameChanges: UsernameChange[] = [];
  const incoming: InstagramUser[] = [];
  const outgoing: InstagramUser[] = [];

  // Map tentativeIncoming par timestamp pour recherche rapide
  // Uniquement pour les timestamps réels et valides (ex: > 10000000)
  const incomingByTimestamp = new Map<number, InstagramUser>();
  tentativeIncoming.forEach(u => {
    if (u.timestamp > 10000000) {
      incomingByTimestamp.set(u.timestamp, u);
    }
  });

  const matchedNewUsernames = new Set<string>();

  tentativeOutgoing.forEach(uOld => {
    let matched = false;
    if (uOld.timestamp > 10000000) {
      const uNew = incomingByTimestamp.get(uOld.timestamp);
      if (uNew) {
        usernameChanges.push({
          oldUsername: uOld.username,
          newUsername: uNew.username,
          timestamp: uOld.timestamp,
          url: uNew.url
        });
        matchedNewUsernames.add(uNew.username.toLowerCase());
        matched = true;
      }
    }
    if (!matched) {
      outgoing.push(uOld);
    }
  });

  tentativeIncoming.forEach(uNew => {
    if (!matchedNewUsernames.has(uNew.username.toLowerCase())) {
      incoming.push(uNew);
    }
  });

  // Trier par ordre alphabétique
  const sortAlpha = (a: InstagramUser, b: InstagramUser) => a.username.localeCompare(b.username);
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
      netChange: incoming.length - outgoing.length
    }
  };
}
