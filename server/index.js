import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const GEMINI_KEY = process.env.GEMINI_KEY || '';
const NEWS_API_KEY = process.env.NEWS_API_KEY || '';
const MODEL_NAME = 'gemini-1.5-flash';

/**
 * Helper to call Gemini API
 */
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_KEY}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(text);
}

/**
 * Helper to search NewsAPI
 */
async function searchNews(query) {
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=relevancy&pageSize=5&apiKey=${NEWS_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.articles || [];
}

/**
 * Fact-check endpoint
 */
app.post('/api/verify', async (req, res) => {
  try {
    const { claim } = req.body;
    if (!claim) return res.status(400).json({ error: 'Claim is required' });

    // Step 1: Search articles
    const articles = await searchNews(claim);
    const articleSnippets = articles.map(a => `${a.title} — ${a.description}`).join('\n');

    // Step 2: Prepare Gemini prompt
    const systemPrompt = `
You are a non-partisan fact checker.
Claim: "${claim}"
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

    const result = await callGemini(systemPrompt);
    // Include top articles as sources
    result.sources = articles.map(a => ({ name: a.source.name, url: a.url }));

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
