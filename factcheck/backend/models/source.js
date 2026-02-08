// sources.js

export const TRUSTED_SOURCES = [
  {
    name: "Reuters",
    domain: "reuters.com",
    trust: 0.95,
    bias: "low"
  },
  {
    name: "Associated Press",
    domain: "apnews.com",
    trust: 0.95,
    bias: "low"
  },
  {
    name: "BBC",
    domain: "bbc.com",
    trust: 0.93,
    bias: "low"
  },
  {
    name: "The Guardian",
    domain: "theguardian.com",
    trust: 0.9,
    bias: "center-left"
  },
  {
    name: "The New York Times",
    domain: "nytimes.com",
    trust: 0.92,
    bias: "center-left"
  },
  {
    name: "Al Jazeera",
    domain: "aljazeera.com",
    trust: 0.88,
    bias: "center"
  },
  {
    name: "Washington Post",
    domain: "washingtonpost.com",
    trust: 0.9,
    bias: "center-left"
  }
];

export const RUMOR_SOURCES = [
  "twitter.com",
  "x.com",
  "tiktok.com",
  "facebook.com",
  "instagram.com",
  "reddit.com",
  "youtube.com",
  "whatsapp.com",
  "telegram.org"
];

export function classifySource(url = "") {
  const u = url.toLowerCase();

  const trusted = TRUSTED_SOURCES.find(s => u.includes(s.domain));
  if (trusted) {
    return {
      type: "trusted",
      trust: trusted.trust,
      bias: trusted.bias,
      name: trusted.name
    };
  }

  const rumor = RUMOR_SOURCES.find(d => u.includes(d));
  if (rumor) {
    return {
      type: "rumor",
      trust: 0.2,
      bias: "unknown",
      name: "Social Media"
    };
  }

  return {
    type: "unknown",
    trust: 0.5,
    bias: "unknown",
    name: "Unknown Source"
  };
}
