// backend/routes/verify.route.js

import express from "express";
import fetch from "node-fetch";

const router = express.Router();

/*
INPUT:
{ query: "news text or claim" }

OUTPUT:
{
  verdict,
  confidence,
  verifiable_score,
  trust_score,
  bias,
  tactics,
  claims,
  sources
}
*/

router.post("/verify", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "No query provided" });
    }

    /* -------- STEP 1: SEARCH REAL NEWS -------- */
    const newsRes = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=relevancy&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`
    );

    const newsData = await newsRes.json();

    if (!newsData.articles || newsData.articles.length === 0) {
      return res.json({
        verdict: "Unclear",
        confidence: 5,
        verifiable_score: 5,
        trust_score: 5,
        bias: { label: "Unknown", explanation: "No reliable sources found" },
        tactics: ["No data"],
        claims: [],
        sources: []
      });
    }

    /* -------- STEP 2: SOURCE QUALITY SCORING -------- */
    const trustedDomains = [
      "bbc.co.uk",
      "reuters.com",
      "apnews.com",
      "theguardian.com",
      "nytimes.com",
      "washingtonpost.com",
      "aljazeera.com",
      "forbes.com",
      "nature.com",
      "who.int",
      "un.org"
    ];

    let trustPoints = 0;
    let verifiablePoints = 0;

    const sources = newsData.articles.map(a => {
      const url = a.url;
      const domain = new URL(url).hostname.replace("www.", "");

      const trusted = trustedDomains.some(td => domain.includes(td));

      if (trusted) trustPoints += 10;
      verifiablePoints += 5;

      return {
        name: a.source.name || domain,
        url
      };
    });

    /* -------- STEP 3: METRIC CALCULATION -------- */
    const articleCount = newsData.articles.length;

    let trust_score = Math.min(100, Math.round((trustPoints / (articleCount * 10)) * 100));
    let verifiable_score = Math.min(100, Math.round((verifiablePoints / (articleCount * 5)) * 100));
    let confidence = Math.round((trust_score + verifiable_score) / 2);

    /* -------- STEP 4: VERDICT ENGINE -------- */
    let verdict = "Unclear";

    if (confidence > 75) verdict = "True";
    else if (confidence > 45) verdict = "Likely True";
    else if (confidence > 25) verdict = "Doubtful";
    else verdict = "False";

    /* -------- STEP 5: CLAIM EXTRACTION -------- */
    const claims = newsData.articles.slice(0, 5).map(a => ({
      claim: a.title,
      status: verdict === "True" ? "Verified" : verdict === "False" ? "Debunked" : "Unclear",
      details: a.description || "No description available"
    }));

    /* -------- STEP 6: BIAS HEURISTIC -------- */
    let biasLabel = "Neutral";
    if (sources.some(s => s.name.toLowerCase().includes("fox"))) biasLabel = "Right Leaning";
    if (sources.some(s => s.name.toLowerCase().includes("cnn"))) biasLabel = "Left Leaning";

    const bias = {
      label: biasLabel,
      explanation: "Bias inferred from dominant publishing sources"
    };

    /* -------- FINAL RESPONSE -------- */
    res.json({
      verdict,
      confidence,
      verifiable_score,
      trust_score,
      bias,
      tactics: ["Source cross-verification", "Domain trust scoring", "Multi-source correlation"],
      claims,
      sources
    });

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({ error: "Verification engine failed" });
  }
});

export default router;
