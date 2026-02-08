// claim.js
// Claim object model + helpers

export class Claim {
  constructor(text, source = null) {
    this.id = crypto.randomUUID();
    this.text = text;
    this.source = source;
    this.status = "unverified"; // verified | debunked | unclear | unverified
    this.confidence = 0; // 0–1
    this.similarity = 0; // 0–1
    this.evidence = [];
  }
}

export function createClaims(sentences = [], source = null) {
  if (!Array.isArray(sentences)) return [];
  return sentences
    .map(s => s.trim())
    .filter(s => s.length > 10)
    .map(s => new Claim(s, source));
}

export function updateClaim(claim, data = {}) {
  if (!claim) return null;
  return {
    ...claim,
    ...data
  };
}

export function scoreClaim(claim, similarityScore = 0, sourceTrust = 0.5) {
  let confidence = (similarityScore * 0.6) + (sourceTrust * 0.4);

  let status = "unclear";
  if (confidence > 0.75) status = "verified";
  else if (confidence < 0.35) status = "debunked";

  return {
    ...claim,
    similarity: similarityScore,
    confidence: Number(confidence.toFixed(3)),
    status
  };
}
