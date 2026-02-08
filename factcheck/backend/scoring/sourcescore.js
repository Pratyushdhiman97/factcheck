// backend/logic/sourcescore.js

export function calculateSourceScore(articles) {
  if (!articles || articles.length === 0) return 0;

  let credibilityScore = 0;
  let maxScore = 0;

  const trustedSources = [
    "bbc",
    "reuters",
    "ap",
    "associated press",
    "cnn",
    "nytimes",
    "the guardian",
    "washington post",
    "forbes",
    "economist",
    "al jazeera"
  ];

  const lowCredSources = [
    "facebook",
    "twitter",
    "telegram",
    "whatsapp",
    "blogspot",
    "reddit",
    "unknown",
    "youtube",
    "instagram"
  ];

  for (const article of articles) {
    let score = 1; // base score
    maxScore += 3;

    const sourceName = (article.source?.name || "").toLowerCase();

    // trusted media
    if (trustedSources.some(src => sourceName.includes(src))) {
      score = 3;
    }

    // unreliable platforms
    if (lowCredSources.some(src => sourceName.includes(src))) {
      score = 0.5;
    }

    // author presence
    if (article.author) {
      score += 0.5;
    }

    // published date validity
    if (article.publishedAt) {
      score += 0.5;
    }

    credibilityScore += score;
  }

  // normalize to 0–100
  let finalScore = (credibilityScore / maxScore) * 100;
  finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));

  return finalScore; // % trust based on sources
}
