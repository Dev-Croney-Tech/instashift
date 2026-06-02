# 🔄 InstaShift

[![Licence: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![Stack: Next.js 16](https://img.shields.io/badge/Stack-Next.js%2016-blue.svg)](https://nextjs.org/)
[![Style: Tailwind v4](https://img.shields.io/badge/Style-Tailwind%20v4-cyan.svg)](https://tailwindcss.com/)
[![Security: 100% Client--Side](https://img.shields.io/badge/Security-100%25%20Client--Side-emerald.svg)]()

**InstaShift** est un analyseur d'audience Instagram statique premium, **100% sécurisé, privé et open-source**. 

Contrairement aux applications mobiles classiques qui exigent vos identifiants de connexion (présentant des risques de piratage ou de bannissement de compte), InstaShift traite vos données **intégralement en local dans votre navigateur**. Aucune donnée ne quitte votre ordinateur, aucun mot de passe n'est requis. Il utilise l'export d'informations officiel d'Instagram pour analyser vos abonnés et suivre l'évolution temporelle de votre compte.

🌍 **Site Web** : [instashift.croney-tech.fr](https://instashift.croney-tech.fr)  
💻 **Propulsé par** : [Dev.Croney-Tech](https://dev.croney-tech.fr) 

---

## ✨ Fonctionnalités Clés

* 🔒 **Confidentialité Absolue** : Traitement 100% client-side. Pas de base de données distante, pas de serveurs tiers, pas de trackers. Vos données restent les vôtres.
* 📦 **Import Direct en Drag & Drop (WOW Effect)** : Glissez-déposez simplement votre fichier ZIP d'export Instagram officiel. L'application le décompresse et le parse à la volée en tâche de fond à l'aide de `JSZip`.
* 📊 **Analyse d'Audience Précise** :
  * **Sans retour** : Les comptes que vous suivez mais qui ne vous suivent pas en retour.
  * **Fans** : Les comptes qui vous suivent mais que vous ne suivez pas en retour.
  * **Abonnés mutuels** : Vos abonnements réciproques.
  * **Listes complètes** : Vos abonnés et abonnements triés et filtrés instantanément.
* 🔄 **Évolution Temporelle (IndexedDB locale)** : Sauvegardez des instantanés historiques dans la base de données IndexedDB sécurisée de votre propre navigateur pour analyser :
  * Vos **abonnés entrants** (les nouveaux abonnés depuis la dernière fois).
  * Vos **abonnés sortants** (les comptes qui se sont désabonnés).
  * L'évolution nette de votre croissance.
* 🎨 **UI/UX Haute Couture** : Design futuriste en mode sombre profond, effets de flou de verre (glassmorphism), micro-animations dynamiques (GSAP), et défilement ultra-fluide (Lenis).

---

## 🛠️ Stack Technique

* **Framework** : [Next.js v16](https://nextjs.org/) (App Router & TypeScript) avec export HTML statique.
* **Design & Styles** : [Tailwind CSS v4](https://tailwindcss.com/) & animations fluides personnalisées.
* **Moteur de Décompression** : [JSZip](https://stuk.github.io/jszip/) pour l'extraction locale.
* **Smooth Scroll** : [Lenis](https://lenis.darkroom.engineering/) avec support d'accessibilité.
* **Animations** : [GSAP](https://greensock.com/gsap/) pour l'apparition progressive des éléments et des statistiques.
* **Base de données** : API IndexedDB native du navigateur pour le stockage persistant et chiffré localement.
* **Icônes** : [Lucide React](https://lucide.dev/).

---

## 📖 Guide de démarrage utilisateur (Comment obtenir vos données ?)

Pour que l'outil fonctionne de manière instantanée (avec un ZIP de moins de 1 Mo), suivez ces étapes simples pour exporter vos données Instagram :

1. Allez sur **Instagram** &gt; **Votre activité** &gt; **Télécharger vos informations**.
2. Sélectionnez **Téléchargement partiel**.
3. Cochez **uniquement** la case **Abonnés et abonnements** (cela évite de télécharger vos photos/vidéos et permet à Instagram de générer le fichier en moins de 2 minutes).
4. Choisissez le format **JSON** (fortement recommandé pour la précision) ou HTML.
5. Validez la demande. Une fois le mail de confirmation d'Instagram reçu, téléchargez votre fichier ZIP et glissez-le directement sur [InstaShift](https://instashift.croney-tech.fr).

---

## 💻 Installation & Développement Local

Si vous souhaitez faire tourner InstaShift sur votre machine ou contribuer au projet :

### Prérequis
* [Node.js](https://nodejs.org/) (version 18 ou supérieure recommandée)
* npm, pnpm ou yarn

### 1. Cloner le dépôt
```bash
git clone https://github.com/Dev-Croney-Tech/instashift.git
cd instashift
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Lancer le serveur de développement
```bash
npm run dev
```
Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur pour voir le résultat.

### 4. Compiler pour la production (Export statique HTML)
```bash
npm run build
```
Les fichiers HTML/CSS/JS compilés et prêts à être hébergés de manière statique (sur Cloudflare Pages, Netlify ou Vercel) seront générés dans le dossier `/out`.

---

## 🔒 Sécurité & Hébergement

InstaShift est configuré pour être déployé sur **Cloudflare Pages** et intègre des règles de sécurité réseau extrêmement rigoureuses définies dans le fichier `public/_headers` :
* **Content Security Policy (CSP)** stricte.
* **HSTS (Strict-Transport-Security)** pour forcer le HTTPS.
* Protection contre le clickjacking et le sniffing de type MIME.

---

## 📄 Licence

Ce projet est distribué sous la licence **MIT**. Voir le fichier `LICENSE` pour plus de détails.

---

## 🏢 À propos de Dev.Croney-Tech

**InstaShift** est un projet open-source initié par **Dev.Croney-Tech**, l'agence de développement web du groupe **Croney Technology Group**. Nous concevons des sites web, PWA et applications SaaS premium, immersifs, performants et respectueux de la vie privée.

* **Site web principal** : [dev.croney-tech.fr](https://dev.croney-tech.fr)
* **Holding** : [group.croney-technology.com](https://group.croney-technology.com)
* **Contact** : [dev@croney-tech.fr](mailto:dev@croney-tech.fr)
