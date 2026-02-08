// textclean.js

/**
 * Cleans raw scraped/news text for processing
 */
export function cleanText(text = "") {
  if (!text) return "";

  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")        // remove URLs
    .replace(/[^a-z0-9\s]/g, " ")           // remove symbols
    .replace(/\s+/g, " ")                   // collapse spaces
    .trim();
}

/**
 * Sentence cleaner
 */
export function cleanSentence(sentence = "") {
  if (!sentence) return "";

  return sentence
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tokenizer
 */
export function tokenize(text = "") {
  return cleanText(text).split(" ").filter(Boolean);
}
