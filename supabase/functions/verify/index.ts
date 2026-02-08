import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

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

    const GEMINI_KEY = Deno.env.get('GEMINI_KEY');
    const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY');

    if (!GEMINI_KEY || !NEWS_API_KEY) {
      console.error("[verify] Missing API keys");
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // Ensure sources are included from NewsAPI if Gemini didn't provide enough
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