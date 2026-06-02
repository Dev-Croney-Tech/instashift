"use client";

import { useState, useMemo } from "react";
import { InstagramUser } from "@/utils/insta-parser";

interface GrowthChartProps {
  followers: InstagramUser[];
  following: InstagramUser[];
}

type Period = "day" | "week" | "month" | "year";

interface DataPoint {
  key: string;
  label: string;
  date: Date;
  followers: number;
  following: number;
}

function getWeekNumber(d: Date): number {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
}

/**
 * Génère une clé de tri stable et un label d'affichage pour regrouper les relations.
 */
function getPeriodInfo(timestamp: number, period: Period) {
  const date = new Date(timestamp * 1000);
  let key: string;
  let label: string;

  switch (period) {
    case "day": {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      key = `${yyyy}-${mm}-${dd}`;
      label = `${dd}/${mm}/${String(yyyy).slice(-2)}`;
      break;
    }
    case "week": {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      const yyyy = d.getFullYear();
      const w = getWeekNumber(d);
      key = `${yyyy}-W${String(w).padStart(2, "0")}`;
      label = `S${w} ${yyyy}`;
      break;
    }
    case "month": {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      key = `${yyyy}-${mm}`;
      label = date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      break;
    }
    case "year": {
      const yyyy = date.getFullYear();
      key = `${yyyy}`;
      label = `${yyyy}`;
      break;
    }
  }
  return { key, label, date };
}

function getChronologicalData(
  followers: InstagramUser[],
  following: InstagramUser[],
  period: Period
): DataPoint[] {
  const followersCountMap = new Map<string, { label: string; count: number; date: Date }>();
  const followingCountMap = new Map<string, { label: string; count: number; date: Date }>();

  followers.forEach((user) => {
    const { key, label, date } = getPeriodInfo(user.timestamp, period);
    const existing = followersCountMap.get(key) || { label, count: 0, date };
    existing.count++;
    followersCountMap.set(key, existing);
  });

  following.forEach((user) => {
    const { key, label, date } = getPeriodInfo(user.timestamp, period);
    const existing = followingCountMap.get(key) || { label, count: 0, date };
    existing.count++;
    followingCountMap.set(key, existing);
  });

  const allKeys = new Set<string>([
    ...followersCountMap.keys(),
    ...followingCountMap.keys(),
  ]);

  const points = Array.from(allKeys).map((key) => {
    const fInfo = followersCountMap.get(key);
    const figInfo = followingCountMap.get(key);
    const label = fInfo?.label || figInfo?.label || "";
    const date = fInfo?.date || figInfo?.date || new Date();
    return {
      key,
      label,
      date,
      followers: fInfo?.count || 0,
      following: figInfo?.count || 0,
    };
  });

  // Tri chronologique inverse (plus récents à gauche)
  points.sort((a, b) => b.key.localeCompare(a.key));

  return points;
}

