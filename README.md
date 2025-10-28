# Ticket Price Dashboard (Viagogo, Vivid Seats, StubHub)

A tiny, free-to-host dashboard that **scrapes the lowest ticket price** for your Circoloco event from three sites and **auto-deploys to GitHub Pages** on a schedule.

- Scrapes using **Playwright** (headless Chromium) in GitHub Actions
- Builds a static React site with **Vite**
- Deploys to **GitHub Pages** every 30 minutes (cron)
- Shows the **current lowest price** per site and highlights the best

> ⚠️ **Important:** Respect each site's Terms of Use. This repo is for personal/educational use. Pages may change; selectors rely on visible text, not fragile CSS classes.

## One-click Setup

1. **Create a new _public_ GitHub repo** and upload these files.
2. Go to **Settings → Pages** and set:
   - **Source:** GitHub Actions
3. Go to **Actions** tab → enable workflows for this repo if prompted.
4. The `Scrape & Deploy Dashboard` workflow will run on push and then every 30 minutes.  
   You can also run it manually via **Actions → Scrape & Deploy Dashboard → Run workflow**.

After the first successful run, your dashboard will be live at:
```
https://<your-username>.github.io/<your-repo-name>/
```

## Local development (optional)

```bash
# Terminal 1: run scraper once (writes to web/public/data.json)
cd scraper
npm ci
npx playwright install --with-deps
npm run scrape

# Terminal 2: dev server
cd ../web
npm ci
npm run dev
# open http://localhost:5173
```

## Change the event / URLs

Open `scraper/scrape.js` and replace the three URLs in `SITES`. The extractors use resilient
regex on the visible text:
- **Vivid Seats:** looks for `tickets start at $XXX`
- **viagogo:** looks for `Cheapest ... $XXX`
- **StubHub:** looks for `Cheapest ... $XXX`

If a page fails to load or the phrase changes, the price will show as `—` until fixed in the extractor.

## Notes on reliability

- Headless browsers are used to allow client-side rendering to finish. We also wait for `networkidle` for up to 15s.
- We intentionally avoid brittle CSS selectors and prefer **visible text** regex.  
- If rate-limited, try increasing the schedule interval or add random delays.

## Disclaimer

Check and follow each site's terms before scraping. All trademarks and names belong to their owners.
This code is provided "as is" with no guarantees.
