// reddis.js
// Reddit signal fetcher for rumor/news detection

import fetch from "node-fetch";

const REDDIT_ENDPOINT = "https://www.reddit.com/search.json";

export async function fetchReddit(query) {
  const url = `${REDDIT_ENDPOINT}?q=${encodeURIComponent(query)}&sort=relevance&limit=15`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "verifact/1.0"
    }
  });

  if (!res.ok) {
    throw new Error(`Reddit fetch error: ${res.status}`);
  }

  const data = await res.json();

  return (data.data?.children || []).map(p => ({
    title: p.data.title,
    text: p.data.selftext || "",
    url: `https://reddit.com${p.data.permalink}`,
    upvotes: p.data.ups || 0,
    comments: p.data.num_comments || 0,
    subreddit: p.data.subreddit,
    created: p.data.created_utc
  }));
}

/* ---------- Rumor Signal Extraction ---------- */

export function analyzeRedditSignals(posts = []) {
  if (!posts.length) {
    return {
      rumorScore: 0.5,
      signals: []
    };
  }

  let rumorIndicators = 0;
  let total = posts.length;

  const keywords = [
    "fake", "hoax", "scam", "rumor", "unverified",
    "not true", "false", "misinformation",
    "propaganda", "edited", "ai generated"
  ];

  const signals = [];

  for (const p of posts) {
    const text = `${p.title} ${p.text}`.toLowerCase();

    let hit = false;
    for (const k of keywords) {
      if (text.includes(k)) {
        rumorIndicators++;
        hit = true;
        signals.push({
          post: p.url,
          keyword: k
        });
        break;
      }
    }

    // low-quality rumor pattern
    if (p.upvotes < 5 && p.comments < 3) {
      rumorIndicators += 0.5;
    }
  }

  const score = rumorIndicators / total;

  return {
    rumorScore: Number(Math.min(score, 1).toFixed(3)),
    signals
  };
}
