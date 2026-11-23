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
  followers: number;
  following: number;
}

function getWeekNumber(d: Date): number {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const numberOfDays = Math.floor(
    (d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000)
  );
  return Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
}

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
      label = `${dd}/${mm}`;
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
      label = `S${String(w).padStart(2, "0")}·${String(yyyy).slice(-2)}`;
      break;
    }
    case "month": {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      key = `${yyyy}-${mm}`;
      label = `${mm}/${String(yyyy).slice(-2)}`;
      break;
    }
    case "year": {
      const yyyy = date.getFullYear();
      key = `${yyyy}`;
      label = `${yyyy}`;
      break;
    }
  }
  return { key, label };
}

function getChronologicalData(
  followers: InstagramUser[],
  following: InstagramUser[],
  period: Period
): DataPoint[] {
  const followersCountMap = new Map<string, { label: string; count: number }>();
  const followingCountMap = new Map<string, { label: string; count: number }>();

  // Exclure strictement les timestamps inconnus (<= 0) pour éviter tout pic artificiel
  followers.forEach((user) => {
    if (!user.timestamp || user.timestamp <= 0) return;
    const { key, label } = getPeriodInfo(user.timestamp, period);
    const existing = followersCountMap.get(key) || { label, count: 0 };
    existing.count++;
    followersCountMap.set(key, existing);
  });

  following.forEach((user) => {
    if (!user.timestamp || user.timestamp <= 0) return;
    const { key, label } = getPeriodInfo(user.timestamp, period);
    const existing = followingCountMap.get(key) || { label, count: 0 };
    existing.count++;
    followingCountMap.set(key, existing);
  });

  const allKeys = new Set<string>([
    ...followersCountMap.keys(),
    ...followingCountMap.keys(),
  ]);

  const points: DataPoint[] = Array.from(allKeys).map((key) => {
    const fInfo = followersCountMap.get(key);
    const figInfo = followingCountMap.get(key);
    return {
      key,
      label: fInfo?.label || figInfo?.label || key,
      followers: fInfo?.count || 0,
      following: figInfo?.count || 0,
    };
  });

  // Tri chronologique naturel : du plus ancien (à gauche) au plus récent (à droite)
  points.sort((a, b) => a.key.localeCompare(b.key));

  // Borner aux 60 dernières périodes actives pour préserver la lisibilité du SVG
  if (points.length > 60) {
    return points.slice(points.length - 60);
  }

  return points;
}

