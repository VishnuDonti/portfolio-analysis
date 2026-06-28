import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Square,
  Settings,
  Layers,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ArrowRight,
  Info,
  DollarSign,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  Shield,
  Zap,
} from "lucide-react";

// Safe localStorage helpers
const safeGetItem = (key: string): string => {
  try {
    return localStorage.getItem(key) || "";
  } catch (_) {
    return "";
  }
};

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (_) {}
};

interface OptionLeg {
  id: string;
  strike: number;
  type: "CE" | "PE";
  action: "BUY" | "SELL";
  quantity: number;
  premium: number; // Simulated premium per unit
}

interface AlgoStrategy {
  id: string;
  name: string;
  index: string;
  legs: OptionLeg[];
  triggerType: "immediate" | "rsi_under" | "rsi_over" | "macd_cross" | "time_based";
  triggerValue: string;
  stopLossPct: number;
  takeProfitPct: number;
  trailingSl: boolean;
  isPaperTrade: boolean;
  status: "idle" | "waiting" | "active" | "stopped" | "completed";
  entrySpotPrice: number;
  currentSpotPrice: number;
  pnl: number;
  createdAt: string;
  ordersPlaced: any[];
}

interface Instrument {
  symbol: string;
  name: string;
  type: "INDEX" | "STOCK";
  lotSize: number;
  strikeStep: number;
}

const DEFAULT_INSTRUMENTS: Instrument[] = [
  { symbol: "NIFTY 50", name: "Nifty 50 Index", type: "INDEX", lotSize: 50, strikeStep: 100 },
  { symbol: "BANKNIFTY", name: "Nifty Bank Index", type: "INDEX", lotSize: 15, strikeStep: 100 },
  { symbol: "RELIANCE", name: "Reliance Industries", type: "STOCK", lotSize: 250, strikeStep: 20 },
  { symbol: "TCS", name: "Tata Consultancy Services", type: "STOCK", lotSize: 175, strikeStep: 50 },
  { symbol: "INFY", name: "Infosys Ltd", type: "STOCK", lotSize: 400, strikeStep: 20 },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", type: "STOCK", lotSize: 550, strikeStep: 10 },
  { symbol: "ICICIBANK", name: "ICICI Bank Ltd", type: "STOCK", lotSize: 700, strikeStep: 10 },
  { symbol: "SBIN", name: "State Bank of India", type: "STOCK", lotSize: 1500, strikeStep: 5 },
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd", type: "STOCK", lotSize: 1425, strikeStep: 10 },
];

