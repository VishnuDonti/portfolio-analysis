import React, { useState } from "react";
import { Asset } from "../types";
import { ChartPie, ChartBar, Info } from "lucide-react";

interface PortfolioChartsProps {
  id: string;
  assets: Asset[];
  currency: "USD" | "INR";
}

const COLORS = [
  "#10b981", // Emerald
  "#6366f1", // Indigo
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#3b82f6", // Blue
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#06b6d4", // Cyan
  "#14b8a6", // Teal
  "#a855f7", // Purple
];

export default function PortfolioCharts({ id, assets, currency }: PortfolioChartsProps) {
  const [groupBy, setGroupBy] = useState<"type" | "sector">("type");
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  if (assets.length === 0) {
    return null;
  }

  // Calculate totals and grouping
  const totalValue = assets.reduce((sum, a) => sum + a.quantity * a.currentPrice, 0);

  const groups: { [key: string]: number } = {};
  assets.forEach((asset) => {
    const key = groupBy === "type" ? asset.type : asset.sector;
    const value = asset.quantity * asset.currentPrice;
    groups[key] = (groups[key] || 0) + value;
  });

  // Sort groups by size
  const sortedGroups = Object.entries(groups)
    .map(([name, value]) => ({
      name,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // Helper for Donut chart calculations
  let accumulatedPercent = 0;
  const donutSlices = sortedGroups.map((group, index) => {
    const slice = {
      ...group,
      color: COLORS[index % COLORS.length],
      startPercent: accumulatedPercent,
      endPercent: accumulatedPercent + group.percentage,
    };
    accumulatedPercent += group.percentage;
    return slice;
  });

  // Format currency
  const formatCurrency = (val: number) => {
    const FX_RATE = 83.0;
    if (currency === "INR") {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(val * FX_RATE);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div id={id} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Chart 1: Donut Allocation */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <ChartPie className="w-4 h-4 text-indigo-600" /> Asset Allocation
            </h4>
            <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-lg">
              <button
                onClick={() => setGroupBy("type")}
                className={`px-2.5 py-1 text-[10px] font-mono rounded-md transition-colors cursor-pointer ${
                  groupBy === "type"
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Asset Class
              </button>
              <button
                onClick={() => setGroupBy("sector")}
                className={`px-2.5 py-1 text-[10px] font-mono rounded-md transition-colors cursor-pointer ${
                  groupBy === "sector"
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Sector
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 py-4 justify-center">
          {/* SVG Donut */}
          <div className="relative w-44 h-44 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {/* Backing circle */}
              <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="12" />

              {/* Dynamic arcs */}
              {donutSlices.map((slice) => {
                const radius = 38;
                const circumference = 2 * Math.PI * radius;
                const strokeDasharray = `${(slice.percentage * circumference) / 100} ${circumference}`;
                const strokeDashoffset = `${-(slice.startPercent * circumference) / 100}`;
                const isHovered = hoveredSlice === slice.name;

                return (
                  <circle
                    key={slice.name}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={isHovered ? 15 : 12}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap={slice.percentage === 100 ? "butt" : "round"}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredSlice(slice.name)}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {hoveredSlice ? (
                <>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center max-w-[100px] truncate">
                    {hoveredSlice}
                  </span>
                  <span className="text-sm font-mono font-bold text-indigo-600">
                    {donutSlices.find((s) => s.name === hoveredSlice)?.percentage.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Total Net Value
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-950">
                    {formatCurrency(totalValue)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Legends */}
          <div className="flex-1 w-full space-y-2">
            {donutSlices.slice(0, 5).map((slice) => (
              <div
                key={slice.name}
                className={`flex items-center justify-between p-1.5 rounded-lg border transition-all cursor-pointer ${
                  hoveredSlice === slice.name
                    ? "bg-indigo-50/50 border-slate-200"
                    : "bg-transparent border-transparent"
                }`}
                onMouseEnter={() => setHoveredSlice(slice.name)}
                onMouseLeave={() => setHoveredSlice(null)}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                  <span className="text-xs text-slate-600 font-bold truncate max-w-[120px]">
                    {slice.name}
                  </span>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-slate-900 font-bold">{slice.percentage.toFixed(1)}%</span>
                  <span className="text-slate-400 block text-[9px] font-normal">{formatCurrency(slice.value)}</span>
                </div>
              </div>
            ))}
            {donutSlices.length > 5 && (
              <div className="flex items-center gap-1.5 pl-4 text-[10px] text-slate-400 font-mono">
                <Info className="w-3 h-3 text-indigo-600" />
                <span>+ {donutSlices.length - 5} other categories</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart 2: Asset Growth / Performance comparison */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
            <ChartBar className="w-4 h-4 text-indigo-600" /> Cost vs. Current Value
          </h4>
        </div>

        <div className="space-y-3 py-1 flex-1 flex flex-col justify-center">
          {assets.slice(0, 5).map((asset) => {
            const currentVal = asset.quantity * asset.currentPrice;
            const totalCost = asset.quantity * asset.costBasis;
            const maxVal = Math.max(
              totalCost,
              currentVal,
              ...assets.map((a) => Math.max(a.quantity * a.costBasis, a.quantity * a.currentPrice))
            );
            const costPct = maxVal > 0 ? (totalCost / maxVal) * 100 : 0;
            const currPct = maxVal > 0 ? (currentVal / maxVal) * 100 : 0;
            const returnPct = totalCost > 0 ? ((currentVal - totalCost) / totalCost) * 100 : 0;

            return (
              <div key={asset.id} className="space-y-1 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{asset.symbol}</span>
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      returnPct >= 0 ? "text-emerald-600" : "text-rose-500"
                    }`}
                  >
                    {returnPct >= 0 ? "+" : ""}
                    {returnPct.toFixed(1)}% Return
                  </span>
                </div>

                {/* Progress Stack bar */}
                <div className="space-y-1">
                  {/* Cost Bar */}
                  <div className="flex items-center gap-2">
                    <span className="w-12 text-[9px] font-bold text-slate-400 uppercase">Cost:</span>
                    <div className="flex-1 h-2 bg-slate-100 border border-slate-200/60 rounded overflow-hidden">
                      <div
                        className="h-full bg-slate-400/70 transition-all duration-500"
                        style={{ width: `${costPct}%` }}
                      />
                    </div>
                    <span className="w-14 text-right text-[10px] font-mono text-slate-500">
                      {formatCurrency(totalCost)}
                    </span>
                  </div>

                  {/* Market Value Bar */}
                  <div className="flex items-center gap-2">
                    <span className="w-12 text-[9px] font-bold text-slate-400 uppercase">Value:</span>
                    <div className="flex-1 h-2 bg-slate-100 border border-slate-200/60 rounded overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          returnPct >= 0 ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${currPct}%` }}
                      />
                    </div>
                    <span className="w-14 text-right text-[10px] font-mono text-slate-900 font-bold">
                      {formatCurrency(currentVal)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {assets.length > 5 && (
            <p className="text-[10px] text-slate-400 text-center font-mono mt-1 font-normal">
              * Showing top 5 assets by absolute cost/value magnitude
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
