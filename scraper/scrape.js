import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const SITES = [
  {
    name: "Vivid Seats",
    url: "https://www.vividseats.com/circoloco-tickets-brooklyn-brooklyn-storehouse-at-brooklyn-navy-yard-11-1-2025--concerts-dance-electronica/production/5949572?quantity=1",
    // Looks for "tickets start at $123" phrasing
    extract: (text) => {
      const m = text.match(/tickets start at\s*\$([\d,]+)/i);
      if (m) return parseInt(m[1].replace(/,/g, ""), 10);
      // fallback: grab the first dollar amount on the page
      const m2 = text.match(/\$\s*([\d,]+)\b/);
      if (m2) return parseInt(m2[1].replace(/,/g, ""), 10);
      return null;
    }
  },
  {
    name: "viagogo",
    url: "https://www.viagogo.com/Concert-Tickets/Dance-and-Electronic-Music/Circoloco-Ibiza-Tickets/E-159171757?backUrl=%2FConcert-Tickets%2FDance-and-Electronic-Music%2FCircoloco-Ibiza-Tickets&listingQty=1&quantity=1",
    // Looks for "Cheapest ... $163"
    extract: (text) => {
      const m = text.match(/Cheapest[^$]*\$\s*([\d,]+)/i);
      if (m) return parseInt(m[1].replace(/,/g, ""), 10);
      const m2 = text.match(/\bfrom\s*\$\s*([\d,]+)/i);
      if (m2) return parseInt(m2[1].replace(/,/g, ""), 10);
      const m3 = text.match(/\$\s*([\d,]+)\b/);
      if (m3) return parseInt(m3[1].replace(/,/g, ""), 10);
      return null;
    }
  },
  {
    name: "StubHub",
    url: "https://www.stubhub.com/circoloco-ibiza-new-york-tickets-11-1-2025/event/159171757/?backUrl=%2Fcircoloco-tickets%2Fperformer%2F727916&quantity=1",
    // Looks for "Cheapest ... $217"
    extract: (text) => {
      const m = text.match(/Cheapest[^$]*\$\s*([\d,]+)/i);
      if (m) return parseInt(m[1].replace(/,/g, ""), 10);
      const m2 = text.match(/\$\s*([\d,]+)\b/);
      if (m2) return parseInt(m2[1].replace(/,/g, ""), 10);
      return null;
    }
  }
];

function nowIso() {
  return new Date().toISOString();
}

async function scrapeAll() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
  });

  const results = [];

  for (const site of SITES) {
    const page = await context.newPage();
    let lowest = null;
    try {
      await page.goto(site.url, { waitUntil: "domcontentloaded", timeout: 60000 });
      // Let client-side content hydrate
      try { await page.waitForLoadState("networkidle", { timeout: 15000 }); } catch {}
      // Pull all visible text on the page
      const bodyText = await page.evaluate(() => document.body?.innerText || "");
      lowest = site.extract(bodyText);
    } catch (err) {
      console.error("Error scraping", site.name, err.message);
    }
    results.push({
      site: site.name,
      url: site.url,
      lowest,
    });
    await page.close();
  }

  await browser.close();

  // Build output
  const out = {
    currency: "USD",
    updatedAt: nowIso(),
    prices: results
  };

  // Write into web/public/data.json
  const outPath = path.resolve(process.cwd(), "../web/public/data.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf-8");

  console.log("Wrote", outPath);
}

scrapeAll();
