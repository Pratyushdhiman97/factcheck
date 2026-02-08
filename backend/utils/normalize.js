// normalize.js

/**
 * Normalize text for NLP processing
 * - lowercases
 * - removes noise
 * - standardizes spacing
 * - keeps sentence structure
 */

export function normalizeText(text = "") {
  if (!text || typeof text !== "string") return "";

  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")        // remove urls
    .replace(/www\.\S+/g, "")              // remove www links
    .replace(/[^a-z0-9\s.,?!]/g, "")       // remove symbols
    .replace(/\s+/g, " ")                  // normalize spaces
    .replace(/\.+/g, ".")                  // normalize dots
    .replace(/\?+/g, "?")                  // normalize questions
    .replace(/!+/g, "!")                   // normalize exclamations
    .trim();
}

/**
 * Normalize numbers to scale (0–1)
 */
export function normalizeScore(value, min = 0, max = 100) {
  if (typeof value !== "number") return 0;
  if (max === min) return 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/**
 * Clamp value safely
 */
export function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Normalize array of scores
 */
export function normalizeArray(arr = []) {
  if (!Array.isArray(arr) || arr.length === 0) return [];

  const min = Math.min(...arr);
  const max = Math.max(...arr);

  return arr.map(v => normalizeScore(v, min, max));
}

/**
 * Clean sentences for matching/comparison
 */
export function normalizeForCompare(text = "") {
  return normalizeText(text)
    .replace(/[.,?!]/g, "")  // remove punctuation
    .trim();
}
