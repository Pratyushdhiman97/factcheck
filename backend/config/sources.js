// sources.js
// Source trust scoring + classification

const TRUSTED_SOURCES = [
  "reuters", "bbc", "associated press", "ap", "the hindu",
  "guardian", "nytimes", "washington post", "cnn", "al jazeera"
];

const QUESTIONABLE_SOURCES = [
  "blog", "telegram", "whatsapp", "facebook", "twitter", "x.com",
  "reddit", "youtube", "unknown"
];

export function evaluateSource(sourceName = "") {
  const s = sourceName.toLowerCase();

  if (TRUSTED_SOURCES.some(t => s.includes(t))) {
    return { score: 0.9, label: "trusted" };
  }

  if (QUESTIONABLE_SOURCES.some(q => s.includes(q))) {
    return { score: 0.3, label: "questionable" };
  }

  return { score: 0.6, label: "neutral" };
}

export function aggregateSources(sources = []) {
  if (!sources.length) {
    return { score: 0.2, label: "unknown" };
  }

  let total = 0;
  let trustedCount = 0;

  for (const src of sources) {
    const res = evaluateSource(src.name || src.source || "");
    total += res.score;
    if (res.label === "trusted") trustedCount++;
  }

  const avg = total / sources.length;

  let label = "mixed";
  if (avg > 0.75) label = "mostly trusted";
  else if (avg < 0.4) label = "mostly unreliable";

  return {
    score: Number(avg.toFixed(3)),
    label,
    trustedRatio: trustedCount / sources.length
  };
}
