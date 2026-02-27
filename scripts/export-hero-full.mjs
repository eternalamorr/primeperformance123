import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outDir = path.resolve("exports");
const outputPath = path.join(outDir, "hero-background-full.png");

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2560, height: 1440 } });

await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

await page.addStyleTag({
  content: `
    header, nav { display: none !important; }
    .hero-copy, .hero-actions, .hero-model { display: none !important; }
    .hero-ambient-glow { opacity: 0.95 !important; }
  `,
});

await page.waitForTimeout(1000);

await page.screenshot({ path: outputPath, fullPage: false });
await browser.close();

console.log(outputPath);
