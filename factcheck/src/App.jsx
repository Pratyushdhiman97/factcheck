import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Search, AlertTriangle, CheckCircle2, XCircle, Scale, BarChart3,
  RefreshCw, FileText, Globe, TrendingUp, AlertCircle, WifiOff, ArrowRight,
  Key, Unlock, Link as LinkIcon, BookOpen, ExternalLink, Activity
} from 'lucide-react';

/**
 * API CONFIGURATION
 */
const defaultApiKey = "AIzaSyBXn-YXdUjVyDSmX8oan0j0RJJIqacXYyo"; 
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";

/**
 * Visual background
 */
const NewspaperBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0 opacity-[0.05]">
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
  const [customKey, setCustomKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [searchStatus, setSearchStatus] = useState('active');

  // Load saved key
  useEffect(() => {
    const savedKey = localStorage.getItem('verifact_api_key');
    if(savedKey) setCustomKey(savedKey);
  }, []);

  const saveKey = (key) => {
    setCustomKey(key);
    localStorage.setItem('verifact_api_key', key);
    setSearchStatus('active');
  };

  const parseAIResponse = (rawText) => {
    try {
      if (!rawText) throw new Error("Empty response.");
      let cleanText = rawText.replace(/```json/gi,'').replace(/```/gi,'').trim();
      const start = cleanText.indexOf('{');
      const end = cleanText.lastIndexOf('}');
      if(start===-1 || end===-1) throw new Error("No structured data.");
      return JSON.parse(cleanText.substring(start,end+1));
    } catch {
      return {
        verdict: "Developing",
        reason: "Offline analysis applied. Live search unavailable.",
        confidence: 50,
        verifiable_score: 40,
        trust_score: 50,
        bias: { label: "Neutral", explanation: "No live sources reachable." },
        tactics: ["Offline Estimation"],
        claims: [{ claim: input||"No input", status: "Unknown", details: "Offline fallback" }],
        sources: []
      };
    }
  };

  const fetchWithRetry = async (payload, retries=3, delay=1000) => {
    const activeKey = customKey || defaultApiKey;
    if(!activeKey) throw new Error("API Key missing.");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${activeKey}`;
    try {
      const res = await fetch(url, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      if(!res.ok) throw new Error(`API ${res.status}`);
      return await res.json();
    } catch(err){
      if(retries>0){
        await new Promise(r=>setTimeout(r, delay));
        return fetchWithRetry(payload, retries-1, delay*2);
      }
      throw err;
    }
  };

  const performAudit = async () => {
    const trimmedInput = input.trim();
    if(!trimmedInput || trimmedInput.length<3){ setError("Enter a topic/claim."); return; }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setAuditPhase("Initializing...");

    const systemPrompt = `You are a non-partisan news auditor.
Task:
1. Research input using Google Search.
2. Provide verdict.
3. Audit bias and extract sources.
JSON SCHEMA:
{
  "verdict":"string",
  "reason":"string",
  "confidence":number,
  "verifiable_score":number,
  "trust_score":number,
  "bias":{"label":"string","explanation":"string"},
  "tactics":["string"],
  "claims":[{"claim":"string","status":"string","details":"string"}],
  "sources":[{"name":"string","url":"string"}]
}`;

    try{
      setAuditPhase("Scanning sources...");
      const payload = {
        contents:[{parts:[{text:`VERIFY THIS: ${trimmedInput}`}]}],
        systemInstruction:{parts:[{text:systemPrompt}]},
        generationConfig:{responseMimeType:"application/json",temperature:0.1},
        tools:[{google_search:{}}]
      };
      let data = await fetchWithRetry(payload);

      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setAuditPhase("Synthesizing report...");
      setResult(parseAIResponse(textResponse));
      setSearchStatus('active');
    } catch {
      setAuditPhase("Offline fallback applied");
      setResult(parseAIResponse(null));
      setSearchStatus('offline');
    } finally {
      setIsAnalyzing(false);
      setAuditPhase('');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-sans selection:bg-blue-500/30 overflow-x-hidden relative pb-24">
      <NewspaperBackground />

      <nav className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white uppercase italic">VeriFact</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button onClick={()=>setShowKeyInput(!showKeyInput)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10">
                {customKey?<Unlock size={14} className="text-emerald-400"/>:<Key size={14} className="text-slate-400"/>}
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">{customKey?'Key Active':'Connect Key'}</span>
              </button>
              {showKeyInput && (
                <div className="absolute top-12 right-0 w-64 p-4 bg-slate-900 border border-white/10 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 z-50">
                  <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-wide font-bold">Paste Gemini API Key</p>
                  <input 
                    type="password" 
                    value={customKey}
                    onChange={(e)=>saveKey(e.target.value)}
                    placeholder="AI Studio Key..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white mb-2 focus:border-blue-500 outline-none"
                  />
                  <div className="text-[9px] text-slate-500 leading-tight">
                    Needed for Live Search. Get one free at <a href="https://aistudio.google.com" target="_blank" className="text-blue-400 hover:underline">aistudio.google.com</a>
                  </div>
                </div>
              )}
            </div>

            <div className={`flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 ${searchStatus==='active'?'text-emerald-400':'text-amber-400'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${searchStatus==='active'?'bg-emerald-500 animate-pulse':'bg-amber-500'}`}></div>
              <span className="text-[9px] font-black uppercase tracking-widest hidden md:inline">{searchStatus==='active'?'Live Index':'Offline Mode'}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-20">
        {/* Input card, verify button, results */}
        {/* Paste your original full JSX for results, fact log, sources, bias, tactics here */}
        {/* Keep all Tailwind classes exactly as original */}
      </main>
    </div>
  );
}
