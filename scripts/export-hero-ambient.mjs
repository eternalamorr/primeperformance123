import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outDir = path.resolve("exports");
const htmlPath = path.join(outDir, "hero-ambient-glow.html");
const pngPath = path.join(outDir, "hero-ambient-glow.png");

fs.mkdirSync(outDir, { recursive: true });

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #050508; }
  .frame { width: 100vw; height: 100vh; position: relative; overflow: hidden; background: #050508; }
  .hero-ambient-glow {
    position: absolute;
    inset: -12% -8% -24%;
    z-index: 1;
    background:
      radial-gradient(55% 45% at 22% 18%, rgba(0, 128, 221, 0.22), transparent 72%),
      radial-gradient(60% 50% at 78% 20%, rgba(255, 40, 71, 0.18), transparent 74%),
      radial-gradient(70% 60% at 50% 55%, rgba(255, 255, 255, 0.18), transparent 76%);
    filter: blur(46px) saturate(0.95) contrast(1.15);
    opacity: 0.85;
    mix-blend-mode: soft-light;
    transform: translateY(0);
  }
</style>
</head>
<body>
  <div class="frame">
    <div class="hero-ambient-glow"></div>
  </div>
</body>
</html>`;

fs.writeFileSync(htmlPath, html);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2560, height: 1440 } });
await page.goto(`file://${htmlPath}`, { waitUntil: "load" });
await page.screenshot({ path: pngPath, fullPage: true });
await browser.close();

console.log(pngPath);
