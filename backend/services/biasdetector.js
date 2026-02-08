// backend/logic/biasdetector.js

export function detectBias(text) {
  if (!text || typeof text !== "string") {
    return {
      label: "Unknown",
      score: 0,
      explanation: "No analyzable content"
    };
  }

  const t = text.toLowerCase();

  const emotionalWords = [
    "shocking","outrage","disaster","betrayal","crisis","panic","terrifying",
    "exposed","destroyed","corrupt","evil","brutal","chaos","collapse"
  ];

  const politicalLeft = [
    "progressive","liberal","leftist","social justice","woke","equity","diversity"
  ];

  const politicalRight = [
    "conservative","nationalist","patriot","right-wing","traditional values",
    "freedom fighters","anti-woke"
  ];

  const sensationalPhrases = [
    "you won’t believe","what happened next","truth behind","they don’t want you to know",
    "hidden truth","secret plan","exposed"
  ];

  let emotionScore = 0;
  let leftScore = 0;
  let rightScore = 0;
  let sensationalScore = 0;

  for (const w of emotionalWords) if (t.includes(w)) emotionScore++;
  for (const w of politicalLeft) if (t.includes(w)) leftScore++;
  for (const w of politicalRight) if (t.includes(w)) rightScore++;
  for (const w of sensationalPhrases) if (t.includes(w)) sensationalScore++;

  const totalBiasSignals = emotionScore + sensationalScore + leftScore + rightScore;

  let label = "Neutral";
  if (sensationalScore + emotionScore > 3) label = "Sensational";
  if (leftScore > rightScore + 1) label = "Left-leaning";
  if (rightScore > leftScore + 1) label = "Right-leaning";
  if (totalBiasSignals > 6) label = "Highly Biased";

  const biasStrength = Math.min(100, Math.round((totalBiasSignals / 10) * 100));

  let explanation = "Language appears mostly neutral.";
  if (label === "Sensational") explanation = "Emotionally loaded and clickbait-style language detected.";
  if (label === "Left-leaning") explanation = "Political framing aligns more with left-leaning narratives.";
  if (label === "Right-leaning") explanation = "Political framing aligns more with right-leaning narratives.";
  if (label === "Highly Biased") explanation = "Heavy emotional, political, and narrative manipulation detected.";

  return {
    label,
    score: biasStrength, // 0–100
    explanation
  };
}
