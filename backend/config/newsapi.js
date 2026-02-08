// newsapi.js
// NewsAPI.org fetcher

import fetch from "node-fetch";

const NEWSAPI_KEY = process.env.NEWSAPI_KEY;

export async function fetchNewsAPI(query) {
  if (!NEWSAPI_KEY) {
    throw new Error("NEWSAPI_KEY not set");
  }

  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&pageSize=10&sortBy=relevancy&apiKey=${NEWSAPI_KEY}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`NewsAPI error: ${res.status}`);
  }

  const data = await res.json();

  return (data.articles || []).map(a => ({
    title: a.title,
    content: a.content || a.description || "",
    url: a.url,
    source: a.source?.name || "newsapi",
    publishedAt: a.publishedAt
  }));
}
