"use client";

import React, { useRef, useState } from "react";
import { SavedSnapshot, estimateSnapshotsSizeKb } from "@/utils/db";

interface SnapshotDiffPanelProps {
  history: SavedSnapshot[];
  currentSnapshotId: string | null;
  baseSnapshotId: string;
  targetSnapshotId: string;
  onSelectSnapshot: (snapshot: SavedSnapshot) => void;
  onDeleteSnapshot: (id: string) => void;
  onClearAllSnapshots: () => void;
  onExportSnapshots: () => void;
  onImportSnapshotsFile: (file: File) => void;
  onChangeDiffSelection: (baseId: string, targetId: string) => void;
  onSwapDiffSelection: () => void;
}

export function SnapshotDiffPanel({
  history,
  currentSnapshotId,
  baseSnapshotId,
  targetSnapshotId,
  onSelectSnapshot,
  onDeleteSnapshot,
  onClearAllSnapshots,
  onExportSnapshots,
  onImportSnapshotsFile,
  onChangeDiffSelection,
  onSwapDiffSelection,
}: SnapshotDiffPanelProps) {
  const importInputRef = useRef<HTMLInputElement>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const storageSizeKb = estimateSnapshotsSizeKb(history);

  return (
    <div className="space-y-4">
      {/* Panneau 1 : Comparateur Temporel Git Diff (Base -> Cible) */}
      <div className="linear-panel rounded-lg p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-[#8a8f98] block">
              COMPARATEUR TEMPOREL
            </span>
            <h3 className="text-[14px] font-semibold text-[#f7f8f8] mt-0.5">
              Sélecteur Git Diff
            </h3>
          </div>
          <button
            type="button"
            onClick={onSwapDiffSelection}
            disabled={!baseSnapshotId || !targetSnapshotId}
            title="Intervertir Base (Ancien) et Cible (Récent)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono bg-[#16181a] hover:bg-[#1c1e21] text-[#d0d6e0] border border-[rgba(255,255,255,0.08)] disabled:opacity-40 transition-colors cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5 text-[#5e6ad2]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
            <span>Intervertir</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {/* Base (Ancien) */}
          <div>
            <label
              htmlFor="diff-base-select"
              className="block text-[11px] font-mono uppercase tracking-[0.06em] text-[#8a8f98] mb-1"
            >
              BASE (ANCIEN SNAPSHOT)
            </label>
            <select
              id="diff-base-select"
              value={baseSnapshotId}
              onChange={(e) => onChangeDiffSelection(e.target.value, targetSnapshotId)}
              className="w-full px-2.5 py-1.5 rounded text-[12px] font-mono linear-input cursor-pointer"
            >
              <option value="current">Session active (courante)</option>
              {history.map((snap) => (
                <option key={`base-${snap.id}`} value={snap.id}>
                  {snap.label} ({snap.followersCount} ab.)
                </option>
              ))}
            </select>
          </div>

          {/* Cible (Récent) */}
          <div>
            <label
              htmlFor="diff-target-select"
              className="block text-[11px] font-mono uppercase tracking-[0.06em] text-[#8a8f98] mb-1"
            >
              CIBLE (NOUVEAU SNAPSHOT)
            </label>
            <select
              id="diff-target-select"
              value={targetSnapshotId}
              onChange={(e) => onChangeDiffSelection(baseSnapshotId, e.target.value)}
              className="w-full px-2.5 py-1.5 rounded text-[12px] font-mono linear-input cursor-pointer"
            >
              <option value="current">Session active (courante)</option>
              {history.map((snap) => (
                <option key={`target-${snap.id}`} value={snap.id}>
                  {snap.label} ({snap.followersCount} ab.)
                </option>
              ))}
            </select>
          </div>
        </div>

        {baseSnapshotId === targetSnapshotId && (
          <div className="p-2.5 rounded bg-[rgba(251,191,36,0.08)] border border-[rgba(251,191,36,0.25)] text-[11px] font-mono text-[#fbbf24]">
            La base et la cible pointent vers le même snapshot (aucun diff).
          </div>
        )}
      </div>

      {/* Panneau 2 : Gestionnaire IndexedDB Local */}
      <div className="linear-panel rounded-lg p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-[#8a8f98] block">
              STOCKAGE INDEXEDDB
            </span>
            <h3 className="text-[14px] font-semibold text-[#f7f8f8] mt-0.5">
              Snapshots locaux ({history.length})
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono tabular-nums bg-[#16181a] text-[#8a8f98] border border-[rgba(255,255,255,0.07)]">
            {storageSizeKb} Ko
          </span>
        </div>

        {/* Actions Backup / Import / Purge */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onExportSnapshots}
            disabled={history.length === 0}
            className="px-2.5 py-1 rounded text-[11px] font-mono bg-[#16181a] hover:bg-[#1c1e21] text-[#d0d6e0] border border-[rgba(255,255,255,0.08)] disabled:opacity-40 transition-colors cursor-pointer"
          >
            Exporter JSON
          </button>

          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onImportSnapshotsFile(file);
                e.target.value = "";
              }
            }}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="px-2.5 py-1 rounded text-[11px] font-mono bg-[#16181a] hover:bg-[#1c1e21] text-[#d0d6e0] border border-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
          >
            Importer JSON
          </button>

          {history.length > 0 && (
            <>
              {confirmClearAll ? (
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllSnapshots();
                      setConfirmClearAll(false);
                    }}
                    className="px-2 py-1 rounded text-[11px] font-mono bg-[rgba(248,113,113,0.16)] text-[#f87171] border border-[rgba(248,113,113,0.35)] cursor-pointer"
                  >
                    Confirmer purge
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(false)}
                    className="px-2 py-1 rounded text-[11px] font-mono bg-[#16181a] text-[#8a8f98] cursor-pointer"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(true)}
                  className="ml-auto px-2.5 py-1 rounded text-[11px] font-mono text-[#f87171] hover:bg-[rgba(248,113,113,0.1)] transition-colors cursor-pointer"
                >
                  Purger
                </button>
              )}
            </>
          )}
        </div>

        {/* Liste des snapshots */}
        {history.length === 0 ? (
          <div className="p-4 rounded bg-[#0a0b0d] border border-[rgba(255,255,255,0.05)] text-center text-[12px] text-[#62666d]">
            Aucun snapshot sauvegardé dans IndexedDB.
          </div>
        ) : (
          <div
            data-lenis-prevent
            className="max-h-64 overflow-y-auto custom-scrollbar space-y-1.5 pr-0.5"
          >
            {history.map((snap) => {
              const isCurrent = currentSnapshotId === snap.id;
              const isConfirming = confirmDeleteId === snap.id;

              return (
                <div
                  key={snap.id}
                  onClick={() => onSelectSnapshot(snap)}
                  className={`p-2.5 rounded-md border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    isCurrent
                      ? "bg-[rgba(94,106,210,0.12)] border-[rgba(94,106,210,0.4)]"
                      : "bg-[#0a0b0d] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.14)]"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-medium text-[#f7f8f8] truncate">
                        {snap.label}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#5e6ad2] text-white">
                          ACTIF
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-[#62666d] tabular-nums mt-0.5">
                      {new Date(snap.date).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}{" "}
                      · {snap.followersCount} ab. / {snap.followingCount} suiv.
                    </div>
                  </div>

                  <div
                    className="shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isConfirming ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteSnapshot(snap.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[rgba(248,113,113,0.2)] text-[#f87171] cursor-pointer"
                        >
                          Oui
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#16181a] text-[#8a8f98] cursor-pointer"
                        >
                          Non
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(snap.id)}
                        title="Supprimer ce snapshot"
                        className="p-1 rounded text-[#62666d] hover:text-[#f87171] transition-colors cursor-pointer"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.75}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
