// backend/logic/finalscore.js

import { calculateFactScore } from "./factscore.js";
import { agreementScore } from "./agreement.js";
import { applyContradictionPenalty } from "./contradictionpenalty.js";

export function calculateFinalScore(articles) {
  if (!articles || articles.length === 0) {
    return {
      authenticity: 0,
      trust: 0,
      verdict: "No data",
      label: "Unverifiable"
    };
  }

  const fact = calculateFactScore(articles);
  const agreement = agreementScore(articles);
  const contradictionPenalty = applyContradictionPenalty(articles);

  // raw weighted score
  let rawScore =
    (fact.confidence * 0.5) +
    (agreement * 0.35) -
    (contradictionPenalty * 0.25);

  // clamp 0–100
  let finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  let verdict = "Unverified";
  let label = "Low reliability";

  if (finalScore >= 80) {
    verdict = "True";
    label = "Highly reliable";
  } else if (finalScore >= 60) {
    verdict = "Mostly true";
    label = "Reliable";
  } else if (finalScore >= 40) {
    verdict = "Uncertain";
    label = "Mixed signals";
  } else if (finalScore >= 20) {
    verdict = "Likely false";
    label = "Low trust";
  } else {
    verdict = "False";
    label = "Highly unreliable";
  }

  return {
    authenticity: finalScore,   // % truth probability
    trust: fact.trust_score,    // source trust %
    confidence: fact.confidence,
    agreement,
    contradictionPenalty,
    verdict,
    label
  };
}
