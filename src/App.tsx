import React, { useState, useEffect } from "react";
import { Asset, RiskProfile, PortfolioAnalysis } from "./types";
import { DEFAULT_ASSETS } from "./data";
import MetricCard from "./components/MetricCard";
import AssetTable from "./components/AssetTable";
import AssetForm from "./components/AssetForm";
import PortfolioCharts from "./components/PortfolioCharts";
import AIAnalyst from "./components/AIAnalyst";
import ScenarioSimulator from "./components/ScenarioSimulator";
import Rebalancer from "./components/Rebalancer";
import OptionsAlgoTrading from "./components/OptionsAlgoTrading";
import {
  Wallet,
  TrendingUp,
  LineChart,
  BrainCircuit,
  Activity,
  Scale,
  Plus,
  Compass,
  AlertCircle,
  HelpCircle,
  Link,
  Cpu,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ZerodhaConnector from "./components/ZerodhaConnector";

export default function App() {
  // State: Assets
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem("portfolio_assets");
    return saved ? JSON.parse(saved) : DEFAULT_ASSETS;
  });

  // State: Target Risk profile
  const [riskProfile, setRiskProfile] = useState<RiskProfile>(() => {
    const saved = localStorage.getItem("portfolio_risk_profile");
    return (saved as RiskProfile) || "Balanced";
  });

  // State: Gemini Cache Analysis
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(() => {
    const saved = localStorage.getItem("portfolio_ai_analysis");
    return saved ? JSON.parse(saved) : null;
  });

  // UI Tabs State
  const [activeTab, setActiveTab] = useState<"overview" | "ai" | "scenarios" | "rebalancer" | "options">("overview");

  // Form State
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);

  // State: Currency conversion
  const [currency, setCurrency] = useState<"USD" | "INR">(() => {
    const saved = localStorage.getItem("portfolio_currency");
    return (saved as "USD" | "INR") || "INR";
  });

  // Zerodha Integration State
  const [isZerodhaOpen, setIsZerodhaOpen] = useState(false);

  // Auto-detect Zerodha request token or status errors from URL redirect to trigger modal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("request_token") || params.get("status") === "error" || params.get("message")) {
      setIsZerodhaOpen(true);
    }
  }, []);

  // Sync Currency to LocalStorage
  useEffect(() => {
    localStorage.setItem("portfolio_currency", currency);
  }, [currency]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem("portfolio_assets", JSON.stringify(assets));
    // Clear old cached analysis if holdings change substantially, prompting recalculation
    // This maintains data truth!
  }, [assets]);

  useEffect(() => {
    localStorage.setItem("portfolio_risk_profile", riskProfile);
  }, [riskProfile]);

  useEffect(() => {
    if (analysis) {
      localStorage.setItem("portfolio_ai_analysis", JSON.stringify(analysis));
    } else {
      localStorage.removeItem("portfolio_ai_analysis");
    }
  }, [analysis]);

  // Calculations
  const totalValue = assets.reduce((sum, a) => sum + a.quantity * a.currentPrice, 0);
  const totalCost = assets.reduce((sum, a) => sum + a.quantity * a.costBasis, 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPct = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
  const isProfit = totalGainLoss >= 0;

  // Handler: Save Asset (Create or Update)
  const handleSaveAsset = (newAsset: Omit<Asset, "id"> & { id?: string }) => {
    if (newAsset.id) {
      // Edit mode
      setAssets((prev) =>
        prev.map((a) => (a.id === newAsset.id ? (newAsset as Asset) : a))
      );
      setAssetToEdit(null);
    } else {
      // Add mode
      const freshAsset: Asset = {
        ...newAsset,
        id: Date.now().toString(),
      };
      setAssets((prev) => [...prev, freshAsset]);
      setIsAddingAsset(false);
    }
    // Bust cached analysis since assets modified
    setAnalysis(null);
  };

  // Handler: Delete Asset
  const handleDeleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    setAnalysis(null);
  };

  // Format currency based on selection
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500/10 selection:text-indigo-600">
      
      {/* Dynamic Navigation/App bar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          
          {/* Logo brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
              <Compass className="w-4.5 h-4.5 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-950">Portfolio Analyzer</h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">AI-Powered Risk Engine</span>
            </div>
          </div>

          {/* Controls bar */}
          <div className="flex items-center gap-4">
            {/* Currency Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 border border-slate-200 rounded-lg">
              {(["INR", "USD"] as const).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer font-mono ${
                    currency === curr
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title={`Switch to ${curr}`}
                >
                  {curr === "INR" ? "₹ INR" : "$ USD"}
                </button>
              ))}
            </div>

            {/* Risk Target selection bar */}
            <div className="flex items-center gap-3">
              <span className="hidden lg:inline text-[10px] font-bold text-slate-400 uppercase tracking-widest">Risk Strategy:</span>
              <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-lg">
              {(["Conservative", "Balanced", "Growth", "Aggressive"] as RiskProfile[]).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setRiskProfile(p);
                    setAnalysis(null); // Bust cached analysis to match new targets
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer font-mono ${
                    riskProfile === p
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Dynamic Metric cards row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            id="metric-total-value"
            title="Total Valuation"
            value={formatCurrency(totalValue)}
            subtext="Current real-time market value"
            icon={Wallet}
            iconColor="text-indigo-600"
            bgColor="bg-white"
          />
          <MetricCard
            id="metric-total-return"
            title="Total Unrealized Return"
            value={`${isProfit ? "+" : ""}${formatCurrency(totalGainLoss)}`}
            subtext={`${isProfit ? "+" : ""}${totalGainLossPct.toFixed(2)}% absolute return`}
            subtextColor={isProfit ? "text-emerald-600" : "text-rose-500"}
            icon={TrendingUp}
            iconColor={isProfit ? "text-emerald-600" : "text-rose-500"}
            bgColor="bg-white"
          />
          <MetricCard
            id="metric-cost-basis"
            title="Total Cost Basis"
            value={formatCurrency(totalCost)}
            subtext="Consolidated capital deployed"
            icon={LineChart}
            iconColor="text-slate-500"
            bgColor="bg-white"
          />
          <MetricCard
            id="metric-diversification"
            title="Diversification Rating"
            value={analysis ? `${analysis.diversificationScore}/100` : "Calculate"}
            subtext={analysis ? "Evaluated by Advisor Aura" : "Click AI Advisor tab to scan"}
            subtextColor="text-indigo-600 font-mono font-bold"
            icon={Activity}
            iconColor="text-indigo-600"
            bgColor="bg-white"
          />
        </div>

        {/* Floating warning if analysis is stale */}
        {!analysis && assets.length > 0 && (
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 flex items-center justify-between gap-3 text-xs shadow-sm">
            <span className="text-slate-600 flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
              <AlertCircle className="w-4 h-4 text-indigo-600" />
              Portfolio state altered. Recalculate diversification score with Aura.
            </span>
            <button
              onClick={() => setActiveTab("ai")}
              className="text-indigo-600 hover:text-indigo-500 font-bold font-mono cursor-pointer text-xs"
            >
              Analyze with Gemini →
            </button>
          </div>
        )}

        {/* Navigation tabs */}
        <div className="border-b border-slate-200 flex items-center justify-between pb-1">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-2 text-xs font-bold font-mono uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Overview & Assets
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`px-3 py-2 text-xs font-bold font-mono uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "ai"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5" /> Aura AI Advisor
            </button>
            <button
              onClick={() => setActiveTab("scenarios")}
              className={`px-3 py-2 text-xs font-bold font-mono uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                activeTab === "scenarios"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Stress Simulator
            </button>
            <button
              onClick={() => setActiveTab("rebalancer")}
              className={`px-3 py-2 text-xs font-bold font-mono uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "rebalancer"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Scale className="w-3.5 h-3.5" /> Target Rebalancer
            </button>
            <button
              onClick={() => setActiveTab("options")}
              className={`px-3 py-2 text-xs font-bold font-mono uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "options"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" /> Options Algo
            </button>
          </div>

          {activeTab === "overview" && !isAddingAsset && !assetToEdit && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsZerodhaOpen(true)}
                className="px-3 py-1.5 border border-indigo-200 hover:border-indigo-300 text-indigo-600 hover:text-indigo-500 font-bold text-xs font-mono rounded-lg transition-all flex items-center gap-1 cursor-pointer bg-white shadow-sm"
              >
                <Link className="w-3.5 h-3.5 animate-pulse" /> Link Zerodha
              </button>
              <button
                onClick={() => setIsAddingAsset(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs font-mono rounded-lg transition-all flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Asset
              </button>
            </div>
          )}
        </div>

        {/* Tab panels content layout */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            
            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Drawer asset addition / edit form */}
                {(isAddingAsset || assetToEdit) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="max-w-xl mx-auto"
                  >
                    <AssetForm
                      id="asset-editor-panel"
                      assetToEdit={assetToEdit}
                      currency={currency}
                      onSave={handleSaveAsset}
                      onCancel={() => {
                        setIsAddingAsset(false);
                        setAssetToEdit(null);
                      }}
                    />
                  </motion.div>
                )}

                {/* SVG Charts display */}
                <PortfolioCharts id="overview-charts-panel" assets={assets} currency={currency} />

                {/* Main holdings list */}
                <AssetTable
                  id="asset-holdings-inventory"
                  assets={assets}
                  currency={currency}
                  onEdit={(asset) => {
                    setAssetToEdit(asset);
                    setIsAddingAsset(false);
                    // Scroll smoothly to top form
                    window.scrollTo({ top: 120, behavior: "smooth" });
                  }}
                  onDelete={handleDeleteAsset}
                  totalPortfolioValue={totalValue}
                />
              </motion.div>
            )}

            {/* TAB: AI ADVISOR */}
            {activeTab === "ai" && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AIAnalyst
                  id="gemini-analyst-panel"
                  assets={assets}
                  riskProfile={riskProfile}
                  analysis={analysis}
                  currency={currency}
                  onAnalysisSuccess={(data) => setAnalysis(data)}
                />
              </motion.div>
            )}

            {/* TAB: STRESS SIMULATOR */}
            {activeTab === "scenarios" && (
              <motion.div
                key="scenarios"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ScenarioSimulator id="stress-simulator-panel" assets={assets} currency={currency} />
              </motion.div>
            )}

            {/* TAB: REBALANCER */}
            {activeTab === "rebalancer" && (
              <motion.div
                key="rebalancer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Rebalancer id="rebalancer-calculator-panel" assets={assets} currency={currency} />
              </motion.div>
            )}

            {/* TAB: OPTIONS ALGO TRADING */}
            {activeTab === "options" && (
              <motion.div
                key="options"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <OptionsAlgoTrading currency={currency} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Zerodha Connector Modal */}
      <ZerodhaConnector
        id="zerodha-connector-dialog"
        isOpen={isZerodhaOpen}
        onClose={() => setIsZerodhaOpen(false)}
        currentAssets={assets}
        onImportAssets={(importedAssets) => {
          setAssets(importedAssets);
          setAnalysis(null); // Clear cache so AI Advisor can analyze new Indian stock holdings!
        }}
      />

      {/* Humble Footer */}
      <footer className="border-t border-slate-200 bg-slate-100 py-6 text-center text-[10px] font-bold font-mono text-slate-400 mt-12 uppercase tracking-widest">
        <p>© 2026 Portfolio Analyzer • Powered by Gemini AI • Professional Sandbox</p>
      </footer>
    </div>
  );
}
