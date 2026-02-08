// backend/logic/contradictionpenalty.js

/*
Purpose:
Detect contradictory claims across sources
Apply penalty to confidence, trust, and verifiable scores
*/

export function applyContradictionPenalty(claims, scores) {
  /*
  claims: [{ claim, status, details }]
  scores: { confidence, trust_score, verifiable_score }
  */

  let contradictionCount = 0;

  const normalized = claims.map(c => c.claim.toLowerCase());

  // Simple semantic contradiction detection (pattern-based)
  for (let i = 0; i < normalized.length; i++) {
    for (let j = i + 1; j < normalized.length; j++) {
      if (
        normalized[i].includes("not") && normalized[j].includes("is") ||
        normalized[i].includes("false") && normalized[j].includes("true") ||
        normalized[i].includes("denied") && normalized[j].includes("confirmed")
      ) {
        contradictionCount++;
      }
    }
  }

  // Penalty logic
  let penalty = contradictionCount * 7; // 7% per contradiction

  let confidence = Math.max(0, scores.confidence - penalty);
  let trust_score = Math.max(0, scores.trust_score - penalty);
  let verifiable_score = Math.max(0, scores.verifiable_score - penalty);

  return {
    confidence,
    trust_score,
    verifiable_score,
    contradictionCount,
    penaltyApplied: penalty
  };
}
