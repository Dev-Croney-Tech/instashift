export interface StepItem {
  step: string;
  title: string;
  detail: string;
  badge: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export const EXPORT_STEPS: StepItem[] = [
  {
    step: "01",
    title: "Centre des comptes Meta",
    detail: "Ouvrez Instagram > Paramètres > Centre des comptes > Vos informations et autorisations > Télécharger vos informations.",
    badge: "Navigation",
  },
  {
    step: "02",
    title: "Ciblage des connexions",
    detail: "Choisissez « Certaines de vos informations » et cochez exclusivement « Abonnés et abonnements » pour éviter d'exporter vos médias.",
    badge: "Filtrage",
  },
  {
    step: "03",
    title: "Période : Tout le temps",
    detail: "Sélectionnez impérativement la plage « Tout le temps » (et non 3 ou 6 mois) afin d'obtenir 100 % de l'historique de votre audience.",
    badge: "Critique",
  },
  {
    step: "04",
    title: "Format JSON ou HTML",
    detail: "Privilégiez le format JSON (horodatage à la seconde près). Le format HTML est également pris en charge par le moteur local.",
    badge: "Export < 2 min",
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Pourquoi aucun mot de passe Instagram n'est-il demandé ?",
    answer:
      "Connecter son compte Instagram à une application tierce non officielle viole les conditions d'utilisation de Meta et déclenche fréquemment des blocages automatiques ou des compromissions de session. InstaShift opère hors-ligne en lisant l'archive ZIP officielle fournie par Meta : votre compte ne subit aucune connexion externe.",
  },
  {
    question: "Comment vérifier qu'aucune donnée ne quitte mon navigateur ?",
    answer:
      "Le traitement repose sur JSZip (décompression en mémoire vive) et IndexedDB (stockage navigateur). Vous pouvez ouvrir l'inspecteur réseau de votre navigateur (F12 > onglet Network) ou couper votre connexion Wi-Fi avant de glisser votre archive ZIP : l'audit s'exécute avec 0 requête sortante, renforcé par une politique Content-Security-Policy stricte.",
  },
  {
    question: "Pourquoi le nombre d'abonnés dans le ZIP est-il parfois inférieur à mon profil ?",
    answer:
      "Deux causes expliquent un écart : 1) Lors de la demande d'export sur Instagram, la période par défaut est souvent réglée sur « Les 3 derniers mois » ou « L'année dernière » au lieu de « Tout le temps ». 2) À l'inverse, un léger surplus de 1 à 5 comptes dans le ZIP correspond aux profils désactivés ou suspendus qu'Instagram masque sur l'application mobile mais conserve dans l'export brut.",
  },
  {
    question: "Comment la formule mathématique entre Mutuels, Sans retour et Fans est-elle calculée ?",
    answer:
      "L'ensemble suit deux égalités strictes : Vos Abonnements (Following) = Mutuels + Sans retour (ceux qui ne vous suivent pas). Vos Abonnés (Followers) = Mutuels + Fans (ceux que vous ne suivez pas en retour). Chaque profil est dédupliqué et normalisé en minuscules avant comparaison.",
  },
  {
    question: "Comment fonctionne la détection des changements de pseudonyme (@username) ?",
    answer:
      "Lorsque vous comparez deux sauvegardes locales (Snapshot A vs Snapshot B) issues d'exports JSON, InstaShift inspecte les horodatages exacts d'abonnement (précision à la seconde Unix). Si un pseudonyme disparaît mais qu'un nouveau pseudonyme apparaît avec un timestamp d'abonnement strictement identique et unique, l'outil l'identifie comme un changement de @username plutôt que comme un désabonnement.",
  },
  {
    question: "Mes instantanés sauvegardés persistent-ils si je change d'ordinateur ?",
    answer:
      "Les instantanés sont stockés dans la base IndexedDB propre à votre navigateur actuel. Pour conserver vos sauvegardes à long terme ou les transférer sur une autre machine, utilisez le bouton « Exporter JSON » dans le panneau des snapshots locaux.",
  },
];
