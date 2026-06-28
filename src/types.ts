export type AssetType =
  | "Stock"
  | "Crypto"
  | "ETF"
  | "Mutual Fund"
  | "Bond"
  | "Cash"
  | "Other";

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  quantity: number;
  costBasis: number; // Price purchased at per unit
  currentPrice: number; // Current market price per unit
  sector: string; // Technology, Healthcare, Financials, Crypto, Cash, etc.
  isZerodha?: boolean;
}

export type RiskProfile = "Conservative" | "Balanced" | "Growth" | "Aggressive";

export interface Recommendation {
  asset: string;
  action: string;
  rationale: string;
}

export interface PortfolioAnalysis {
  allocationRiskRating: "Low" | "Medium" | "High";
  riskExplanation: string;
  diversificationScore: number; // 0-100
  keyObservations: string[];
  recommendations: Recommendation[];
  sectorOutlook: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface BacktestScenario {
  id: string;
  name: string;
  period: string;
  description: string;
  impacts: { [key: string]: number }; // AssetType or Sector mapped to % yield impact, e.g., { "Crypto": -60, "Technology": -35, "Bond": 5 }
}
