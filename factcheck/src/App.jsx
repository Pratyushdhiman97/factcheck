import React, { useState } from 'react';
import {
  ShieldCheck, WifiOff, BookOpen, ExternalLink
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

const MODEL_NAME = "gemini-2.5-flash";
const ENV_KEY = import.meta.env.VITE_GEMINI_KEY || "";

const NewspaperBackground = () => (
  <div className="fixed inset-0 pointer-events-none select-none z-0 opacity-[0.05]"></div>
);

export default function App() {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const parseAIResponse = (raw) => {
    if (!raw || !raw.trim().startsWith('{')) {
      throw new Error("Invalid AI response format");
    }
    return JSON.parse(raw.trim());
  };

  const fetchWithRetry = async (payload, retries = 3) => {
    if (!ENV_KEY) throw new Error("No API key");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${ENV_KEY}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        if (retries > 0) return fetchWithRetry(payload, retries - 1);
        throw new Error(`API Error ${res.status}`);
      }

      return await res.json();
    } catch (e) {
      if (retries > 0) return fetchWithRetry(payload, retries - 1);
      throw e;
    }
  };

  const performAudit = async () => {
    if (!input.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    const systemPrompt = `
You are a non-partisan fact checker.
Return STRICT JSON:

{
  "verdict": "True/False/Unclear/Confirmed",
  "reason": "string",
  "confidence": number,
  "verifiable_score": number,
  "trust_score": number,
  "bias": { "label": "string", "explanation": "string" },
  "tactics": ["string"],
  "claims": [{ "claim": "string", "status": "Verified/Debunked/Unclear", "details": "string" }],
  "sources": [{ "name": "string", "url": "string" }]
}
`;

    const payload = {
      contents: [{ parts: [{ text: `VERIFY: ${input}` }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
    };

    try {
      const data = await fetchWithRetry(payload);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = parseAIResponse(text);
      setResult(parsed);
    } catch (e) {
      setError(e.message || "Network error");
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

        {/* GEMINI KEY INPUT REMOVED */}
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

            <MediaBiasCard mediaBias={result.bias?.label} narrativeTags={result.tactics || []} />

            <FactLog facts={result.claims || []} />

            <SourceDossier sources={result.sources || []} />
          </>
        )}

        <Footer />
      </main>
    </div>
  );
}
