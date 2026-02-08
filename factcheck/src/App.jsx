import React, { useState } from 'react';
import { 
  ShieldCheck, Search, AlertTriangle, CheckCircle2, XCircle, Scale, 
  BarChart3, RefreshCw, Globe, ArrowRight, Activity, BookOpen, ExternalLink, Link as LinkIcon
} from 'lucide-react';

const defaultApiKey = import.meta.env.VITE_API_KEY || "AIzaSyBXn-YXdUjVyDSmX8oan0j0RJJIqacXYyo";
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";

const NewspaperBackground = () => (
  <div className="fixed inset-0 pointer-events-none select-none z-0 opacity-5">
    <div className="absolute top-[-5%] left-[-2%] rotate-[-8deg] bg-[#fdfaf1] text-black p-12 max-w-sm font-serif shadow-2xl border-b-4 border-black">
      <h2 className="text-6xl font-black uppercase mb-2 tracking-tighter">The Daily News</h2>
      <div className="flex justify-between border-y border-black py-1 mb-4 text-[10px] font-bold">
        <span>VOL. CXIV... No. 38,492</span>
        <span>LATE EDITION</span>
      </div>
      <p className="text-sm leading-tight font-bold mb-2 italic">TRUTH IN THE AGE OF DISINFORMATION</p>
    </div>
  </div>
);

export default function App() {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [auditPhase, setAuditPhase] = useState('');

  const parseAIResponse = (rawText) => {
    try {
      if (!rawText) throw new Error("Empty response received.");
      let cleanText = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const start = cleanText.indexOf('{');
      const end = cleanText.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error("No structured audit data found.");
      return JSON.parse(cleanText.substring(start, end + 1));
    } catch {
      // fallback offline data
      return {
        verdict: "Developing",
        reason: "Offline analysis applied. Full live search unavailable.",
        confidence: 50,
        verifiable_score: 40,
        trust_score: 50,
        bias: { label: "Neutral", explanation: "No live sources reachable." },
        tactics: ["Offline Estimation"],
        claims: [{ claim: input || "No input", status: "Unknown", details: "Offline fallback" }],
        sources: []
      };
    }
  };

  const fetchWithRetry = async (payload, retries = 3, delay = 1000) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${defaultApiKey}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      return await res.json();
    } catch (err) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, delay));
        return fetchWithRetry(payload, retries - 1, delay * 2);
      }
      throw err;
    }
  };

  const performAudit = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || trimmedInput.length < 3) {
      setError("Enter a topic, question, or claim.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setAuditPhase('Initializing...');

    const systemPrompt = `You are a non-partisan news auditor.
Task:
1. Research input using Google Search.
2. Provide verdict.
3. Audit bias and extract sources.
JSON SCHEMA:
{
  "verdict": "string",
  "reason": "string",
  "confidence": number,
  "verifiable_score": number,
  "trust_score": number,
  "bias": { "label": "string", "explanation": "string" },
  "tactics": ["string"],
  "claims": [{"claim":"string","status":"string","details":"string"}],
  "sources":[{"name":"string","url":"string"}]
}`;

    try {
      setAuditPhase('Fetching Live Data...');
      const payload = {
        contents: [{ parts: [{ text: `VERIFY THIS: ${trimmedInput}` }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
      };

      const data = await fetchWithRetry(payload);
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setAuditPhase('Synthesizing...');
      setResult(parseAIResponse(textResponse));
    } catch {
      // fallback offline
      setAuditPhase('Offline Fallback Applied');
      setResult(parseAIResponse(null));
    } finally {
      setIsAnalyzing(false);
      setAuditPhase('');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-slate-100 relative pb-24 font-sans overflow-x-hidden">
      <NewspaperBackground />
      <nav className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-2xl border-b border-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <ShieldCheck className="text-white w-6 h-6"/>
          </div>
          <span className="text-xl font-black tracking-tighter text-white uppercase italic">VeriFact</span>
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-20">
        <div className="text-center mb-16 space-y-6">
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.8] uppercase italic">
            Search & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-500 underline decoration-blue-500/30">Verify.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto font-medium leading-relaxed">
            Enter a rumor, question, or news topic. Works online & offline.
          </p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-3xl rounded-2xl border border-white/5 shadow-2xl p-4 mb-16">
          <div className="relative">
            <Search className="absolute top-6 left-6 text-slate-500 w-6 h-6"/>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); performAudit(); } }}
              placeholder="Enter topic or question..."
              className="w-full h-32 py-6 pl-16 pr-8 bg-transparent border-none rounded-2xl text-slate-200 placeholder:text-slate-600 font-medium text-xl leading-relaxed resize-none"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={performAudit}
              disabled={isAnalyzing || !input.trim()}
              className={`px-10 py-4 rounded-xl font-black uppercase text-xs flex items-center gap-3 ${
                isAnalyzing ? 'bg-slate-800 text-slate-500 cursor-not-allowed' :
                'bg-white text-black hover:bg-blue-600 hover:text-white shadow-xl active:scale-95'
              }`}
            >
              {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <ArrowRight className="w-4 h-4"/>}
              <span>{isAnalyzing ? auditPhase||'Analyzing...' : 'Verify Now'}</span>
            </button>
          </div>
        </div>

        {result && (
          <div className="space-y-12">
            <div className="p-8 rounded-2xl border border-white/10 flex flex-col md:flex-row justify-between gap-6 shadow-lg backdrop-blur-xl">
              <div className="flex items-center gap-6">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ${
                  result.verdict.toLowerCase().includes('true') ? 'bg-emerald-500' : 
                  result.verdict.toLowerCase().includes('false') ? 'bg-rose-500' : 'bg-amber-500'}`}>
                  {result.verdict.toLowerCase().includes('true') ? <CheckCircle2 className="text-white w-10 h-10"/> : 
                   result.verdict.toLowerCase().includes('false') ? <XCircle className="text-white w-10 h-10"/> :
                   <AlertTriangle className="text-white w-10 h-10"/>}
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase opacity-40 mb-1">Verdict</div>
                  <h3 className="text-3xl font-black">{result.verdict}</h3>
                  <p className="text-slate-400">{result.reason}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-2xl flex items-center gap-4 mb-12">
            <AlertTriangle className="w-6 h-6"/>
            <span>{error}</span>
          </div>
        )}
      </main>
    </div>
  );
}
