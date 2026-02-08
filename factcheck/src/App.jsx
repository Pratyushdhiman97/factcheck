import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Search, AlertTriangle, CheckCircle2, XCircle, Scale, BarChart3,
  RefreshCw, Globe, Key, Unlock, WifiOff, ArrowRight
} from 'lucide-react';

const defaultApiKey = "AIzaSyBXn-YXdUjVyDSmX8oan0j0RJJIqacXYyo"; 
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
  const [customKey, setCustomKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [searchStatus, setSearchStatus] = useState('active');

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
      if(!rawText) throw new Error("Empty response.");
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

  const verdictColor = (verdict) => {
    if(verdict.toLowerCase().includes('true')) return 'emerald';
    if(verdict.toLowerCase().includes('false')) return 'rose';
    return 'amber';
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

      {/* MAIN */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-20 space-y-16">
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
              onChange={(e)=>setInput(e.target.value)}
              onKeyDown={(e)=>{if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); performAudit(); }}}
              placeholder="Ask a question or enter a topic..."
              className="w-full h-32 py-6 pl-16 pr-8 bg-transparent border-none rounded-[2rem] focus:ring-0 resize-none text-slate-200 placeholder:text-slate-600 font-medium text-xl leading-relaxed"
            />
          </div>
          <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex gap-4 opacity-40 px-4"><Globe size={16} /><span className="text-xs font-bold uppercase tracking-widest">Searching Global Sources</span></div>
            <button
              onClick={performAudit}
              disabled={isAnalyzing || !input.trim()}
              className={`w-full md:w-auto px-10 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 ${isAnalyzing?'bg-slate-800 text-slate-500 cursor-not-allowed':'bg-white text-black hover:bg-blue-600 hover:text-white shadow-xl active:scale-95'}`}
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
            <div className={`p-10 rounded-[3rem] border-2 flex flex-col md:flex-row md:items-center justify-between gap-10 shadow-2xl backdrop-blur-xl bg-${verdictColor(result.verdict)}-500/5 border-${verdictColor(result.verdict)}-500/20`}>
              <div className="flex items-center gap-10">
                <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl transform rotate-[-5deg] bg-${verdictColor(result.verdict)}-500`}>
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

            {/* Bias & Tactics */}
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
              <div className="p-8 space-y-4">
                {result.claims.map((c,i)=>(
                  <div key={i} className="p-4 bg-black/20 rounded-xl">
                    <p className="font-bold">{c.claim}</p>
                    <p className="text-slate-400 text-sm">{c.status} - {c.details}</p>
                  </div>
                ))}
              </div>
            </div>
                        {/* Sources */}
            {result.sources && result.sources.length > 0 && (
              <div className="bg-slate-900/40 rounded-[3rem] border border-white/5 overflow-hidden">
                <div className="p-8 border-b border-white/5 bg-white/[0.02] font-black uppercase text-[10px] text-slate-400 tracking-widest">
                  Sources
                </div>
                <div className="p-8 space-y-4">
                  {result.sources.map((s, i) => (
                    <div key={i} className="p-4 bg-black/20 rounded-xl flex justify-between items-center">
                      <p className="font-bold text-slate-200">{s.name}</p>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs hover:underline flex items-center gap-1">
                        Visit <ArrowRight size={14} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div> {/* End of results space-y-12 */}
        )}
      </main>
    </div> /* End of App wrapper */
  );
}

            

