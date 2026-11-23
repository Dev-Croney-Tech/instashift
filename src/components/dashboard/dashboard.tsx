"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { extractInstaFiles, extractLooseInstaFiles } from "@/utils/zip-parser";
import {
  InstagramUser,
  parseInstagramHTML,
  parseInstagramJSON,
} from "@/utils/insta-parser";
import {
  AnalysisResult,
  ComparisonResult,
  analyzeSnapshot,
  compareSnapshots,
} from "@/utils/analyzer";
import {
  SavedSnapshot,
  clearAllSnapshots,
  deleteSnapshot,
  getAllSnapshots,
  importSnapshotsFromJson,
  saveSnapshot,
} from "@/utils/db";
import { generateDemoDataset } from "@/lib/demo-data";
import { DropzoneWorkbench } from "./dropzone-workbench";
import KpiStrip from "./kpi-strip";
import GrowthChart from "./growth-chart";
import { SnapshotDiffPanel } from "./snapshot-diff-panel";
import { AccountExplorer, ExplorerTab } from "./account-explorer";

interface SessionTelemetry {
  sourceLabel: string;
  format: "json" | "html" | "demo" | "snapshot";
  fileSizeKb: number;
  parseTimeMs: number;
  filesProcessed: number;
  isDemo: boolean;
}

