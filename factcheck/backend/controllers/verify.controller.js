// verify.controller.js
// Main verification pipeline controller

import { fetchNews } from "../services/newsfetcher.js";
import { scrapeArticle } from "../services/scraper.js";
import { cleanText } from "../utils/textclean.js";
import { extractClaims } from "../nlp/claimextractor.js";
import { normalizeText } from "../utils/normalize.js";
import { similarity } from "../nlp/similarity.js";
import { matchFacts } from "../engine/factmatcher.js";
import { detectRumor } from "../engine/rumordetector.js";
import { detectBias } from "../engine/biasdetector.js";
import { factScore } from "../scores/factscore.js";
import { rumorScore } from "../scores/rumorscore.js";
import { sourceScore } from "../scores/sourcescore.js";
import { contradictionPenalty } from "../scores/contradictionpenalty.js";
import { finalScore } from "../scores/finalscore.js";

export async function verifyNews(req, res) {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query required" });
    }

    /* 1. Fetch news */
    const articles = await fetchNews(query);

    if (!articles.length) {
      return res.json({
        verdict: "Unclear",
        authenticity: 0.1,
        trust: 0.1,
        reason: "No reliable sources found",
        sources: [],
        claims: []
      });
    }

    let allClaims = [];
    let allSources = [];
    let factMatches = [];
    let contradictions = [];
    let rumorSignals = [];
    let biasSignals = [];

    /* 2. Process each article */
    for (const art of articles) {
      const raw = await scrapeArticle(art.url);
      const cleaned = cleanText(raw);
      const normalized = normalizeText(cleaned);

      const claims = extractClaims(normalized);
      allClaims.push(...claims);

      allSources.push({
        name: art.source,
        url: art.url
      });

      // fact matching
      const matches = await matchFacts(claims);
      factMatches.push(...matches);

      // rumor detection
      const rumor = detectRumor(normalized);
      rumorSignals.push(rumor);

      // bias detection
      const bias = detectBias(normalized);
      biasSignals.push(bias);

      // contradiction detection
      const contra = contradictionPenalty(claims);
      contradictions.push(contra);
    }

    /* 3. Scores */
    const fScore = factScore(factMatches);
    const rScore = rumorScore(rumorSignals);
    const sScore = sourceScore(allSources);
    const cPenalty = contradictionPenalty(allClaims);

    const final = finalScore({
      fact: fScore,
      rumor: rScore,
      source: sScore,
      contradiction: cPenalty
    });

    /* 4. Verdict logic */
    let verdict = "Unclear";
    if (final.authenticity > 0.75) verdict = "True";
    else if (final.authenticity < 0.35) verdict = "False";
    else verdict = "Developing";

    res.json({
      verdict,
      authenticity: final.authenticity,   // 0–1
      trust: final.trust,                  // 0–1
      confidence: final.confidence,        // 0–1
      reason: final.reason,
      bias: {
        label: biasSignals[0]?.label || "neutral",
        explanation: biasSignals[0]?.reason || ""
      },
      claims: allClaims.slice(0, 15),
      sources: allSources.slice(0, 10)
    });

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({
      error: "Verification failed",
      details: err.message
    });
  }
}
