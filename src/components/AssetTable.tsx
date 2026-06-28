import React from "react";
import { Asset } from "../types";
import { Edit2, Trash2, TrendingUp, TrendingDown, CircleDollarSign } from "lucide-react";

interface AssetTableProps {
  id: string;
  assets: Asset[];
  currency: "USD" | "INR";
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
  totalPortfolioValue: number;
}

export default function AssetTable({
  id,
  assets,
  currency,
  onEdit,
  onDelete,
  totalPortfolioValue,
}: AssetTableProps) {
  // Format helpers
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

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "Stock":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">STK</span>;
      case "Crypto":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-100">CRY</span>;
      case "ETF":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-100">ETF</span>;
      case "Bond":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-100">BND</span>;
      case "Cash":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">CSH</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">OTH</span>;
    }
  };

  if (assets.length === 0) {
    return (
      <div id={id} className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center flex flex-col items-center justify-center space-y-3">
        <CircleDollarSign className="w-10 h-10 text-slate-400 animate-pulse" />
        <h3 className="font-semibold text-slate-700">No assets in portfolio</h3>
        <p className="text-xs text-slate-500 max-w-xs">
          Click the "Add Asset" button or input custom details to begin building and analyzing your investment portfolio.
        </p>
      </div>
    );
  }

  return (
    <div id={id} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Holdings Inventory</h3>
        <span className="text-[10px] font-mono font-bold text-slate-400">{assets.length} Active Asset{assets.length > 1 ? "s" : ""}</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400 font-bold bg-white">
              <th className="py-3 px-4">Symbol</th>
              <th className="py-3 px-3">Class & Sector</th>
              <th className="py-3 px-3 text-right">Holdings</th>
              <th className="py-3 px-3 text-right">Current Value</th>
              <th className="py-3 px-3 text-right">Gain / Loss</th>
              <th className="py-3 px-3 text-right">Weight</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium">
            {assets.map((asset) => {
              const currentVal = asset.quantity * asset.currentPrice;
              const totalCost = asset.quantity * asset.costBasis;
              const gainLoss = currentVal - totalCost;
              const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
              const allocationPercent = totalPortfolioValue > 0 ? (currentVal / totalPortfolioValue) * 100 : 0;
              const isProfit = gainLoss >= 0;

              return (
                <tr key={asset.id} className="hover:bg-indigo-50/20 border-b border-slate-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold font-sans text-slate-900 text-sm tracking-tight">{asset.symbol}</span>
                        {asset.isZerodha && (
                          <span className="text-[9px] font-bold font-mono px-1 py-0.2 bg-indigo-50 text-indigo-600 rounded border border-indigo-100 animate-pulse" title="Synced live via Zerodha Kite Connect">KITE</span>
                        )}
                      </div>
                      <span className="text-slate-400 text-[10px] truncate max-w-[150px] font-normal">{asset.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex flex-col gap-1 items-start">
                      {getAssetIcon(asset.type)}
                      <span className="text-[10px] text-slate-400 font-mono font-normal">{asset.sector}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-slate-600">
                    <div className="flex flex-col">
                      <span className="font-bold">{asset.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                      <span className="text-[10px] text-slate-400 font-normal">@ {formatCurrency(asset.costBasis)}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-slate-900">
                    <div className="flex flex-col">
                      <span className="font-bold">{formatCurrency(currentVal)}</span>
                      <span className="text-[10px] text-slate-400 font-normal">@ {formatCurrency(asset.currentPrice)}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono">
                    <div className={`inline-flex flex-col items-end ${isProfit ? "text-emerald-600" : "text-rose-500"}`}>
                      <span className="flex items-center gap-0.5 text-xs font-bold">
                        {isProfit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {isProfit ? "+" : ""}{formatCurrency(gainLoss)}
                      </span>
                      <span className="text-[10px] font-normal">
                        {isProfit ? "+" : ""}{gainLossPercent.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono">
                    <div className="flex flex-col items-end">
                      <span className="text-slate-700 font-bold">{allocationPercent.toFixed(1)}%</span>
                      {/* Weight progress pill */}
                      <div className="w-12 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-indigo-600"
                          style={{ width: `${Math.min(allocationPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onEdit(asset)}
                        className="p-1.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-all cursor-pointer"
                        title="Edit Asset"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(asset.id)}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-all cursor-pointer"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
