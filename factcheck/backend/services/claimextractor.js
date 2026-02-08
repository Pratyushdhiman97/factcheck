// backend/logic/claimextractor.js

export function extractClaims(text) {
  if (!text || typeof text !== "string") return [];

  // Split by sentence logic
  const sentences = text
    .replace(/\n/g, " ")
    .split(/[.!?]/)
    .map(s => s.trim())
    .filter(s => s.length > 20); // ignore tiny junk

  const claimTriggers = [
    "is", "are", "was", "were",
    "has", "have", "had",
    "will", "shall",
    "caused", "leads to", "results in",
    "according to", "reported", "confirmed", "denied",
    "increased", "decreased", "killed", "arrested", "banned", "launched"
  ];

  const claims = [];

  for (const s of sentences) {
    const lower = s.toLowerCase();

    let score = 0;
    for (const t of claimTriggers) {
      if (lower.includes(t)) score++;
    }

    // Heuristic: factual structure detection
    const hasNumbers = /\d/.test(s);
    const hasEntities = /[A-Z][a-z]+/.test(s); // crude named entity detection

    if (score >= 1 && (hasNumbers || hasEntities)) {
      claims.push({
        claim: s,
        status: "Unverified",
        details: "Extracted as factual assertion"
      });
    }
  }

  return claims;
}
