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

    // Provided API Keys
    const NEWS_API_KEY = "95590055460d462bb390b1b0fccf98c6";
    const GNEWS_API_KEY = "b92f914acf4ed99c48200b42c6381506";
    const GEMINI_KEY = "AIzaSyC7qwoYFRKUSVJh4XIsn6cDnbXl9ySnPDU";
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`[verify] Cross-referencing news for: ${query}`);

    // Step 1: Fetch from NewsAPI
    const newsRes = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=relevancy&pageSize=5&apiKey=${NEWS_API_KEY}`);
    const newsData = await newsRes.json();
    
    // Step 2: Fetch from GNews
    const gnewsRes = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=5&apikey=${GNEWS_API_KEY}`);
    const gnewsData = await gnewsRes.json();

    const allArticles = [
      ...(newsData.articles || []).map((a: any) => ({ title: a.title, desc: a.description, source: a.source.name, url: a.url })),
      ...(gnewsData.articles || []).map((a: any) => ({ title: a.title, desc: a.description, source: a.source.name, url: a.url }))
    ];

    const articleSnippets = allArticles.map(a => `[${a.source}] ${a.title}: ${a.desc}`).join('\n---\n');

    // Step 3: AI Analysis
    console.log("[verify] Analyzing with Gemini 1.5 Flash");
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

    const geminiData = await geminiRes.json();
    const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    const result = JSON.parse(resultText);

    // Step 4: Save to History
    await supabase.from('verifications').insert({
      query: query,
      verdict: result.verdict,
      confidence: result.confidence,
      trust_score: result.trust_score,
      verifiable_score: result.verifiable_score,
      bias_label: result.bias?.label
    });

    // Ensure sources are populated
    if (!result.sources || result.sources.length === 0) {
      result.sources = allArticles.slice(0, 5).map(a => ({ name: a.source, url: a.url }));
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("[verify] Error:", error);
    return new Response(JSON.stringify({ error: "Verification failed. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})