export default function GrowthChart({ followers, following }: GrowthChartProps) {
  const periods: { key: Period; label: string }[] = [
    { key: "day", label: "Jour" },
    { key: "week", label: "Semaine" },
    { key: "month", label: "Mois" },
    { key: "year", label: "Année" },
  ];

  const [activePeriod, setActivePeriod] = useState<Period>("month");
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

  const data = useMemo(
    () => getChronologicalData(followers, following, activePeriod),
    [followers, following, activePeriod]
  );

  const maxVal = useMemo(() => {
    let max = 1;
    data.forEach((d) => {
      if (d.followers > max) max = d.followers;
      if (d.following > max) max = d.following;
    });
    return max;
  }, [data]);

  const chartHeight = 140;
  const chartTop = 16;
  const pointsPerItem = 42;
  const chartWidth = useMemo(
    () => Math.max(320, data.length * pointsPerItem + 44),
    [data.length]
  );

  const barWidth = 8;
  const gap = 3;
  const itemWidth = useMemo(
    () => (chartWidth - 44) / Math.max(1, data.length),
    [chartWidth, data.length]
  );

  const activePoint =
    hoveredPoint || (data.length > 0 ? data[data.length - 1] : null);

  return (
    <section
      aria-label="Chronologie des connexions"
      className="linear-panel rounded-lg p-4 space-y-3.5 overflow-hidden"
    >
      {/* En-tête empilé verticalement (zéro débordement dans la colonne 4/12) */}
      <div className="space-y-3 border-b border-border-subtle pb-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-text-secondary block">
              DISTRIBUTION TEMPORELLE
            </span>
            <h2 className="text-[14px] font-semibold text-text-primary mt-0.5">
              Flux d&apos;acquisition (Passé → Présent)
            </h2>
          </div>
          <span className="shrink-0 px-2 py-0.5 rounded text-[11px] font-mono tabular-nums bg-surface-2 text-text-secondary border border-border-subtle">
            {data.length} {data.length > 1 ? "périodes" : "période"}
          </span>
        </div>

        {/* Sélecteur de période 100% largeur (4 colonnes égales, clic garanti sur toute la surface) */}
        <div
          role="group"
          aria-label="Granularité temporelle"
          className="grid grid-cols-4 gap-1 rounded-md bg-[#0a0b0d] border border-border-subtle p-1 text-xs font-mono"
        >
          {periods.map((p) => {
            const isSelected = activePeriod === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  setActivePeriod(p.key);
                  setHoveredPoint(null);
                }}
                aria-pressed={isSelected}
                className={`w-full py-1.5 px-2 text-center rounded transition-colors duration-150 cursor-pointer select-none ${
                  isSelected
                    ? "bg-brand-indigo text-white font-medium shadow-xs"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Barre combinée Télémétrie & Légende (compacte, contenue à 100% dans le cadre) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-[#0a0b0d] border border-border-subtle text-[11px] font-mono tabular-nums">
          <span className="text-text-secondary font-medium">
            {activePoint ? `Période : ${activePoint.label}` : "Aucune période"}
          </span>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-brand-indigo">
              <span className="w-2 h-2 rounded-xs bg-brand-indigo inline-block shrink-0" />
              <span>+{activePoint ? activePoint.followers : 0} ab.</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-diff-add">
              <span className="w-2 h-2 rounded-xs bg-diff-add inline-block shrink-0" />
              <span>+{activePoint ? activePoint.following : 0} suiv.</span>
            </span>
          </div>
        </div>
      </div>

      {/* Zone de tracé SVG */}
      {data.length === 0 ? (
        <div className="py-8 text-center text-xs font-mono text-text-muted border border-dashed border-border-subtle rounded-md bg-surface-2">
          Aucun horodatage exploitable pour cette période.
        </div>
      ) : (
        <div
          className="overflow-x-auto w-full custom-scrollbar pb-1"
          data-lenis-prevent
        >
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight + chartTop + 24}`}
            width={chartWidth}
            height={chartHeight + chartTop + 24}
            className="block select-none min-w-full"
            role="img"
            aria-label="Graphique de croissance chronologique"
          >
            {/* Lignes de grille horizontales */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
              const y = chartTop + chartHeight - frac * chartHeight;
              return (
                <g key={frac}>
                  <line
                    x1="32"
                    y1={y}
                    x2={chartWidth - 6}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.06)"
                    strokeWidth="1"
                  />
                  <text
                    x="26"
                    y={y + 3}
                    textAnchor="end"
                    fill="#555a64"
                    fontSize="10"
                    fontFamily="var(--font-mono), monospace"
                  >
                    {Math.round(frac * maxVal)}
                  </text>
                </g>
              );
            })}

            {/* Barres de données */}
            {data.map((d, i) => {
              const x =
                36 + i * itemWidth + (itemWidth - (barWidth * 2 + gap)) / 2;
              const hFollowers = (d.followers / maxVal) * chartHeight;
              const hFollowing = (d.following / maxVal) * chartHeight;
              const isHovered = hoveredPoint?.key === d.key;

              return (
                <g
                  key={d.key}
                  onMouseEnter={() => setHoveredPoint(d)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="cursor-crosshair"
                >
                  {/* Surbrillance de colonne au survol */}
                  <rect
                    x={36 + i * itemWidth}
                    y={chartTop}
                    width={itemWidth}
                    height={chartHeight}
                    fill={
                      isHovered ? "rgba(255, 255, 255, 0.035)" : "transparent"
                    }
                  />

                  {/* Barre Abonnés (Linear Indigo) */}
                  <rect
                    x={x}
                    y={chartTop + chartHeight - hFollowers}
                    width={barWidth}
                    height={Math.max(hFollowers, 1.5)}
                    rx="2"
                    fill="#5e6ad2"
                    opacity={isHovered ? "1" : "0.85"}
                  >
                    <title>
                      {d.label} — Abonnés : +{d.followers}
                    </title>
                  </rect>

                  {/* Barre Abonnements (Geist Emerald) */}
                  <rect
                    x={x + barWidth + gap}
                    y={chartTop + chartHeight - hFollowing}
                    width={barWidth}
                    height={Math.max(hFollowing, 1.5)}
                    rx="2"
                    fill="#34d399"
                    opacity={isHovered ? "1" : "0.8"}
                  >
                    <title>
                      {d.label} — Abonnements : +{d.following}
                    </title>
                  </rect>

                  {/* Libellé axe X */}
                  <text
                    x={x + barWidth + gap / 2}
                    y={chartTop + chartHeight + 15}
                    textAnchor="middle"
                    fill={isHovered ? "#f7f8f8" : "#8a8f98"}
                    fontSize="9.5"
                    fontFamily="var(--font-mono), monospace"
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </section>
  );
}
