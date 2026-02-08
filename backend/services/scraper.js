// scraper.js
import axios from "axios";
import cheerio from "cheerio";

/**
 * Scrape article content from a news URL
 * Returns clean text + metadata
 */

export async function scrapeArticle(url) {
  try {
    const { data } = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);

    // Remove junk
    $("script, style, nav, footer, header, ads, iframe, noscript").remove();

    const title =
      $("meta[property='og:title']").attr("content") ||
      $("title").text() ||
      $("h1").first().text();

    const description =
      $("meta[name='description']").attr("content") ||
      $("meta[property='og:description']").attr("content") ||
      "";

    const author =
      $("meta[name='author']").attr("content") ||
      $(".author").first().text() ||
      "";

    const published =
      $("meta[property='article:published_time']").attr("content") ||
      $("time").attr("datetime") ||
      "";

    // Extract article text
    let content = "";

    $("p").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 40) content += text + " ";
    });

    content = content
      .replace(/\s+/g, " ")
      .replace(/\n+/g, " ")
      .trim();

    return {
      success: true,
      url,
      title: title.trim(),
      description: description.trim(),
      author: author.trim(),
      published,
      content,
      length: content.length,
    };
  } catch (err) {
    return {
      success: false,
      url,
      error: "SCRAPE_FAILED",
      message: err.message,
    };
  }
}

/**
 * Batch scrape multiple URLs
 */
export async function scrapeMultiple(urls = []) {
  const results = [];

  for (const url of urls) {
    const data = await scrapeArticle(url);
    results.push(data);
  }

  return results;
}

/**
 * Clean text for NLP processing
 */
export function cleanText(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s.?!]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