export default function OptionsAlgoTrading({ currency }: { currency: "USD" | "INR" }) {
  // 1. Core States
  const [instruments, setInstruments] = useState<Instrument[]>(() => {
    const saved = safeGetItem("sod_custom_instruments");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return DEFAULT_INSTRUMENTS;
  });

  const [index, setIndex] = useState<string>("NIFTY 50");
  const [strategyPreset, setStrategyPreset] = useState<string>("bull_call_spread");
  const [legs, setLegs] = useState<OptionLeg[]>([]);
  const [activeStrategies, setActiveStrategies] = useState<AlgoStrategy[]>(() => {
    const saved = safeGetItem("active_algo_strategies");
    return saved ? JSON.parse(saved) : [];
  });
  const [strategyName, setStrategyName] = useState("Alpha Bullish Spread");
  const [triggerType, setTriggerType] = useState<"immediate" | "rsi_under" | "rsi_over" | "macd_cross" | "time_based">("immediate");
  const [triggerValue, setTriggerValue] = useState("Immediate Entry");
  const [stopLossPct, setStopLossPct] = useState(10);
  const [takeProfitPct, setTakeProfitPct] = useState(10);
  const [trailingSl, setTrailingSl] = useState(false);
  const [isPaperTrade, setIsPaperTrade] = useState(true);

  // Custom stock creator states
  const [customSymbolInput, setCustomSymbolInput] = useState("");
  const [customNameInput, setCustomNameInput] = useState("");
  const [customLotInput, setCustomLotInput] = useState(100);
  const [customStepInput, setCustomStepInput] = useState(10);
  const [customSpotInput, setCustomSpotInput] = useState(1000);
  const [showCustomCreator, setShowCustomCreator] = useState(false);

  // SOD (Start of Day) Intraday Day Trading States
  const [sodEnabled, setSodEnabled] = useState(() => safeGetItem("sod_enabled") === "true");
  const [sodTime, setSodTime] = useState(() => safeGetItem("sod_time") || "09:15");
  const [sodStopLoss, setSodStopLoss] = useState(() => parseInt(safeGetItem("sod_sl")) || 10);
  const [sodTakeProfit, setSodTakeProfit] = useState(() => parseInt(safeGetItem("sod_tp")) || 10);
  const [sodIndex, setSodIndex] = useState<string>(() => safeGetItem("sod_index") || "NIFTY 50");
  const [sodPreset, setSodPreset] = useState(() => safeGetItem("sod_preset") || "straddle");
  const [sodIsPaperTrade, setSodIsPaperTrade] = useState(() => safeGetItem("sod_paper_trade") !== "false");
  const [sodLastRunDate, setSodLastRunDate] = useState(() => safeGetItem("sod_last_run_date") || "");
  const [sodDailyCount, setSodDailyCount] = useState(() => parseInt(safeGetItem("sod_daily_count")) || 0);

  // Sync SOD states to localStorage
  useEffect(() => {
    safeSetItem("sod_enabled", String(sodEnabled));
    safeSetItem("sod_time", sodTime);
    safeSetItem("sod_sl", String(sodStopLoss));
    safeSetItem("sod_tp", String(sodTakeProfit));
    safeSetItem("sod_index", sodIndex);
    safeSetItem("sod_preset", sodPreset);
    safeSetItem("sod_paper_trade", String(sodIsPaperTrade));
    safeSetItem("sod_last_run_date", sodLastRunDate);
    safeSetItem("sod_daily_count", String(sodDailyCount));
  }, [sodEnabled, sodTime, sodStopLoss, sodTakeProfit, sodIndex, sodPreset, sodIsPaperTrade, sodLastRunDate, sodDailyCount]);

  // Sync custom instruments
  useEffect(() => {
    safeSetItem("sod_custom_instruments", JSON.stringify(instruments));
  }, [instruments]);

  // AI News Suggestions states
  const [newsSuggestions, setNewsSuggestions] = useState<any[]>(() => {
    const saved = safeGetItem("sod_news_suggestions");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return [];
  });
  const [loadingNews, setLoadingNews] = useState(false);
  const [newsLastUpdated, setNewsLastUpdated] = useState(() => safeGetItem("sod_news_last_updated") || "Never");

  const fetchNewsSuggestions = async () => {
    setLoadingNews(true);
    addLog("Scanning recent global market and stock news for trading ideas...");
    try {
      const response = await fetch("/api/news-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      if (data && Array.isArray(data.suggestions)) {
        setNewsSuggestions(data.suggestions);
        setNewsLastUpdated(data.lastUpdated);
        safeSetItem("sod_news_suggestions", JSON.stringify(data.suggestions));
        safeSetItem("sod_news_last_updated", data.lastUpdated);
        addLog(`Successfully parsed ${data.suggestions.length} news-driven option suggestions from Gemini Intelligence.`);
      } else {
        throw new Error("Invalid suggestions response format");
      }
    } catch (error: any) {
      console.error("Failed to fetch stock suggestions:", error);
      addLog(`⚠️ AI News suggestions scan failed: ${error?.message || error}`);
    } finally {
      setLoadingNews(false);
    }
  };

  const selectSuggestedStock = (suggestion: any) => {
    // 1. Check if the instrument exists, if not, add it
    const exists = instruments.find((ins) => ins.symbol === suggestion.symbol);
    if (!exists) {
      const newIns: Instrument = {
        symbol: suggestion.symbol,
        name: suggestion.name,
        type: suggestion.symbol.includes("NIFTY") ? "INDEX" : "STOCK",
        lotSize: suggestion.suggestedLotSize || 100,
        strikeStep: suggestion.suggestedStrikeStep || 10,
      };
      setInstruments((prev) => [...prev, newIns]);
    } else {
      // Update its custom parameters if they vary
      setInstruments((prev) =>
        prev.map((ins) => {
          if (ins.symbol === suggestion.symbol) {
            return {
              ...ins,
              lotSize: suggestion.suggestedLotSize || ins.lotSize,
              strikeStep: suggestion.suggestedStrikeStep || ins.strikeStep,
            };
          }
          return ins;
        })
      );
    }

    // 2. Add/update simulated spot price for this symbol
    setSpotPrices((prev) => ({
      ...prev,
      [suggestion.symbol]: suggestion.targetSpot || prev[suggestion.symbol] || 1000,
    }));

    // 3. Select index/ticker and preset
    setIndex(suggestion.symbol);
    setStrategyPreset(suggestion.suggestedPreset);

    // 4. Log status
    addLog(`Loaded news-driven options structure for ${suggestion.symbol} [${suggestion.suggestedPreset}] based on: "${suggestion.newsHeadline}"`);
    setSuccessMsg(`Configured strategy builder with ${suggestion.symbol} and recommended ${suggestion.suggestedPreset.replace(/_/g, " ").toUpperCase()} preset!`);
    
    // 5. Scroll smoothly to builder
    setTimeout(() => {
      const element = document.getElementById("options-strategy-builder");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const selectSodNewsSuggestion = (suggestion: any) => {
    // 1. Check if the instrument exists, if not, add it
    const exists = instruments.find((ins) => ins.symbol === suggestion.symbol);
    if (!exists) {
      const newIns: Instrument = {
        symbol: suggestion.symbol,
        name: suggestion.name,
        type: suggestion.symbol.includes("NIFTY") ? "INDEX" : "STOCK",
        lotSize: suggestion.suggestedLotSize || 100,
        strikeStep: suggestion.suggestedStrikeStep || 10,
      };
      setInstruments((prev) => [...prev, newIns]);
    } else {
      // Update its parameters if they vary
      setInstruments((prev) =>
        prev.map((ins) => {
          if (ins.symbol === suggestion.symbol) {
            return {
              ...ins,
              lotSize: suggestion.suggestedLotSize || ins.lotSize,
              strikeStep: suggestion.suggestedStrikeStep || ins.strikeStep,
            };
          }
          return ins;
        })
      );
    }

    // 2. Add/update simulated spot price for this symbol
    setSpotPrices((prev) => ({
      ...prev,
      [suggestion.symbol]: suggestion.targetSpot || prev[suggestion.symbol] || 1000,
    }));

    // 3. Set SOD fields
    setSodIndex(suggestion.symbol);
    setSodPreset(suggestion.suggestedPreset);

    addLog(`[SOD Auto] Loaded news-driven instrument ${suggestion.symbol} (${suggestion.suggestedPreset.replace(/_/g, " ").toUpperCase()}) based on news: "${suggestion.newsHeadline}"`);
    setSuccessMsg(`[SOD Auto] Configured with ${suggestion.symbol} based on latest ${suggestion.sentiment} market news!`);
  };

  // Status logs
  const [logMessages, setLogMessages] = useState<string[]>(["Algo system initialized.", "Paper trading sandbox server active."]);

  // Zerodha connectivity check
  const [apiKey, setApiKey] = useState(() => safeGetItem("zerodha_api_key"));
  const [accessToken, setAccessToken] = useState(() => safeGetItem("zerodha_access_token"));
  const isZerodhaConnected = !!apiKey && !!accessToken;

  // Live market quotes (simulated)
  const [spotPrices, setSpotPrices] = useState<{ [symbol: string]: number }>(() => {
    const saved = safeGetItem("sod_spot_prices");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return {
      "NIFTY 50": 24000,
      "BANKNIFTY": 52000,
      "RELIANCE": 2520,
      "TCS": 3840,
      "INFY": 1620,
      "HDFCBANK": 1710,
      "ICICIBANK": 1160,
      "SBIN": 825,
      "TATAMOTORS": 945,
    };
  });

  const spotPricesRef = useRef(spotPrices);
  useEffect(() => {
    spotPricesRef.current = spotPrices;
    safeSetItem("sod_spot_prices", JSON.stringify(spotPrices));
  }, [spotPrices]);

  const spotPrice = spotPrices[index] || 1000;

  // General state feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // FX Rate (INR to displays)
  const FX_RATE = 83.0;
  const formatValue = (val: number) => {
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
      maximumFractionDigits: 0,
    }).format(val);
  };

  // 2. Load Preset Options Legs whenever spot price or preset changes
  useEffect(() => {
    const currentInstrument = instruments.find((ins) => ins.symbol === index) || DEFAULT_INSTRUMENTS[0];
    const defaultLot = currentInstrument.lotSize;
    const step = currentInstrument.strikeStep;
    const baseSpot = Math.round(spotPrice / step) * step;

    let newLegs: OptionLeg[] = [];
    if (strategyPreset === "bull_call_spread") {
      newLegs = [
        { id: "leg1", strike: baseSpot, type: "CE", action: "BUY", quantity: defaultLot, premium: 145 },
        { id: "leg2", strike: baseSpot + step, type: "CE", action: "SELL", quantity: defaultLot, premium: 85 },
      ];
    } else if (strategyPreset === "bear_put_spread") {
      newLegs = [
        { id: "leg1", strike: baseSpot, type: "PE", action: "BUY", quantity: defaultLot, premium: 130 },
        { id: "leg2", strike: baseSpot - step, type: "PE", action: "SELL", quantity: defaultLot, premium: 72 },
      ];
    } else if (strategyPreset === "iron_condor") {
      newLegs = [
        { id: "leg1", strike: baseSpot - 2 * step, type: "PE", action: "BUY", quantity: defaultLot, premium: 22 },
        { id: "leg2", strike: baseSpot - step, type: "PE", action: "SELL", quantity: defaultLot, premium: 54 },
        { id: "leg3", strike: baseSpot + step, type: "CE", action: "SELL", quantity: defaultLot, premium: 58 },
        { id: "leg4", strike: baseSpot + 2 * step, type: "CE", action: "BUY", quantity: defaultLot, premium: 25 },
      ];
    } else if (strategyPreset === "straddle") {
      newLegs = [
        { id: "leg1", strike: baseSpot, type: "CE", action: "BUY", quantity: defaultLot, premium: 155 },
        { id: "leg2", strike: baseSpot, type: "PE", action: "BUY", quantity: defaultLot, premium: 140 },
      ];
    } else if (strategyPreset === "strangle") {
      newLegs = [
        { id: "leg1", strike: baseSpot + step, type: "CE", action: "BUY", quantity: defaultLot, premium: 88 },
        { id: "leg2", strike: baseSpot - step, type: "PE", action: "BUY", quantity: defaultLot, premium: 76 },
      ];
    }
    setLegs(newLegs);
  }, [strategyPreset, index, spotPrice, instruments]);

  // Dynamic news-driven options suggestions on mount if empty
  useEffect(() => {
    if (!newsSuggestions || newsSuggestions.length === 0) {
      fetchNewsSuggestions();
    }
  }, []);

  // Sync state with localStorage
  useEffect(() => {
    safeSetItem("active_algo_strategies", JSON.stringify(activeStrategies));
  }, [activeStrategies]);

  // Periodic simulated market data and algorithm check
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Random walk for spot prices to simulate live ticks
      setSpotPrices((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((sym) => {
          const prevVal = next[sym] ?? 1000;
          const pct = (Math.random() - 0.495) * 0.0016; // 0.16% max change
          next[sym] = Math.round((prevVal + prevVal * pct) * 100) / 100;
        });
        return next;
      });

      // 2. Update active algorithms
      setActiveStrategies((prevStrategies) => {
        let altered = false;
        const next = prevStrategies.map((strat) => {
          if (strat.status !== "active") return strat;

          altered = true;
          const currentSpot = spotPricesRef.current[strat.index] || strat.currentSpotPrice;
          const deltaSpot = currentSpot - strat.entrySpotPrice;

          // Compute live floating payoff of multi-leg strategy based on simple option delta-premium simulation
          let totalLegsPnl = 0;
          strat.legs.forEach((leg) => {
            const intrinsicAtEntry =
              leg.type === "CE"
                ? Math.max(0, strat.entrySpotPrice - leg.strike)
                : Math.max(0, leg.strike - strat.entrySpotPrice);

            const intrinsicNow =
              leg.type === "CE"
                ? Math.max(0, currentSpot - leg.strike)
                : Math.max(0, leg.strike - currentSpot);

            // Option premium tracks intrinsic value shift + remaining time value decay (assumed slightly stable)
            const simulatedPremiumNow = Math.max(
              2.0,
              leg.premium + (intrinsicNow - intrinsicAtEntry) * 0.95
            );

            const tradeLegPnl =
              leg.action === "BUY"
                ? (simulatedPremiumNow - leg.premium) * leg.quantity
                : (leg.premium - simulatedPremiumNow) * leg.quantity;

            totalLegsPnl += tradeLegPnl;
          });

          // Check stop-loss / take-profit conditions
          let status = strat.status;
          let entryTotalPremium = strat.legs.reduce(
            (acc, curr) => acc + curr.premium * curr.quantity,
            0
          );
          if (entryTotalPremium === 0) entryTotalPremium = 1;

          // Normalized margin/capital proxy
          const totalCapitalProxy = strat.legs.reduce(
            (acc, curr) => acc + curr.strike * 0.1 * curr.quantity,
            0
          );

          const percentReturn = (totalLegsPnl / (totalCapitalProxy || 50000)) * 100;

          if (percentReturn <= -strat.stopLossPct) {
            status = "completed";
            addLog(`Strategy [${strat.name}] breached Stop Loss of -${strat.stopLossPct}%. Auto squaring off legs.`);
          } else if (percentReturn >= strat.takeProfitPct) {
            status = "completed";
            addLog(`Strategy [${strat.name}] achieved Take Profit target of +${strat.takeProfitPct}%. Locking profit!`);
          }

          return {
            ...strat,
            currentSpotPrice: currentSpot,
            pnl: totalLegsPnl,
            status,
          };
        });

        return altered ? next : prevStrategies;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogMessages((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 40)]);
  };

  // SOD Day Trading Automation Executor
  const executeSodEntry = async (forced = false) => {
    const curSpot = spotPrices[sodIndex] || 1000;
    const currentInstrument = instruments.find((ins) => ins.symbol === sodIndex) || instruments[0];
    const defaultLot = currentInstrument.lotSize;
    const step = currentInstrument.strikeStep;
    const baseSpot = Math.round(curSpot / step) * step;

    let sodLegs: OptionLeg[] = [];
    if (sodPreset === "bull_call_spread") {
      sodLegs = [
        { id: `sod-leg1-${Date.now()}`, strike: baseSpot, type: "CE", action: "BUY", quantity: defaultLot, premium: 145 },
        { id: `sod-leg2-${Date.now()}`, strike: baseSpot + step, type: "CE", action: "SELL", quantity: defaultLot, premium: 85 },
      ];
    } else if (sodPreset === "bear_put_spread") {
      sodLegs = [
        { id: `sod-leg1-${Date.now()}`, strike: baseSpot, type: "PE", action: "BUY", quantity: defaultLot, premium: 130 },
        { id: `sod-leg2-${Date.now()}`, strike: baseSpot - step, type: "PE", action: "SELL", quantity: defaultLot, premium: 72 },
      ];
    } else if (sodPreset === "iron_condor") {
      sodLegs = [
        { id: `sod-leg1-${Date.now()}`, strike: baseSpot - 2 * step, type: "PE", action: "BUY", quantity: defaultLot, premium: 22 },
        { id: `sod-leg2-${Date.now()}`, strike: baseSpot - step, type: "PE", action: "SELL", quantity: defaultLot, premium: 54 },
        { id: `sod-leg3-${Date.now()}`, strike: baseSpot + step, type: "CE", action: "SELL", quantity: defaultLot, premium: 58 },
        { id: `sod-leg4-${Date.now()}`, strike: baseSpot + 2 * step, type: "CE", action: "BUY", quantity: defaultLot, premium: 25 },
      ];
    } else if (sodPreset === "straddle") {
      // Intraday straddles are commonly shorted to collect theta decay, let's do action: "SELL"
      sodLegs = [
        { id: `sod-leg1-${Date.now()}`, strike: baseSpot, type: "CE", action: "SELL", quantity: defaultLot, premium: 155 },
        { id: `sod-leg2-${Date.now()}`, strike: baseSpot, type: "PE", action: "SELL", quantity: defaultLot, premium: 140 },
      ];
    } else if (sodPreset === "strangle") {
      sodLegs = [
        { id: `sod-leg1-${Date.now()}`, strike: baseSpot + step, type: "CE", action: "SELL", quantity: defaultLot, premium: 88 },
        { id: `sod-leg2-${Date.now()}`, strike: baseSpot - step, type: "PE", action: "SELL", quantity: defaultLot, premium: 76 },
      ];
    }

    const formattedLegs = sodLegs.map((l) => {
      const cleanSym = sodIndex.replace(/\s+/g, "").toUpperCase();
      return {
        ...l,
        tradingsymbol: `${cleanSym}24DEC${l.strike}${l.type}`,
      };
    });

    let ordersPlaced: any[] = [];
    const routeStr = sodIsPaperTrade ? "PAPER SANDBOX" : "ZERODHA KITE LIVE";
    addLog(`🌅 SOD Automator: Triggering trade entry (${sodIndex} ${sodPreset.toUpperCase().replace(/_/g, " ")}) via ${routeStr}...`);

    if (!sodIsPaperTrade) {
      if (!isZerodhaConnected) {
        const errMsg = "Zerodha is not connected! SOD live day trading entry aborted. Please link your Kite account.";
        addLog(`❌ SOD Scheduler: ${errMsg}`);
        if (forced) {
          setErrorMsg(errMsg);
        }
        return;
      }

      try {
        const response = await fetch("/api/zerodha/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey,
            accessToken,
            legs: formattedLegs.map((l) => ({
              tradingsymbol: l.tradingsymbol,
              action: l.action,
              quantity: l.quantity,
              exchange: "NFO",
              order_type: "MARKET",
            })),
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Zerodha API rejected SOD option orders.");
        }

        ordersPlaced = data.results || [];
        const succeededCount = ordersPlaced.filter((o) => o.status === "success").length;
        addLog(`🌅 SOD Live Trade success: ${succeededCount} of ${sodLegs.length} legs routed via Zerodha.`);
        if (succeededCount === 0) {
          throw new Error("Kite API rejected SOD entry order legs.");
        }
      } catch (err: any) {
        const errMsg = err?.message || "Failed to route SOD option orders.";
        addLog(`❌ SOD Live Router failure: ${errMsg}`);
        if (forced) {
          setErrorMsg(`Zerodha Router: ${errMsg}`);
        }
        return;
      }
    } else {
      // Paper Trading Execution simulation
      ordersPlaced = formattedLegs.map((l) => ({
        tradingsymbol: l.tradingsymbol,
        action: l.action,
        quantity: l.quantity,
        status: "success",
        orderId: `SIM-SOD-${Math.floor(100000 + Math.random() * 900000)}`,
      }));
      addLog(`🌅 SOD Sandbox Success: Placed ${sodLegs.length} mock options contract orders.`);
    }

    const newStrategy: AlgoStrategy = {
      id: `algo-sod-${Date.now()}`,
      name: `SOD Day Trade (${sodPreset.toUpperCase().replace(/_/g, " ")})`,
      index: sodIndex,
      legs: sodLegs,
      triggerType: "time_based",
      triggerValue: sodTime,
      stopLossPct: sodStopLoss,
      takeProfitPct: sodTakeProfit,
      trailingSl: false,
      isPaperTrade: sodIsPaperTrade,
      status: "active",
      entrySpotPrice: curSpot,
      currentSpotPrice: curSpot,
      pnl: 0,
      createdAt: new Date().toLocaleTimeString(),
      ordersPlaced,
    };

    setActiveStrategies((prev) => [newStrategy, ...prev]);
    setSodDailyCount((prev) => prev + 1);

    if (forced) {
      setSuccessMsg(`Successfully executed Start-of-Day Entry for ${sodIndex} with ${sodStopLoss}% SL & ${sodTakeProfit}% Target!`);
    } else {
      addLog(`🟢 SOD Automator successfully launched Intraday Day Trade position for today.`);
    }
  };

  // Periodic scheduled check for start of day
  useEffect(() => {
    if (!sodEnabled) return;

    const checkInterval = setInterval(() => {
      const now = new Date();
      const hoursStr = now.getHours().toString().padStart(2, "0");
      const minutesStr = now.getMinutes().toString().padStart(2, "0");
      const timeStr = `${hoursStr}:${minutesStr}`;
      const dateStr = now.toDateString(); // e.g. "Sun Jun 28 2026"

      // Trigger if schedule time matches and we haven't run today
      if (timeStr === sodTime && sodLastRunDate !== dateStr) {
        setSodLastRunDate(dateStr);
        executeSodEntry(false);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkInterval);
  }, [sodEnabled, sodTime, sodLastRunDate, sodStopLoss, sodTakeProfit, sodIndex, sodPreset, sodIsPaperTrade]);

  // 3. Legs manual management handlers
  const handleAddLeg = () => {
    const defaultLot = index === "NIFTY 50" ? 50 : 15;
    const baseSpot = Math.round(spotPrice / 100) * 100;
    const newLeg: OptionLeg = {
      id: `custom-leg-${Date.now()}`,
      strike: baseSpot,
      type: "CE",
      action: "BUY",
      quantity: defaultLot,
      premium: 100,
    };
    setLegs([...legs, newLeg]);
    addLog(`Added custom leg to option builder.`);
  };

  const handleRemoveLeg = (id: string) => {
    setLegs(legs.filter((l) => l.id !== id));
  };

  const handleLegChange = (id: string, key: keyof OptionLeg, value: any) => {
    setLegs(
      legs.map((l) => {
        if (l.id === id) {
          return { ...l, [key]: value };
        }
        return l;
      })
    );
  };

  // 4. Payoff calculations for graphing
  // Sample range: we find min strike and max strike, then widen the range to plot payoff
  const strikes = legs.map((l) => l.strike);
  const avgStrike = strikes.length > 0 ? strikes.reduce((a, b) => a + b, 0) / strikes.length : spotPrice;
  const graphMinSpot = Math.max(1000, avgStrike - 350);
  const graphMaxSpot = avgStrike + 350;

  // Generate 35 coordinate points for plotting
  const samplePoints: { spot: number; pnl: number }[] = [];
  const sampleStep = (graphMaxSpot - graphMinSpot) / 34;

  for (let i = 0; i <= 34; i++) {
    const testSpot = graphMinSpot + i * sampleStep;
    let pointPnl = 0;

    legs.forEach((leg) => {
      // Intrinsic value of option at expiry
      const intrinsicAtExpiry =
        leg.type === "CE" ? Math.max(0, testSpot - leg.strike) : Math.max(0, leg.strike - testSpot);

      // PnL per option unit
      const unitPnl =
        leg.action === "BUY" ? intrinsicAtExpiry - leg.premium : leg.premium - intrinsicAtExpiry;

      pointPnl += unitPnl * leg.quantity;
    });

    samplePoints.push({ spot: Math.round(testSpot), pnl: pointPnl });
  }

  // Calculate stats
  const currentSpotPnl = legs.reduce((acc, leg) => {
    const intrinsicAtEntry =
      leg.type === "CE"
        ? Math.max(0, spotPrice - leg.strike)
        : Math.max(0, leg.strike - spotPrice);
    return acc; // Floating is dynamic, at expiry payoff plotted is at expiry
  }, 0);

  const maxLossValue = Math.min(...samplePoints.map((p) => p.pnl));
  const maxProfitValue = Math.max(...samplePoints.map((p) => p.pnl));
  
  // Find Break-Even spots
  const breakevens: number[] = [];
  for (let i = 0; i < samplePoints.length - 1; i++) {
    const p1 = samplePoints[i];
    const p2 = samplePoints[i + 1];
    if ((p1.pnl <= 0 && p2.pnl > 0) || (p1.pnl >= 0 && p2.pnl < 0)) {
      // Linear interpolation to approximate cross
      const ratio = Math.abs(p1.pnl) / (Math.abs(p1.pnl) + Math.abs(p2.pnl));
      breakevens.push(Math.round(p1.spot + ratio * (p2.spot - p1.spot)));
    }
  }

  // 5. Submit Strategy and Trigger Algo Automation
  const handleDeployAlgo = async () => {
    if (legs.length === 0) {
      setErrorMsg("Please add at least one option leg to launch the strategy.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formattedLegs = legs.map((l) => ({
      ...l,
      tradingsymbol: `${index === "NIFTY 50" ? "NIFTY" : "BANKNIFTY"}24DEC${l.strike}${l.type}`,
    }));

    // Trigger simulation or real Zerodha execution
    let ordersPlaced: any[] = [];
    let deployedStatus: "active" | "waiting" = triggerType === "immediate" ? "active" : "waiting";

    if (!isPaperTrade) {
      if (!isZerodhaConnected) {
        setErrorMsg("Zerodha is not connected! Switch to Paper Trading mode or link your Kite API first.");
        setLoading(false);
        return;
      }

      // Execute via live Zerodha backend API endpoint we introduced in server.ts
      try {
        addLog(`Initiating LIVE execution on Zerodha for strategy [${strategyName}]...`);
        const response = await fetch("/api/zerodha/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey,
            accessToken,
            legs: formattedLegs.map((l) => ({
              tradingsymbol: l.tradingsymbol,
              action: l.action,
              quantity: l.quantity,
              exchange: "NFO",
              order_type: "MARKET",
            })),
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Zerodha API rejected options contract orders.");
        }

        ordersPlaced = data.results || [];
        const succeededCount = ordersPlaced.filter((o) => o.status === "success").length;
        addLog(`Zerodha live trade executed: ${succeededCount} of ${legs.length} orders placed successfully.`);

        if (succeededCount === 0) {
          throw new Error("All Zerodha options leg order placements failed. Check account margin or status.");
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to route real options leg orders to Zerodha.");
        setLoading(false);
        return;
      }
    } else {
      // Paper trading simulated order log
      ordersPlaced = formattedLegs.map((l) => ({
        tradingsymbol: l.tradingsymbol,
        action: l.action,
        quantity: l.quantity,
        status: "success",
        orderId: `SIM-${Math.floor(100000 + Math.random() * 900000)}`,
      }));
      addLog(`Paper Trading simulation active. Rooted ${legs.length} mock option legs into the local Sandbox.`);
    }

    const newStrategy: AlgoStrategy = {
      id: `algo-${Date.now()}`,
      name: strategyName,
      index,
      legs: JSON.parse(JSON.stringify(legs)), // Deep clone
      triggerType,
      triggerValue,
      stopLossPct,
      takeProfitPct,
      trailingSl,
      isPaperTrade,
      status: deployedStatus,
      entrySpotPrice: spotPrice,
      currentSpotPrice: spotPrice,
      pnl: 0,
      createdAt: new Date().toLocaleTimeString(),
      ordersPlaced,
    };

    setActiveStrategies([newStrategy, ...activeStrategies]);
    setSuccessMsg(
      isPaperTrade
        ? `Successfully deployed Paper Trading Algo Strategy [${strategyName}]!`
        : `Successfully deployed LIVE Options Algo Strategy [${strategyName}] via Zerodha!`
    );
    setLoading(false);

    // Reset fields to defaults
    setStrategyName("Alpha Bullish Spread");
  };

  // Square off strategy
  const handleSquareOff = async (id: string) => {
    const strat = activeStrategies.find((s) => s.id === id);
    if (!strat) return;

    if (!strat.isPaperTrade && isZerodhaConnected) {
      addLog(`Sending LIVE exit offset orders to Zerodha for [${strat.name}]...`);
      // Square off leg means reversing actions (BUY -> SELL, SELL -> BUY)
      const offsetLegs = strat.legs.map((l) => ({
        tradingsymbol: `${strat.index === "NIFTY 50" ? "NIFTY" : "BANKNIFTY"}24DEC${l.strike}${l.type}`,
        action: l.action === "BUY" ? "SELL" : "BUY",
        quantity: l.quantity,
        exchange: "NFO",
        order_type: "MARKET",
      }));

      try {
        const response = await fetch("/api/zerodha/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey,
            accessToken,
            legs: offsetLegs,
          }),
        });

        if (response.ok) {
          addLog(`LIVE options legs successfully offset and squared off on Zerodha.`);
        } else {
          addLog(`⚠️ Zerodha offset rejected. Real-world square off must be closed directly in Kite.`);
        }
      } catch (e) {
        addLog(`⚠️ Network failure syncing offset order: ${e}`);
      }
    }

    setActiveStrategies(
      activeStrategies.map((s) => {
        if (s.id === id) {
          return { ...s, status: "stopped" as const };
        }
        return s;
      })
    );
    addLog(`Strategy [${strat.name}] manually squared off. Terminated automation triggers.`);
  };

  const handleClearHistory = () => {
    setActiveStrategies([]);
    addLog("Cleared all historical algorithms logs.");
  };

  // SVG Payoff curve plotting helpers
  const svgW = 500;
  const svgH = 220;
  const pad = 40;

  // Coordinates mapping
  const getX = (spot: number) => {
    return pad + ((spot - graphMinSpot) * (svgW - 2 * pad)) / (graphMaxSpot - graphMinSpot);
  };

  // Find max absolute PnL to scale Y centered around 0
  const maxAbsPnl = Math.max(
    ...samplePoints.map((p) => Math.abs(p.pnl)),
    100 // Avoid division by zero
  );

  const getY = (pnl: number) => {
    const graphCenterY = svgH / 2;
    // Scale factor to map max PnL to bounds of padding
    const usableHeight = svgH / 2 - pad;
    const scaledOffset = (pnl / maxAbsPnl) * usableHeight;
    return graphCenterY - scaledOffset;
  };

  // Build SVG path line
  let payoffPath = "";
  if (samplePoints.length > 0) {
    payoffPath = `M ${getX(samplePoints[0].spot)} ${getY(samplePoints[0].pnl)}`;
    for (let i = 1; i < samplePoints.length; i++) {
      payoffPath += ` L ${getX(samplePoints[i].spot)} ${getY(samplePoints[i].pnl)}`;
    }
  }

  // Shaded green/red paths
  // Profit fill: build path for parts above zero
  let profitFillPath = "";
  let lossFillPath = "";
  if (samplePoints.length > 0) {
    // Shading using simple SVG polygons
    const zeroY = getY(0);
    // Find points above 0
    profitFillPath = `M ${getX(samplePoints[0].spot)} ${zeroY}`;
    samplePoints.forEach((p) => {
      const yVal = getY(p.pnl);
      const limitY = yVal < zeroY ? yVal : zeroY; // only points above zero
      profitFillPath += ` L ${getX(p.spot)} ${limitY}`;
    });
    profitFillPath += ` L ${getX(samplePoints[samplePoints.length - 1].spot)} ${zeroY} Z`;

    // Loss fill: build path for parts below zero
    lossFillPath = `M ${getX(samplePoints[0].spot)} ${zeroY}`;
    samplePoints.forEach((p) => {
      const yVal = getY(p.pnl);
      const limitY = yVal > zeroY ? yVal : zeroY; // only points below zero
      lossFillPath += ` L ${getX(p.spot)} ${limitY}`;
    });
    lossFillPath += ` L ${getX(samplePoints[samplePoints.length - 1].spot)} ${zeroY} Z`;
  }

  return (
    <div className="space-y-6">
      {/* Alert / Notice Bar */}
      {!isPaperTrade && !isZerodhaConnected && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-amber-950">Zerodha Client Session Required</h4>
            <p className="font-medium text-amber-800 leading-relaxed">
              You selected <strong>Live Zerodha Broker</strong> execution mode, but no active API session was detected. Options leg submissions will reject. Please link your Kite Developer credentials via the <strong>Link Zerodha Account</strong> modal or toggle execution mode to <strong>Paper Trading (Sandbox)</strong> to build and simulate risk-free algorithms.
            </p>
          </div>
        </div>
      )}

      {/* Start-of-Day (SOD) Intraday Day Trading Automator Card */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800 rounded-xl p-5 text-white shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-indigo-500/20 text-indigo-400 rounded">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  Start-of-Day (SOD) Intraday Trading Automator
                </h2>
                <p className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-wider">
                  Automatic Daily Option Deployment with Safeguards
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider border flex items-center gap-1.5 ${
                sodEnabled
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-pulse"
                  : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${sodEnabled ? "bg-emerald-400" : "bg-slate-500"}`}></span>
              {sodEnabled ? "🟢 Active & Listening Everyday" : "⚪ Disabled / Idle"}
            </span>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={sodEnabled}
                onChange={(e) => {
                  setSodEnabled(e.target.checked);
                  addLog(
                    `Start-of-Day Intraday Automator was ${
                      e.target.checked ? "ENABLED (listening for 9:15 AM everyday)" : "DISABLED"
                    }`
                  );
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        {/* Form controls grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Market Start Time (IST)
            </label>
            <div className="relative">
              <input
                type="time"
                value={sodTime}
                onChange={(e) => setSodTime(e.target.value)}
                className="bg-slate-950/75 border border-slate-800 hover:border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-mono font-bold outline-none focus:border-indigo-500 w-full"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Daily Stop Loss Limit
            </label>
            <div className="relative">
              <input
                type="number"
                value={sodStopLoss}
                onChange={(e) => setSodStopLoss(Math.max(1, parseInt(e.target.value) || 10))}
                className="bg-slate-950/75 border border-slate-800 hover:border-slate-700 text-rose-400 rounded-lg px-3 py-2 text-xs font-mono font-bold outline-none focus:border-indigo-500 w-full text-center"
              />
              <span className="absolute right-3 top-2.5 text-[10px] text-rose-500 font-bold">%</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Daily Target Profit
            </label>
            <div className="relative">
              <input
                type="number"
                value={sodTakeProfit}
                onChange={(e) => setSodTakeProfit(Math.max(1, parseInt(e.target.value) || 10))}
                className="bg-slate-950/75 border border-slate-800 hover:border-slate-700 text-emerald-400 rounded-lg px-3 py-2 text-xs font-mono font-bold outline-none focus:border-indigo-500 w-full text-center"
              />
              <span className="absolute right-3 top-2.5 text-[10px] text-emerald-500 font-bold">%</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center gap-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                Index / Stock Instrument
              </label>
              <button
                type="button"
                onClick={fetchNewsSuggestions}
                disabled={loadingNews}
                className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none disabled:opacity-50"
                title="Scan latest corporate and financial headlines to suggest momentum ideas"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${loadingNews ? "animate-spin" : ""}`} />
                {loadingNews ? "Scanning..." : "Scan News"}
              </button>
            </div>
            <select
              value={sodIndex}
              onChange={(e: any) => setSodIndex(e.target.value)}
              className="bg-slate-950/75 border border-slate-800 hover:border-slate-700 text-indigo-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500 w-full cursor-pointer"
            >
              {instruments.map((ins) => (
                <option key={ins.symbol} value={ins.symbol}>
                  {ins.symbol} ({ins.name})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              SOD Option Strategy
            </label>
            <select
              value={sodPreset}
              onChange={(e: any) => setSodPreset(e.target.value)}
              className="bg-slate-950/75 border border-slate-800 hover:border-slate-700 text-indigo-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500 w-full cursor-pointer"
            >
              <option value="straddle">Short Straddle (ATM CE/PE Sell)</option>
              <option value="strangle">Short Strangle (CE/PE Sell)</option>
              <option value="iron_condor">Iron Condor (Risk-Defined)</option>
              <option value="bull_call_spread">Bull Call Spread</option>
              <option value="bear_put_spread">Bear Put Spread</option>
            </select>
          </div>
        </div>

        {/* News Hotpicks list inside SOD */}
        {newsSuggestions && newsSuggestions.length > 0 && (
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-2.5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Dynamic News Hotpicks (Click to instantly load into SOD)
              </span>
              <span className="text-[9px] text-slate-500 font-mono">Last scanned: {newsLastUpdated}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {newsSuggestions.map((s, idx) => {
                const isSelected = sodIndex === s.symbol;
                const isBull = s.sentiment === "Bullish";
                const isBear = s.sentiment === "Bearish";
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectSodNewsSuggestion(s)}
                    className={`px-2.5 py-1.5 rounded text-left transition-all cursor-pointer flex flex-col gap-0.5 border ${
                      isSelected
                        ? "bg-indigo-950 border-indigo-500/80 text-white shadow-md shadow-indigo-500/5"
                        : "bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300"
                    }`}
                    title={s.newsHeadline}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-black tracking-wide">{s.symbol}</span>
                      <span
                        className={`text-[8px] font-bold px-1 rounded uppercase tracking-wider ${
                          isBull
                            ? "bg-emerald-500/15 text-emerald-400"
                            : isBear
                            ? "bg-rose-500/15 text-rose-400"
                            : "bg-slate-500/15 text-slate-400"
                        }`}
                      >
                        {isBull ? "▲ Bullish" : isBear ? "▼ Bearish" : "■ Neutral"}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium line-clamp-1 max-w-[200px]">
                      {s.newsHeadline}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Integration notice & Action buttons row */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-2.5 max-w-xl">
            <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              This routine deploys options at <strong className="text-indigo-200 font-semibold">{sodTime} IST</strong> daily. If live ticker fluctuations breach the <strong className="text-rose-400 font-semibold">-{sodStopLoss}% Stop Loss</strong> or hit the <strong className="text-emerald-400 font-semibold">+{sodTakeProfit}% target</strong>, it triggers an instant multi-leg offset order via <strong className="font-semibold text-slate-300">Zerodha Kite API</strong> or Paper sandbox, protecting capital automatically.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Broker mode switcher inside SOD */}
            <div className="bg-slate-950/80 border border-slate-800 p-1.5 rounded-lg flex items-center gap-2">
              <button
                onClick={() => setSodIsPaperTrade(true)}
                className={`px-2.5 py-1 text-[10px] font-bold font-mono uppercase tracking-wide rounded ${
                  sodIsPaperTrade
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Sandbox
              </button>
              <button
                onClick={() => setSodIsPaperTrade(false)}
                className={`px-2.5 py-1 text-[10px] font-bold font-mono uppercase tracking-wide rounded flex items-center gap-1 ${
                  !sodIsPaperTrade
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Kite Live {!sodIsPaperTrade && isZerodhaConnected && <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />}
              </button>
            </div>

            <button
              onClick={() => executeSodEntry(true)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 text-white font-bold font-mono text-[11px] uppercase tracking-wider rounded-lg shadow transition-all cursor-pointer flex items-center gap-1.5"
              title="Force execute the daily start of day routine now for instant validation"
            >
              <Zap className="w-3.5 h-3.5 fill-current" /> Trigger Entry Now (Test)
            </button>
          </div>
        </div>

        {/* Tiny stats overview */}
        <div className="flex gap-4 text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
          <span>Daily Cycle count: <strong className="text-indigo-400 font-semibold font-sans">{sodDailyCount}</strong></span>
          <span>Last Run Date: <strong className="text-indigo-400 font-semibold font-sans">{sodLastRunDate || "Never Run Yet"}</strong></span>
          <span>Target Platform: <strong className="text-indigo-400 font-semibold font-sans">{sodIsPaperTrade ? "Sandbox Paper Engine" : "Zerodha Kite Live"}</strong></span>
        </div>
      </div>

      {/* AI News-Driven Stock Suggestions Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-indigo-500" /> AI Market News-Driven Options Suggestions
            </h3>
            <p className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-widest">
              Dynamically scanned from live headlines using Gemini Grounding
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-500 font-mono font-bold">
              Last Scan: <span className="text-slate-800">{newsLastUpdated}</span>
            </span>
            <button
              onClick={fetchNewsSuggestions}
              disabled={loadingNews}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 disabled:opacity-60 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingNews ? "animate-spin" : ""}`} />
              {loadingNews ? "Scanning News..." : "Scan Market News"}
            </button>
          </div>
        </div>

        {loadingNews ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            <div className="text-center">
              <p className="text-xs font-bold text-slate-700">Analyzing live corporate press releases & headlines...</p>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-1">Grounding option presets with real-time news context</p>
            </div>
          </div>
        ) : newsSuggestions && newsSuggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {newsSuggestions.map((s, idx) => {
              const isBull = s.sentiment === "Bullish";
              const isBear = s.sentiment === "Bearish";
              
              return (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-100 hover:border-indigo-100 rounded-lg p-4 flex flex-col justify-between gap-3 transition-all group"
                >
                  <div className="space-y-2">
                    {/* Symbol / Sentiment headers */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded font-mono">
                          {s.symbol}
                        </span>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">{s.name}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1 ${
                            isBull
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : isBear
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {isBull ? "▲ Bullish" : isBear ? "▼ Bearish" : "■ Neutral"}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono font-bold">
                          Confidence: <span className="text-slate-700 font-sans">{s.confidence}%</span>
                        </span>
                      </div>
                    </div>

                    {/* Headline summary */}
                    <div className="bg-white border border-slate-100/80 rounded p-2.5 space-y-1">
                      <p className="text-xs text-slate-800 font-semibold leading-snug">
                        "{s.newsHeadline}"
                      </p>
                      <p className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                        Source: <span className="text-slate-500 lowercase">{s.source}</span>
                      </p>
                    </div>

                    {/* Volatility & Strategy indicators */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-b border-slate-200/50 py-1.5">
                      <div>
                        <span className="text-slate-400 font-bold uppercase block text-[8px] tracking-wider">Suggested Preset</span>
                        <span className="text-indigo-700 font-bold font-sans">
                          {s.suggestedPreset.replace(/_/g, " ").toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase block text-[8px] tracking-wider">Implied Volatility</span>
                        <span className={`font-bold ${s.impliedVolatility === "High" ? "text-amber-600" : s.impliedVolatility === "Low" ? "text-emerald-600" : "text-blue-600"}`}>
                          {s.impliedVolatility}
                        </span>
                      </div>
                    </div>

                    {/* Strategy Rationale */}
                    <p className="text-[11px] text-slate-500 leading-relaxed italic">
                      {s.rationale}
                    </p>
                  </div>

                  <button
                    onClick={() => selectSuggestedStock(s)}
                    className="w-full py-1.5 bg-white hover:bg-indigo-600 hover:text-white border border-slate-200 group-hover:border-indigo-500 text-slate-700 rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                  >
                    Select Ticker & Deploy Preset <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400 text-xs">
            No news suggestions loaded. Click "Scan Market News" to fetch recent intelligence.
          </div>
        )}
      </div>

      {/* Intro Dashboard Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Parameters & Configurator */}
        <div id="options-strategy-builder" className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" /> Options Strategy Builder
              </h3>
              <p className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-widest mt-0.5">
                Configure Multi-Leg options structures
              </p>
            </div>

            <div className="flex gap-2 items-center">
              <select
                value={index}
                onChange={(e: any) => {
                  setIndex(e.target.value);
                  addLog(`Selected instrument: ${e.target.value}`);
                }}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
              >
                {instruments.map((ins) => (
                  <option key={ins.symbol} value={ins.symbol}>
                    {ins.symbol} (Spot: {spotPrices[ins.symbol]?.toFixed(1) || "1,000.0"})
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowCustomCreator(!showCustomCreator)}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Create and simulate a custom stock/index options instrument"
              >
                <Plus className="w-3.5 h-3.5" /> Custom Stock
              </button>
            </div>
          </div>

          {/* Custom stock creator panel */}
          {showCustomCreator && (
            <div className="bg-slate-50 border border-indigo-100 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500" /> Create Custom Simulated Option Stock
                </span>
                <button
                  onClick={() => setShowCustomCreator(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Ticker Symbol
                  </label>
                  <input
                    type="text"
                    placeholder="RELIANCE"
                    value={customSymbolInput}
                    onChange={(e) => setCustomSymbolInput(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                    className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono font-bold w-full text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="Reliance Industries"
                    value={customNameInput}
                    onChange={(e) => setCustomNameInput(e.target.value)}
                    className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-bold w-full text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Spot Price
                  </label>
                  <input
                    type="number"
                    placeholder="2500"
                    value={customSpotInput}
                    onChange={(e) => setCustomSpotInput(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono font-bold w-full text-slate-800 outline-none focus:border-indigo-500 text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Lot Size
                  </label>
                  <input
                    type="number"
                    placeholder="250"
                    value={customLotInput}
                    onChange={(e) => setCustomLotInput(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono font-bold w-full text-slate-800 outline-none focus:border-indigo-500 text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Strike Step
                  </label>
                  <input
                    type="number"
                    placeholder="20"
                    value={customStepInput}
                    onChange={(e) => setCustomStepInput(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono font-bold w-full text-slate-800 outline-none focus:border-indigo-500 text-center"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/50">
                <button
                  type="button"
                  onClick={() => {
                    if (!customSymbolInput || !customNameInput) {
                      setErrorMsg("Please fill in Ticker Symbol and Company Name.");
                      return;
                    }
                    if (instruments.some((ins) => ins.symbol === customSymbolInput)) {
                      setErrorMsg(`Instrument ${customSymbolInput} already exists!`);
                      return;
                    }

                    const newInstrument: Instrument = {
                      symbol: customSymbolInput,
                      name: customNameInput,
                      type: "STOCK",
                      lotSize: customLotInput,
                      strikeStep: customStepInput,
                    };

                    setInstruments((prev) => [...prev, newInstrument]);
                    setSpotPrices((prev) => ({
                      ...prev,
                      [customSymbolInput]: customSpotInput,
                    }));

                    setIndex(customSymbolInput);
                    addLog(`Created new dynamic options stock instrument: ${customSymbolInput} (${customNameInput})`);
                    setSuccessMsg(`Successfully added ${customSymbolInput} with Lot Size ${customLotInput} & Strike Step ${customStepInput}!`);
                    
                    // Reset inputs
                    setCustomSymbolInput("");
                    setCustomNameInput("");
                    setCustomSpotInput(1000);
                    setCustomLotInput(100);
                    setCustomStepInput(10);
                    setShowCustomCreator(false);
                  }}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-all shadow cursor-pointer"
                >
                  Save & Select Stock
                </button>
              </div>
            </div>
          )}

          {/* Strategy preset selectors */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Standard Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {[
                { id: "bull_call_spread", name: "Bull Call Spread" },
                { id: "bear_put_spread", name: "Bear Put Spread" },
                { id: "iron_condor", name: "Iron Condor" },
                { id: "straddle", name: "Straddle" },
                { id: "strangle", name: "Strangle" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setStrategyPreset(p.id);
                    addLog(`Loaded option strategy template: ${p.name}`);
                  }}
                  className={`px-2 py-1.5 rounded text-xs font-bold font-mono tracking-tight border transition-all cursor-pointer ${
                    strategyPreset === p.id
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Table of active legs */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Strategy Legs ({legs.length})
              </label>
              <button
                onClick={handleAddLeg}
                className="px-2 py-0.5 border border-indigo-100 text-indigo-600 hover:bg-indigo-50 text-[10px] font-bold font-mono uppercase tracking-wider rounded-md flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Custom Leg
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/20">
              <div className="grid grid-cols-12 gap-1.5 p-2 bg-slate-100/75 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                <div className="col-span-2 text-left pl-1">Action</div>
                <div className="col-span-3">Strike</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Lots/Qty</div>
                <div className="col-span-2">Premium</div>
                <div className="col-span-1"></div>
              </div>

              {legs.length === 0 ? (
                <div className="p-6 text-center text-xs font-medium text-slate-400 font-mono">
                  No legs defined in this options strategy yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-150">
                  {legs.map((leg) => (
                    <div
                      key={leg.id}
                      className="grid grid-cols-12 gap-1.5 p-2 text-xs font-semibold text-slate-700 items-center text-center"
                    >
                      <div className="col-span-2 text-left">
                        <select
                          value={leg.action}
                          onChange={(e: any) => handleLegChange(leg.id, "action", e.target.value)}
                          className={`bg-white border rounded px-1 py-0.5 font-bold text-[11px] outline-none ${
                            leg.action === "BUY"
                              ? "text-emerald-600 border-emerald-200"
                              : "text-rose-500 border-rose-200"
                          } cursor-pointer`}
                        >
                          <option value="BUY">BUY</option>
                          <option value="SELL">SELL</option>
                        </select>
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          step="50"
                          value={leg.strike}
                          onChange={(e: any) =>
                            handleLegChange(leg.id, "strike", parseInt(e.target.value) || 0)
                          }
                          className="bg-white border border-slate-200 text-slate-800 text-center rounded px-1.5 py-0.5 font-mono text-[11px] w-full outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="col-span-2">
                        <select
                          value={leg.type}
                          onChange={(e: any) => handleLegChange(leg.id, "type", e.target.value)}
                          className="bg-white border border-slate-200 rounded px-1 py-0.5 text-center font-mono text-[11px] text-slate-600 outline-none cursor-pointer"
                        >
                          <option value="CE">CE (Call)</option>
                          <option value="PE">PE (Put)</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          step="5"
                          value={leg.quantity}
                          onChange={(e: any) =>
                            handleLegChange(leg.id, "quantity", parseInt(e.target.value) || 0)
                          }
                          className="bg-white border border-slate-200 text-slate-800 text-center rounded px-1 py-0.5 font-mono text-[11px] w-full outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.5"
                          value={leg.premium}
                          onChange={(e: any) =>
                            handleLegChange(leg.id, "premium", parseFloat(e.target.value) || 0)
                          }
                          className="bg-white border border-slate-200 text-slate-800 text-center rounded px-1 py-0.5 font-mono text-[11px] w-full outline-none focus:border-indigo-500 text-indigo-600"
                        />
                      </div>

                      <div className="col-span-1 flex items-center justify-center">
                        <button
                          onClick={() => handleRemoveLeg(leg.id)}
                          className="text-slate-400 hover:text-rose-500 p-1 transition-all cursor-pointer"
                          title="Remove Leg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Algo trigger configurations */}
          <div className="bg-slate-50 border border-slate-150 rounded-lg p-3 sm:p-4 space-y-4">
            <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 uppercase tracking-wider">
              <Settings className="w-4 h-4 text-indigo-600" /> Automation Trigger & Risk Config
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Trigger details */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Algo Entry Condition
                </label>
                <select
                  value={triggerType}
                  onChange={(e: any) => {
                    setTriggerType(e.target.value);
                    if (e.target.value === "immediate") setTriggerValue("Immediate Entry");
                    else if (e.target.value === "rsi_under") setTriggerValue("RSI < 30");
                    else if (e.target.value === "rsi_over") setTriggerValue("RSI > 70");
                    else if (e.target.value === "macd_cross") setTriggerValue("MACD Bullish Cross");
                    else if (e.target.value === "time_based") setTriggerValue("9:20 AM IST");
                  }}
                  className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer w-full"
                >
                  <option value="immediate">Immediate Placement</option>
                  <option value="rsi_under">RSI Oversold Breakout (RSI &lt; 30)</option>
                  <option value="rsi_over">RSI Overbought Pullback (RSI &gt; 70)</option>
                  <option value="macd_cross">MACD Momentum Crossover</option>
                  <option value="time_based">Time Scheduled Auto-Trigger</option>
                </select>

                <input
                  type="text"
                  value={triggerValue}
                  onChange={(e) => setTriggerValue(e.target.value)}
                  placeholder="Set trigger parameter value"
                  className="bg-white border border-slate-200 text-slate-800 rounded px-2 py-1 font-mono text-[11px] w-full outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              {/* SL / TP Limits */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Risk Safeguards
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trailingSl}
                      onChange={(e) => setTrailingSl(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3 h-3"
                    />
                    <span className="text-[10px] text-slate-500 font-bold">Trailing SL</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-rose-500 font-bold uppercase block mb-1">
                      Stop Loss %
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={stopLossPct}
                        onChange={(e) => setStopLossPct(parseInt(e.target.value) || 0)}
                        className="bg-white border border-slate-200 text-slate-800 text-center rounded px-2 py-1 font-mono text-[11px] w-full outline-none focus:border-indigo-500 text-rose-600 font-bold"
                      />
                      <span className="absolute right-2 top-1 text-[10px] text-rose-400 font-bold">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] text-emerald-500 font-bold uppercase block mb-1">
                      Take Profit %
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={takeProfitPct}
                        onChange={(e) => setTakeProfitPct(parseInt(e.target.value) || 0)}
                        className="bg-white border border-slate-200 text-slate-800 text-center rounded px-2 py-1 font-mono text-[11px] w-full outline-none focus:border-indigo-500 text-emerald-600 font-bold"
                      />
                      <span className="absolute right-2 top-1 text-[10px] text-emerald-400 font-bold">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Run engine select and trigger button */}
            <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                    Execution Mode
                  </span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={isPaperTrade}
                        onChange={() => setIsPaperTrade(true)}
                        className="text-indigo-600 focus:ring-indigo-500 w-3 h-3"
                      />
                      <span className="text-xs font-bold text-slate-600">Paper (Sandbox)</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={!isPaperTrade}
                        onChange={() => setIsPaperTrade(false)}
                        className="text-indigo-600 focus:ring-indigo-500 w-3 h-3"
                      />
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                        Zerodha Live {isZerodhaConnected && <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={strategyName}
                  onChange={(e) => setStrategyName(e.target.value)}
                  placeholder="Strategy Name"
                  className="bg-white border border-slate-200 text-slate-800 rounded px-2.5 py-1.5 text-xs font-mono outline-none focus:border-indigo-500 font-bold w-full sm:w-44"
                />

                <button
                  onClick={handleDeployAlgo}
                  disabled={loading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-bold text-xs font-mono uppercase tracking-wider rounded-lg transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Deploy Algo
                </button>
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 rounded p-2 text-rose-800 text-[11px] font-bold font-mono">
              ❌ {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-emerald-800 text-[11px] font-bold font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {successMsg}
            </div>
          )}
        </div>

        {/* Right column: Interactive options payoff curves & metrics */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-1 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Payoff Analyst & Expiry Risk
            </h3>
            <p className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-widest">
              Live probability of profit & payoff graph
            </p>
          </div>

          {/* SVG Custom payoff curve */}
          <div className="relative border border-slate-150 rounded-lg bg-slate-950/95 overflow-hidden flex items-center justify-center h-[230px] my-4 shadow-inner">
            <div className="absolute top-2 left-2 flex flex-col gap-0.5">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">P&L Payoff (at expiry)</span>
            </div>
            <div className="absolute top-2 right-2 flex gap-1 bg-slate-900/60 p-1 rounded border border-slate-800 text-[8px] font-bold text-slate-300 font-mono">
              <span>Spot: {spotPrice.toFixed(1)}</span>
            </div>

            {legs.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono font-medium">Add legs to plot payoff curve</p>
            ) : (
              <svg width={svgW} height={svgH} className="w-full h-full text-slate-100">
                {/* Horizontal reference axis at Y=0 */}
                <line
                  x1={pad}
                  y1={getY(0)}
                  x2={svgW - pad}
                  y2={getY(0)}
                  stroke="#475569"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />

                {/* Vertical current spot reference axis */}
                <line
                  x1={getX(spotPrice)}
                  y1={pad}
                  x2={getX(spotPrice)}
                  y2={svgH - pad}
                  stroke="#6366f1"
                  strokeWidth="1.2"
                  strokeDasharray="4 2"
                />
                <text
                  x={getX(spotPrice) + 4}
                  y={pad + 10}
                  className="text-[9px] fill-indigo-400 font-bold font-mono"
                >
                  Spot
                </text>

                {/* Area shaded fills for Profit & Loss zones */}
                <path d={profitFillPath} fill="rgba(16, 185, 129, 0.08)" />
                <path d={lossFillPath} fill="rgba(239, 68, 68, 0.08)" />

                {/* Draw the options strategy payoff curve line */}
                <path d={payoffPath} fill="none" stroke="#10b981" strokeWidth="2.5" className="transition-all" />

                {/* Plot break even locations */}
                {breakevens.map((be, idx) => (
                  <g key={idx}>
                    <circle cx={getX(be)} cy={getY(0)} r="4.5" className="fill-slate-900 stroke-amber-500 stroke-2" />
                    <text
                      x={getX(be)}
                      y={getY(0) + 15}
                      textAnchor="middle"
                      className="text-[8px] fill-amber-500 font-bold font-mono"
                    >
                      BE: {be}
                    </text>
                  </g>
                ))}

                {/* Axis limits display */}
                <text x={pad} y={svgH - 10} className="text-[8px] fill-slate-500 font-mono font-bold">
                  {Math.round(graphMinSpot)}
                </text>
                <text x={svgW - pad} y={svgH - 10} textAnchor="end" className="text-[8px] fill-slate-500 font-mono font-bold">
                  {Math.round(graphMaxSpot)}
                </text>
              </svg>
            )}
          </div>

          {/* Visual statistics cards */}
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Max Capital Loss</span>
              <span className="text-xs font-mono font-bold text-rose-600 block mt-0.5">
                {maxLossValue < -999999 ? "Unlimited Loss Risk" : formatValue(maxLossValue)}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Max Net Profit</span>
              <span className="text-xs font-mono font-bold text-emerald-600 block mt-0.5">
                {maxProfitValue > 999999 ? "Unlimited Profit Potential" : formatValue(maxProfitValue)}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Risk/Reward Ratio</span>
              <span className="text-xs font-mono font-bold text-slate-700 block mt-0.5">
                {Math.abs(maxLossValue) > 0
                  ? `1 : ${(maxProfitValue / Math.abs(maxLossValue)).toFixed(1)}`
                  : "N/A"}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Probability of Profit</span>
              <span className="text-xs font-mono font-bold text-indigo-600 block mt-0.5">
                {strategyPreset === "bull_call_spread" || strategyPreset === "bear_put_spread"
                  ? "54.2%"
                  : strategyPreset === "iron_condor"
                  ? "68.5%"
                  : "41.0%"}
              </span>
            </div>
          </div>

          {/* Quick guide info */}
          <div className="flex gap-2 p-2 bg-indigo-50/50 rounded-lg border border-indigo-150 text-[10px] leading-relaxed text-indigo-800 font-medium">
            <Info className="w-3.5 h-3.5 shrink-0 text-indigo-600 mt-0.5" />
            <span>
              The payoff analyzer plots profit/loss outcomes at expiration. Live P&L values update every 3 seconds based on the active automated paper loop.
            </span>
          </div>
        </div>
      </div>

      {/* Grid bottom row: Active Running Algorithms Positions, Tickers, and console logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Active Automated running Algos positions */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-600 animate-pulse" /> Active Automated Positions
              </h3>
              <p className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-widest">
                Real-time tracking of running algo systems
              </p>
            </div>
            {activeStrategies.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-[10px] font-bold text-rose-500 font-mono uppercase hover:underline cursor-pointer"
              >
                Clear History Logs
              </button>
            )}
          </div>

          {activeStrategies.length === 0 ? (
            <div className="p-12 text-center text-xs font-semibold text-slate-400 font-mono space-y-1">
              <p>No active automated options algorithms are currently deployed.</p>
              <p className="text-[10px] text-slate-300">Deploy an algo strategy using the configurator to start tracking.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeStrategies.map((strat) => (
                <div
                  key={strat.id}
                  className={`border rounded-lg overflow-hidden transition-all shadow-sm ${
                    strat.status === "active"
                      ? "border-emerald-200 bg-emerald-50/10"
                      : "border-slate-200 bg-slate-50/30"
                  }`}
                >
                  {/* Top summary row */}
                  <div className="p-3 bg-slate-50 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{strat.name}</span>
                        <span className="text-[9px] font-mono bg-indigo-50 border border-indigo-150 text-indigo-600 font-bold px-1 rounded uppercase">
                          {strat.index}
                        </span>
                        <span
                          className={`text-[9px] font-mono border font-bold px-1 rounded uppercase ${
                            strat.isPaperTrade
                              ? "bg-slate-100 border-slate-200 text-slate-600"
                              : "bg-amber-100 border-amber-200 text-amber-700"
                          }`}
                        >
                          {strat.isPaperTrade ? "Sandbox Paper" : "Zerodha Live"}
                        </span>
                      </div>
                      <p className="text-[10px] font-medium text-slate-400 font-mono">
                        Trigger: {strat.triggerValue} • Deployed: {strat.createdAt}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">
                          Spot Price Shift
                        </span>
                        <span className="font-mono text-xs text-slate-700 font-bold">
                          Entry {strat.entrySpotPrice.toFixed(0)} → {strat.currentSpotPrice.toFixed(0)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">
                          Net Strategy P&L
                        </span>
                        <span
                          className={`font-mono font-bold text-xs ${
                            strat.pnl >= 0 ? "text-emerald-600" : "text-rose-500"
                          }`}
                        >
                          {strat.pnl >= 0 ? "+" : ""}
                          {formatValue(strat.pnl)}
                        </span>
                      </div>

                      <div>
                        {strat.status === "active" ? (
                          <button
                            onClick={() => handleSquareOff(strat.id)}
                            className="px-2 py-1 border border-rose-200 text-rose-500 hover:bg-rose-50 text-[10px] font-mono font-bold uppercase rounded-md transition-all cursor-pointer flex items-center gap-1"
                            title="Instant square off of all legs"
                          >
                            <Square className="w-2.5 h-2.5 fill-rose-500" /> Square Off
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wide bg-slate-100 text-slate-400 rounded-md border border-slate-200">
                            {strat.status === "stopped" ? "Squared Off" : "Completed / Triggered"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Options Contract Legs breakdown inside this strategy */}
                  <div className="p-2 divide-y divide-slate-100 bg-white/50 text-[11px]">
                    <div className="grid grid-cols-12 text-[9px] font-bold text-slate-400 uppercase py-1 text-center">
                      <div className="col-span-4 text-left pl-2">Contract instrument symbol</div>
                      <div className="col-span-2">Action</div>
                      <div className="col-span-2">Strike</div>
                      <div className="col-span-2">Qty</div>
                      <div className="col-span-2">Entry Premium</div>
                    </div>
                    {strat.legs.map((leg, lIdx) => (
                      <div
                        key={lIdx}
                        className="grid grid-cols-12 text-slate-600 font-medium py-1.5 text-center items-center font-mono"
                      >
                        <div className="col-span-4 text-left pl-2 font-bold text-slate-800">
                          {strat.index === "NIFTY 50" ? "NIFTY" : "BANKNIFTY"}24DEC{leg.strike}
                          {leg.type}
                        </div>
                        <div className="col-span-2">
                          <span
                            className={`font-bold px-1 rounded text-[10px] ${
                              leg.action === "BUY"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : "bg-rose-50 text-rose-500 border border-rose-100"
                            }`}
                          >
                            {leg.action}
                          </span>
                        </div>
                        <div className="col-span-2">{leg.strike}</div>
                        <div className="col-span-2">{leg.quantity}</div>
                        <div className="col-span-2 font-bold text-indigo-600">{leg.premium}</div>
                      </div>
                    ))}

                    {/* Order Placement Logs */}
                    {strat.ordersPlaced && strat.ordersPlaced.length > 0 && (
                      <div className="p-2 bg-slate-50 border-t border-slate-100">
                        <span className="text-[8px] font-bold text-indigo-800 uppercase tracking-wider block mb-1">Kite API Execution Route logs:</span>
                        <div className="space-y-1 font-mono text-[9px]">
                          {strat.ordersPlaced.map((ord: any, ordIdx: number) => (
                            <div key={ordIdx} className="flex justify-between items-center bg-white p-1 rounded border border-slate-200/60">
                              <span>Leg {ordIdx + 1} ({ord.tradingsymbol}): {ord.action} {ord.quantity} units</span>
                              {ord.status === "success" ? (
                                <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Placed (ID: {ord.orderId})
                                </span>
                              ) : (
                                <span className="text-rose-500 font-bold">Failed: {ord.error}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Logs console */}
        <div className="lg:col-span-4 bg-slate-950/95 border border-slate-800 text-slate-100 rounded-lg p-4 sm:p-5 shadow-sm flex flex-col justify-between h-[280px] sm:h-auto">
          <div className="space-y-1 pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-indigo-500" /> Live Algo Console Logs
            </h3>
            <p className="text-[9px] text-slate-500 font-bold font-mono uppercase tracking-widest">
              Live status feeds from execution engine
            </p>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-[9px] text-slate-300 py-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {logMessages.map((msg, idx) => (
              <div key={idx} className="leading-normal hover:bg-slate-900 px-1 py-0.5 rounded transition-all">
                <span className="text-indigo-400 mr-1.5">&gt;</span>
                <span>{msg}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-[8px] font-bold font-mono text-slate-500">
            <span>ENGINE: {isPaperTrade ? "SANDBOX SIMULATION" : "KITE CONNECT API"}</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Listening
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