export default function GrowthChart({ followers, following }: GrowthChartProps) {
  const periods: { key: Period; label: string }[] = [
    { key: "day", label: "Jour" },
    { key: "week", label: "Semaine" },
    { key: "month", label: "Mois" },
    { key: "year", label: "Année" },
  ];

  const [activePeriod, setActivePeriod] = useState<Period>("week");

  const data = useMemo(() => {
    return getChronologicalData(followers, following, activePeriod);
  }, [followers, following, activePeriod]);

  const maxVal = useMemo(() => {
    let max = 1;
    data.forEach((d) => {
      if (d.followers > max) max = d.followers;
      if (d.following > max) max = d.following;
    });
    return max;
  }, [data]);

  // Dimensioning parameters
  const chartHeight = 160; // Plotted height
  const chartTop = 25;     // Extra padding at top of SVG to prevent value clipping
  const pointsPerItem = 60; // Dynamic spacing per data point to prevent overlap
  const chartWidth = useMemo(() => {
    return Math.max(700, data.length * pointsPerItem);
  }, [data.length]);

  const barWidth = 12;
  const gap = 4;
  const itemWidth = useMemo(() => {
    return (chartWidth - 100) / Math.max(1, data.length);
  }, [chartWidth, data.length]);

  return (
    <div className="glass-panel rounded-2xl border border-border-glass p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider Outfit flex items-center space-x-2">
            <svg className="w-4 h-4 text-brand-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            <span>Croissance de l'audience</span>
          </h3>
          <p className="text-[11px] text-text-muted mt-1">
            Nombre de nouveaux abonnés et abonnements par période, basé sur les dates d'abonnement de votre export.
          </p>
        </div>

        {/* Legend & Period Selector */}
        <div className="flex flex-wrap items-center gap-4 lg:gap-6 self-start lg:self-center">
          {/* HTML Legend (stays fixed and visible on scroll) */}
          <div className="flex items-center space-x-4 text-xs font-semibold Outfit">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-brand-purple opacity-85 block"></span>
              <span className="text-text-secondary">Abonnés gagnés</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-brand-cyan opacity-85 block"></span>
              <span className="text-text-secondary">Suivis</span>
            </div>
          </div>

          {/* Selector */}
          <div className="flex items-center rounded-xl overflow-hidden border border-border-glass text-xs bg-bg-item">
            {periods.map((p) => (
              <button
                key={p.key}
                onClick={() => setActivePeriod(p.key)}
                className={`px-3 py-1.5 font-semibold Outfit transition-all duration-200 cursor-pointer ${
                  activePeriod === p.key
                    ? "bg-brand-purple text-white shadow-glow"
                    : "bg-transparent text-text-secondary hover:bg-bg-item-hover"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart wrapper to handle overflow scrolling */}
      {data.length === 0 ? (
        <div className="py-12 text-center text-xs text-text-muted select-none border border-dashed border-border-glass rounded-xl bg-bg-item">
          Aucune donnée temporelle disponible pour cette période.
        </div>
      ) : (
        <div className="overflow-x-auto w-full pr-2 pb-2 scrollbar-thin">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight + chartTop + 25}`}
            width={chartWidth}
            height={chartHeight + chartTop + 25}
            className="block"
            role="img"
            aria-label="Graphique de croissance de l'audience"
          >
            {/* Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
              const y = chartTop + chartHeight - frac * chartHeight;
              return (
                <g key={frac}>
                  <line
                    x1="40"
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="var(--border-glass)"
                    strokeWidth="1"
                  />
                  <text
                    x="34"
                    y={y + 3}
                    textAnchor="end"
                    className="fill-text-muted font-bold"
                    fontSize="9"
                    fontFamily="Outfit, sans-serif"
                  >
                    {Math.round(frac * maxVal)}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {data.map((d, i) => {
              const x = 50 + i * itemWidth + (itemWidth - (barWidth * 2 + gap)) / 2;
              const hFollowers = (d.followers / maxVal) * chartHeight;
              const hFollowing = (d.following / maxVal) * chartHeight;

              return (
                <g key={d.key}>
                  {/* Follower bar */}
                  <rect
                    x={x}
                    y={chartTop + chartHeight - hFollowers}
                    width={barWidth}
                    height={Math.max(hFollowers, 1)}
                    rx="3"
                    fill="var(--color-purple)"
                    opacity="0.85"
                  >
                    <title>Abonnés: +{d.followers} ({d.label})</title>
                  </rect>
                  {/* Following bar */}
                  <rect
                    x={x + barWidth + gap}
                    y={chartTop + chartHeight - hFollowing}
                    width={barWidth}
                    height={Math.max(hFollowing, 1)}
                    rx="3"
                    fill="var(--color-cyan)"
                    opacity="0.85"
                  >
                    <title>Abonnements: +{d.following} ({d.label})</title>
                  </rect>
                  {/* Label */}
                  <text
                    x={x + barWidth + gap / 2}
                    y={chartTop + chartHeight + 16}
                    textAnchor="middle"
                    className="fill-text-muted font-bold"
                    fontSize="8"
                    fontFamily="Outfit, sans-serif"
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}
