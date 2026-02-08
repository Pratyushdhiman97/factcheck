import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { query } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Using provided keys
    const NEWS_API_KEY = "95590055460d462bb390b1b0fccf98c6";
    const GEMINI_KEY = "AIzaSyC7qwoYFRKUSVJh4XIsn6cDnbXl9ySnPDU";
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Step 1: Search NewsAPI
    console.log(`[verify] Searching news for: ${query}`);
    const newsUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=relevancy&pageSize=5&apiKey=${NEWS_API_KEY}`;
    const newsRes = await fetch(newsUrl);
    const newsData = await newsRes.json();
    const articles = newsData.articles || [];
    const articleSnippets = articles.map((a: any) => `${a.title} — ${a.description}`).join('\n');

    // Step 2: Call Gemini
    console.log("[verify] Calling Gemini for analysis");
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
    const systemPrompt = `
      You are a non-partisan fact checker.
      Claim: "${query}"
      Articles: ${articleSnippets}

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

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
      }),
    });

    const geminiData = await geminiRes.json();
    const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    const result = JSON.parse(resultText);

    // Step 3: Save to Database
    console.log("[verify] Saving result to database");
    const { error: dbError } = await supabase
      .from('verifications')
      .insert({
        query: query,
        verdict: result.verdict,
        confidence: result.confidence,
        trust_score: result.trust_score,
        verifiable_score: result.verifiable_score,
        bias_label: result.bias?.label
      });

    if (dbError) console.error("[verify] DB Error:", dbError);

    // Ensure sources are included
    if (!result.sources || result.sources.length === 0) {
      result.sources = articles.map((a: any) => ({ name: a.source.name, url: a.url }));
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("[verify] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})