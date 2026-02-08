// gnews.js
// GNews API fetcher

import fetch from "node-fetch";

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

export async function fetchGNews(query) {
  if (!GNEWS_API_KEY) {
    throw new Error("GNEWS_API_KEY not set");
  }

  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=10&apikey=${GNEWS_API_KEY}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`GNews API error: ${res.status}`);
  }

  const data = await res.json();

  return (data.articles || []).map(a => ({
    title: a.title,
    content: a.content || "",
    url: a.url,
    source: a.source?.name || "gnews",
    publishedAt: a.publishedAt
  }));
}
