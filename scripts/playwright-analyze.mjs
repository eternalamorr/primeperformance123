import fs from "node:fs";
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "https://vercel.com/shared-8867s-projects/v0-archive";
const maxPages = Number(process.env.PW_MAX_PAGES || 10);

const normalizeUrl = (url) => {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
};

const isSameOrigin = (url) => {
  try {
    return new URL(url).origin === new URL(baseUrl).origin;
  } catch {
    return false;
  }
};

const isNavigable = (url) => {
  if (!url) return false;
  if (url.startsWith("mailto:") || url.startsWith("tel:")) return false;
  if (url.startsWith("javascript:")) return false;
  return true;
};

const nowIso = () => new Date().toISOString();

const analyzePage = async (page, url) => {
  const consoleMessages = [];
  const pageErrors = [];
  const requestFailures = [];
  const badResponses = [];

  const consoleListener = (msg) => {
    const type = msg.type();
    if (type === "error" || type === "warning") {
      consoleMessages.push({ type, text: msg.text() });
    }
  };
  const pageErrorListener = (error) => {
    pageErrors.push({ message: error.message || String(error) });
  };
  const requestFailedListener = (request) => {
    requestFailures.push({ url: request.url(), method: request.method(), failure: request.failure()?.errorText || "unknown" });
  };
  const responseListener = (response) => {
    const status = response.status();
    if (status >= 400) {
      badResponses.push({ url: response.url(), status });
    }
  };

  page.on("console", consoleListener);
  page.on("pageerror", pageErrorListener);
  page.on("requestfailed", requestFailedListener);
  page.on("response", responseListener);

  const startedAt = nowIso();
  let ok = true;
  let status = null;
  let title = "";
  let error = null;

  try {
    const response = await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    status = response?.status() ?? null;
    title = await page.title();
  } catch (err) {
    ok = false;
    error = err?.message || String(err);
  }

  const finishedAt = nowIso();

  page.off("console", consoleListener);
  page.off("pageerror", pageErrorListener);
  page.off("requestfailed", requestFailedListener);
  page.off("response", responseListener);

  return {
    url,
    ok,
    status,
    title,
    startedAt,
    finishedAt,
    consoleMessages,
    pageErrors,
    requestFailures,
    badResponses,
  };
};

const run = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const visited = new Set();
  const queue = [baseUrl];
  const results = [];

  while (queue.length && results.length < maxPages) {
    const nextUrl = normalizeUrl(queue.shift());
    if (!nextUrl || visited.has(nextUrl)) continue;
    if (!isNavigable(nextUrl)) continue;
    if (!isSameOrigin(nextUrl)) continue;

    visited.add(nextUrl);
    const result = await analyzePage(page, nextUrl);
    results.push(result);

    if (results.length >= maxPages) break;

    const links = await page.evaluate(() => Array.from(document.querySelectorAll("a[href]")).map((a) => a.getAttribute("href")));
    for (const href of links) {
      if (!href) continue;
      const absolute = normalizeUrl(new URL(href, page.url()).toString());
      if (absolute && !visited.has(absolute) && isSameOrigin(absolute) && isNavigable(absolute)) {
        queue.push(absolute);
      }
    }
  }

  await browser.close();

  const report = {
    baseUrl,
    analyzedAt: nowIso(),
    maxPages,
    pagesAnalyzed: results.length,
    pages: results,
  };

  fs.writeFileSync("playwright-analysis.json", JSON.stringify(report, null, 2));
  console.log(`Saved report to playwright-analysis.json with ${results.length} page(s).`);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
