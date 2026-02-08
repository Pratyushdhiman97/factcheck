// backend/logic/rumorscore.js

export function calculateRumorScore(articles) {
  if (!articles || articles.length === 0) return 0;

  let rumorSignals = 0;
  let totalSignals = 0;

  const rumorKeywords = [
    "allegedly",
    "unconfirmed",
    "rumor",
    "sources say",
    "insiders",
    "reportedly",
    "claims",
    "speculation",
    "viral post",
    "social media",
    "leak"
  ];

  for (const article of articles) {
    const text = `${article.title || ""} ${article.description || ""}`.toLowerCase();

    let localScore = 0;

    // keyword-based rumor detection
    for (const word of rumorKeywords) {
      if (text.includes(word)) {
        localScore += 1;
      }
    }

    // source credibility weight
    let sourceWeight = 1;
    if (article.source?.name) {
      const src = article.source.name.toLowerCase();

      if (src.includes("twitter") || src.includes("facebook") || src.includes("telegram")) {
        sourceWeight = 1.5; // social media → more rumor prone
      }
      if (src.includes("times") || src.includes("bbc") || src.includes("reuters")) {
        sourceWeight = 0.5; // verified media → less rumor
      }
    }

    rumorSignals += localScore * sourceWeight;
    totalSignals += rumorKeywords.length;
  }

  // normalize to 0–100
  let score = (rumorSignals / totalSignals) * 100;

  // clamp
  score = Math.max(0, Math.min(100, Math.round(score)));

  return score; // % probability of being rumor-driven
}
