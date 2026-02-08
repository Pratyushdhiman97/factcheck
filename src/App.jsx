import React, { useState } from 'react';
import {
  ShieldCheck, WifiOff
} from 'lucide-react';

import Hero from './components/Hero';
import InputSection from './components/InputSection';
import LiveStatus from './components/LiveStatus';
import VerdictCard from './components/VerdictCard';
import MediaBiasCard from './components/MediaBiasCard';
import FactLog from './components/FactLog';
import SourceDossier from './components/SourceDossier';
import Footer from './components/Footer';

import './App.css';
import './animations.css';

const NewspaperBackground = () => (
  <div className="fixed inset-0 pointer-events-none select-none z-0 opacity-[0.05]"></div>
);

export default function App() {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const performAudit = async () => {
    if (!input.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("http://localhost:5000/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: input })
      });

      if (!res.ok) {
        throw new Error("Backend error");
      }

      const data = await res.json();

      setResult(data);

    } catch (e) {
      setError("Verification engine offline");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col items-center justify-center">
      <NewspaperBackground />

      {/* NAVBAR */}
      <nav className="p-4 flex justify-between w-full max-w-5xl border-b border-white/10">
        <div className="flex items-center gap-2">
          <ShieldCheck /> 
          <span className="font-bold text-lg">VeriFact</span>
        </div>
      </nav>

      {/* MAIN APP */}
      <main className="app">
        <Hero />

        <InputSection
          query={input}
          setQuery={setInput}
          handleVerify={performAudit}
          loading={isAnalyzing}
        />

        <LiveStatus loading={isAnalyzing} />

        {error && (
          <div className="mt-4 text-red-400 flex gap-2 items-center">
            <WifiOff size={16}/> {error}
          </div>
        )}

        {result && (
          <>
            <VerdictCard results={{
              verdict: result.verdict,
              confidence: result.confidence,
              verifiable: result.verifiable_score,
              trustScore: result.trust_score
            }} />

            <MediaBiasCard
              mediaBias={result.bias?.label}
              narrativeTags={result.tactics || []}
            />

            <FactLog facts={result.claims || []} />

            <SourceDossier sources={result.sources || []} />
          </>
        )}

        <Footer />
      </main>
    </div>
  );
}
