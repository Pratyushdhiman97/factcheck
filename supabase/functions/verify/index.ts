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

    // API Keys
    const NEWS_API_KEY = "95590055460d462bb390b1b0fccf98c6";
    const GNEWS_API_KEY = "b92f914acf4ed99c48200b42c6381506";
    const GEMINI_KEY = "AIzaSyC7qwoYFRKUSVJh4XIsn6cDnbXl9ySnPDU";
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`[verify] Processing query: ${query}`);

    // Step 1: Fetch from NewsAPI
    let allArticles = [];
    try {
      const newsRes = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=relevancy&pageSize=5&apiKey=${NEWS_API_KEY}`);
      if (newsRes.ok) {
        const newsData = await newsRes.json();
        allArticles.push(...(newsData.articles || []).map((a: any) => ({ title: a.title, desc: a.description, source: a.source.name, url: a.url })));
      } else {
        console.warn(`[verify] NewsAPI returned status: ${newsRes.status}`);
      }
    } catch (e) {
      console.error("[verify] NewsAPI fetch failed", e);
    }
    
    // Step 2: Fetch from GNews
    try {
      const gnewsRes = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=5&apikey=${GNEWS_API_KEY}`);
      if (gnewsRes.ok) {
        const gnewsData = await gnewsRes.json();
        allArticles.push(...(gnewsData.articles || []).map((a: any) => ({ title: a.title, desc: a.description, source: a.source.name, url: a.url })));
      } else {
        console.warn(`[verify] GNews returned status: ${gnewsRes.status}`);
      }
    } catch (e) {
      console.error("[verify] GNews fetch failed", e);
    }

    if (allArticles.length === 0) {
      return new Response(JSON.stringify({ 
        verdict: "Unclear", 
        reason: "No news articles found for this query.",
        confidence: 0,
        verifiable_score: 0,
        trust_score: 0,
        sources: [],
        claims: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const articleSnippets = allArticles.map(a => `[${a.source}] ${a.title}: ${a.desc}`).join('\n---\n');

    // Step 3: AI Analysis
    console.log("[verify] Calling Gemini API...");
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
    const systemPrompt = `
      You are a professional fact-checker. Analyze the following claim based on the provided news snippets.
      
      Claim: "${query}"
      
      Context from News Sources:
      ${articleSnippets}

      Return a valid JSON object with this structure:
      {
        "verdict": "True" | "False" | "Unclear" | "Developing",
        "reason": "Short explanation",
        "confidence": 0-100,
        "verifiable_score": 0-100,
        "trust_score": 0-100,
        "bias": { "label": "Left" | "Right" | "Neutral" | "Sensational", "explanation": "Why?" },
        "tactics": ["List of media tactics detected"],
        "claims": [{ "claim": "Specific sub-claim", "status": "Verified" | "Debunked" | "Unclear", "details": "Context" }],
        "sources": [{ "name": "Source Name", "url": "URL" }]
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

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error(`[verify] Gemini API error (${geminiRes.status}):`, errorText);
      throw new Error(`Gemini API returned ${geminiRes.status}`);
    }

    const geminiData = await geminiRes.json();
    const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      console.error("[verify] Gemini returned no content. Data:", JSON.stringify(geminiData));
      throw new Error("Gemini returned an empty response. This might be due to safety filters.");
    }

    const result = JSON.parse(resultText);

    // Step 4: Save to History (Optional/Background)
    try {
      await supabase.from('verifications').insert({
        query: query,
        verdict: result.verdict,
        confidence: result.confidence,
        trust_score: result.trust_score,
        verifiable_score: result.verifiable_score,
        bias_label: result.bias?.label
      });
    } catch (dbError) {
      console.warn("[verify] Failed to save to history:", dbError);
    }

    // Ensure sources are populated
    if (!result.sources || result.sources.length === 0) {
      result.sources = allArticles.slice(0, 5).map(a => ({ name: a.source, url: a.url }));
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("[verify] Critical Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Verification failed." }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})