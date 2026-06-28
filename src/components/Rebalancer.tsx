import React, { useState, useEffect } from "react";
import { Asset } from "../types";
import { Scale, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";

interface RebalancerProps {
  id: string;
  assets: Asset[];
  currency: "USD" | "INR";
}

export default function Rebalancer({ id, assets, currency }: RebalancerProps) {
  const [targets, setTargets] = useState<{ [key: string]: number }>({});
  const [errors, setErrors] = useState<string | null>(null);

  const totalValue = assets.reduce((sum, a) => sum + a.quantity * a.currentPrice, 0);

  // Initialize target allocations equally on first load
  useEffect(() => {
    if (assets.length > 0) {
      const equalShare = Math.round(100 / assets.length);
      const initialTargets: { [key: string]: number } = {};
      assets.forEach((asset, idx) => {
        // Adjust the last asset to ensure total is exactly 100
        if (idx === assets.length - 1) {
          const sumSoFar = Object.keys(initialTargets).reduce((s, k) => s + (initialTargets[k] || 0), 0);
          initialTargets[asset.id] = 100 - sumSoFar;
        } else {
          initialTargets[asset.id] = equalShare;
        }
      });
      setTargets(initialTargets);
    }
  }, [assets]);

  if (assets.length === 0) {
    return (
      <div id={id} className="bg-white border border-slate-200 rounded-lg p-6 text-center flex flex-col items-center justify-center space-y-2">
        <Scale className="w-8 h-8 text-slate-300 animate-pulse" />
        <h4 className="font-bold text-slate-800 text-sm">Portfolio is empty</h4>
        <p className="text-xs text-slate-500 max-w-xs font-medium">
          Add assets to your holdings before attempting target rebalancing calculations.
        </p>
      </div>
    );
  }

  const handleTargetChange = (assetId: string, val: string) => {
    const num = val === "" ? 0 : Math.max(0, Math.min(100, Number(val)));
    setTargets((prev) => ({
      ...prev,
      [assetId]: num,
    }));
  };

  const totalTargetPercent = Object.keys(targets).reduce((s, k) => s + (targets[k] || 0), 0);
  const isValid = totalTargetPercent === 100;

  // Apply Presets
  const applyPreset = (presetType: "equal" | "current" | "conservative" | "aggressive") => {
    const newTargets: { [key: string]: number } = {};

    if (presetType === "equal") {
      const share = Math.floor(100 / assets.length);
      assets.forEach((asset, idx) => {
        if (idx === assets.length - 1) {
          const sum = Object.keys(newTargets).reduce((s, k) => s + (newTargets[k] || 0), 0);
          newTargets[asset.id] = 100 - sum;
        } else {
          newTargets[asset.id] = share;
        }
      });
    } else if (presetType === "current") {
      assets.forEach((asset, idx) => {
        const val = asset.quantity * asset.currentPrice;
        const wt = totalValue > 0 ? Math.round((val / totalValue) * 100) : 0;
        newTargets[asset.id] = wt;
      });
      // Correct potential rounding anomalies to exact 100
      const sum = Object.keys(newTargets).reduce((s, k) => s + (newTargets[k] || 0), 0);
      if (sum !== 100 && assets.length > 0) {
        newTargets[assets[0].id] += (100 - sum);
      }
    } else if (presetType === "conservative") {
      // Allocate heavily to Bond and Cash types, less to Crypto
      let allocated = 0;
      const lowRiskAssets = assets.filter((a) => a.type === "Bond" || a.type === "Cash");
      const highRiskAssets = assets.filter((a) => a.type === "Crypto" || a.type === "Stock" || a.type === "ETF" || a.type === "Mutual Fund" || a.type === "Other");

      if (lowRiskAssets.length > 0) {
        const lowRiskShare = Math.floor(70 / lowRiskAssets.length);
        lowRiskAssets.forEach((a) => {
          newTargets[a.id] = lowRiskShare;
          allocated += lowRiskShare;
        });
      }

      if (highRiskAssets.length > 0) {
        const remaining = 100 - allocated;
        const highRiskShare = Math.floor(remaining / highRiskAssets.length);
        highRiskAssets.forEach((a, idx) => {
          if (idx === highRiskAssets.length - 1) {
            newTargets[a.id] = 100 - Object.keys(newTargets).reduce((s, k) => s + (newTargets[k] || 0), 0);
          } else {
            newTargets[a.id] = highRiskShare;
          }
        });
      } else if (lowRiskAssets.length > 0) {
        newTargets[lowRiskAssets[0].id] += (100 - allocated);
      }
    } else if (presetType === "aggressive") {
      // Allocate heavily to Stock, Crypto and ETF types
      let allocated = 0;
      const growthAssets = assets.filter((a) => a.type === "Stock" || a.type === "Crypto" || a.type === "ETF");
      const safeAssets = assets.filter((a) => a.type === "Bond" || a.type === "Cash" || a.type === "Mutual Fund" || a.type === "Other");

      if (growthAssets.length > 0) {
        const growthShare = Math.floor(85 / growthAssets.length);
        growthAssets.forEach((a) => {
          newTargets[a.id] = growthShare;
          allocated += growthShare;
        });
      }

      if (safeAssets.length > 0) {
        const remaining = 100 - allocated;
        const safeShare = Math.floor(remaining / safeAssets.length);
        safeAssets.forEach((a, idx) => {
          if (idx === safeAssets.length - 1) {
            newTargets[a.id] = 100 - Object.keys(newTargets).reduce((s, k) => s + (newTargets[k] || 0), 0);
          } else {
            newTargets[a.id] = safeShare;
          }
        });
      } else if (growthAssets.length > 0) {
        newTargets[growthAssets[0].id] += (100 - allocated);
      }
    }

    setTargets(newTargets);
  };

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
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div id={id} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left panel targets adjustment */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-4">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-indigo-600" /> Allocate Targets
          </h4>
          <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-wider">
            Enter target weights. Targets must sum to 100%.
          </p>
        </div>

        {/* Preset quick actions */}
        <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-100">
          <button
            onClick={() => applyPreset("equal")}
            className="px-2 py-1 text-[10px] font-mono font-bold border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Equal Weights
          </button>
          <button
            onClick={() => applyPreset("current")}
            className="px-2 py-1 text-[10px] font-mono font-bold border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Current Weights
          </button>
          <button
            onClick={() => applyPreset("conservative")}
            className="px-2 py-1 text-[10px] font-mono font-bold border border-slate-200 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Conservative
          </button>
          <button
            onClick={() => applyPreset("aggressive")}
            className="px-2 py-1 text-[10px] font-mono font-bold border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Aggressive
          </button>
        </div>

        {/* Form list inputs */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {assets.map((asset) => {
            const currentWeight = totalValue > 0 ? ((asset.quantity * asset.currentPrice) / totalValue) * 100 : 0;

            return (
              <div key={asset.id} className="flex items-center justify-between gap-4 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800 text-xs">{asset.symbol}</span>
                  <span className="text-[10px] text-slate-400 font-bold font-mono">Current: {currentWeight.toFixed(0)}%</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={targets[asset.id] ?? ""}
                    onChange={(e) => handleTargetChange(asset.id, e.target.value)}
                    className="w-16 bg-white border border-slate-200 rounded px-2 py-1 text-center font-mono text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-bold"
                  />
                  <span className="font-mono text-xs text-slate-400 font-bold">%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Validation total indicator */}
        <div className={`p-3 rounded-lg border flex items-center justify-between text-xs font-mono font-bold ${
          isValid
            ? "bg-emerald-50 border-emerald-100 text-emerald-700"
            : "bg-amber-50 border-amber-100 text-amber-700"
        }`}>
          <div className="flex items-center gap-1.5">
            {isValid ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4 animate-bounce" />}
            <span>Total Target Allocated</span>
          </div>
          <span>{totalTargetPercent}%</span>
        </div>
      </div>

      {/* Right panel calculations output */}
      <div className="xl:col-span-2 bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col justify-between">
        {!isValid ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-2">
            <Scale className="w-10 h-10 text-slate-300 animate-pulse" />
            <h4 className="text-sm font-bold text-slate-800">Allocation Mismatch</h4>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed font-medium">
              Adjust your target inputs on the left until the sum equals exactly{" "}
              <span className="text-indigo-600 font-bold font-mono">100%</span> to unlock precise rebalancing buy/sell calculations.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <RefreshCw className="w-4 h-4 text-indigo-600" /> Rebalancing Trade Orders
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="py-2.5 px-3">Asset</th>
                    <th className="py-2.5 px-3 text-right">Current Value</th>
                    <th className="py-2.5 px-3 text-right">Target Weight</th>
                    <th className="py-2.5 px-3 text-right">Target Value</th>
                    <th className="py-2.5 px-3 text-right">Difference</th>
                    <th className="py-2.5 px-3 text-center">Trade Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-600 font-bold">
                  {assets.map((asset) => {
                    const currentVal = asset.quantity * asset.currentPrice;
                    const targetWeight = targets[asset.id] || 0;
                    const targetVal = (totalValue * targetWeight) / 100;
                    const difference = targetVal - currentVal;
                    const unitsRequired = difference / asset.currentPrice;

                    let badge;
                    if (Math.abs(difference) < 5) {
                      badge = <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase">HOLD</span>;
                    } else if (difference > 0) {
                      badge = <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">BUY</span>;
                    } else {
                      badge = <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 uppercase">SELL</span>;
                    }

                    return (
                      <tr key={asset.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-bold text-slate-800">{asset.symbol}</td>
                        <td className="py-3 px-3 text-right text-slate-500 font-tabular">{formatCurrency(currentVal)}</td>
                        <td className="py-3 px-3 text-right font-tabular">{targetWeight}%</td>
                        <td className="py-3 px-3 text-right text-slate-800 font-tabular">{formatCurrency(targetVal)}</td>
                        <td className={`py-3 px-3 text-right font-bold font-tabular ${
                          Math.abs(difference) < 5
                            ? "text-slate-400"
                            : difference > 0
                            ? "text-emerald-600"
                            : "text-rose-500"
                        }`}>
                          {difference > 0 ? "+" : ""}
                          {formatCurrency(difference)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div>{badge}</div>
                            {Math.abs(difference) >= 5 && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                {Math.abs(unitsRequired).toLocaleString(undefined, {
                                  minimumFractionDigits: 1,
                                  maximumFractionDigits: 4,
                                })}{" "}
                                shares
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
