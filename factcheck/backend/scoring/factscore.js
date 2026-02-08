// backend/logic/factscore.js

/*
Calculates reliability scores based on:
- source count
- trusted domains
- content consistency
- repetition across sources
*/

export function calculateFactScore(articles) {
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
  let consistencyPoints = 0;

  const titles = articles.map(a => a.title.toLowerCase());

  articles.forEach(a => {
    const url = a.url;
    const domain = new URL(url).hostname.replace("www.", "");

    // trusted domain scoring
    if (trustedDomains.some(td => domain.includes(td))) {
      trustPoints += 15;
    } else {
      trustPoints += 5;
    }

    // verifiable scoring
    if (a.author || a.source?.name) verifiablePoints += 5;
    if (a.publishedAt) verifiablePoints += 5;
  });

  // consistency scoring (topic overlap)
  for (let i = 0; i < titles.length; i++) {
    for (let j = i + 1; j < titles.length; j++) {
      const common = titles[i].split(" ").filter(w => titles[j].includes(w));
      if (common.length > 3) consistencyPoints += 3;
    }
  }

  const maxTrust = articles.length * 15;
  const maxVerifiable = articles.length * 10;
  const maxConsistency = articles.length * 5;

  let trust_score = Math.min(100, Math.round((trustPoints / maxTrust) * 100));
  let verifiable_score = Math.min(100, Math.round((verifiablePoints / maxVerifiable) * 100));
  let confidence = Math.min(
    100,
    Math.round((trust_score * 0.4 + verifiable_score * 0.4 + (consistencyPoints / maxConsistency) * 100 * 0.2))
  );

  return {
    trust_score,
    verifiable_score,
    confidence
  };
}
