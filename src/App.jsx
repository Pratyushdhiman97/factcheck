import React, { useState } from 'react';
import { ShieldCheck, WifiOff, Search, AlertCircle, Info } from 'lucide-react';
import { supabase } from './integrations/supabase/client';
import toast from 'react-hot-toast';

import Hero from './components/Hero';
import InputSection from './components/InputSection';
import LiveStatus from './components/LiveStatus';
import VerdictCard from './components/VerdictCard';
import MediaBiasCard from './components/MediaBiasCard';
import FactLog from './components/FactLog';
import SourceDossier from './components/SourceDossier';
import HistoryLog from './components/HistoryLog';
import Footer from './components/Footer';

import './App.css';
import './animations.css';

const NewspaperBackground = () => (
  <div className="fixed inset-0 pointer-events-none select-none z-0 opacity-[0.05]"></div>
);

export default function App() {
  const [input, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const performAudit = async () => {
    if (!input.trim()) {
      toast.error("Please enter a claim to verify.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    const loadingToast = toast.loading("Analyzing claim across global sources...");

    try {
      const { data, error: funcError } = await supabase.functions.invoke('verify', {
        body: { query: input },
      });

      if (funcError) {
        setError(funcError.message || "Function invocation failed.");
        toast.error("Connection failed", { id: loadingToast });
        return;
      }

      if (data.error) {
        setError(data.error);
        toast.error("Verification error", { id: loadingToast });
        return;
      }
      
      setResult(data);
      setRefreshHistory(prev => prev + 1);
      
      if (data.verdict === "Unclear" && data.sources.length === 0) {
        toast("No sources found for this specific claim.", { icon: 'ℹ️', id: loadingToast });
      } else {
        toast.success("Analysis complete!", { id: loadingToast });
      }

    } catch (e) {
      console.error("Verification error:", e);
      setError(e.message || "An unexpected error occurred.");
      toast.error("System error", { id: loadingToast });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col items-center">
      <NewspaperBackground />

      <nav className="p-4 flex justify-between w-full max-w-5xl border-b border-white/10 z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-cyan-400" /> 
          <span className="font-bold text-lg tracking-tighter">VERIFACT AI</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-cyan-400/50">
          <span className="flex items-center gap-1"><Search size={12}/> LIVE ENGINE</span>
          <span className="flex items-center gap-1"><ShieldCheck size={12}/> SECURE</span>
        </div>
      </nav>

      <main className="app z-10">
        <Hero />

        <InputSection
          query={input}
          setQuery={setQuery}
          handleVerify={performAudit}
          loading={isAnalyzing}
        />

        <LiveStatus loading={isAnalyzing} />

        {error && (
          <div className="mt-4 text-red-400 flex flex-col gap-2 items-center glass-card p-6 border-red-500/30 animate-in fade-in slide-in-from-top-4 max-w-xl">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle size={20}/> Verification Error
            </div>
            <p className="text-sm text-center opacity-80">{error}</p>
            <p className="text-xs mt-2 text-gray-500">Tip: Ensure your API keys are correctly set in Supabase Secrets.</p>
          </div>
        )}

        {result && result.verdict === "Unclear" && result.sources.length === 0 && (
          <div className="mt-4 text-cyan-400 flex flex-col gap-2 items-center glass-card p-6 border-cyan-500/30 animate-in fade-in max-w-xl">
            <div className="flex items-center gap-2 font-bold">
              <Info size={20}/> No Sources Found
            </div>
            <p className="text-sm text-center opacity-80">{result.reason}</p>
            <p className="text-xs mt-2 text-gray-500">Try a broader search or check if the topic is currently in the news.</p>
          </div>
        )}

        {result && (result.sources.length > 0 || result.verdict !== "Unclear") && (
          <div className="w-full space-y-6 animate-in fade-in duration-700">
            <VerdictCard results={{
              verdict: result.verdict,
              confidence: result.confidence,
              verifiable: result.verifiable_score,
              trustScore: result.trust_score
            }} />

            <MediaBiasCard
              mediaBias={result.bias?.label || 'Neutral'}
              narrativeTags={result.tactics || []}
            />

            <FactLog facts={result.claims || []} />

            <SourceDossier sources={result.sources || []} />
          </div>
        )}

        <HistoryLog refreshTrigger={refreshHistory} />

        <Footer />
      </main>
    </div>
  );
}