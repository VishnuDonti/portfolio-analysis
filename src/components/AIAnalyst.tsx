import React, { useState, useEffect, useRef } from "react";
import { Asset, PortfolioAnalysis, RiskProfile, ChatMessage } from "../types";
import {
  BrainCircuit,
  MessageSquare,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Send,
  Loader2,
  PieChart,
} from "lucide-react";

interface AIAnalystProps {
  id: string;
  assets: Asset[];
  riskProfile: RiskProfile;
  analysis: PortfolioAnalysis | null;
  currency: "USD" | "INR";
  onAnalysisSuccess: (analysis: PortfolioAnalysis) => void;
}

export default function AIAnalyst({
  id,
  assets,
  riskProfile,
  analysis,
  currency,
  onAnalysisSuccess,
}: AIAnalystProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat States
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  // Load chat initial welcome if empty
  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Hi! I'm **Aura**, your AI investment co-pilot. I am fully aware of your current portfolio and your **${riskProfile}** risk target. Ask me anything about your asset allocation, risk hedges, sector views, or how specific macro events might affect you.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [riskProfile]);

  const handleRunAnalysis = async () => {
    if (assets.length === 0) {
      setError("Please add at least one asset to your portfolio before running AI analysis.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assets,
          riskProfile,
          currency,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to trigger analysis");
      }

      const data = await res.json();
      onAnalysisSuccess(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An error occurred while analyzing the portfolio. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      // Package messages history for context (up to last 10 messages to keep context window clean)
      const mappedHistory = chatMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          history: mappedHistory,
          assets,
          riskProfile,
          currency,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to receive advice from Aura");
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "text-emerald-700 bg-emerald-50 border-emerald-100";
      case "Medium":
        return "text-amber-700 bg-amber-50 border-amber-100";
      case "High":
        return "text-rose-700 bg-rose-50 border-rose-100";
      default:
        return "text-slate-500 bg-slate-50 border-slate-200";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-rose-500";
  };

  return (
    <div id={id} className="space-y-6">
      {/* Trigger Block / Prompt */}
      {!analysis && !loading && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-center max-w-2xl mx-auto space-y-4 shadow-sm">
          <div className="mx-auto w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-600 animate-pulse">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">AI Portfolio Diversification & Risk Report</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Unlock a professional, deep analysis of your current assets. Aura will evaluate sector concentration,
              correlations, and assess whether your holdings align with your selected profile target of{" "}
              <span className="text-indigo-600 font-bold uppercase">{riskProfile}</span>.
            </p>
          </div>

          {error && <p className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-100 rounded-lg p-2">{error}</p>}

          <button
            onClick={handleRunAnalysis}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-semibold text-xs font-mono transition-all flex items-center gap-1.5 mx-auto shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" /> Generate Portfolio Intelligence Report
          </button>
        </div>
      )}

      {/* Loading Block */}
      {loading && (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center max-w-xl mx-auto space-y-3 shadow-sm">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">Assembling Portfolio Intelligence...</h4>
            <p className="text-xs text-slate-400 font-medium">Querying Gemini model, indexing assets, and calculating risk benchmarks...</p>
          </div>
        </div>
      )}

      {/* Analysis Output Section */}
      {analysis && !loading && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Detailed analysis cards */}
          <div className="xl:col-span-2 space-y-5">
            {/* KPI row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Score card */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-4 shadow-sm">
                <div className="relative w-14 h-14 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={getScoreColor(analysis.diversificationScore)}
                      strokeWidth="3.5"
                      strokeDasharray={`${analysis.diversificationScore}, 100`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-base text-slate-900 font-tabular">
                    {analysis.diversificationScore}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Diversification Score</span>
                  <p className="text-xs text-slate-500 font-medium">
                    {analysis.diversificationScore >= 80
                      ? "Well balanced across asset types and sectors."
                      : analysis.diversificationScore >= 50
                      ? "Moderately concentrated. Room for diversification."
                      : "High concentration risk in few holdings."}
                  </p>
                </div>
              </div>

              {/* Risk evaluation */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Allocation Risk Rating</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getRiskColor(analysis.allocationRiskRating)}`}>
                    {analysis.allocationRiskRating}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2">
                  {analysis.riskExplanation}
                </p>
              </div>
            </div>

            {/* Observations List */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-indigo-600" /> Key Portfolio Observations
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                {analysis.keyObservations.map((obs, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-indigo-600 font-mono font-bold select-none">{idx + 1}.</span>
                    <span className="leading-relaxed">{obs}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Macro Sector Outlook */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" /> Macro Sector Outlook
              </h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {analysis.sectorOutlook}
              </p>
            </div>

            {/* Action Recommendations */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-indigo-600" /> Advisor Recommendations
                </h4>
                <button
                  onClick={handleRunAnalysis}
                  className="text-xs font-bold font-mono text-indigo-600 hover:text-indigo-500 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Recalculate
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.recommendations.map((rec, idx) => (
                  <div key={idx} className="bg-slate-50/50 border border-slate-100 rounded-lg p-3 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-800">{rec.asset}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 uppercase">
                          {rec.action}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        {rec.rationale}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat with Aura chatbot sidebar */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-[550px] xl:h-[650px] overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600" /> Consult Advisor Aura
                  </h4>
                  <span className="text-[10px] text-slate-400 font-semibold block">Live conversation engine</span>
                </div>
              </div>
              <button
                onClick={() => setChatMessages([
                  {
                    id: "welcome",
                    role: "assistant",
                    content: `Hi! I'm **Aura**, your AI investment co-pilot. I am fully aware of your current portfolio and your **${riskProfile}** risk target. Ask me anything about your asset allocation, risk hedges, sector views, or how specific macro events might affect you.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  }
                ])}
                className="text-[10px] font-bold font-mono text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                Clear Chat
              </button>
            </div>

            {/* Message window */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div key={msg.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-lg px-3.5 py-2 text-xs leading-relaxed shadow-sm font-medium ${
                        isUser
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-slate-50 border border-slate-150 text-slate-800 rounded-tl-none"
                      }`}
                    >
                      {/* Rich bold renderer simple mapping */}
                      <p className="whitespace-pre-line">
                        {msg.content.split("**").map((chunk, chunkIdx) => {
                          if (chunkIdx % 2 === 1) {
                            return <strong key={chunkIdx} className="font-bold text-indigo-600">{chunk}</strong>;
                          }
                          return chunk;
                        })}
                      </p>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono mt-1 px-1 font-normal">{msg.timestamp}</span>
                  </div>
                );
              })}

              {chatLoading && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 pl-1.5 font-bold">
                  <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
                  <span>Aura is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quickstart suggestions */}
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-150 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
              <button
                onClick={() => {
                  setChatInput("How can I better hedge my portfolio?");
                }}
                className="px-2 py-1 text-[10px] font-mono font-bold border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white transition-all cursor-pointer"
              >
                "How can I hedge risk?"
              </button>
              <button
                onClick={() => {
                  setChatInput("Am I overexposed to any specific sectors?");
                }}
                className="px-2 py-1 text-[10px] font-mono font-bold border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white transition-all cursor-pointer"
              >
                "Check overexposure"
              </button>
              <button
                onClick={() => {
                  setChatInput("Suggest changes to lower my risk.");
                }}
                className="px-2 py-1 text-[10px] font-mono font-bold border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white transition-all cursor-pointer"
              >
                "Lower my risk"
              </button>
            </div>

            {/* Message submission */}
            <form onSubmit={handleSendChat} className="p-3 border-t border-slate-200 bg-white flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Aura a financial question..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
