"use client";

import { Users, UserCheck, UserX, ArrowLeftRight } from "lucide-react";
import { AnalysisResult } from "@/utils/analyzer";

export type ExplorerTab =
  | "nonFollowers"
  | "fans"
  | "mutuals"
  | "followers"
  | "following"
  | "comparison";

interface KpiStripProps {
  analysis: AnalysisResult;
  activeTab: ExplorerTab;
  onSelectTab: (tab: ExplorerTab) => void;
  followersDelta: number | null;
}

export default function KpiStrip({
  analysis,
  activeTab,
  onSelectTab,
  followersDelta,
}: KpiStripProps) {
  const { stats } = analysis;
  const nonFollowRatio =
    stats.followingCount > 0
      ? Math.round((stats.nonFollowersBackCount / stats.followingCount) * 100)
      : 0;

  return (
    <section
      aria-label="Indicateurs clés d'audience"
      className="linear-panel rounded-lg overflow-hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle"
    >
      {/* 1. Abonnés (Followers) */}
      <button
        type="button"
        onClick={() => onSelectTab("followers")}
        className={`p-4 sm:p-5 text-left transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-brand-indigo ${
          activeTab === "followers"
            ? "bg-surface-hover"
            : "bg-surface-1 hover:bg-surface-2"
        }`}
      >
        <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
          <span>Abonnés (Followers)</span>
          <Users className="w-3.5 h-3.5 text-brand-indigo" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2.5">
          <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary font-mono tabular-nums">
            {stats.followersCount.toLocaleString("fr-FR")}
          </span>
          {followersDelta !== null && (
            <span
              className={`px-1.5 py-0.5 text-[11px] font-mono tabular-nums rounded border ${
                followersDelta >= 0
                  ? "bg-diff-add/10 border-diff-add/25 text-diff-add"
                  : "bg-diff-del/10 border-diff-del/25 text-diff-del"
              }`}
              title="Variation par rapport au dernier instantané comparé"
            >
              {followersDelta >= 0 ? `+${followersDelta}` : followersDelta}
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] font-mono tabular-nums text-text-muted">
          <span>Audience entrante totale</span>
          {activeTab === "followers" && (
            <span className="text-brand-indigo">Actif</span>
          )}
        </div>
      </button>

      {/* 2. Abonnements (Following) + Ratio */}
      <button
        type="button"
        onClick={() => onSelectTab("following")}
        className={`p-4 sm:p-5 text-left transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-brand-indigo ${
          activeTab === "following"
            ? "bg-surface-hover"
            : "bg-surface-1 hover:bg-surface-2"
        }`}
      >
        <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
          <span>Abonnements (Following)</span>
          <UserCheck className="w-3.5 h-3.5 text-text-secondary" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2.5">
          <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary font-mono tabular-nums">
            {stats.followingCount.toLocaleString("fr-FR")}
          </span>
          <span className="px-1.5 py-0.5 text-[11px] font-mono tabular-nums rounded bg-surface-2 border border-border-subtle text-text-secondary">
            Ratio {stats.followerToFollowingRatio}x
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] font-mono tabular-nums text-text-muted">
          <span>Comptes que vous suivez</span>
          {activeTab === "following" && (
            <span className="text-brand-indigo">Actif</span>
          )}
        </div>
      </button>

      {/* 3. Sans retour (Don't Follow Back) — Critique */}
      <button
        type="button"
        onClick={() => onSelectTab("nonFollowers")}
        className={`p-4 sm:p-5 text-left transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-brand-indigo ${
          activeTab === "nonFollowers"
            ? "bg-surface-hover"
            : "bg-surface-1 hover:bg-surface-2"
        }`}
      >
        <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-diff-del" />
            <span>Sans retour (Non-réciproques)</span>
          </span>
          <UserX className="w-3.5 h-3.5 text-diff-del" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2.5">
          <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-diff-del font-mono tabular-nums">
            {stats.nonFollowersBackCount.toLocaleString("fr-FR")}
          </span>
          <span className="px-1.5 py-0.5 text-[11px] font-mono tabular-nums rounded bg-diff-del/10 border border-diff-del/25 text-diff-del">
            {nonFollowRatio}% des suivis
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] font-mono tabular-nums text-text-muted">
          <span>Ne vous suivent pas en retour</span>
          {activeTab === "nonFollowers" && (
            <span className="text-diff-del">Filtré</span>
          )}
        </div>
      </button>

      {/* 4. Mutuels & Fans (2 zones 100% cliquables côte à côte sans zone morte) */}
      <div
        className={`p-4 sm:p-5 flex flex-col justify-between transition-colors duration-150 ${
          activeTab === "mutuals" || activeTab === "fans"
            ? "bg-surface-hover"
            : "bg-surface-1 hover:bg-surface-2"
        }`}
      >
        <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
          <span>Réciprocité & Fans</span>
          <ArrowLeftRight className="w-3.5 h-3.5 text-diff-add" />
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2 items-baseline">
          <button
            type="button"
            onClick={() => onSelectTab("mutuals")}
            className="w-full text-left group cursor-pointer focus:outline-none rounded py-0.5"
            title="Afficher les abonnements mutuels"
          >
            <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-diff-add font-mono tabular-nums group-hover:underline">
              {stats.mutualsCount.toLocaleString("fr-FR")}
            </span>
            <span className="ml-1.5 text-[11px] font-mono text-text-secondary">
              mutuels ({stats.followBackRatio}%)
            </span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab("fans")}
            className="w-full text-right sm:text-left pl-2 border-l border-border-subtle group cursor-pointer focus:outline-none rounded py-0.5"
            title="Afficher les fans que vous ne suivez pas en retour"
          >
            <span className="text-xl sm:text-2xl font-semibold tracking-tight text-brand-amber font-mono tabular-nums group-hover:underline">
              {stats.fansCount.toLocaleString("fr-FR")}
            </span>
            <span className="ml-1 text-[11px] font-mono text-text-secondary">
              fans
            </span>
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-mono tabular-nums text-text-muted">
          <button
            type="button"
            onClick={() => onSelectTab("mutuals")}
            className={`w-full text-left hover:text-text-primary cursor-pointer ${
              activeTab === "mutuals" ? "text-diff-add underline" : ""
            }`}
          >
            Voir mutuels
          </button>
          <button
            type="button"
            onClick={() => onSelectTab("fans")}
            className={`w-full text-right hover:text-text-primary cursor-pointer ${
              activeTab === "fans" ? "text-brand-amber underline" : ""
            }`}
          >
            Voir fans ({stats.fansCount})
          </button>
        </div>
      </div>
    </section>
  );
}