export default function Dashboard() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<ExplorerTab>("nonFollowers");
  const [telemetry, setTelemetry] = useState<SessionTelemetry | null>(null);

  // Historique IndexedDB + Snapshot virtuel de démo
  const [dbHistory, setDbHistory] = useState<SavedSnapshot[]>([]);
  const [demoBaseSnapshot, setDemoBaseSnapshot] = useState<SavedSnapshot | null>(null);
  const [currentSnapshotId, setCurrentSnapshotId] = useState<string | null>(null);

  // Sélecteurs du Comparateur Git Diff (Base -> Cible)
  const [baseSnapshotId, setBaseSnapshotId] = useState<string>("");
  const [targetSnapshotId, setTargetSnapshotId] = useState<string>("current");

  // Sauvegarde d'un nouveau snapshot dans IndexedDB
  const [snapshotLabel, setSnapshotLabel] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const snaps = await getAllSnapshots();
      setDbHistory(snaps);
      return snaps;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    let active = true;
    getAllSnapshots()
      .then((snaps) => {
        if (active) {
          setDbHistory(snaps);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Liste combinée des snapshots disponibles (incluant la base démo si le mode démo est actif)
  const availableSnapshots = useMemo(() => {
    if (demoBaseSnapshot) {
      const filtered = dbHistory.filter((s) => s.id !== demoBaseSnapshot.id);
      return [demoBaseSnapshot, ...filtered];
    }
    return dbHistory;
  }, [dbHistory, demoBaseSnapshot]);

  // Réinitialisation complète de la session (retour au Workbench Dropzone)
  const handleResetWorkspace = useCallback(() => {
    setResult(null);
    setError(null);
    setTelemetry(null);
    setDemoBaseSnapshot(null);
    setCurrentSnapshotId(null);
    setBaseSnapshotId("");
    setTargetSnapshotId("current");
    setActiveTab("nonFollowers");
    setIsSaved(false);
    setStatusBanner(null);
  }, []);

  useEffect(() => {
    const onHeaderReset = () => handleResetWorkspace();
    window.addEventListener("instashift:reset", onHeaderReset);
    return () => window.removeEventListener("instashift:reset", onHeaderReset);
  }, [handleResetWorkspace]);

  // Résout la liste d'abonnés et le libellé d'un identifiant de snapshot ("current" ou ID)
  const resolveSnapshotData = useCallback(
    (id: string): { followers: InstagramUser[]; label: string } | null => {
      if (!id) return null;
      if (id === "current") {
        if (!result) return null;
        return {
          followers: result.followers,
          label: telemetry?.sourceLabel || "Session active",
        };
      }
      const found = availableSnapshots.find((s) => s.id === id);
      if (!found) return null;
      return {
        followers: found.followers,
        label: found.label,
      };
    },
    [result, telemetry, availableSnapshots]
  );

  // Calcul réactif du Git Diff selon l'ordre exact Base -> Cible choisi par l'utilisateur
  const comparisonData = useMemo((): {
    comparison: ComparisonResult | null;
    baseLabel: string;
    targetLabel: string;
  } => {
    if (!result || !baseSnapshotId || !targetSnapshotId) {
      return { comparison: null, baseLabel: "", targetLabel: "" };
    }
    if (baseSnapshotId === targetSnapshotId) {
      return { comparison: null, baseLabel: "", targetLabel: "" };
    }

    const baseObj = resolveSnapshotData(baseSnapshotId);
    const targetObj = resolveSnapshotData(targetSnapshotId);

    if (!baseObj || !targetObj) {
      return { comparison: null, baseLabel: "", targetLabel: "" };
    }

    return {
      comparison: compareSnapshots(baseObj.followers, targetObj.followers),
      baseLabel: baseObj.label,
      targetLabel: targetObj.label,
    };
  }, [result, baseSnapshotId, targetSnapshotId, resolveSnapshotData]);

  // Traitement des fichiers déposés (.zip ou plusieurs .json / .html)
  const handleFilesSelected = async (fileList: FileList) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setIsLoading(true);
    setError(null);
    setDemoBaseSnapshot(null);
    const t0 = performance.now();

    try {
      const zipFile = files.find((f) => f.name.toLowerCase().endsWith(".zip"));
      const extracted = zipFile
        ? await extractInstaFiles(zipFile)
        : await extractLooseInstaFiles(files);

      let followers: InstagramUser[] = [];
      let following: InstagramUser[] = [];

      if (
        extracted.followersFiles.length === 0 &&
        extracted.followingFiles.length === 0
      ) {
        throw new Error(
          "Aucun fichier followers_1.json / following.json (ou .html) n'a été trouvé dans votre sélection. Assurez-vous d'avoir exporté la section « Abonnés et suivi »."
        );
      }

      extracted.followersFiles.forEach((f) => {
        const parsed =
          f.format === "json"
            ? parseInstagramJSON(f.content)
            : parseInstagramHTML(f.content);
        followers = [...followers, ...parsed];
      });

      extracted.followingFiles.forEach((f) => {
        const parsed =
          f.format === "json"
            ? parseInstagramJSON(f.content)
            : parseInstagramHTML(f.content);
        following = [...following, ...parsed];
      });

      // Dédoublonnage de sécurité sur les fichiers followers_1, followers_2...
      const uniqueFollowers = new Map<string, InstagramUser>();
      followers.forEach((u) => {
        const key = u.username.toLowerCase();
        if (!uniqueFollowers.has(key)) {
          uniqueFollowers.set(key, u);
        }
      });
      followers = Array.from(uniqueFollowers.values());

      const uniqueFollowing = new Map<string, InstagramUser>();
      following.forEach((u) => {
        const key = u.username.toLowerCase();
        if (!uniqueFollowing.has(key)) {
          uniqueFollowing.set(key, u);
        }
      });
      following = Array.from(uniqueFollowing.values());

      if (followers.length === 0 && following.length === 0) {
        throw new Error(
          "Aucun compte valide n'a pu être extrait des fichiers fournis. Vérifiez que l'export contient bien les listes d'abonnés et d'abonnements."
        );
      }

      const detectedFormat =
        extracted.followersFiles[0]?.format ||
        extracted.followingFiles[0]?.format ||
        "json";

      const analysis = analyzeSnapshot(followers, following);
      const parseTimeMs = Math.max(1, Math.round(performance.now() - t0));

      setResult(analysis);
      setCurrentSnapshotId(null);
      setIsSaved(false);
      setActiveTab("nonFollowers");

      const dateLabel = new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      setSnapshotLabel(`Export du ${dateLabel}`);
      setTelemetry({
        sourceLabel: zipFile
          ? zipFile.name
          : `${files.length} fichier(s) (${detectedFormat.toUpperCase()})`,
        format: detectedFormat,
        fileSizeKb: extracted.fileSizeKb,
        parseTimeMs,
        filesProcessed: extracted.totalFilesCount,
        isDemo: false,
      });

      // Sélectionner automatiquement le snapshot le plus récent comme base de comparaison
      const latestSnaps = await loadHistory();
      if (latestSnaps.length > 0) {
        setBaseSnapshotId(latestSnaps[0].id);
        setTargetSnapshotId("current");
      } else {
        setBaseSnapshotId("");
        setTargetSnapshotId("current");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l'analyse des fichiers."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Mode Démo en 1 clic (instantané, réaliste, avec diff pré-configuré)
  const handleLoadDemo = () => {
    const demo = generateDemoDataset();
    const analysis = analyzeSnapshot(
      demo.currentFollowers,
      demo.currentFollowing
    );
    const demoLabel = "Démo — Export Oct. 2026";

    setError(null);
    setDemoBaseSnapshot(demo.previousSnapshot);
    setResult(analysis);
    setCurrentSnapshotId(null);
    setIsSaved(false);
    setSnapshotLabel(demoLabel);
    setTelemetry({
      sourceLabel: demoLabel,
      format: "demo",
      fileSizeKb: demo.fileSizeKb,
      parseTimeMs: demo.parseTimeMs,
      filesProcessed: 2,
      isDemo: true,
    });

    setBaseSnapshotId(demo.previousSnapshot.id);
    setTargetSnapshotId("current");
    setActiveTab("nonFollowers");
  };

  // Sauvegarde du snapshot courant dans IndexedDB
  const handleSaveCurrentSnapshot = async () => {
    if (!result) return;
    try {
      const id = `snap-${Date.now()}`;
      const newSnap: SavedSnapshot = {
        id,
        date: new Date().toISOString(),
        label:
          snapshotLabel.trim() ||
          `Export du ${new Date().toLocaleDateString("fr-FR")}`,
        followersCount: result.stats.followersCount,
        followingCount: result.stats.followingCount,
        followers: result.followers,
        following: result.following,
      };
      await saveSnapshot(newSnap);
      setIsSaved(true);
      setCurrentSnapshotId(id);
      const updated = await loadHistory();
      if (updated.length > 1) {
        const previous = updated.find((s) => s.id !== id);
        if (previous) {
          setBaseSnapshotId(previous.id);
          setTargetSnapshotId(id);
        }
      }
      setStatusBanner("Snapshot enregistré localement dans IndexedDB.");
      setTimeout(() => setStatusBanner(null), 3000);
    } catch {
      setError("Impossible d'enregistrer le snapshot dans IndexedDB.");
    }
  };

  // Chargement d'un snapshot existant depuis IndexedDB
  const handleSelectSnapshot = (snapshot: SavedSnapshot) => {
    const t0 = performance.now();
    const analysis = analyzeSnapshot(snapshot.followers, snapshot.following);
    const parseTimeMs = Math.max(1, Math.round(performance.now() - t0));

    setResult(analysis);
    setCurrentSnapshotId(snapshot.id);
    setIsSaved(true);
    setSnapshotLabel(snapshot.label);
    setTelemetry({
      sourceLabel: snapshot.label,
      format: "snapshot",
      fileSizeKb: Math.round(
        (JSON.stringify(snapshot).length / 1024) * 10
      ) / 10,
      parseTimeMs,
      filesProcessed: 1,
      isDemo: snapshot.id.startsWith("demo-"),
    });

    const olderSnapshot = availableSnapshots.find((s) => s.id !== snapshot.id);
    if (olderSnapshot) {
      setBaseSnapshotId(olderSnapshot.id);
      setTargetSnapshotId(snapshot.id);
    } else {
      setBaseSnapshotId(snapshot.id);
      setTargetSnapshotId(snapshot.id);
    }
  };

  // Suppression d'un snapshot individuel
  const handleDeleteSnapshot = async (id: string) => {
    if (demoBaseSnapshot && id === demoBaseSnapshot.id) {
      setDemoBaseSnapshot(null);
      return;
    }
    await deleteSnapshot(id);
    const updated = await loadHistory();
    if (baseSnapshotId === id) {
      setBaseSnapshotId(updated[0]?.id || "");
    }
    if (targetSnapshotId === id) {
      setTargetSnapshotId("current");
    }
  };

  // Purge complète d'IndexedDB (et de la base démo si active)
  const handleClearAllSnapshots = async () => {
    await clearAllSnapshots();
    setDbHistory([]);
    setDemoBaseSnapshot(null);
    setBaseSnapshotId("");
    setTargetSnapshotId("current");
    setStatusBanner("Tous les snapshots locaux ont été purgés.");
    setTimeout(() => setStatusBanner(null), 3000);
  };

  // Export de tous les snapshots disponibles (IndexedDB ou démo) en JSON
  const handleExportSnapshots = () => {
    const snapshotsToExport =
      dbHistory.length > 0 ? dbHistory : availableSnapshots;
    if (snapshotsToExport.length === 0) return;
    const blob = new Blob([JSON.stringify(snapshotsToExport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `instashift-snapshots-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Import d'un fichier JSON de snapshots
  const handleImportSnapshotsFile = async (file: File) => {
    try {
      const text = await file.text();
      const count = await importSnapshotsFromJson(text);
      await loadHistory();
      setStatusBanner(`${count} snapshot(s) importé(s) dans IndexedDB.`);
      setTimeout(() => setStatusBanner(null), 3500);
    } catch {
      setError("Le fichier JSON de snapshots est invalide ou corrompu.");
    }
  };

  // Changement manuel des sélecteurs Base / Cible
  const handleChangeDiffSelection = (baseId: string, targetId: string) => {
    setBaseSnapshotId(baseId);
    setTargetSnapshotId(targetId);
    if (activeTab !== "comparison") {
      setActiveTab("comparison");
    }
  };

  // Bouton Intervertir : inverse réellement Base et Cible sans écraser l'ordre
  const handleSwapDiffSelection = () => {
    if (!baseSnapshotId || !targetSnapshotId) return;
    const prevBase = baseSnapshotId;
    const prevTarget = targetSnapshotId;
    setBaseSnapshotId(prevTarget);
    setTargetSnapshotId(prevBase);
    if (activeTab !== "comparison") {
      setActiveTab("comparison");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {!result ? (
        <DropzoneWorkbench
          isDragging={isDragging}
          isLoading={isLoading}
          error={error}
          history={dbHistory}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFilesSelected(e.dataTransfer.files);
            }
          }}
          onFilesSelected={handleFilesSelected}
          onLoadDemo={handleLoadDemo}
          onSelectSnapshot={handleSelectSnapshot}
          onDeleteSnapshot={handleDeleteSnapshot}
        />
      ) : (
        <div className="space-y-6">
          {/* Barre supérieure du Workbench actif : télémétrie, sauvegarde IndexedDB & actions */}
          <div className="linear-panel rounded-lg p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-[#16181a] text-[#d0d6e0] border border-[rgba(255,255,255,0.08)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                  {telemetry?.isDemo ? "DATASET DÉMO" : "SESSION ACTIVE"}
                </span>
                {telemetry && (
                  <span className="text-[11px] font-mono text-[#8a8f98] tabular-nums">
                    {telemetry.format.toUpperCase()} · {telemetry.fileSizeKb} Ko ·{" "}
                    {telemetry.parseTimeMs} ms
                  </span>
                )}
              </div>
              <h1 className="text-lg sm:text-xl font-semibold tracking-[-0.02em] text-[#f7f8f8]">
                {telemetry?.sourceLabel || "Rapport d'inspection d'audience"}
              </h1>
            </div>

            {/* Contrôles de sauvegarde IndexedDB + Nouvelle analyse */}
            <div className="flex flex-wrap items-center gap-2">
              {!isSaved ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={snapshotLabel}
                    onChange={(e) => setSnapshotLabel(e.target.value)}
                    placeholder="Nom du snapshot..."
                    aria-label="Nom du snapshot à sauvegarder"
                    className="px-3 py-1.5 rounded-md text-[12px] font-mono linear-input w-48 sm:w-56"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCurrentSnapshot}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium bg-[#5e6ad2] hover:bg-[#6875e2] text-white transition-colors cursor-pointer"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                      />
                    </svg>
                    <span>Sauvegarder (IndexedDB)</span>
                  </button>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-mono bg-[rgba(52,211,153,0.12)] text-[#34d399] border border-[rgba(52,211,153,0.28)]">
                  ✓ Snapshot sauvegardé
                </span>
              )}

              <button
                type="button"
                onClick={handleResetWorkspace}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-mono bg-[#16181a] hover:bg-[#1c1e21] text-[#d0d6e0] border border-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
              >
                <span>Nouvel import</span>
              </button>
            </div>
          </div>

          {statusBanner && (
            <div className="px-4 py-2.5 rounded-md bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.28)] text-[12px] font-mono text-[#34d399]">
              {statusBanner}
            </div>
          )}

          {error && (
            <div className="px-4 py-2.5 rounded-md bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.28)] text-[12px] font-mono text-[#f87171]">
              {error}
            </div>
          )}

          {/* Bandeau des 4 KPI analytiques */}
          <KpiStrip
            analysis={result}
            activeTab={activeTab}
            onSelectTab={(tab) => setActiveTab(tab)}
            followersDelta={
              comparisonData.comparison
                ? comparisonData.comparison.stats.netChange
                : null
            }
          />

          {/* Grille Principale : Explorateur Haute Densité (8 col) + Télémétrie & Snapshots (4 col) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8">
              <AccountExplorer
                result={result}
                comparisonResult={comparisonData.comparison}
                baseLabel={comparisonData.baseLabel}
                targetLabel={comparisonData.targetLabel}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>

            <div className="lg:col-span-4 space-y-6">
              <GrowthChart
                followers={result.followers}
                following={result.following}
              />

              <SnapshotDiffPanel
                history={availableSnapshots}
                currentSnapshotId={currentSnapshotId}
                baseSnapshotId={baseSnapshotId}
                targetSnapshotId={targetSnapshotId}
                onSelectSnapshot={handleSelectSnapshot}
                onDeleteSnapshot={handleDeleteSnapshot}
                onClearAllSnapshots={handleClearAllSnapshots}
                onExportSnapshots={handleExportSnapshots}
                onImportSnapshotsFile={handleImportSnapshotsFile}
                onChangeDiffSelection={handleChangeDiffSelection}
                onSwapDiffSelection={handleSwapDiffSelection}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
