import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Search, RefreshCw, ArrowRight, Unlock, Key, Globe, CheckCircle2, XCircle, AlertTriangle,
  Scale, BarChart3, WifiOff
} from 'lucide-react';

const defaultApiKey = "AIzaSyAedA3FWzNHgNh-P5aF8o0KJ3ciot0zlR4";
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";

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
  const [searchStatus, setSearchStatus] = useState('active');
  const [customKey, setCustomKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('verifact_api_key');
    if (savedKey) setCustomKey(savedKey);
  }, []);

  const saveKey = (key) => {
    setCustomKey(key);
    localStorage.setItem('verifact_api_key', key);
    setSearchStatus('active');
  };

  const parseAIResponse = (rawText) => {
    try {
      if (!rawText) throw new Error("Empty response received.");
      let cleanText = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const start = cleanText.indexOf('{');
      const end = cleanText.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error("No structured audit data found.");
      return JSON.parse(cleanText.substring(start, end + 1));
    } catch (e) {
      console.error("Parse Error:", rawText);
      throw new Error("Audit report was generated but is unreadable. Please retry.");
    }
  };

  const fetchWithRetry = async (payload, retries = 5, delay = 1000) => {
    const activeKey = customKey || defaultApiKey;
    if (!activeKey) throw new Error("API Key Missing. Please enter a key.");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${activeKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 401) return { error: 'AUTH_RESTRICTION', status: response.status };
        if (retries > 0 && (response.status >= 500 || response.status === 429)) {
          await new Promise(res => setTimeout(res, delay + Math.random() * 500));
          return fetchWithRetry(payload, retries - 1, delay * 2);
        }
        throw new Error(`Audit Node Error (${response.status})`);
      }
      return await response.json();
    } catch (err) {
      if (retries > 0 && err.name !== 'TypeError') {
        await new Promise(res => setTimeout(res, delay));
        return fetchWithRetry(payload, retries - 1, delay * 2);
      }
      throw err;
    }
  };

  const performAudit = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || trimmedInput.length < 3) {
      setError("Please enter a topic, question, or claim.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setAuditPhase('Initializing Search Protocols...');

    const systemPrompt = `You are a non-partisan news auditor and fact-checker.
Task: verify the input and return JSON structured results.`;

    try {
      setAuditPhase('Scanning Global Media...');
      const primaryPayload = {
        contents: [{ parts: [{ text: `VERIFY THIS TOPIC/CLAIM: ${trimmedInput}` }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        tools: [{ "google_search": {} }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
      };

      let data = await fetchWithRetry(primaryPayload);

      if (data.error === 'AUTH_RESTRICTION') {
        setSearchStatus('restricted');
        setAuditPhase('Search Blocked - Using Internal Knowledge...');
        setError("Live Search Blocked: Please add a valid API Key.");
        const fallbackPayload = {
          contents: [{ parts: [{ text: `ANALYZE THIS TOPIC: ${trimmedInput}` }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json" }
        };
        data = await fetchWithRetry(fallbackPayload);
      } else setSearchStatus('active');

      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setAuditPhase('Synthesizing Report...');
      setResult(parseAIResponse(textResponse));
    } catch (err) {
      setError(err.message || "Connection lost.");
    } finally {
      setIsAnalyzing(false);
      setAuditPhase('');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-sans selection:bg-blue-500/30 overflow-x-hidden relative pb-24">
      <NewspaperBackground />

      {/* NAV */}
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
              <button 
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
              >
                {customKey ? <Unlock size={14} className="text-emerald-400"/> : <Key size={14} className="text-slate-400"/>}
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                    {customKey ? 'Key Active' : 'Connect Key'}
                </span>
              </button>
              
              {showKeyInput && (
                <div className="absolute top-12 right-0 w-64 p-4 bg-slate-900 border border-white/10 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 z-50">
                  <input 
                    type="password" 
                    value={customKey}
                    onChange={(e) => saveKey(e.target.value)}
                    placeholder="Paste AI Key"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white mb-2 focus:border-blue-500 outline-none"
                  />
                </div>
              )}
            </div>

            <div className={`flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 ${searchStatus === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${searchStatus === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
              <span className="text-[9px] font-black uppercase tracking-widest hidden md:inline">
                {searchStatus === 'active' ? 'Live Index' : 'Offline Mode'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-20 space-y-16">
        {/* HEADER */}
        <div className="text-center space-y-4">
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.8] uppercase italic drop-shadow-2xl">
            Search & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-500 underline decoration-blue-500/30">Verify</span>
          </h1>
          <p className="text-lg text-slate-400 font-medium leading-relaxed">Enter a rumor, question, or news topic. We'll search the truth and audit the bias.</p>
        </div>

        {/* INPUT CARD */}
        <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-2xl p-4 focus-within:border-blue-500/40 transition-all">
          <div className="relative">
            <Search className="absolute top-6 left-6 text-slate-500 w-6 h-6" />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); performAudit(); } }}
              placeholder="Ask a question or enter a topic..."
              className="w-full h-32 py-6 pl-16 pr-8 bg-transparent border-none rounded-[2rem] focus:ring-0 resize-none text-slate-200 placeholder:text-slate-600 font-medium text-xl leading-relaxed"
            />
          </div>
          <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex gap-4 opacity-40 px-4"><Globe size={16} /><span className="text-xs font-bold uppercase tracking-widest">Searching Global Sources</span></div>
            <button
              onClick={performAudit}
              disabled={isAnalyzing || !input.trim()}
              className={`w-full md:w-auto px-10 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 ${
                isAnalyzing ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-white text-black hover:bg-blue-600 hover:text-white shadow-xl active:scale-95'
              }`}
            >
              {isAnalyzing ? (<><RefreshCw className="w-4 h-4 animate-spin"/><span>{auditPhase}</span></>) : (<><span>Verify Now</span><ArrowRight className="w-4 h-4"/></>)}
            </button>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-[2rem] flex items-start gap-4">
            <WifiOff className="w-8 h-8 flex-shrink-0" />
            <div><p className="font-black text-[10px] uppercase opacity-60 mb-1">Search Issue</p><p>{error}</p></div>
          </div>
        )}

        {/* RESULTS */}
        {result && (
          <div className="space-y-12">
            {/* Verdict Card */}
            <div className={`p-10 rounded-[3rem] border-2 flex flex-col md:flex-row md:items-center justify-between gap-10 shadow-2xl backdrop-blur-xl ${
              result.verdict.toLowerCase().includes('true') ? 'bg-emerald-500/5 border-emerald-500/20' :
              result.verdict.toLowerCase().includes('false') ? 'bg-rose-500/5 border-rose-500/20' :
              'bg-amber-500/5 border-amber-500/20'
            }`}>
              <div className="flex items-center gap-10">
                <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl transform rotate-[-5deg] ${
                  result.verdict.toLowerCase().includes('true') ? 'bg-emerald-500' : result.verdict.toLowerCase().includes('false') ? 'bg-rose-500' : 'bg-amber-500'
                }`}>
                  {result.verdict.toLowerCase().includes('true') ? <CheckCircle2 size={48} className="text-white"/> : result.verdict.toLowerCase().includes('false') ? <XCircle size={48} className="text-white"/> : <AlertTriangle size={48} className="text-white"/>}
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">Search Verdict</div>
                  <h3 className="text-5xl font-black uppercase tracking-tighter italic leading-none mb-3">{result.verdict}</h3>
                  <p className="text-slate-400 font-medium text-lg leading-snug">{result.reason}</p>
                </div>
              </div>

              {/* Vital Signs */}
              <div className="bg-black/50 p-8 rounded-[2.5rem] border border-white/5 min-w-[200px] flex flex-col justify-center space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Verifiable Info</span>
                  <span className={`text-xl font-black ${result.verifiable_score>70?'text-emerald-400':'text-amber-400'}`}>{result.verifiable_score||0}%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-1000" style={{width:`${result.verifiable_score||0}%`, backgroundColor: result.verifiable_score>70?'#34d399':'#fbbf24'}}></div>
                </div>

                <div className="flex justify-between items-end">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Source Trust</span>
                  <span className={`text-xl font-black ${result.trust_score>70?'text-blue-400':'text-rose-400'}`}>{result.trust_score||0}%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-1000" style={{width:`${result.trust_score||0}%`, backgroundColor: result.trust_score>70?'#60a5fa':'#fb7185'}}></div>
                </div>
              </div>
            </div>

            {/* Bias & Tactics Grid */}
            <div className="grid md:grid-cols-2 gap-10">
              <div className="bg-slate-900/40 p-10 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-8"><Scale size={20} className="text-blue-400"/><h4 className="font-black uppercase text-[10px] text-slate-400">Media Framing</h4></div>
                <p className="p-6 bg-black/40 rounded-2xl italic text-sm text-slate-300 font-serif leading-relaxed">"{result.bias.explanation}"</p>
              </div>

              <div className="bg-slate-900/40 p-10 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-8"><BarChart3 size={20} className="text-orange-400"/><h4 className="font-black uppercase text-[10px] text-slate-400">Narrative Tactics</h4></div>
                <div className="flex flex-wrap gap-2">{result.tactics.map((t,i)=><span key={i} className="px-4 py-2 bg-white/5 text-white border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">{t}</span>)}</div>
              </div>
            </div>

            {/* Fact Log */}
            <div className="bg-slate-900/40 rounded-[3rem] border border-white/5 overflow-hidden">
              <div className="p-8 border-b border-white/5 bg-white/[0.02] font-black uppercase text-[10px] text-slate-400 tracking-widest">Fact Log</div>
              <div className="p-8 space
