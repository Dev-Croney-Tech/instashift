# InstaShift

[![License: MIT](https://img.shields.io/badge/License-MIT-5e6ad2.svg)](https://opensource.org/licenses/MIT)
[![Stack: Next.js 16](https://img.shields.io/badge/Stack-Next.js%2016-0f1011.svg)](https://nextjs.org/)
[![Style: Tailwind v4](https://img.shields.io/badge/Style-Tailwind%20v4-0f1011.svg)](https://tailwindcss.com/)
[![Runtime: 100% Client-Side](https://img.shields.io/badge/Runtime-100%25%20Client--Side-34d399.svg)](https://instashift.croney-tech.fr)

**InstaShift** est un workbench open-source d'analyse différentielle d'audience Instagram, conçu pour s'exécuter intégralement côté client dans le navigateur.

Contrairement aux services tiers qui demandent vos identifiants Instagram ou utilisent des scrapers non officiels (exposant le compte à des restrictions ou révocations de session), InstaShift opère exclusivement sur l'archive officielle générée par l'Espace Comptes Meta (`.zip`, `.json` ou `.html`). La décompression, la normalisation UTF-8 et le calcul de différences entre snapshots s'effectuent en mémoire locale via `JSZip` et `IndexedDB`.

- **Application en production** : [instashift.croney-tech.fr](https://instashift.croney-tech.fr)
- **Ingénierie & Maintenance** : [Dev.Croney-Tech](https://dev.croney-tech.fr)

---

## Architecture & Fonctionnalités

- **Exécution 100% Locale (Zero-Network Sandbox)** : Aucune requête réseau sortante (`connect-src 'self'`). Les fichiers importés restent dans la mémoire vive de l'onglet actif.
- **Support Multi-Format & Décodage Mojibake Meta** :
  - Prise en charge directe de l'archive `.zip` complète ou sélection multiple de fichiers extraits (`followers_1.json`, `followers_2.json`, `following.json` ou équivalents `.html`).
  - Correction automatique de l'encodage UTF-8 littéral propre aux exports JSON de Meta (`decodeMetaMojibake`).
  - Tri numérique naturel des archives paginées (`followers_1.json` à `followers_N.json`) pour les comptes à forte audience.
- **Comparateur Temporel Git Diff (`IndexedDB`)** :
  - Sauvegarde locale d'instantanés horodatés dans la base `IndexedDB` du navigateur.
  - Calcul différentiel entre deux snapshots quelconques (Base → Cible) avec inversion directionnelle instantanée :
    - `+` **Abonnés entrants** (nouveaux abonnés sur la période).
    - `-` **Désabonnements sortants** (comptes ayant cessé de suivre).
    - `~` **Détection de renommages (`@old` → `@new`)** basée sur l'unicité stricte du timestamp Unix d'abonnement initial (`fréquence === 1` dans l'ancien et le nouveau snapshot).
  - Export et réimport complets de la base locale au format `.json`.
- **Explorateur Haute Densité & Télémétrie** :
  - Navigation clavier rapide (`/` ou `⌘K` pour filtrer, `ESC` pour réinitialiser).
  - Tri par date d'action (plus récent / plus ancien) ou ordre alphabétique (`A → Z` / `Z → A`).
  - Export de n'importe quelle vue filtrée en **CSV** (avec BOM UTF-8), **JSON**, ou copie directe de la liste de `@usernames` dans le presse-papier.
  - Mode Démo en 1 clic pré-chargé pour tester immédiatement l'interface et le comparateur `Git Diff` sans archive sous la main.

---

## Stack Technique

- **Framework** : [Next.js 16](https://nextjs.org/) (App Router, TypeScript strict, compilation statique `output: "export"`).
- **Système Visuel** : [Tailwind CSS v4](https://tailwindcss.com/) — Design System *Linear Dark (80%) × Vercel Geist Analytics (20%)* (`Geist Sans` & `Geist Mono`, `tabular-nums`).
- **Moteur d'Archive** : [JSZip](https://stuk.github.io/jszip/) pour la lecture asynchrone de flux ZIP en mémoire.
- **Persistance Locale** : API native `IndexedDB` (`InstaShiftDB`).

---

## Guide d'extraction de l'archive Instagram (Meta)

Pour obtenir une archive légère (quelques centaines de Ko) générée en moins de 5 minutes :

1. Ouvrez **Instagram** > **Paramètres et activité** > **Espace Comptes** > **Vos informations et autorisations** > **Télécharger vos informations**.
2. Choisissez **Télécharger ou transférer des informations** puis **Certaines de vos informations**.
3. Cochez uniquement **Abonnés et suivi** (`Followers and following`) dans la section Connexions.
4. Sélectionnez **Télécharger sur l'appareil**, définissez la **Plage de dates : Depuis le début** (`All time`) et le **Format : JSON** (recommandé pour la précision des timestamps Unix à la seconde).
5. Déposez le fichier `.zip` obtenu directement dans [InstaShift](https://instashift.croney-tech.fr).

---

## Développement Local & Build Statique

### Prérequis
- Node.js >= 20
- npm

### Installation
```bash
git clone https://github.com/Dev-Croney-Tech/instashift.git
cd instashift
npm install
```

### Serveur de développement
```bash
npm run dev
```

### Vérification & Compilation Statique (`/out`)
```bash
npm run lint
npm run build
```
Le dossier `/out` généré est 100% statique et prêt à être servi sur Cloudflare Pages, Vercel ou tout hébergeur statique avec les en-têtes HTTP de sécurité définis dans `public/_headers`.

---

## Licence

Distribué sous licence **MIT**. Consultez le fichier `LICENSE` pour plus d'informations.

---

## Crédits

Conçu et maintenu par **[Dev.Croney-Tech](https://dev.croney-tech.fr)**, filiale d'ingénierie logicielle de **[Croney Technology Group](https://group.croney-technology.com)**.
