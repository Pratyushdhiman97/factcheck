import React, { useState } from "react";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  WifiOff,
} from "lucide-react";

/** MODEL CONFIG */
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";

/** Background */
const NewspaperBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0 opacity-5">
    <div className="absolute top-[-5%] left-[-2%] rotate-[-8deg] bg-[#fdfaf1] text-black p-12 max-w-sm font-serif shadow-2xl border-b-4 border-black">
      <h2 className="text-6xl font-black uppercase mb-2 tracking-tighter">
        The Daily News
      </h2>
      <div className="flex justify-between border-y border-black py-1 mb-4 text-[10px] font-bold">
        <span>VOL. CXIV... No. 38,492</span>
        <span>LATE EDITION</span>
      </div>
      <p className="text-sm leading-tight font-bold mb-2 italic">
        TRUTH IN THE AGE OF DISINFORMATION
      </p>
    </div>
  </div>
);

export default function App() {
  const [input, setInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [auditPhase, setAuditPhase] = useState("");
  const [searchStatus, setSearchStatus] = useState("active");

  const parseAIResponse = (rawText) => {
    if (!rawText) {
      return {
        verdict: "Developing",
        reason: "Offline analysis applied. Live search unavailable.",
        confidence: 50,
        verifiable_score: 40,
        trust_score: 50,
        bias: { label: "Neutral", explanation: "No live sources reachable." },
        tactics: ["Offline Estimation"],
        claims: [{ claim: input || "No input", status: "Unknown", details: "Offline fallback" }],
        sources: [],
      };
    }
    return rawText;
  };

  const performAudit = async () => {
    if (!input.trim()) {
      setError("Enter a topic or claim.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setAuditPhase("Analyzing...");

    try {
      await new Promise((r) => setTimeout(r, 1200)); // fake delay
      const fakeResult = parseAIResponse(true);
      setResult(fakeResult);
      setSearchStatus("offline");
    } catch (err) {
      setError("Analysis failed.");
    } finally {
      setIsAnalyzing(false);
      setAuditPhase("");
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start bg-gradient-to-b from-[#050505] to-black text-slate-100 font-sans overflow-x-hidden pb-24">
      <NewspaperBackground />

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-2xl border-b border-white/5 w-full">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white uppercase italic">
              VeriFact
            </span>
          </div>

          <div
            className={`flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 ${
              searchStatus === "active" ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                searchStatus === "active"
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-amber-500"
              }`}
            ></div>
            <span className="text-[9px] font-black uppercase tracking-widest hidden md:inline">
              {searchStatus === "active" ? "Live Index" : "Offline Mode"}
            </span>
          </div>
        </div>
      </nav>

      <main className="z-10 flex flex-col items-center w-full max-w-4xl px-6 py-12 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter leading-[0.9] uppercase italic drop-shadow-2xl">
            Search &{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-500 underline decoration-blue-500/30">
              Verify
            </span>
          </h1>
          <p className="text-lg text-slate-400 font-medium leading-relaxed">
            Enter a rumor, question, or news topic. We'll search the truth and
            audit the bias.
          </p>
        </div>

        {/* Input */}
        <div className="w-full bg-slate-900/40 backdrop-blur-3xl rounded-3xl border border-white/5 shadow-2xl p-4 transition-all">
          <div className="relative">
            <Search className="absolute top-6 left-6 text-slate-500 w-6 h-6" />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  performAudit();
                }
              }}
              placeholder="Ask a question or enter a topic..."
              className="w-full h-32 py-6 pl-16 pr-8 bg-transparent border-none rounded-2xl focus:ring-0 resize-none text-slate-200 placeholder:text-slate-600 font-medium text-xl leading-relaxed"
            />
          </div>
          <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex gap-4 opacity-40 px-4">
              <Search size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">
                Searching Global Sources
              </span>
            </div>
            <button
              onClick={performAudit}
              disabled={isAnalyzing || !input.trim()}
              className={`w-full md:w-auto px-10 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 ${
                isAnalyzing
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-white text-black hover:bg-blue-600 hover:text-white shadow-xl active:scale-95"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{auditPhase}</span>
                </>
              ) : (
                <>
                  <span>Verify Now</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-2xl flex items-start gap-4 w-full">
            <WifiOff className="w-8 h-8 flex-shrink-0" />
            <div>
              <p className="font-black text-[10px] uppercase opacity-60 mb-1">
                Search Issue
              </p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="flex flex-col w-full space-y-12">
            {/* Verdict */}
            <div
              className={`p-10 rounded-3xl border-2 flex flex-col md:flex-row md:items-center justify-between gap-10 shadow-2xl backdrop-blur-xl ${
                result.verdict.toLowerCase().includes("true")
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : result.verdict.toLowerCase().includes("false")
                  ? "bg-rose-500/5 border-rose-500/20"
                  : "bg-amber-500/5 border-amber-500/20"
              }`}
            >
              <div className="flex items-center gap-10">
                <div
                  className={`w-24 h-24 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-[-5deg] ${
                    result.verdict.toLowerCase().includes("true")
                      ? "bg-emerald-500"
                      : result.verdict.toLowerCase().includes("false")
                      ? "bg-rose-500"
                      : "bg-amber-500"
                  }`}
                >
                  {result.verdict.toLowerCase().includes("true") ? (
                    <CheckCircle2 size={48} className="text-white" />
                  ) : result.verdict.toLowerCase().includes("false") ? (
                    <XCircle size={48} className="text-white" />
                  ) : (
                    <AlertTriangle size={48} className="text-white" />
                  )}
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">
                    Search Verdict
                  </div>
                  <h3 className="text-5xl font-black uppercase tracking-tighter italic leading-none mb-3">
                    {result.verdict}
                  </h3>
                  <p className="text-slate-400 font-medium text-lg leading-snug">
                    {result.reason}
                  </p>
                </div>
              </div>
            </div>

            {/* Fact Log */}
            <div className="bg-slate-900/40 rounded-3xl border border-white/5 overflow-hidden">
              <div className="p-8 border-b border-white/5 bg-white/[0.02] font-black uppercase text-[10px] text-slate-400 tracking-widest">
                Fact Log
              </div>
              <div className="p-8 space-y-4">
                {result.claims.map((c, i) => (
                  <div key={i} className="p-4 bg-black/20 rounded-xl">
                    <p className="font-bold">{c.claim}</p>
                    <p className="text-slate-400 text-sm">
                      {c.status} - {c.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
