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

    const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY') || "95590055460d462bb390b1b0fccf98c6";
    const GNEWS_API_KEY = Deno.env.get('GNEWS_API_KEY') || "b92f914acf4ed99c48200b42c6381506";
    const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GEMINI_KEY') || "AIzaSyC7qwoYFRKUSVJh4XIsn6cDnbXl9ySnPDU";
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`[verify] Processing query: ${query}`);

    const cleanQuery = (q: string) => {
      return q.replace(/[^\w\s]/gi, '').split(' ').slice(0, 8).join(' ');
    };

    const searchQuery = cleanQuery(query);
    let allArticles = [];

    // Step 1: Fetch from NewsAPI
    try {
      const newsRes = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&language=en&sortBy=relevancy&pageSize=10&apiKey=${NEWS_API_KEY}`);
      if (newsRes.ok) {
        const newsData = await newsRes.json();
        if (newsData.articles?.length > 0) {
          allArticles.push(...newsData.articles.map((a: any) => ({ 
            title: a.title, 
            desc: a.description || a.content || "", 
            source: a.source.name, 
            url: a.url 
          })));
        }
      }
    } catch (e) {
      console.error("[verify] NewsAPI failed", e);
    }

    // Step 2: Fetch from GNews
    if (allArticles.length < 3) {
      try {
        const gnewsRes = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(searchQuery)}&lang=en&max=5&apikey=${GNEWS_API_KEY}`);
        if (gnewsRes.ok) {
          const gnewsData = await gnewsRes.json();
          if (gnewsData.articles?.length > 0) {
            allArticles.push(...gnewsData.articles.map((a: any) => ({ 
              title: a.title, 
              desc: a.description || a.content || "", 
              source: a.source.name, 
              url: a.url 
            })));
          }
        }
      } catch (e) {
        console.error("[verify] GNews failed", e);
      }
    }

    // If absolutely no articles found, return early with a specific state
    if (allArticles.length === 0) {
      return new Response(JSON.stringify({ 
        verdict: "Unclear", 
        reason: "No news articles found for this claim. This usually means the topic is not being reported by major news outlets or the query is too specific.",
        confidence: 0,
        verifiable_score: 0,
        trust_score: 0,
        bias: { label: "Unknown", explanation: "No data available to analyze bias." },
        tactics: ["No data available"],
        claims: [],
        sources: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const articleSnippets = allArticles.slice(0, 8).map(a => `[${a.source}] ${a.title}: ${a.desc}`).join('\n---\n');

    // Step 4: AI Analysis
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
    const systemPrompt = `
      You are a professional fact-checker. Analyze the following claim based on the provided news snippets.
      
      Claim: "${query}"
      
      Context from News Sources:
      ${articleSnippets}

      IMPORTANT: If the provided news snippets do not contain enough information to verify the claim, set the verdict to "Unclear".
      
      Return a valid JSON object with this structure:
      {
        "verdict": "True" | "False" | "Unclear" | "Developing",
        "reason": "Short explanation based on sources",
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

    if (!geminiRes.ok) throw new Error("AI Analysis Service failed.");

    const geminiData = await geminiRes.json();
    const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) throw new Error("AI Analysis returned no content.");

    const result = JSON.parse(resultText);

    // Save to History
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
      console.warn("[verify] History save failed:", dbError);
    }

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