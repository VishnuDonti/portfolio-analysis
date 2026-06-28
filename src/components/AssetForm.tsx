import React, { useState, useEffect } from "react";
import { Asset, AssetType } from "../types";
import { AVAILABLE_SECTORS } from "../data";
import { X, Plus, Edit2 } from "lucide-react";

interface AssetFormProps {
  id: string;
  assetToEdit?: Asset | null;
  currency: "USD" | "INR";
  onSave: (asset: Omit<Asset, "id"> & { id?: string }) => void;
  onCancel: () => void;
}

const ASSET_TYPES: AssetType[] = [
  "Stock",
  "Crypto",
  "ETF",
  "Mutual Fund",
  "Bond",
  "Cash",
  "Other",
];

export default function AssetForm({ id, assetToEdit, currency, onSave, onCancel }: AssetFormProps) {
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<AssetType>("Stock");
  const [quantity, setQuantity] = useState<number | "">("");
  const [costBasis, setCostBasis] = useState<number | "">("");
  const [currentPrice, setCurrentPrice] = useState<number | "">("");
  const [sector, setSector] = useState(AVAILABLE_SECTORS[0]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const FX_RATE = 83.0;
    if (assetToEdit) {
      setSymbol(assetToEdit.symbol);
      setName(assetToEdit.name);
      setType(assetToEdit.type);
      setQuantity(assetToEdit.quantity);
      setCostBasis(currency === "INR" ? Number((assetToEdit.costBasis * FX_RATE).toFixed(2)) : assetToEdit.costBasis);
      setCurrentPrice(currency === "INR" ? Number((assetToEdit.currentPrice * FX_RATE).toFixed(2)) : assetToEdit.currentPrice);
      setSector(assetToEdit.sector);
    } else {
      setSymbol("");
      setName("");
      setType("Stock");
      setQuantity("");
      setCostBasis("");
      setCurrentPrice("");
      setSector(AVAILABLE_SECTORS[0]);
    }
    setErrors({});
  }, [assetToEdit, currency]);

  // Handle automatic details for popular tickers
  const handleSymbolBlur = () => {
    if (!symbol) return;
    const cleanSym = symbol.toUpperCase().trim();
    setSymbol(cleanSym);

    // Auto-fill common defaults if adding a new asset
    if (!assetToEdit) {
      const FX_RATE = 83.0;
      const getAutoPrice = (usdPrice: number) => {
        return currency === "INR" ? Number((usdPrice * FX_RATE).toFixed(2)) : usdPrice;
      };

      if (cleanSym === "AAPL") {
        setName("Apple Inc.");
        setType("Stock");
        setSector("Technology");
        setCurrentPrice(getAutoPrice(189.3));
      } else if (cleanSym === "BTC") {
        setName("Bitcoin");
        setType("Crypto");
        setSector("Cryptocurrency");
        setCurrentPrice(getAutoPrice(63800));
      } else if (cleanSym === "ETH") {
        setName("Ethereum");
        setType("Crypto");
        setSector("Cryptocurrency");
        setCurrentPrice(getAutoPrice(3450));
      } else if (cleanSym === "VOO") {
        setName("Vanguard S&P 500 ETF");
        setType("ETF");
        setSector("Broad Market");
        setCurrentPrice(getAutoPrice(485.6));
      } else if (cleanSym === "BND") {
        setName("Vanguard Total Bond Market");
        setType("Bond");
        setSector("Fixed Income");
        setCurrentPrice(getAutoPrice(73.1));
      } else if (cleanSym === "MSFT") {
        setName("Microsoft Corp.");
        setType("Stock");
        setSector("Technology");
        setCurrentPrice(getAutoPrice(415.5));
      } else if (cleanSym === "NVDA") {
        setName("NVIDIA Corp.");
        setType("Stock");
        setSector("Technology");
        setCurrentPrice(getAutoPrice(125.2));
      } else if (cleanSym === "CASH" || cleanSym === "USD") {
        setName("US Dollar Cash");
        setType("Cash");
        setSector("Cash Equivalents");
        setQuantity(1000);
        setCostBasis(getAutoPrice(1));
        setCurrentPrice(getAutoPrice(1));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!symbol.trim()) newErrors.symbol = "Ticker symbol is required";
    if (!name.trim()) newErrors.name = "Asset name is required";
    if (quantity === "" || Number(quantity) <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }
    if (costBasis === "" || Number(costBasis) < 0) {
      newErrors.costBasis = "Cost basis cannot be negative";
    }
    if (currentPrice === "" || Number(currentPrice) < 0) {
      newErrors.currentPrice = "Current price cannot be negative";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const FX_RATE = 83.0;
    const finalCostBasis = currency === "INR" ? Number((Number(costBasis) / FX_RATE).toFixed(4)) : Number(costBasis);
    const finalCurrentPrice = currency === "INR" ? Number((Number(currentPrice) / FX_RATE).toFixed(4)) : Number(currentPrice);

    onSave({
      id: assetToEdit?.id,
      symbol: symbol.toUpperCase().trim(),
      name: name.trim(),
      type,
      quantity: Number(quantity),
      costBasis: finalCostBasis,
      currentPrice: finalCurrentPrice,
      sector,
    });
  };

  return (
    <div id={id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm relative">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
        <h3 className="text-sm font-bold font-sans text-slate-900 flex items-center gap-2">
          {assetToEdit ? (
            <>
              <Edit2 className="w-4 h-4 text-indigo-600" /> Edit Asset
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 text-indigo-600" /> Add New Asset
            </>
          )}
        </h3>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-50 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ticker / Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              onBlur={handleSymbolBlur}
              placeholder="e.g. AAPL, BTC"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
            />
            {errors.symbol && <p className="text-[10px] text-red-500 mt-1 font-sans">{errors.symbol}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Asset Class</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AssetType)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-sans"
            >
              {ASSET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Asset Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Apple Inc. / Bitcoin"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-sans"
          />
          {errors.name && <p className="text-[10px] text-red-500 mt-1 font-sans">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Quantity</label>
            <input
              type="number"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="0.0"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
            />
            {errors.quantity && <p className="text-[10px] text-red-500 mt-1 font-sans">{errors.quantity}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cost Basis ({currency === "INR" ? "₹" : "$"})</label>
            <input
              type="number"
              step="any"
              value={costBasis}
              onChange={(e) => setCostBasis(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="0.00"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
            />
            {errors.costBasis && <p className="text-[10px] text-red-500 mt-1 font-sans">{errors.costBasis}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Price ({currency === "INR" ? "₹" : "$"})</label>
            <input
              type="number"
              step="any"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="0.00"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
            />
            {errors.currentPrice && <p className="text-[10px] text-red-500 mt-1 font-sans">{errors.currentPrice}</p>}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Market Sector</label>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-sans"
          >
            {AVAILABLE_SECTORS.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-mono font-bold border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
          >
            Save Asset
          </button>
        </div>
      </form>
    </div>
  );
}
