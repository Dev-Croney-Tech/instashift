"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { InstagramUser } from "@/utils/insta-parser";
import { AnalysisResult, ComparisonResult } from "@/utils/analyzer";

export type ExplorerTab =
  | "nonFollowers"
  | "fans"
  | "mutuals"
  | "followers"
  | "following"
  | "comparison";

export type SortMode = "date-desc" | "date-asc" | "alpha-asc" | "alpha-desc";

interface AccountExplorerProps {
  result: AnalysisResult;
  comparisonResult: ComparisonResult | null;
  baseLabel: string;
  targetLabel: string;
  activeTab: ExplorerTab;
  onTabChange: (tab: ExplorerTab) => void;
}

const ITEMS_PER_PAGE = 60;

/**
 * Génère une teinte HSL déterministe à partir du pseudonyme pour l'avatar d'initiales.
 */
function getAvatarColors(username: string): {
  bg: string;
  border: string;
  text: string;
  initials: string;
} {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  const clean = username.replace(/^[^a-zA-Z0-9]+/, "");
  const initials = (clean.slice(0, 2) || username.slice(0, 2) || "IG").toUpperCase();

  return {
    bg: `hsla(${hue}, 42%, 14%, 1)`,
    border: `hsla(${hue}, 55%, 36%, 0.45)`,
    text: `hsla(${hue}, 70%, 78%, 1)`,
    initials,
  };
}

