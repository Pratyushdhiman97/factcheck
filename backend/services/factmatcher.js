// backend/logic/factmatcher.js

export function matchFacts(claims, sources) {
  if (!Array.isArray(claims) || !Array.isArray(sources)) return [];

  const matchedFacts = [];

  for (const claimObj of claims) {
    const claimText = claimObj.claim.toLowerCase();
    let matches = 0;
    let total = 0;

    for (const src of sources) {
      const content = (src.content || "").toLowerCase();
      if (!content) continue;

      total++;

      // keyword overlap score
      const words = claimText.split(/\s+/).filter(w => w.length > 4);
      let hit = 0;

      for (const w of words) {
        if (content.includes(w)) hit++;
      }

      if (hit > 0) matches++;
    }

    let supportRatio = total === 0 ? 0 : matches / total;

    matchedFacts.push({
      claim: claimObj.claim,
      matches,
      totalSources: total,
      supportRatio,   // real computed value 0–1
      status:
        supportRatio > 0.6
          ? "supported"
          : supportRatio > 0.3
          ? "uncertain"
          : "unsupported"
    });
  }

  return matchedFacts;
}
