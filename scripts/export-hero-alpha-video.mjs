import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { chromium } from "playwright";

const BASE_URL = process.env.HERO_EXPORT_URL || "http://localhost:3000";
const FPS = Number(process.env.HERO_EXPORT_FPS || 24);
const DURATION = Number(process.env.HERO_EXPORT_DURATION || 3);
const WIDTH = Number(process.env.HERO_EXPORT_WIDTH || 1280);
const HEIGHT = Number(process.env.HERO_EXPORT_HEIGHT || 720);

const outDir = path.resolve("public", "videos");
const framesDir = path.resolve("exports", "hero-alpha-frames");
const webmPath = path.join(outDir, "hero-chair-alpha.webm");
const mp4Path = path.join(outDir, "hero-chair-fallback.mp4");
const posterPath = path.join(outDir, "hero-chair-poster.png");

fs.mkdirSync(outDir, { recursive: true });
fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });

const totalFrames = Math.max(1, Math.floor(FPS * DURATION));
const frameDelayMs = Math.max(1, Math.round(1000 / FPS));

const checkFfmpeg = () => {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
  } catch {
    throw new Error("ffmpeg is not installed. Install ffmpeg and retry.");
  }
};

const verifyTarget = async (url) => {
  const response = await fetch(url, { method: "GET" }).catch(() => null);
  if (!response || !response.ok) {
    throw new Error(
      `Cannot reach ${url}. Start the app first (pnpm dev or pnpm start), then retry.`
    );
  }
};

const exportFrames = async () => {
  await verifyTarget(BASE_URL);

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--use-angle=swiftshader",
      "--use-gl=angle",
    ],
  });
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });

  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 120000 });

  await page.addStyleTag({
    content: `
      html, body {
        background: transparent !important;
      }
      header, footer, nav, #webgl, .hero-copy, .hero-actions, .hero-ambient-glow, .grain {
        display: none !important;
      }
      .hero-model {
        opacity: 1 !important;
        pointer-events: auto !important;
        margin: 0 auto !important;
      }
    `,
  });

  await page.waitForSelector(".hero-model canvas", { timeout: 120000 });
  await page.waitForTimeout(600);

  const clip = await page.evaluate(() => {
    const canvas = document.querySelector(".hero-model canvas");
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, rect.x),
      y: Math.max(0, rect.y),
      width: Math.max(1, rect.width),
      height: Math.max(1, rect.height),
    };
  });

  if (!clip) {
    await browser.close();
    throw new Error("Hero canvas not found. Check that homepage renders the hero model.");
  }

  for (let i = 0; i < totalFrames; i += 1) {
    const framePath = path.join(framesDir, `frame-${String(i).padStart(4, "0")}.png`);
    await page.screenshot({
      path: framePath,
      clip,
      omitBackground: true,
    });
    await page.waitForTimeout(frameDelayMs);
  }

  await browser.close();
};

const encode = () => {
  const inputPattern = path.join(framesDir, "frame-%04d.png");

  execSync(
    `ffmpeg -y -framerate ${FPS} -i "${inputPattern}" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -b:v 0 -crf 30 "${webmPath}"`,
    { stdio: "inherit" }
  );

  execSync(
    `ffmpeg -y -framerate ${FPS} -i "${inputPattern}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart -crf 22 "${mp4Path}"`,
    { stdio: "inherit" }
  );

  execSync(`ffmpeg -y -i "${inputPattern.replace("%04d", "0000")}" -update 1 "${posterPath}"`, {
    stdio: "inherit",
  });
};

const run = async () => {
  checkFfmpeg();
  await exportFrames();
  encode();

  const webmSize = fs.statSync(webmPath).size;
  const mp4Size = fs.statSync(mp4Path).size;

  console.log(`Saved alpha video: ${webmPath} (${(webmSize / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`Saved fallback mp4: ${mp4Path} (${(mp4Size / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`Saved poster: ${posterPath}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
