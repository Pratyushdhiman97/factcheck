// backend/services/newsfetcher.js
import axios from "axios";

const NEWS_API_KEY = process.env.NEWS_API_KEY;

export async function fetchNews(query) {
  if (!query) return [];

  try {
    const res = await axios.get("https://newsapi.org/v2/everything", {
      params: {
        q: query,
        language: "en",
        sortBy: "relevancy",
        pageSize: 20,
        apiKey: NEWS_API_KEY
      }
    });

    if (!res.data.articles) return [];

    return res.data.articles.map(a => ({
      title: a.title,
      description: a.description,
      content: a.content || "",
      source: a.source?.name || "unknown",
      url: a.url,
      publishedAt: a.publishedAt
    }));

  } catch (err) {
    console.error("News fetch error:", err.message);
    return [];
  }
}
