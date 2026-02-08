import React, { useState } from 'react';
import { ShieldCheck, Search, AlertCircle, Info } from 'lucide-react';
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

// Hardcoded keys for "Make it work now" mode
const NEWS_API_KEY = "95590055460d462bb390b1b0fccf98c6";
const GNEWS_API_KEY = "b92f914acf4ed99c48200b42c6381506";
const GEMINI_KEY = "AIzaSyC7qwoYFRKUSVJh4XIsn6cDnbXl9ySnPDU";

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
    const loadingToast = toast.loading("Scanning global news archives...");

    try {
      // Step 1: Fetch News
      const searchQuery = input.replace(/[^\w\s]/gi, '').split(' ').slice(0, 6).join(' ');
      let articles = [];

      try {
        const newsRes = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&language=en&sortBy=relevancy&pageSize=5&apiKey=${NEWS_API_KEY}`);
        const newsData = await newsRes.json();
        if (newsData.articles) {
          articles.push(...newsData.articles.map(a => ({
            title: a.title,
            desc: a.description || "",
            source: a.source.name,
            url: a.url
          })));
        }
      } catch (e) { console.warn("NewsAPI failed, trying GNews..."); }

      if (articles.length === 0) {
        try {
          const gnewsRes = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(searchQuery)}&lang=en&max=5&apikey=${GNEWS_API_KEY}`);
          const gnewsData = await gnewsRes.json();
          if (gnewsData.articles) {
            articles.push(...gnewsData.articles.map(a => ({
              title: a.title,
              desc: a.description || "",
              source: a.source.name,
              url: a.url
            })));
          }
        } catch (e) { console.warn("GNews failed."); }
      }

      if (articles.length === 0) {
        setResult({
          verdict: "Unclear",
          reason: "No news articles found for this claim. This usually means the topic is not being reported by major news outlets.",
          confidence: 0,
          verifiable_score: 0,
          trust_score: 0,
          bias: { label: "Unknown", explanation: "No data available." },
          tactics: ["No data"],
          claims: [],
          sources: []
        });
        toast("No sources found.", { icon: 'ℹ️', id: loadingToast });
        setIsAnalyzing(false);
        return;
      }

      // Step 2: AI Analysis via Gemini
      const articleSnippets = articles.map(a => `[${a.source}] ${a.title}: ${a.desc}`).join('\n---\n');
      const systemPrompt = `
        Analyze this claim: "${input}"
        Based on these news snippets:
        ${articleSnippets}

        Return ONLY a JSON object:
        {
          "verdict": "True" | "False" | "Unclear" | "Developing",
          "reason": "Short explanation",
          "confidence": 0-100,
          "verifiable_score": 0-100,
          "trust_score": 0-100,
          "bias": { "label": "Left" | "Right" | "Neutral" | "Sensational", "explanation": "Why?" },
          "tactics": ["Detected tactics"],
          "claims": [{ "claim": "Sub-claim", "status": "Verified" | "Debunked" | "Unclear", "details": "Context" }],
          "sources": [{ "name": "Source", "url": "URL" }]
        }
      `;

      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
        }),
      });

      const geminiData = await geminiRes.json();
      const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      const analysis = JSON.parse(resultText);

      // Ensure sources are populated if AI missed them
      if (!analysis.sources || analysis.sources.length === 0) {
        analysis.sources = articles.slice(0, 5).map(a => ({ name: a.source, url: a.url }));
      }

      setResult(analysis);
      setRefreshHistory(prev => prev + 1);
      toast.success("Analysis complete!", { id: loadingToast });

      // Save to History (Silent)
      supabase.from('verifications').insert({
        query: input,
        verdict: analysis.verdict,
        confidence: analysis.confidence,
        trust_score: analysis.trust_score,
        verifiable_score: analysis.verifiable_score,
        bias_label: analysis.bias?.label
      }).then(() => {});

    } catch (e) {
      console.error("Verification error:", e);
      setError("The verification engine encountered an error. Please try again.");
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
          <div className="mt-4 text-red-400 flex flex-col gap-2 items-center glass-card p-6 border-red-500/30 animate-in fade-in max-w-xl">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle size={20}/> Error
            </div>
            <p className="text-sm text-center opacity-80">{error}</p>
          </div>
        )}

        {result && (
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

            {result.claims && result.claims.length > 0 && <FactLog facts={result.claims} />}
            {result.sources && result.sources.length > 0 && <SourceDossier sources={result.sources} />}
          </div>
        )}

        <HistoryLog refreshTrigger={refreshHistory} />

        <Footer />
      </main>
    </div>
  );
}