function formatUnixTimestamp(ts: number): string {
  if (!ts || ts <= 0) {
    return "Date non spécifiée";
  }
  return new Date(ts * 1000).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function AccountExplorer({
  result,
  comparisonResult,
  baseLabel,
  targetLabel,
  activeTab,
  onTabChange,
}: AccountExplorerProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("date-desc");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [copiedState, setCopiedState] = useState(false);
  const [diffFilter, setDiffFilter] = useState<"all" | "incoming" | "outgoing" | "renames">("all");

  // Raccourci clavier global `/` ou `Cmd+K` / `Ctrl+K` pour focus la barre de recherche
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (!isInputFocused && e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Ensemble rapide pour déterminer le badge de statut d'un compte
  const statusSets = useMemo(() => {
    const nonFollowersSet = new Set(
      result.nonFollowersBack.map((u) => u.username.toLowerCase())
    );
    const fansSet = new Set(result.fans.map((u) => u.username.toLowerCase()));
    const mutualsSet = new Set(result.mutuals.map((u) => u.username.toLowerCase()));
    return { nonFollowersSet, fansSet, mutualsSet };
  }, [result]);

  // Liste filtrée et triée pour les onglets standards
  const filteredAccounts = useMemo(() => {
    let source: InstagramUser[] = [];
    switch (activeTab) {
      case "nonFollowers":
        source = result.nonFollowersBack;
        break;
      case "fans":
        source = result.fans;
        break;
      case "mutuals":
        source = result.mutuals;
        break;
      case "followers":
        source = result.followers;
        break;
      case "following":
        source = result.following;
        break;
      default:
        source = [];
    }

    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? source.filter((u) => u.username.toLowerCase().includes(q))
      : [...source];

    filtered.sort((a, b) => {
      if (sortMode === "date-desc") {
        return (b.timestamp || 0) - (a.timestamp || 0);
      }
      if (sortMode === "date-asc") {
        if (!a.timestamp && b.timestamp) return 1;
        if (a.timestamp && !b.timestamp) return -1;
        return (a.timestamp || 0) - (b.timestamp || 0);
      }
      if (sortMode === "alpha-asc") {
        return a.username.localeCompare(b.username);
      }
      return b.username.localeCompare(a.username);
    });

    return filtered;
  }, [activeTab, result, searchQuery, sortMode]);

  // Filtrage mémoïsé pour l'onglet Git Diff (`comparison`)
  const filteredComparison = useMemo(() => {
    if (!comparisonResult) {
      return { incoming: [], outgoing: [], usernameChanges: [] };
    }
    const q = searchQuery.trim().toLowerCase();
    const incoming = q
      ? comparisonResult.incoming.filter((u) => u.username.toLowerCase().includes(q))
      : comparisonResult.incoming;
    const outgoing = q
      ? comparisonResult.outgoing.filter((u) => u.username.toLowerCase().includes(q))
      : comparisonResult.outgoing;
    const usernameChanges = q
      ? comparisonResult.usernameChanges.filter(
          (c) =>
            c.oldUsername.toLowerCase().includes(q) ||
            c.newUsername.toLowerCase().includes(q)
        )
      : comparisonResult.usernameChanges;

    return { incoming, outgoing, usernameChanges };
  }, [comparisonResult, searchQuery]);

  // Changement d'onglet avec réinitialisation de la pagination
  const handleSelectTab = (tab: ExplorerTab) => {
    onTabChange(tab);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  // Export CSV de la vue active
  const handleExportCSV = () => {
    const rows: string[][] = [["username", "status", "timestamp", "date_iso", "url"]];

    if (activeTab === "comparison" && comparisonResult) {
      filteredComparison.incoming.forEach((u) => {
        rows.push([
          u.username,
          "incoming (+)",
          String(u.timestamp || 0),
          u.timestamp > 0 ? new Date(u.timestamp * 1000).toISOString() : "",
          u.url,
        ]);
      });
      filteredComparison.outgoing.forEach((u) => {
        rows.push([
          u.username,
          "outgoing (-)",
          String(u.timestamp || 0),
          u.timestamp > 0 ? new Date(u.timestamp * 1000).toISOString() : "",
          u.url,
        ]);
      });
      filteredComparison.usernameChanges.forEach((c) => {
        rows.push([
          `${c.oldUsername} -> ${c.newUsername}`,
          "renamed (~)",
          String(c.timestamp || 0),
          c.timestamp > 0 ? new Date(c.timestamp * 1000).toISOString() : "",
          c.url,
        ]);
      });
    } else {
      filteredAccounts.forEach((u) => {
        const lower = u.username.toLowerCase();
        const status = statusSets.nonFollowersSet.has(lower)
          ? "non_follower_back"
          : statusSets.fansSet.has(lower)
          ? "fan"
          : "mutual";
        rows.push([
          u.username,
          status,
          String(u.timestamp || 0),
          u.timestamp > 0 ? new Date(u.timestamp * 1000).toISOString() : "",
          u.url,
        ]);
      });
    }

    const csvContent =
      "\uFEFF" +
      rows
        .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `instashift-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Export JSON de la vue active
  const handleExportJSON = () => {
    const payload =
      activeTab === "comparison" ? filteredComparison : filteredAccounts;
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `instashift-${activeTab}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Copie des @usernames dans le presse-papier
  const handleCopyUsernames = async () => {
    let lines: string[] = [];
    if (activeTab === "comparison") {
      lines = [
        ...filteredComparison.incoming.map((u) => `+ @${u.username}`),
        ...filteredComparison.outgoing.map((u) => `- @${u.username}`),
        ...filteredComparison.usernameChanges.map(
          (c) => `~ @${c.oldUsername} -> @${c.newUsername}`
        ),
      ];
    } else {
      lines = filteredAccounts.map((u) => `@${u.username}`);
    }

    if (lines.length === 0) return;
    const text = lines.join("\n");
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 1800);
    } catch {
      // Fallback silencieux
    }
  };

  const tabs: {
    id: ExplorerTab;
    label: string;
    count: number;
    badgeTone?: "danger" | "success" | "indigo" | "neutral";
  }[] = [
    {
      id: "nonFollowers",
      label: "Non-réciproques",
      count: result.stats.nonFollowersBackCount,
      badgeTone: "danger",
    },
    {
      id: "fans",
      label: "Fans",
      count: result.stats.fansCount,
      badgeTone: "success",
    },
    {
      id: "mutuals",
      label: "Mutuels",
      count: result.stats.mutualsCount,
      badgeTone: "neutral",
    },
    {
      id: "followers",
      label: "Abonnés",
      count: result.stats.followersCount,
      badgeTone: "neutral",
    },
    {
      id: "following",
      label: "Abonnements",
      count: result.stats.followingCount,
      badgeTone: "neutral",
    },
    {
      id: "comparison",
      label: "Git Diff",
      count: comparisonResult
        ? comparisonResult.stats.incomingCount +
          comparisonResult.stats.outgoingCount +
          comparisonResult.stats.usernameChangesCount
        : 0,
      badgeTone: "indigo",
    },
  ];

  const displayedAccounts = filteredAccounts.slice(0, visibleCount);

  return (
    <div className="linear-panel rounded-lg overflow-hidden">
      {/* Barre supérieure d'onglets segmentés */}
      <div className="px-3 pt-3 pb-2.5 bg-[#0a0b0d] border-b border-[rgba(255,255,255,0.07)] flex flex-wrap items-center justify-between gap-2">
        <div
          role="tablist"
          aria-label="Segments d'audience"
          className="flex flex-wrap items-center gap-1"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => handleSelectTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#16181a] text-[#f7f8f8] border border-[rgba(255,255,255,0.12)]"
                    : "text-[#8a8f98] hover:text-[#d0d6e0] hover:bg-[#16181a]/50 border border-transparent"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[11px] font-mono tabular-nums ${
                    isActive && tab.badgeTone === "danger"
                      ? "bg-[rgba(248,113,113,0.16)] text-[#f87171]"
                      : isActive && tab.badgeTone === "success"
                      ? "bg-[rgba(52,211,153,0.16)] text-[#34d399]"
                      : isActive && tab.badgeTone === "indigo"
                      ? "bg-[rgba(94,106,210,0.2)] text-[#8b95ea]"
                      : "bg-[#0f1011] text-[#8a8f98]"
                  }`}
                >
                  {tab.count.toLocaleString("fr-FR")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Barre d'outils unifiée : Recherche (/ ou Cmd+K), Tri & Exports */}
      <div className="p-3 bg-[#0f1011] border-b border-[rgba(255,255,255,0.07)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Recherche clavier */}
        <div className="relative flex-1 max-w-md">
          <svg
            className="w-3.5 h-3.5 text-[#62666d] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(ITEMS_PER_PAGE);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearchQuery("");
                searchInputRef.current?.blur();
              }
            }}
            placeholder="Filtrer par @username..."
            aria-label="Filtrer les comptes par pseudonyme"
            className="w-full pl-8 pr-14 py-1.5 rounded-md text-[13px] linear-input"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-[#8a8f98] hover:text-[#f7f8f8] cursor-pointer"
            >
              ESC
            </button>
          ) : (
            <kbd className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-[#62666d] bg-[#16181a] border border-[rgba(255,255,255,0.08)] rounded pointer-events-none">
              / · ⌘K
            </kbd>
          )}
        </div>

        {/* Tri + Boutons d'Export */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab !== "comparison" && (
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              aria-label="Trier les comptes"
              className="px-2.5 py-1.5 rounded-md text-[12px] font-mono linear-input cursor-pointer"
            >
              <option value="date-desc">Date : Plus récent</option>
              <option value="date-asc">Date : Plus ancien</option>
              <option value="alpha-asc">Pseudo : A → Z</option>
              <option value="alpha-desc">Pseudo : Z → A</option>
            </select>
          )}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyUsernames}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-mono bg-[#16181a] hover:bg-[#1c1e21] text-[#d0d6e0] border border-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
            >
              {copiedState ? (
                <span className="text-[#34d399]">Copié !</span>
              ) : (
                <span>Copier @</span>
              )}
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 rounded-md text-[12px] font-mono bg-[#16181a] hover:bg-[#1c1e21] text-[#d0d6e0] border border-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
            >
              CSV
            </button>
            <button
              type="button"
              onClick={handleExportJSON}
              className="px-2.5 py-1.5 rounded-md text-[12px] font-mono bg-[#16181a] hover:bg-[#1c1e21] text-[#d0d6e0] border border-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
            >
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal : soit le Comparateur Git Diff, soit la Table Haute Densité */}
      {activeTab === "comparison" ? (
        <div className="p-4 space-y-4">
          {!comparisonResult ? (
            <div className="p-8 text-center rounded-lg bg-[#0a0b0d] border border-[rgba(255,255,255,0.06)] space-y-2">
              <div className="text-[14px] font-medium text-[#f7f8f8]">
                Aucun snapshot de comparaison sélectionné
              </div>
              <p className="text-[13px] text-[#8a8f98] max-w-md mx-auto">
                Sauvegardez au moins deux snapshots dans IndexedDB ou chargez le mode démo
                pour inspecter les abonnés entrants (+), sortants (-) et les renommages (~).
              </p>
            </div>
          ) : (
            <>
              {/* En-tête Git Diff */}
              <div className="p-3.5 rounded-md bg-[#0a0b0d] border border-[rgba(255,255,255,0.07)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-[12px] font-mono">
                  <span className="text-[#8a8f98]">DIFF :</span>
                  <span className="px-2 py-0.5 rounded bg-[#16181a] text-[#d0d6e0] border border-[rgba(255,255,255,0.07)]">
                    {baseLabel}
                  </span>
                  <span className="text-[#62666d]">→</span>
                  <span className="px-2 py-0.5 rounded bg-[#16181a] text-[#f7f8f8] border border-[rgba(94,106,210,0.35)]">
                    {targetLabel}
                  </span>
                </div>

                {/* Filtres rapides du Diff */}
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] tabular-nums">
                  <button
                    type="button"
                    onClick={() => setDiffFilter("all")}
                    className={`px-2 py-1 rounded cursor-pointer ${
                      diffFilter === "all"
                        ? "bg-[#16181a] text-[#f7f8f8] border border-[rgba(255,255,255,0.14)]"
                        : "text-[#8a8f98] hover:text-[#f7f8f8]"
                    }`}
                  >
                    Tout
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiffFilter("incoming")}
                    className={`px-2 py-1 rounded cursor-pointer ${
                      diffFilter === "incoming"
                        ? "bg-[rgba(52,211,153,0.16)] text-[#34d399] border border-[rgba(52,211,153,0.35)]"
                        : "text-[#34d399]/80 hover:text-[#34d399]"
                    }`}
                  >
                    +{filteredComparison.incoming.length} entrants
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiffFilter("outgoing")}
                    className={`px-2 py-1 rounded cursor-pointer ${
                      diffFilter === "outgoing"
                        ? "bg-[rgba(248,113,113,0.16)] text-[#f87171] border border-[rgba(248,113,113,0.35)]"
                        : "text-[#f87171]/80 hover:text-[#f87171]"
                    }`}
                  >
                    -{filteredComparison.outgoing.length} sortants
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiffFilter("renames")}
                    className={`px-2 py-1 rounded cursor-pointer ${
                      diffFilter === "renames"
                        ? "bg-[rgba(94,106,210,0.2)] text-[#8b95ea] border border-[rgba(94,106,210,0.4)]"
                        : "text-[#8b95ea]/80 hover:text-[#8b95ea]"
                    }`}
                  >
                    ~{filteredComparison.usernameChanges.length} renommés
                  </button>
                </div>
              </div>

              {/* Section Renommages détectés (~) */}
              {(diffFilter === "all" || diffFilter === "renames") &&
                filteredComparison.usernameChanges.length > 0 && (
                  <div className="rounded-md border border-[rgba(94,106,210,0.28)] bg-[rgba(94,106,210,0.05)] overflow-hidden">
                    <div className="px-3.5 py-2 bg-[rgba(94,106,210,0.1)] border-b border-[rgba(94,106,210,0.2)] flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-[#8b95ea]">
                        ~ CHANGEMENTS DE PSEUDONYME DÉTECTÉS (TIMESTAMP UNIQUE)
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-[#8b95ea]">
                        {filteredComparison.usernameChanges.length}
                      </span>
                    </div>
                    <div className="divide-y divide-[rgba(255,255,255,0.05)]">
                      {filteredComparison.usernameChanges.map((change) => (
                        <div
                          key={`${change.oldUsername}-${change.newUsername}`}
                          className="h-11 px-3.5 flex items-center justify-between gap-3 text-[13px]"
                        >
                          <div className="flex items-center gap-2 min-w-0 font-mono">
                            <span className="text-[#8b95ea]">~</span>
                            <span className="text-[#8a8f98] line-through truncate">
                              @{change.oldUsername}
                            </span>
                            <span className="text-[#62666d]">→</span>
                            <span className="text-[#f7f8f8] font-medium truncate">
                              @{change.newUsername}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[11px] font-mono text-[#62666d] tabular-nums hidden sm:inline">
                              {formatUnixTimestamp(change.timestamp)}
                            </span>
                            <a
                              href={change.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[12px] font-mono text-[#8b95ea] hover:underline"
                            >
                              Profil ↗
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Grille Entrants (+) / Sortants (-) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(diffFilter === "all" || diffFilter === "incoming") && (
                  <div className="rounded-md border border-[rgba(255,255,255,0.07)] bg-[#0a0b0d] overflow-hidden">
                    <div className="px-3.5 py-2 bg-[rgba(52,211,153,0.08)] border-b border-[rgba(52,211,153,0.2)] flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-[#34d399]">
                        + NOUVEAUX ABONNÉS (ENTRANTS)
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-[#34d399]">
                        {filteredComparison.incoming.length}
                      </span>
                    </div>
                    {filteredComparison.incoming.length === 0 ? (
                      <div className="p-6 text-center text-[12px] text-[#62666d]">
                        Aucun abonné entrant sur cette période.
                      </div>
                    ) : (
                      <div
                        data-lenis-prevent
                        className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-[rgba(255,255,255,0.05)]"
                      >
                        {filteredComparison.incoming
                          .slice(0, visibleCount)
                          .map((user) => (
                            <div
                              key={`in-${user.username}`}
                              className="h-11 px-3.5 flex items-center justify-between gap-2 hover:bg-[#16181a]/60 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-[12px] text-[#34d399]">
                                  +
                                </span>
                                <span className="text-[13px] font-medium text-[#f7f8f8] truncate">
                                  @{user.username}
                                </span>
                              </div>
                              <div className="flex items-center gap-2.5 shrink-0">
                                <span className="text-[11px] font-mono text-[#62666d] tabular-nums">
                                  {formatUnixTimestamp(user.timestamp)}
                                </span>
                                <a
                                  href={user.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-mono text-[#8a8f98] hover:text-[#f7f8f8]"
                                >
                                  ↗
                                </a>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {(diffFilter === "all" || diffFilter === "outgoing") && (
                  <div className="rounded-md border border-[rgba(255,255,255,0.07)] bg-[#0a0b0d] overflow-hidden">
                    <div className="px-3.5 py-2 bg-[rgba(248,113,113,0.08)] border-b border-[rgba(248,113,113,0.2)] flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-[#f87171]">
                        − DÉSABONNEMENTS (SORTANTS)
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-[#f87171]">
                        {filteredComparison.outgoing.length}
                      </span>
                    </div>
                    {filteredComparison.outgoing.length === 0 ? (
                      <div className="p-6 text-center text-[12px] text-[#62666d]">
                        Aucun désabonnement détecté sur cette période.
                      </div>
                    ) : (
                      <div
                        data-lenis-prevent
                        className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-[rgba(255,255,255,0.05)]"
                      >
                        {filteredComparison.outgoing
                          .slice(0, visibleCount)
                          .map((user) => (
                            <div
                              key={`out-${user.username}`}
                              className="h-11 px-3.5 flex items-center justify-between gap-2 hover:bg-[#16181a]/60 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-[12px] text-[#f87171]">
                                  −
                                </span>
                                <span className="text-[13px] font-medium text-[#f7f8f8] truncate">
                                  @{user.username}
                                </span>
                              </div>
                              <div className="flex items-center gap-2.5 shrink-0">
                                <span className="text-[11px] font-mono text-[#62666d] tabular-nums">
                                  {formatUnixTimestamp(user.timestamp)}
                                </span>
                                <a
                                  href={user.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-mono text-[#8a8f98] hover:text-[#f7f8f8]"
                                >
                                  ↗
                                </a>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {(filteredComparison.incoming.length > visibleCount ||
                filteredComparison.outgoing.length > visibleCount) && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                    className="px-4 py-1.5 rounded-md text-[12px] font-mono bg-[#16181a] hover:bg-[#1c1e21] text-[#d0d6e0] border border-[rgba(255,255,255,0.08)] cursor-pointer"
                  >
                    Afficher plus d&apos;entrées
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* Liste Haute Densité (h-12 / 48px par ligne) */
        <div>
          {/* En-tête de colonnes */}
          <div className="px-4 py-2 bg-[#0a0b0d] border-b border-[rgba(255,255,255,0.06)] grid grid-cols-12 text-[11px] font-mono uppercase tracking-[0.06em] text-[#62666d]">
            <div className="col-span-6 sm:col-span-5">COMPTE (@USERNAME)</div>
            <div className="col-span-3 hidden sm:block">STATUT RELATIONNEL</div>
            <div className="col-span-4 sm:col-span-2 text-right sm:text-left">
              DATE D&apos;ACTION
            </div>
            <div className="col-span-2 text-right">LIEN</div>
          </div>

          {displayedAccounts.length === 0 ? (
            <div className="p-10 text-center text-[13px] text-[#62666d]">
              Aucun compte ne correspond aux critères de filtrage actuels.
            </div>
          ) : (
            <div
              data-lenis-prevent
              className="max-h-[560px] overflow-y-auto custom-scrollbar divide-y divide-[rgba(255,255,255,0.05)]"
            >
              {displayedAccounts.map((user) => {
                const avatar = getAvatarColors(user.username);
                const lower = user.username.toLowerCase();
                const isNonFollower = statusSets.nonFollowersSet.has(lower);
                const isFan = statusSets.fansSet.has(lower);

                return (
                  <div
                    key={`${activeTab}-${user.username}`}
                    className="h-12 px-4 grid grid-cols-12 items-center hover:bg-[#16181a]/65 transition-colors"
                  >
                    {/* Pseudo + Avatar Initiales */}
                    <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0 pr-2">
                      <span
                        style={{
                          backgroundColor: avatar.bg,
                          borderColor: avatar.border,
                          color: avatar.text,
                        }}
                        className="w-7 h-7 rounded-md border flex items-center justify-center text-[11px] font-mono font-semibold shrink-0 select-none"
                      >
                        {avatar.initials}
                      </span>
                      <span className="text-[13px] font-medium text-[#f7f8f8] truncate">
                        @{user.username}
                      </span>
                    </div>

                    {/* Badge Statut */}
                    <div className="col-span-3 hidden sm:flex items-center">
                      {isNonFollower ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[rgba(248,113,113,0.12)] text-[#f87171] border border-[rgba(248,113,113,0.25)]">
                          Non-réciproque
                        </span>
                      ) : isFan ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[rgba(52,211,153,0.12)] text-[#34d399] border border-[rgba(52,211,153,0.25)]">
                          Fan (vous suit)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#16181a] text-[#8a8f98] border border-[rgba(255,255,255,0.07)]">
                          Mutuel
                        </span>
                      )}
                    </div>

                    {/* Date */}
                    <div className="col-span-4 sm:col-span-2 text-right sm:text-left font-mono text-[12px] text-[#8a8f98] tabular-nums">
                      {formatUnixTimestamp(user.timestamp)}
                    </div>

                    {/* Action Externe */}
                    <div className="col-span-2 text-right">
                      <a
                        href={user.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-[12px] font-mono text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-[#1c1e21] transition-colors"
                      >
                        <span className="hidden md:inline">Profil</span>
                        <span>↗</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Barre de pied de table + Pagination */}
          <div className="px-4 py-2.5 bg-[#0a0b0d] border-t border-[rgba(255,255,255,0.07)] flex items-center justify-between text-[12px] font-mono text-[#8a8f98] tabular-nums">
            <span>
              Affichage de {displayedAccounts.length.toLocaleString("fr-FR")} sur{" "}
              {filteredAccounts.length.toLocaleString("fr-FR")} comptes
            </span>

            {visibleCount < filteredAccounts.length && (
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                className="px-3 py-1 rounded bg-[#16181a] hover:bg-[#1c1e21] text-[#f7f8f8] border border-[rgba(255,255,255,0.1)] transition-colors cursor-pointer"
              >
                Charger {Math.min(ITEMS_PER_PAGE, filteredAccounts.length - visibleCount)} de plus
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
