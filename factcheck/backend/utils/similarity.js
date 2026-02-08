// similarity.js

import { normalizeForCompare } from "./normalize.js";

/**
 * Jaccard similarity between two texts
 */
export function jaccardSimilarity(a = "", b = "") {
  const A = new Set(normalizeForCompare(a).split(" "));
  const B = new Set(normalizeForCompare(b).split(" "));

  if (A.size === 0 || B.size === 0) return 0;

  const intersection = [...A].filter(x => B.has(x)).length;
  const union = new Set([...A, ...B]).size;

  return intersection / union; // 0–1
}

/**
 * Cosine similarity (word vectors)
 */
export function cosineSimilarity(a = "", b = "") {
  const vecA = textToVector(a);
  const vecB = textToVector(b);

  const dot = dotProduct(vecA, vecB);
  const magA = magnitude(vecA);
  const magB = magnitude(vecB);

  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB); // 0–1
}

/**
 * Hybrid similarity score
 */
export function hybridSimilarity(a = "", b = "") {
  const j = jaccardSimilarity(a, b);
  const c = cosineSimilarity(a, b);

  return (j * 0.4) + (c * 0.6); // weighted real score
}

/* ---------- Internals ---------- */

function textToVector(text) {
  const words = normalizeForCompare(text).split(" ");
  const map = {};

  for (const w of words) {
    map[w] = (map[w] || 0) + 1;
  }

  return map;
}

function dotProduct(a, b) {
  let sum = 0;
  for (const k in a) {
    if (b[k]) sum += a[k] * b[k];
  }
  return sum;
}

function magnitude(vec) {
  return Math.sqrt(Object.values(vec).reduce((s, v) => s + v*v, 0));
}
