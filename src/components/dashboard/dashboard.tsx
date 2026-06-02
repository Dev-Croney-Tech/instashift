"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Upload, FileWarning, Search, Users, UserCheck, UserX, 
  ArrowUpDown, Calendar, Trash2, Save, Sparkles, AlertCircle, CheckCircle2, ChevronRight, UserMinus, UserPlus, HelpCircle, ArrowLeft
} from "lucide-react";
import gsap from "gsap";
import { extractInstaFiles } from "@/utils/zip-parser";
import { parseInstaFile, parseInstagramJSON, parseInstagramHTML, InstagramUser } from "@/utils/insta-parser";
import { analyzeSnapshot, compareSnapshots, AnalysisResult, ComparisonResult } from "@/utils/analyzer";
import { getAllSnapshots, saveSnapshot, deleteSnapshot, SavedSnapshot } from "@/utils/db";
import GrowthChart from "@/components/dashboard/growth-chart";

export default function Dashboard() {
  // --- ÉTATS PRINCIPAUX ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Analyse en cours
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  
  // Snapshots d'historique (IndexedDB)
  const [history, setHistory] = useState<SavedSnapshot[]>([]);
  const [snapshotLabel, setSnapshotLabel] = useState("");
  
  // Comparaison
  const [followersComparison, setFollowersComparison] = useState<ComparisonResult | null>(null);
  const [followingComparison, setFollowingComparison] = useState<ComparisonResult | null>(null);
  const [comparisonTab, setComparisonTab] = useState<"followers" | "following">("followers");
  const [comparedWithLabel, setComparedWithLabel] = useState<string | null>(null);
  const [compareIdA, setCompareIdA] = useState("");
  const [compareIdB, setCompareIdB] = useState("");

  // Navigation & Filtres
  const [activeTab, setActiveTab] = useState<"nonFollowers" | "fans" | "mutuals" | "followers" | "following" | "comparison">("nonFollowers");
  const [searchQuery, setSearchQuery] = useState("");
  const [displayLimit, setDisplayLimit] = useState(50); // Pagination simple pour la performance

  // Références d'animation
  const dashboardRef = useRef<HTMLDivElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  // --- EFFETS ---
  // Charger l'historique au montage
  useEffect(() => {
    loadHistory();
  }, []);

  // Déclencher les animations GSAP à l'affichage des données
  useEffect(() => {
    if (analysis && dashboardRef.current) {
      gsap.fromTo(
        dashboardRef.current.querySelectorAll(".animate-fade-in"),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" }
      );
    }
  }, [analysis]);

  // --- FONCTIONS ---
  const loadHistory = async () => {
    try {
      const data = await getAllSnapshots();
      setHistory(data);
    } catch (err) {
      console.error("Erreur de chargement d'historique:", err);
    }
  };

  // Traiter l'import de fichier
  const handleZipFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setFollowersComparison(null);
    setFollowingComparison(null);
    setComparedWithLabel(null);
    setCompareIdA("");
    setCompareIdB("");

    try {
      let followers: InstagramUser[] = [];
      let following: InstagramUser[] = [];

      // 1. Si c'est un fichier ZIP
      if (file.name.endsWith(".zip")) {
        const { followersFiles, followingFiles } = await extractInstaFiles(file);

        if (followersFiles.length === 0 || followingFiles.length === 0) {
          throw new Error(
            "Le fichier ZIP ne semble pas contenir les fichiers requis. Assurez-vous d'avoir exporté la catégorie 'Abonnés et abonnements' d'Instagram."
          );
        }

        // Concaténer les résultats de tous les fichiers fragmentés
        for (const f of followersFiles) {
          followers = followers.concat(parseInstaFile(f.content, f.format, true));
        }
        for (const f of followingFiles) {
          following = following.concat(parseInstaFile(f.content, f.format, false));
        }

        // Dédupliquer par username
        const seenFollowers = new Set<string>();
        followers = followers.filter((u) => {
          const key = u.username.toLowerCase();
          if (seenFollowers.has(key)) return false;
          seenFollowers.add(key);
          return true;
        });
        const seenFollowing = new Set<string>();
        following = following.filter((u) => {
          const key = u.username.toLowerCase();
          if (seenFollowing.has(key)) return false;
          seenFollowing.add(key);
          return true;
        });
      } 
      // 2. Si c'est un fichier JSON individuel (followers)
      else if (file.name.includes("followers") && file.name.endsWith(".json")) {
        const text = await file.text();
        followers = parseInstagramJSON(text, true);
        setError("Fichier d'abonnés chargé. Veuillez également uploader votre fichier d'abonnements pour compléter l'analyse.");
        return;
      }
      // 3. Autre
      else {
        throw new Error("Format de fichier non pris en charge. Veuillez glisser votre fichier ZIP Instagram.");
      }

      if (followers.length === 0 && following.length === 0) {
        throw new Error("Aucune donnée d'abonnés ou d'abonnements n'a pu être extraite.");
      }

      // 4. Lancer l'analyse
      const result = analyzeSnapshot(followers, following);
      setAnalysis(result);
      setSuccess("Analyse terminée avec succès !");
      setActiveTab("nonFollowers");
    } catch (err: any) {
      setError(err.message || "Une erreur s'est produite lors de la lecture du fichier.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Charger directement un snapshot de l'historique
  const handleLoadSnapshot = (snapshot: SavedSnapshot) => {
    setError(null);
    setSuccess(`Instantané "${snapshot.label}" chargé depuis l'historique local.`);
    const result = analyzeSnapshot(snapshot.followers, snapshot.following);
    setAnalysis(result);
    setFollowersComparison(null);
    setFollowingComparison(null);
    setComparedWithLabel(null);
    setCompareIdA("");
    setCompareIdB("");
    setActiveTab("nonFollowers");
  };

  // Gérer le Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropzoneRef.current) {
      dropzoneRef.current.classList.add("border-brand-cyan", "bg-brand-cyan/5");
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropzoneRef.current) {
      dropzoneRef.current.classList.remove("border-brand-cyan", "bg-brand-cyan/5");
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (dropzoneRef.current) {
      dropzoneRef.current.classList.remove("border-brand-cyan", "bg-brand-cyan/5");
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleZipFile(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleZipFile(files[0]);
    }
  };

  // Sauvegarder le snapshot actuel dans IndexedDB
  const handleSaveSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analysis) return;

    const label = snapshotLabel.trim() || `Instantané du ${new Date().toLocaleDateString("fr-FR")}`;
    const id = Date.now().toString();

    const snapshot: SavedSnapshot = {
      id,
      date: new Date().toISOString(),
      label,
      followersCount: analysis.stats.followersCount,
      followingCount: analysis.stats.followingCount,
      followers: analysis.followers,
      following: analysis.following,
    };

    try {
      await saveSnapshot(snapshot);
      setSnapshotLabel("");
      setSuccess("Instantané sauvegardé dans l'historique local !");
      await loadHistory();
    } catch (err) {
      setError("Erreur lors de la sauvegarde de l'instantané.");
      console.error(err);
    }
  };

  // Supprimer un snapshot d'historique
  const handleDeleteSnapshot = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Éviter de déclencher la comparaison accidentellement
    if (!confirm("Voulez-vous vraiment supprimer cet instantané de l'historique ?")) return;

    try {
      await deleteSnapshot(id);
      await loadHistory();
      if (compareIdA === id || compareIdB === id) {
        setFollowersComparison(null);
        setFollowingComparison(null);
        setComparedWithLabel(null);
        setCompareIdA("");
        setCompareIdB("");
        setActiveTab("nonFollowers");
      }
    } catch (err) {
      console.error("Erreur de suppression:", err);
    }
  };

  // Comparer deux snapshots dynamiquement et chronologiquement
  const performComparison = (idA: string, idB: string) => {
    setCompareIdA(idA);
    setCompareIdB(idB);

    if (!idA || !idB) {
      setFollowersComparison(null);
      setFollowingComparison(null);
      setComparedWithLabel(null);
      return;
    }

    const getSnap = (id: string) => {
      if (id === "active" && analysis) {
        return {
          label: "Archive importée",
          date: new Date().toISOString(),
          followers: analysis.followers,
          following: analysis.following
        };
      }
      const hist = history.find(h => h.id === id);
      if (hist) {
        return {
          label: hist.label,
          date: hist.date,
          followers: hist.followers,
          following: hist.following
        };
      }
      return null;
    };

    const snapA = getSnap(idA);
    const snapB = getSnap(idB);

    if (!snapA || !snapB) return;

    // Détermination automatique de la chronologie (du plus ancien au plus récent)
    const isAOlder = new Date(snapA.date).getTime() <= new Date(snapB.date).getTime();
    const older = isAOlder ? snapA : snapB;
    const newer = isAOlder ? snapB : snapA;

    const compFollowers = compareSnapshots(older.followers, newer.followers);
    const compFollowing = compareSnapshots(older.following || [], newer.following || []);

    // Le libellé affiche toujours le sens chronologique pour plus de clarté
    const labelDirection = isAOlder ? `${snapA.label} ➜ ${snapB.label}` : `${snapB.label} ➜ ${snapA.label}`;

    setFollowersComparison(compFollowers);
    setFollowingComparison(compFollowing);
    setComparedWithLabel(labelDirection);
    setActiveTab("comparison");

    // Animer le scroll vers les résultats de comparaison
    setTimeout(() => {
      const compView = document.getElementById("comparison-results-view");
      if (compView) {
        compView.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleCompareWith = (oldSnapshot: SavedSnapshot) => {
    performComparison("active", oldSnapshot.id);
  };

  // --- FILTRAGE DE LISTE ACTIVE ---
  const getActiveList = (): InstagramUser[] => {
    if (!analysis) return [];
    switch (activeTab) {
      case "nonFollowers":
        return analysis.nonFollowersBack;
      case "fans":
        return analysis.fans;
      case "mutuals":
        return analysis.mutuals;
      case "followers":
        return analysis.followers;
      case "following":
        return analysis.following;
      default:
        return [];
    }
  };

  const activeList = getActiveList();
  
  // Filtrer par recherche
  const filteredList = activeList.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full relative" role="main">
      {/* Background Glowing Orbs */}
      <div className="glow-orb w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-brand-purple/10 top-1/4 left-1/10"></div>
      <div className="glow-orb w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] bg-brand-cyan/5 bottom-1/4 right-1/10"></div>

      {/* --- ZONE D'IMPORT & LANDING PAGE (Si aucune donnée active) --- */}
      {!analysis && (
        <div className="space-y-12 py-6 animate-fade-in">
          {/* En-tête de bienvenue */}
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight Outfit text-glow bg-gradient-to-r from-text-primary via-brand-indigo to-brand-purple bg-clip-text text-transparent">
              Analysez votre compte Instagram en toute sécurité
            </h1>
            <p className="text-text-secondary max-w-2xl mx-auto text-sm sm:text-base Inter">
              Comparez l'évolution de vos abonnés et repérez les non-abonnés en retour de manière 
              <strong className="text-text-primary font-semibold"> 100% locale et privée</strong>. Aucun mot de passe requis, aucune donnée ne quitte votre ordinateur.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start w-full">
            {/* Colonne Gauche: Upload ZIP + Guide d'aide */}
            <div className="space-y-6">
              {/* Formulaire Dropzone */}
              <div
                ref={dropzoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="border-2 border-dashed border-border-glass rounded-2xl p-10 sm:p-14 bg-bg-card backdrop-blur-md glass-panel flex flex-col items-center justify-center space-y-4 cursor-pointer group hover:border-brand-purple/50 relative overflow-hidden transition-all duration-300 shadow-glow"
              >
                {loading ? (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-4 border-brand-purple/20 border-t-brand-purple animate-spin"></div>
                      <Sparkles className="w-6 h-6 text-brand-cyan animate-pulse" />
                    </div>
                    <div className="space-y-1 text-center">
                      <h3 className="font-semibold text-lg text-text-primary Outfit">Traitement de l'archive en cours...</h3>
                      <p className="text-text-muted text-xs">Décompression et parsing des fichiers locaux...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="radar-line"></div>
                    <div className="w-14 h-14 rounded-full bg-brand-purple/10 flex items-center justify-center border border-brand-purple/20 group-hover:scale-110 group-hover:bg-brand-purple/20 transition-all duration-300">
                      <Upload className="w-6 h-6 text-brand-purple" />
                    </div>
                    <div className="space-y-1 text-center">
                      <h3 className="font-semibold text-lg text-text-primary Outfit">
                        Glissez votre fichier ZIP Instagram ici
                      </h3>
                      <p className="text-text-muted text-xs sm:text-sm">
                        ou <span className="text-brand-cyan group-hover:underline">parcourez vos fichiers</span>
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".zip"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      aria-label="Sélectionner le fichier ZIP Instagram"
                    />
                  </>
                )}
              </div>

              {/* Alertes d'Erreurs / Succès temporaires */}
              {error && (
                <div className="flex items-center space-x-2.5 px-4 py-3 rounded-lg bg-brand-rose/10 border border-brand-rose/20 text-brand-rose text-sm justify-center w-full animate-pulse">
                  <FileWarning className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Guide explicatif enrichi */}
              <div className="glass-panel rounded-2xl p-6 text-left space-y-4 border border-border-glass">
                <h4 className="font-bold text-sm text-text-primary uppercase tracking-wider flex items-center space-x-2 Outfit">
                  <AlertCircle className="w-4 h-4 text-brand-purple" />
                  <span>Comment obtenir votre archive Instagram ?</span>
                </h4>
                <div className="text-xs text-text-secondary space-y-4 Inter leading-relaxed">
                  <div className="space-y-2">
                    <p className="font-semibold text-text-primary">📱 Option A : Depuis l'application mobile (iOS / Android)</p>
                    <ol className="list-decimal list-inside pl-2 space-y-1">
                      <li>Rendez-vous sur votre profil ➜ Appuyez sur le menu principal <strong className="text-text-primary">☰</strong> (en haut à droite).</li>
                      <li>Sélectionnez <strong className="text-text-primary">Votre activité</strong> ➜ <strong className="text-text-primary">Télécharger vos informations</strong>.</li>
                      <li>Appuyez sur <strong className="text-brand-purple font-semibold">Demander un téléchargement</strong> ➜ Choisissez votre profil.</li>
                      <li>Sélectionnez <strong className="text-text-primary">Sélectionner les types d'informations</strong> ➜ Cochez uniquement <strong className="text-brand-purple font-semibold">Abonnés et abonnements</strong>.</li>
                      <li>Configurez : Format = <strong className="text-brand-cyan font-bold">JSON</strong> (Recommandé), Qualité = Moyenne (Recommandé, plus rapide), Période = Tout le temps.</li>
                      <li>Appuyez sur Envoyer. Instagram génère l'archive en moins de 2 minutes et vous envoie un lien.</li>
                    </ol>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-text-primary">💻 Option B : Depuis un navigateur (Ordinateur)</p>
                    <ol className="list-decimal list-inside pl-2 space-y-1">
                      <li>Allez dans Paramètres ⚙️ ➜ <strong className="text-text-primary">Centre des comptes</strong>.</li>
                      <li>Sélectionnez <strong className="text-text-primary">Vos informations et autorisations</strong> ➜ <strong className="text-text-primary">Télécharger vos informations</strong>.</li>
                      <li>Suivez les mêmes étapes (Téléchargement partiel ➜ Cochez <strong className="text-brand-purple">Abonnés et abonnements</strong> ➜ format <strong className="text-brand-cyan">JSON</strong>).</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne Droite: Historique + FAQ */}
            <div className="space-y-6">
              {/* Accès rapide à l'historique */}
              {history.length > 0 && (
                <div className="glass-panel p-6 rounded-2xl border border-brand-purple/20 bg-brand-purple/5 space-y-4 shadow-glow animate-fade-in">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-brand-purple" />
                    <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider Outfit">
                      Continuer avec une sauvegarde existante
                    </h3>
                  </div>
                  <p className="text-xs text-text-secondary Inter">
                    Vous avez déjà sauvegardé des instantanés d'audience sur cet appareil. Cliquez sur l'un d'eux pour charger ses données directement :
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {history.slice(0, 4).map((snapshot) => (
                      <div
                        key={snapshot.id}
                        onClick={() => handleLoadSnapshot(snapshot)}
                        className="p-3.5 rounded-xl border bg-bg-card border-border-glass hover:border-brand-purple/50 hover:bg-bg-item-hover transition-all duration-200 cursor-pointer flex items-center justify-between group animate-fade-in"
                      >
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <h4 className="font-bold text-xs text-text-secondary group-hover:text-text-primary truncate Outfit">
                            {snapshot.label}
                          </h4>
                          <p className="text-[10px] text-text-muted">
                            {new Date(snapshot.date).toLocaleDateString("fr-FR")} • {snapshot.followersCount} abonnés
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-brand-purple group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQ */}
              <div className="glass-panel rounded-2xl p-6 text-left space-y-4 border border-border-glass">
                <h4 className="font-bold text-sm text-text-primary uppercase tracking-wider flex items-center space-x-2 Outfit">
                  <HelpCircle className="w-4 h-4 text-brand-cyan" />
                  <span>Foire Aux Questions (FAQ)</span>
                </h4>
                <div className="space-y-4 text-xs text-text-secondary Inter leading-relaxed">
                  <div className="space-y-1">
                    <h5 className="font-bold text-text-primary">🛡️ Est-ce sécurisé pour mon compte Instagram ?</h5>
                    <p>Absolument. Contrairement aux applications tierces qui demandent vos identifiants (mot de passe) et risquent de bloquer ou de pirater votre compte, InstaShift n'utilise aucun mot de passe. Tout le traitement se fait hors-ligne dans votre navigateur.</p>
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-text-primary">📂 Mes données d'audience sont-elles envoyées sur internet ?</h5>
                    <p>Non. C'est un outil statique 100% local. Vos fichiers ZIP et vos listes d'abonnés restent intégralement sur votre ordinateur. Aucun serveur externe n'est utilisé. Les instantanés d'historique que vous sauvegardez sont enregistrés uniquement dans la base IndexedDB locale de votre propre navigateur.</p>
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-text-primary">📊 Pourquoi mon compteur de "suivis" Instagram (ex: 191) diffère du site (ex: 193) ?</h5>
                    <p>L'export officiel d'Instagram contient tous vos abonnements bruts stockés dans leur base de données. Cependant, l'application mobile Instagram masque d'elle-même les comptes temporairement suspendus, restreints ou désactivés. InstaShift vous montre la liste brute réelle.</p>
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-text-primary">🔄 Comment fonctionne la répartition et la cohérence des compteurs (Mutuels, Sans retour, Fans) ?</h5>
                    <p>La répartition mathématique est logique et stricte :
                      <br />• <strong>Vos Abonnements (Suivis)</strong> = Abonnements Mutuels + Non-abonnés en retour (Sans retour).
                      <br />• <strong>Vos Abonnés (Followers)</strong> = Abonnements Mutuels + Fans.
                      <br />Par exemple, si vous suivez 193 personnes (Abonnements) et que 190 personnes vous suivent (Abonnés), avec 170 abonnements mutuels, vous aurez précisément 23 personnes sans retour (193 - 170) et 20 fans (190 - 170). Tout se recoupe et s'explique parfaitement.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-text-primary">📉 Pourquoi mon nombre d'abonnés ou d'abonnements affiché est-il très inférieur à la réalité de mon compte Instagram ?</h5>
                    <p>Cela se produit généralement si vous avez demandé un <strong>export de données partiel ou limité dans le temps</strong> (par exemple, uniquement les 3 derniers mois ou la dernière semaine) au lieu de sélectionner <strong>"Tout le temps"</strong> dans les options de période lors de votre demande de téléchargement sur Instagram. Votre fichier ZIP ne contient alors qu'une partie de vos données. Pour y remédier, relancez simplement une demande d'archive complète sur Instagram en veillant à sélectionner "Tout le temps".</p>
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-text-primary">🗑️ Puis-je voir des détails sur les comptes supprimés (ex: @compte_desactive) ?</h5>
                    <p>Le fichier ZIP d'Instagram ne contient que le snapshot instantané de votre compte à un instant T. Il n'indique pas qui a supprimé son compte. C'est pour cela qu'InstaShift propose de sauvegarder des instantanés locaux : en les comparant, vous verrez précisément quel compte n'existe plus.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DASHBOARD ACTIF (Si données chargées) --- */}
      {analysis && (
        <div ref={dashboardRef} className="space-y-8">
          
          {/* En-tête du Dashboard */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-glass pb-6 animate-fade-in">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold Outfit text-glow">
                Dashboard d'Audience
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Analyse active de votre compte • Données 100% locales et privées
              </p>
            </div>
            
            {/* Formulaire Sauvegarde Snapshot */}
            <form onSubmit={handleSaveSnapshot} className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nom de l'instantané..."
                  value={snapshotLabel}
                  onChange={(e) => setSnapshotLabel(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg glass-input w-48 Outfit"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-purple text-white flex items-center space-x-1.5 hover:bg-brand-purple/80 shadow-glow cursor-pointer transition-all duration-200"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Sauvegarder</span>
              </button>
            </form>
          </div>

          {/* Alertes d'état */}
          {success && (
            <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald text-sm max-w-xl mx-auto animate-fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{success}</span>
              </div>
              <button onClick={() => setSuccess(null)} className="text-xs hover:underline ml-4">Fermer</button>
            </div>
          )}

          {/* --- GRILLE DE STATISTIQUES (STAT GRID) --- */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 animate-fade-in">
            {/* 1. Followers */}
            <div 
              onClick={() => setActiveTab("followers")}
              className={`glass-panel p-5 rounded-2xl cursor-pointer select-none relative overflow-hidden group ${activeTab === "followers" ? "border-brand-purple shadow-glow" : "border-border-glass"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider Outfit">Abonnés</span>
                <Users className="w-4 h-4 text-brand-purple" />
              </div>
              <h2 className="text-3xl font-extrabold mt-3 bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent Outfit">
                {analysis.stats.followersCount}
              </h2>
              <div className="mt-1 flex items-center justify-between text-[10px] text-text-muted">
                <span>Profils qui vous suivent</span>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
              </div>
            </div>

            {/* 2. Following */}
            <div 
              onClick={() => setActiveTab("following")}
              className={`glass-panel p-5 rounded-2xl cursor-pointer select-none relative overflow-hidden group ${activeTab === "following" ? "border-brand-cyan shadow-glow-cyan" : "border-border-glass"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider Outfit">Abonnements</span>
                <UserCheck className="w-4 h-4 text-brand-cyan" />
              </div>
              <h2 className="text-3xl font-extrabold mt-3 bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent Outfit">
                {analysis.stats.followingCount}
              </h2>
              <div className="mt-1 flex items-center justify-between text-[10px] text-text-muted">
                <span>Profils suivis par vous</span>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
              </div>
            </div>

            {/* 3. Non-followers Back */}
            <div 
              onClick={() => setActiveTab("nonFollowers")}
              className={`glass-panel p-5 rounded-2xl cursor-pointer select-none relative overflow-hidden group ${activeTab === "nonFollowers" ? "border-brand-rose border-glow-purple shadow-glow" : "border-border-glass"}`}
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-brand-rose/5 rounded-bl-full -z-10"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider Outfit">Sans retour</span>
                <UserX className="w-4 h-4 text-brand-rose" />
              </div>
              <h2 className="text-3xl font-extrabold mt-3 text-brand-rose Outfit text-glow">
                {analysis.stats.nonFollowersBackCount}
              </h2>
              <div className="mt-1 flex items-center justify-between text-[10px] text-text-muted">
                <span>Ils ne vous suivent pas en retour</span>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
              </div>
            </div>

            {/* 4. Fans */}
            <div 
              onClick={() => setActiveTab("fans")}
              className={`glass-panel p-5 rounded-2xl cursor-pointer select-none relative overflow-hidden group ${activeTab === "fans" ? "border-brand-emerald border-glow-cyan shadow-glow-cyan" : "border-border-glass"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider Outfit">Fans</span>
                <Sparkles className="w-4 h-4 text-brand-emerald" />
              </div>
              <h2 className="text-3xl font-extrabold mt-3 text-brand-emerald Outfit">
                {analysis.stats.fansCount}
              </h2>
              <div className="mt-1 flex items-center justify-between text-[10px] text-text-muted">
                <span>Vous ne les suivez pas en retour</span>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
              </div>
            </div>

            {/* 5. Ratio Mutuels */}
            <div 
              onClick={() => setActiveTab("mutuals")}
              className={`glass-panel p-5 rounded-2xl cursor-pointer select-none relative overflow-hidden group ${activeTab === "mutuals" ? "border-brand-purple shadow-glow" : "border-border-glass"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider Outfit">Mutuels</span>
                <ArrowUpDown className="w-4 h-4 text-brand-purple" />
              </div>
              <h2 className="text-3xl font-extrabold mt-3 bg-gradient-to-r from-brand-purple to-brand-cyan bg-clip-text text-transparent Outfit">
                {analysis.stats.mutualsCount}
              </h2>
              <div className="mt-1 flex items-center justify-between text-[10px] text-text-muted">
                <span>Abonnements mutuels ({analysis.stats.followBackRatio}%)</span>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
              </div>
            </div>
          </div>

          {/* --- GRAPHIQUE DE CROISSANCE --- */}
          <GrowthChart followers={analysis.followers} following={analysis.following} />

          {/* --- PANNEAU DE HISTORIQUE & COMPARAISON TEMPORELLE --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">
            
            {/* Colonne Gauche : Historique IndexedDB */}
            <div className="glass-panel p-6 rounded-2xl border border-border-glass space-y-6 lg:col-span-1">
              <div>
                <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider flex items-center space-x-2 Outfit">
                  <Calendar className="w-4 h-4 text-brand-purple" />
                  <span>Historique des instantanés</span>
                </h3>
                <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                  Sélectionnez un instantané ci-dessous pour le comparer à votre analyse en cours et découvrir vos nouveaux abonnés et désabonnements.
                </p>
              </div>

              {history.length === 0 ? (
                <div className="py-8 text-center text-xs text-text-muted border border-dashed border-border-glass rounded-xl bg-bg-item select-none">
                  Aucun historique sauvegardé localement.
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {history.map((snapshot) => (
                    <div
                      key={snapshot.id}
                      onClick={() => handleCompareWith(snapshot)}
                      className={`p-3 rounded-xl border bg-bg-item hover:bg-bg-item-hover cursor-pointer flex items-center justify-between group transition-all duration-200 ${(compareIdA === snapshot.id && compareIdB === "active") ? "border-brand-purple bg-brand-purple/5" : "border-border-glass"}`}
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs text-text-secondary Outfit truncate max-w-[140px] group-hover:text-text-primary">
                          {snapshot.label}
                        </h4>
                        <p className="text-[9px] text-text-muted">
                          {new Date(snapshot.date).toLocaleDateString("fr-FR")} • {snapshot.followersCount} Abonnés
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-brand-purple/20 text-brand-purple border border-brand-purple/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          Comparer
                        </span>
                        <button
                          onClick={(e) => handleDeleteSnapshot(snapshot.id, e)}
                          className="p-1 rounded text-text-muted hover:text-brand-rose hover:bg-brand-rose/10 transition-all duration-200"
                          title="Supprimer cet instantané"
                          aria-label="Supprimer instantané"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bouton pour réinitialiser et uploader un autre ZIP */}
              <button
                onClick={() => {
                  setAnalysis(null);
                  setError(null);
                  setSuccess(null);
                  setFollowersComparison(null);
                  setFollowingComparison(null);
                  setComparedWithLabel(null);
                  setCompareIdA("");
                  setCompareIdB("");
                }}
                className="w-full py-2 border border-border-glass hover:border-brand-purple/40 hover:bg-brand-purple/5 text-text-secondary hover:text-text-primary rounded-xl text-xs font-semibold Outfit tracking-wide cursor-pointer transition-all duration-300"
              >
                Uploader une autre archive
              </button>
            </div>

            {/* Colonne Droite : Listes de Profils et Comparaison */}
            <div className="glass-panel p-6 rounded-2xl border border-border-glass lg:col-span-2 space-y-6 flex flex-col min-h-[480px]">
              
              {/* --- VUE COMPARATIVE ACTIVE --- */}
              {activeTab === "comparison" && followersComparison && followingComparison ? (
                (() => {
                  const currentComparison = comparisonTab === "followers" ? followersComparison : followingComparison;
                  return (
                    <div id="comparison-results-view" className="space-y-6 flex flex-col h-full animate-fade-in">
                      <div className="space-y-4 border-b border-border-glass pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-base text-text-primary Outfit flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-brand-purple animate-pulse" />
                              <span>Évolution temporelle</span>
                            </h3>
                            <p className="text-xs text-text-secondary mt-1">
                              Comparaison : <strong className="text-brand-cyan">{comparedWithLabel}</strong>
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold Outfit">
                            <div className="flex items-center space-x-1.5 text-brand-emerald">
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>+{currentComparison.stats.incomingCount}</span>
                            </div>
                            <div className="flex items-center space-x-1.5 text-brand-rose">
                              <UserMinus className="w-3.5 h-3.5" />
                              <span>-{currentComparison.stats.outgoingCount}</span>
                            </div>
                            {currentComparison.stats.usernameChangesCount ? (
                              <div className="flex items-center space-x-1.5 text-brand-purple" title="Pseudonymes modifiés">
                                <ArrowUpDown className="w-3.5 h-3.5" />
                                <span>{currentComparison.stats.usernameChangesCount}</span>
                              </div>
                            ) : null}
                            <div className={`px-2 py-0.5 rounded ${currentComparison.stats.netChange >= 0 ? "bg-brand-emerald/10 text-brand-emerald" : "bg-brand-rose/10 text-brand-rose"}`}>
                              Net : {currentComparison.stats.netChange >= 0 ? "+" : ""}{currentComparison.stats.netChange}
                            </div>
                          </div>
                        </div>

                        {/* Sélecteur Comparatif Bidirectionnel */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-bg-item p-3 rounded-xl border border-border-glass">
                          <div className="flex-1 flex items-center gap-2 text-xs">
                            <span className="text-text-secondary font-medium whitespace-nowrap">Instant A (Récent) :</span>
                            <select
                              value={compareIdA}
                              onChange={(e) => performComparison(e.target.value, compareIdB)}
                              className="flex-1 px-2 py-1.5 rounded-lg border border-border-glass bg-bg-card text-text-primary Outfit cursor-pointer"
                            >
                              <option value="" disabled>Sélectionner...</option>
                              {analysis && <option value="active">Archive importée</option>}
                              {history.map(h => (
                                <option key={h.id} value={h.id}>{h.label} ({new Date(h.date).toLocaleDateString("fr-FR")})</option>
                              ))}
                            </select>
                          </div>
                          <div className="hidden sm:block text-text-muted text-xs font-bold font-mono">⚡</div>
                          <div className="flex-1 flex items-center gap-2 text-xs">
                            <span className="text-text-secondary font-medium whitespace-nowrap">Instant B (Ancien) :</span>
                            <select
                              value={compareIdB}
                              onChange={(e) => performComparison(compareIdA, e.target.value)}
                              className="flex-1 px-2 py-1.5 rounded-lg border border-border-glass bg-bg-card text-text-primary Outfit cursor-pointer"
                            >
                              <option value="" disabled>Sélectionner...</option>
                              {analysis && <option value="active">Archive importée</option>}
                              {history.map(h => (
                                <option key={h.id} value={h.id}>{h.label} ({new Date(h.date).toLocaleDateString("fr-FR")})</option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={() => performComparison(compareIdB, compareIdA)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-bg-card border border-border-glass hover:bg-bg-item-hover text-text-secondary hover:text-text-primary transition-all duration-200 cursor-pointer self-stretch sm:self-auto text-center"
                            title="Intervertir les deux instantanés"
                            type="button"
                          >
                            Intervertir
                          </button>
                        </div>

                        {/* Commutateur d'onglets de comparaison */}
                        <div className="flex items-center rounded-xl overflow-hidden border border-border-glass text-[11px] bg-bg-item p-0.5 max-w-xs sm:max-w-sm">
                          <button
                            onClick={() => setComparisonTab("followers")}
                            className={`flex-1 py-1.5 px-2 font-semibold Outfit transition-all duration-200 cursor-pointer text-center rounded-lg ${
                              comparisonTab === "followers"
                                ? "bg-brand-purple text-white shadow-glow"
                                : "bg-transparent text-text-secondary hover:bg-bg-item-hover"
                            }`}
                          >
                            Abonnés (+{followersComparison.stats.incomingCount}/-{followersComparison.stats.outgoingCount})
                          </button>
                          <button
                            onClick={() => setComparisonTab("following")}
                            className={`flex-1 py-1.5 px-2 font-semibold Outfit transition-all duration-200 cursor-pointer text-center rounded-lg ${
                              comparisonTab === "following"
                                ? "bg-brand-purple text-white shadow-glow"
                                : "bg-transparent text-text-secondary hover:bg-bg-item-hover"
                            }`}
                          >
                            Abonnements (+{followingComparison.stats.incomingCount}/-{followingComparison.stats.outgoingCount})
                          </button>
                        </div>
                      </div>

                      {/* Doubles listes : Entrants & Sortants */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                        
                        {/* Entrants (Vert) */}
                        <div className="space-y-3 flex flex-col">
                          <h4 className="font-bold text-xs text-brand-emerald flex items-center space-x-1.5 border-b border-brand-emerald/20 pb-2 Outfit flex-shrink-0">
                            <UserPlus className="w-4 h-4" />
                            <span>
                              {comparisonTab === "followers" ? "Nouveaux abonnés" : "Nouveaux abonnements"} ({currentComparison.stats.incomingCount})
                            </span>
                          </h4>
                          <div className="overflow-y-auto max-h-[300px] pr-1 space-y-1.5 flex-1">
                            {currentComparison.stats.incomingCount === 0 ? (
                              <p className="text-xs text-text-muted py-8 text-center select-none">
                                {comparisonTab === "followers" ? "Aucun nouvel abonné." : "Aucun nouvel abonnement."}
                              </p>
                            ) : (
                              currentComparison.incoming.map((user) => (
                                <a
                                  key={user.username}
                                  href={user.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block p-2.5 rounded-xl bg-brand-emerald/5 border border-brand-emerald/10 hover:bg-brand-emerald/10 hover:border-brand-emerald/20 text-xs font-semibold text-text-secondary hover:text-text-primary transition-all duration-200 truncate"
                                >
                                  @{user.username}
                                </a>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Sortants (Rouge) */}
                        <div className="space-y-3 flex flex-col">
                          <h4 className="font-bold text-xs text-brand-rose flex items-center space-x-1.5 border-b border-brand-rose/20 pb-2 Outfit flex-shrink-0">
                            <UserMinus className="w-4 h-4" />
                            <span>
                              {comparisonTab === "followers" ? "Désabonnements" : "Comptes suivis retirés"} ({currentComparison.stats.outgoingCount})
                            </span>
                          </h4>
                          <div className="overflow-y-auto max-h-[300px] pr-1 space-y-1.5 flex-1">
                            {currentComparison.stats.outgoingCount === 0 ? (
                              <p className="text-xs text-text-muted py-8 text-center select-none">
                                {comparisonTab === "followers" ? "Aucun désabonnement." : "Aucun retrait d'abonnement."}
                              </p>
                            ) : (
                              currentComparison.outgoing.map((user) => (
                                <a
                                  key={user.username}
                                  href={user.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block p-2.5 rounded-xl bg-brand-rose/5 border border-brand-rose/10 hover:bg-brand-rose/10 hover:border-brand-rose/20 text-xs font-semibold text-text-secondary hover:text-text-primary transition-all duration-200 truncate"
                                >
                                  @{user.username}
                                </a>
                              ))
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Liste des changements de pseudonyme */}
                      {currentComparison.usernameChanges && currentComparison.usernameChanges.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-border-glass flex-shrink-0">
                          <h4 className="font-bold text-xs text-brand-purple flex items-center space-x-1.5 border-b border-brand-purple/20 pb-2 Outfit">
                            <ArrowUpDown className="w-4 h-4" />
                            <span>Changements de pseudo ({currentComparison.stats.usernameChangesCount})</span>
                          </h4>
                          <div className="overflow-y-auto max-h-[160px] pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {currentComparison.usernameChanges.map((change) => (
                              <div
                                key={change.newUsername}
                                className="p-2.5 rounded-xl border border-brand-purple/10 bg-brand-purple/5 flex items-center justify-between text-xs font-medium text-text-secondary"
                              >
                                <span className="truncate">
                                  <span className="text-text-muted text-[10px]">@{change.oldUsername}</span>
                                  <span className="mx-2 text-brand-purple font-bold">➜</span>
                                  <a
                                    href={change.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline text-text-primary font-bold"
                                  >
                                    @{change.newUsername}
                                  </a>
                                </span>
                                <span className="text-[9px] text-text-muted flex-shrink-0 ml-2">
                                  {new Date(change.timestamp * 1000).toLocaleDateString("fr-FR")}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })()
              ) : (
                /* --- VUE STANDARD PAR ONGLET (Listes normales) --- */
                <div className="space-y-6 flex flex-col h-full flex-1">
                  
                  {/* Barre de Recherche et Onglet Actif */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-glass pb-4 gap-4">
                    <div>
                      <h3 className="font-bold text-base text-text-primary Outfit capitalize">
                        {activeTab === "nonFollowers" && "Sans Retour (Ne vous suivent pas)"}
                        {activeTab === "fans" && "Fans (Vous ne les suivez pas)"}
                        {activeTab === "mutuals" && "Abonnés Mutuels"}
                        {activeTab === "followers" && "Liste des Abonnés"}
                        {activeTab === "following" && "Liste des Abonnements"}
                      </h3>
                      <p className="text-xs text-text-muted mt-1 leading-none">
                        Total : {filteredList.length} profils trouvés
                      </p>
                    </div>

                    {/* input de recherche */}
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
                      <input
                        type="text"
                        placeholder="Rechercher par pseudo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl glass-input Outfit border border-border-glass"
                      />
                    </div>
                  </div>

                  {/* Liste d'abonnés */}
                  {filteredList.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-16 text-center space-y-2 select-none">
                      <div className="w-12 h-12 rounded-full bg-bg-item flex items-center justify-center border border-border-glass">
                        <Users className="w-5 h-5 text-text-muted" />
                      </div>
                      <h4 className="font-semibold text-sm text-text-secondary Outfit">Aucun profil trouvé</h4>
                      <p className="text-[10px] text-text-muted">Essayez d'ajuster votre recherche.</p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-between">
                      {/* Grid de profils */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                        {filteredList.slice(0, displayLimit).map((user) => (
                          <a
                            key={user.username}
                            href={user.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 rounded-xl border border-border-glass bg-bg-item hover:bg-bg-item-hover hover:border-border-glass-hover flex items-center justify-between group transition-all duration-200"
                          >
                            <div className="space-y-0.5 truncate">
                              <span className="font-bold text-xs text-text-secondary group-hover:text-text-primary Outfit block truncate">
                                @{user.username}
                              </span>
                              <span className="text-[9px] text-text-muted block font-medium">
                                Suivi le {new Date(user.timestamp * 1000).toLocaleDateString("fr-FR")}
                              </span>
                            </div>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              Voir le profil
                            </span>
                          </a>
                        ))}
                      </div>

                      {/* Pagination simple si nécessaire */}
                      {filteredList.length > displayLimit && (
                        <div className="mt-4 pt-4 border-t border-border-glass text-center">
                          <button
                            onClick={() => setDisplayLimit((prev) => prev + 50)}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-bg-item border border-border-glass hover:bg-bg-item-hover hover:border-border-glass-hover text-text-secondary hover:text-text-primary transition-all duration-200 cursor-pointer"
                          >
                            Charger plus...
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </main>
  );
}
