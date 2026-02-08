// backend/services/rumordetector.js

const RUMOR_KEYWORDS = [
  "allegedly",
  "unconfirmed",
  "rumor",
  "claims",
  "viral",
  "sources say",
  "reportedly",
  "speculation",
  "leaked",
  "insider",
  "anonymous"
];

export function detectRumor(newsArticles = []) {
  if (!newsArticles.length) return 0;

  let rumorHits = 0;
  let totalChecks = 0;

  for (const article of newsArticles) {
    const text = `${article.title} ${article.description} ${article.content}`.toLowerCase();

    for (const word of RUMOR_KEYWORDS) {
      totalChecks++;
      if (text.includes(word)) rumorHits++;
    }
  }

  const rawScore = rumorHits / Math.max(totalChecks, 1);

  // Rumor score = higher means more rumor-like
  const rumorScore = Math.min(Math.round(rawScore * 100), 100);

  return rumorScore;
}
