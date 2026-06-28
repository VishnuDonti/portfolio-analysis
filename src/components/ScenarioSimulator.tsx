import React, { useState } from "react";
import { Asset, BacktestScenario } from "../types";
import { SCENARIOS } from "../data";
import { HelpCircle, Play, Undo2, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

interface ScenarioSimulatorProps {
  id: string;
  assets: Asset[];
  currency: "USD" | "INR";
}

export default function ScenarioSimulator({ id, assets, currency }: ScenarioSimulatorProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState(SCENARIOS[0].id);
  const [simulated, setSimulated] = useState(false);

  if (assets.length === 0) {
    return (
      <div id={id} className="bg-white border border-slate-200 rounded-lg p-6 text-center flex flex-col items-center justify-center space-y-2">
        <AlertTriangle className="w-8 h-8 text-amber-500 animate-pulse" />
        <h4 className="font-bold text-slate-800 text-sm">Portfolio is empty</h4>
        <p className="text-xs text-slate-500 max-w-xs font-medium">
          Add assets to your inventory before attempting to simulate macroeconomic shocks.
        </p>
      </div>
    );
  }

  const selectedScenario = SCENARIOS.find((s) => s.id === selectedScenarioId)!;

  // Calculate math
  const originalTotal = assets.reduce((sum, a) => sum + a.quantity * a.currentPrice, 0);

  let simulatedTotal = 0;
  const assetCalculations = assets.map((asset) => {
    const currentVal = asset.quantity * asset.currentPrice;
    
    // Look up impact percentage. Check sector first, then fall back to asset class, or default to 0.
    const sectorImpact = selectedScenario.impacts[asset.sector];
    const typeImpact = selectedScenario.impacts[asset.type];
    const impactPct = sectorImpact !== undefined ? sectorImpact : (typeImpact !== undefined ? typeImpact : 0);
    
    const changeAmount = (currentVal * impactPct) / 100;
    const projectVal = currentVal + changeAmount;
    simulatedTotal += projectVal;

    return {
      ...asset,
      originalValue: currentVal,
      projectedValue: projectVal,
      changeAmount,
      impactPct,
    };
  });

  const netImpactAmount = simulatedTotal - originalTotal;
  const netImpactPercent = originalTotal > 0 ? (netImpactAmount / originalTotal) * 100 : 0;
  const isLoss = netImpactAmount < 0;

  // Format Helpers
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
    <div id={id} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Selector & Details Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-600" /> Select Macro Scenario
            </h4>
            <select
              value={selectedScenarioId}
              onChange={(e) => {
                setSelectedScenarioId(e.target.value);
                setSimulated(false);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500 font-sans cursor-pointer"
            >
              {SCENARIOS.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 bg-slate-50/50 border border-slate-100 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Historical Period</span>
              <span className="text-[10px] text-slate-600 font-bold font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {selectedScenario.period}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed pt-1">
              {selectedScenario.description}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 mt-4">
          {!simulated ? (
            <button
              onClick={() => setSimulated(true)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs font-mono transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Play className="w-4 h-4" /> Run Stress Simulation
            </button>
          ) : (
            <button
              onClick={() => setSimulated(false)}
              className="w-full py-2.5 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 rounded-lg font-bold text-xs font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Undo2 className="w-4 h-4" /> Reset Simulation
            </button>
          )}
        </div>
      </div>

      {/* Results panel */}
      <div className="xl:col-span-2 bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col justify-between">
        {!simulated ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
            <AlertTriangle className="w-12 h-12 text-slate-300 animate-pulse" />
            <h4 className="text-sm font-bold text-slate-800">Simulation Not Started</h4>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed font-medium">
              Click the stress button to project how your actual asset quantities and weights would hold up during the{" "}
              <span className="text-indigo-600 font-bold">"{selectedScenario.name}"</span> shock.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Simulation KPI card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-3 text-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Pre-Crash Portfolio</span>
                <span className="text-base font-bold text-slate-800 font-mono font-tabular">{formatCurrency(originalTotal)}</span>
              </div>
              <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-3 text-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Simulated Valuation</span>
                <span className="text-base font-bold text-slate-900 font-mono font-tabular">{formatCurrency(simulatedTotal)}</span>
              </div>
              <div className={`border rounded-lg p-3 text-center flex flex-col justify-center ${
                isLoss ? "bg-rose-50 border-rose-100 text-rose-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"
              }`}>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Estimated Impact</span>
                <span className={`text-base font-bold font-mono flex items-center justify-center gap-1 ${
                  isLoss ? "text-rose-600" : "text-emerald-600"
                }`}>
                  {isLoss ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  {isLoss ? "" : "+"}{netImpactPercent.toFixed(1)}%
                </span>
                <span className={`text-[10px] font-mono block font-bold ${isLoss ? "text-rose-500" : "text-emerald-500"}`}>
                  ({isLoss ? "" : "+"}{formatCurrency(netImpactAmount)})
                </span>
              </div>
            </div>

            {/* Asset projection table */}
            <div className="space-y-3">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset Specific Vulnerabilities</h5>
              
              <div className="space-y-2">
                {assetCalculations.map((asset) => {
                  const assetLoss = asset.changeAmount < 0;
                  const ratio = originalTotal > 0 ? (asset.originalValue / originalTotal) * 100 : 0;

                  return (
                    <div key={asset.id} className="bg-slate-50/50 border border-slate-100 p-2.5 rounded-lg flex items-center justify-between gap-4">
                      <div className="flex flex-col min-w-[70px]">
                        <span className="font-bold text-slate-800 text-xs">{asset.symbol}</span>
                        <span className="text-[9px] text-slate-400 uppercase font-bold font-mono">{asset.type}</span>
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[9px] text-slate-400 font-bold font-mono">
                          <span>Holdings magnitude: {ratio.toFixed(0)}%</span>
                          <span className={assetLoss ? "text-rose-600" : "text-emerald-600"}>
                            {assetLoss ? "" : "+"}{asset.impactPct}% shock
                          </span>
                        </div>
                        {/* Interactive relative double meter */}
                        <div className="h-2 bg-slate-100 border border-slate-200/50 rounded overflow-hidden relative">
                          <div
                            className="h-full bg-slate-300 absolute top-0 left-0 transition-all duration-300"
                            style={{ width: `${Math.max(2, (asset.originalValue / originalTotal) * 100)}%` }}
                          />
                          <div
                            className={`h-full absolute top-0 left-0 transition-all duration-300 opacity-60 ${
                              assetLoss ? "bg-rose-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.max(2, (asset.projectedValue / originalTotal) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-right flex flex-col font-mono text-xs min-w-[90px]">
                        <span className="text-slate-900 font-bold">{formatCurrency(asset.projectedValue)}</span>
                        <span className={`text-[10px] font-bold ${assetLoss ? "text-rose-500" : "text-emerald-600"}`}>
                          {assetLoss ? "" : "+"}{formatCurrency(asset.changeAmount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
