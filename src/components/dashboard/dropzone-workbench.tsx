"use client";

import React, { useRef, useState } from "react";
import { EXPORT_STEPS, FAQ_ITEMS } from "@/lib/constants";
import { SavedSnapshot } from "@/utils/db";

interface DropzoneWorkbenchProps {
  isDragging: boolean;
  isLoading: boolean;
  error: string | null;
  history: SavedSnapshot[];
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFilesSelected: (files: FileList) => void;
  onLoadDemo: () => void;
  onSelectSnapshot: (snapshot: SavedSnapshot) => void;
  onDeleteSnapshot: (id: string) => void;
}

export function DropzoneWorkbench({
  isDragging,
  isLoading,
  error,
  history,
  onDragOver,
  onDragLeave,
  onDrop,
  onFilesSelected,
  onLoadDemo,
  onSelectSnapshot,
  onDeleteSnapshot,
}: DropzoneWorkbenchProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <div className="space-y-12">
      {/* Top Workbench Hero + Terminal Dropzone */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Colonne Gauche : Contexte Technique & Spécifications */}
        <div className="lg:col-span-5 space-y-5 pt-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#16181a] border border-[rgba(255,255,255,0.07)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5e6ad2]" />
            <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-[#a0a5b1]">
              CLIENT-SIDE AUDIENCE WORKBENCH
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-[#f7f8f8] leading-[1.12] text-balance">
            Inspection différentielle d&apos;audience Instagram.
          </h1>

          <p className="text-[15px] text-[#8a8f98] leading-[1.6] text-pretty">
            Analysez vos abonnés, détectez les comptes non-réciproques et comparez vos
            instantanés dans le temps façon{" "}
            <span className="font-mono text-[13px] text-[#d0d6e0] bg-[#16181a] px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.07)]">
              git diff
            </span>
            . Exécution intégrale dans le thread local du navigateur via{" "}
            <span className="font-mono text-[13px] text-[#d0d6e0]">JSZip</span> et{" "}
            <span className="font-mono text-[13px] text-[#d0d6e0]">IndexedDB</span>, sans
            connexion à votre compte Instagram.
          </p>

          {/* Spécifications techniques rapides */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.07)]">
              <div className="text-[11px] font-mono uppercase tracking-[0.06em] text-[#62666d]">
                FORMATS SUPPORTÉS
              </div>
              <div className="mt-1 font-mono text-[13px] text-[#f7f8f8] tabular-nums">
                .zip · .json · .html
              </div>
            </div>
            <div className="p-3 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.07)]">
              <div className="text-[11px] font-mono uppercase tracking-[0.06em] text-[#62666d]">
                PERSISTANCE LOCALE
              </div>
              <div className="mt-1 font-mono text-[13px] text-[#34d399] tabular-nums">
                IndexedDB · 0 requête
              </div>
            </div>
          </div>

          {/* Bouton Mode Démo 1-clic mis en valeur pour test immédiat */}
          <div className="p-4 rounded-lg bg-[#0f1011] border border-[rgba(255,255,255,0.07)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[13px] font-medium text-[#f7f8f8] flex items-center gap-2">
                <span>Pas d&apos;archive sous la main ?</span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[rgba(94,106,210,0.14)] text-[#8b95ea] border border-[rgba(94,106,210,0.3)]">
                  DÉMO
                </span>
              </div>
              <p className="text-[12px] text-[#8a8f98] mt-0.5">
                Chargez un jeu de données réaliste avec historique et renommages pré-calculés.
              </p>
            </div>
            <button
              type="button"
              onClick={onLoadDemo}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-md text-[13px] font-medium bg-[#16181a] hover:bg-[#1c1e21] text-[#f7f8f8] border border-[rgba(255,255,255,0.12)] hover:border-[rgba(94,106,210,0.5)] transition-colors cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5 text-[#5e6ad2]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Charger la démo</span>
            </button>
          </div>
        </div>

        {/* Colonne Droite : Terminal d'importation (Dropzone) */}
        <div className="lg:col-span-7">
          <div className="linear-panel rounded-lg overflow-hidden">
            {/* Barre de titre façon fenêtre système / IDE */}
            <div className="px-4 py-2.5 bg-[#0a0b0d] border-b border-[rgba(255,255,255,0.07)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg
                  className="w-3.5 h-3.5 text-[#8a8f98]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                <span className="text-[12px] font-mono text-[#d0d6e0]">
                  import-workspace://meta-export
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#62666d] tabular-nums">
                UTF-8 · JSZip v3.10
              </span>
            </div>

            {/* Zone de dépôt */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              aria-label="Sélectionner une archive ZIP Instagram ou les fichiers JSON/HTML"
              className={`p-6 sm:p-8 transition-colors cursor-pointer focus:outline-none ${
                isDragging
                  ? "bg-[rgba(94,106,210,0.08)]"
                  : "bg-[#0f1011] hover:bg-[#121416]"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onFilesSelected(e.target.files);
                    e.target.value = "";
                  }
                }}
                accept=".zip,.json,.html,application/zip,application/json,text/html"
                multiple
                className="hidden"
              />

              <div
                className={`border border-dashed rounded-lg p-6 sm:p-8 flex flex-col items-center text-center transition-colors ${
                  isDragging
                    ? "border-[#5e6ad2] bg-[rgba(94,106,210,0.06)]"
                    : "border-[rgba(255,255,255,0.12)] bg-[#0a0b0d]/60"
                }`}
              >
                <div className="w-11 h-11 rounded-lg bg-[#16181a] border border-[rgba(255,255,255,0.08)] flex items-center justify-center mb-4 text-[#d0d6e0]">
                  {isLoading ? (
                    <svg
                      className="w-5 h-5 text-[#5e6ad2] animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-[#5e6ad2]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.75}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  )}
                </div>

                <p className="text-[15px] font-medium text-[#f7f8f8]">
                  {isLoading
                    ? "Décompression et indexation en cours..."
                    : "Glissez-déposez votre export .zip Instagram"}
                </p>
                <p className="text-[13px] text-[#8a8f98] mt-1 max-w-md">
                  Ou sélectionnez directement les fichiers{" "}
                  <span className="font-mono text-[12px] text-[#d0d6e0]">
                    followers_1.json
                  </span>{" "}
                  et{" "}
                  <span className="font-mono text-[12px] text-[#d0d6e0]">
                    following.json
                  </span>{" "}
                  extraits.
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium bg-[#5e6ad2] hover:bg-[#6875e2] text-white transition-colors cursor-pointer"
                  >
                    Sélectionner l&apos;archive (.zip / .json)
                  </button>
                </div>

                {/* Arborescence attendue */}
                <div className="mt-6 w-full max-w-md text-left p-3 rounded bg-[#010102] border border-[rgba(255,255,255,0.06)] font-mono text-[11px] text-[#8a8f98] space-y-1">
                  <div className="text-[#62666d] uppercase tracking-[0.06em] mb-1">
                    CHEMINS RECONNUS AUTOMATIQUEMENT :
                  </div>
                  <div className="truncate">
                    <span className="text-[#62666d]">├─</span>{" "}
                    connections/followers_and_following/
                    <span className="text-[#34d399]">followers_1.json</span>
                  </div>
                  <div className="truncate">
                    <span className="text-[#62666d]">└─</span>{" "}
                    connections/followers_and_following/
                    <span className="text-[#5e6ad2]">following.json</span>
                  </div>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-4 p-3.5 rounded-md bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.28)] flex items-start gap-2.5 text-left"
                >
                  <svg
                    className="w-4 h-4 text-[#f87171] shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
                    />
                  </svg>
                  <div className="text-[13px] text-[#f87171] leading-snug">{error}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Snapshots Locaux Sauvegardés (IndexedDB) */}
      {history.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-mono uppercase tracking-[0.06em] text-[#8a8f98]">
                Snapshots IndexedDB récents
              </h2>
              <span className="px-1.5 py-0.5 rounded text-[11px] font-mono tabular-nums bg-[#16181a] text-[#d0d6e0] border border-[rgba(255,255,255,0.07)]">
                {history.length}
              </span>
            </div>
            <span className="text-[12px] font-mono text-[#62666d]">
              Cliquez sur un snapshot pour l&apos;ouvrir
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.map((snap) => {
              const isConfirming = confirmDeleteId === snap.id;
              return (
                <div
                  key={snap.id}
                  onClick={() => onSelectSnapshot(snap)}
                  className="linear-card rounded-lg p-4 cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[14px] text-[#f7f8f8] truncate group-hover:text-[#8b95ea] transition-colors">
                        {snap.label}
                      </span>
                    </div>
                    <div className="text-[12px] font-mono text-[#62666d] tabular-nums mt-0.5">
                      {new Date(snap.date).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[12px] font-mono tabular-nums">
                      <span className="text-[#d0d6e0]">
                        {snap.followersCount.toLocaleString("fr-FR")}{" "}
                        <span className="text-[#62666d]">abonnés</span>
                      </span>
                      <span className="text-[#62666d]">·</span>
                      <span className="text-[#8a8f98]">
                        {snap.followingCount.toLocaleString("fr-FR")}{" "}
                        <span className="text-[#62666d]">suivis</span>
                      </span>
                    </div>
                  </div>

                  <div
                    className="shrink-0 flex items-center gap-1"
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
                          className="px-2 py-1 rounded text-[11px] font-mono bg-[rgba(248,113,113,0.16)] text-[#f87171] border border-[rgba(248,113,113,0.35)] hover:bg-[rgba(248,113,113,0.25)] cursor-pointer"
                        >
                          Supprimer
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 rounded text-[11px] font-mono bg-[#16181a] text-[#8a8f98] hover:text-[#f7f8f8] cursor-pointer"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(snap.id)}
                        title="Supprimer ce snapshot"
                        aria-label={`Supprimer le snapshot ${snap.label}`}
                        className="p-1.5 rounded text-[#62666d] hover:text-[#f87171] hover:bg-[rgba(248,113,113,0.1)] transition-colors cursor-pointer"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.75}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Stepper 4 Étapes : Procédure d'exportation officielle Meta */}
      <section className="space-y-4 pt-4 border-t border-[rgba(255,255,255,0.07)]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.06em] text-[#5e6ad2]">
              PROCÉDURE D&apos;EXTRACTION META
            </div>
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#f7f8f8] mt-0.5">
              Comment récupérer votre archive officielle Instagram
            </h2>
          </div>
          <span className="text-[12px] font-mono text-[#8a8f98]">
            Format recommandé : <strong className="text-[#34d399] font-normal">JSON</strong> · Plage :{" "}
            <strong className="text-[#d0d6e0] font-normal">Depuis le début</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {EXPORT_STEPS.map((item) => (
            <div
              key={item.step}
              className="linear-panel rounded-lg p-4 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] font-semibold text-[#5e6ad2] tabular-nums">
                    STEP {item.step}
                  </span>
                  <span className="font-mono text-[11px] text-[#62666d] px-1.5 py-0.5 rounded bg-[#0a0b0d] border border-[rgba(255,255,255,0.05)]">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-[14px] font-medium text-[#f7f8f8]">{item.title}</h3>
                <p className="text-[13px] text-[#8a8f98] leading-relaxed">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section FAQ Technique (Layout 2 colonnes asymétriques) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t border-[rgba(255,255,255,0.07)]">
        <div className="lg:col-span-4 space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-[0.06em] text-[#5e6ad2]">
            DOCUMENTATION & SÉCURITÉ
          </div>
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#f7f8f8]">
            Questions techniques fréquentes
          </h2>
          <p className="text-[13px] text-[#8a8f98] leading-relaxed">
            Détails sur l&apos;exécution hors-ligne, l&apos;heuristique de comparaison{" "}
            <span className="font-mono text-[12px] text-[#d0d6e0]">compareSnapshots</span> et la
            structure des archives Meta.
          </p>
        </div>

        <div className="lg:col-span-8 divide-y divide-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.07)] rounded-lg bg-[#0f1011] overflow-hidden">
          {FAQ_ITEMS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={faq.question}>
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full px-5 py-3.5 text-left flex items-center justify-between gap-4 hover:bg-[#16181a]/60 transition-colors cursor-pointer"
                >
                  <span className="text-[14px] font-medium text-[#f7f8f8]">
                    {faq.question}
                  </span>
                  <span className="font-mono text-[14px] text-[#8a8f98] shrink-0">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-[13px] text-[#8a8f98] leading-relaxed border-t border-[rgba(255,255,255,0.04)] pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
