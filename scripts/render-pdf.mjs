import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const inputPath = path.resolve("presentation.md");
const htmlPath = path.resolve("presentation.html");
const outputPath = path.resolve("presentation.pdf");

const lines = fs.readFileSync(inputPath, "utf-8").split("\n");

const slides = [];
let current = [];
for (const line of lines) {
  if (line.startsWith("## ")) {
    if (current.length) slides.push(current);
    current = [line];
  } else {
    current.push(line);
  }
}
if (current.length) slides.push(current);

const htmlParts = [
  "<!doctype html>",
  "<html>",
  "<head>",
  "<meta charset='utf-8'>",
  "<style>",
  "@page { size: A4; margin: 20mm; }",
  "body { font-family: Helvetica, Arial, sans-serif; font-size: 12pt; color: #111; }",
  "h1 { font-size: 24pt; margin: 0 0 8mm 0; }",
  "h2 { font-size: 16pt; margin: 0 0 6mm 0; }",
  "p { margin: 0 0 4mm 0; line-height: 1.35; }",
  "ul { margin: 0 0 4mm 0; padding-left: 18pt; }",
  ".slide { page-break-after: always; }",
  ".muted { color: #444; }",
  "</style>",
  "</head>",
  "<body>",
];

if (lines.length && lines[0].startsWith("# ")) {
  const title = lines[0].slice(2).trim();
  let slogan = "";
  for (const l of lines) {
    if (l.startsWith("Слоган:")) {
      slogan = l.replace("Слоган:", "").trim();
      break;
    }
  }
  htmlParts.push("<div class='slide'>");
  htmlParts.push(`<h1>${title}</h1>`);
  if (slogan) htmlParts.push(`<p class='muted'>${slogan}</p>`);
  htmlParts.push("</div>");
}

for (const slide of slides) {
  const titleLine = slide[0]?.startsWith("## ") ? slide[0].slice(3).trim() : "Слайд";
  htmlParts.push("<div class='slide'>");
  htmlParts.push(`<h2>${titleLine}</h2>`);
  let inList = false;
  for (const line of slide.slice(1)) {
    if (line.startsWith("- ")) {
      if (!inList) {
        htmlParts.push("<ul>");
        inList = true;
      }
      htmlParts.push(`<li>${line.slice(2)}</li>`);
      continue;
    }
    if (inList) {
      htmlParts.push("</ul>");
      inList = false;
    }
    if (!line.trim()) continue;
    if (line.startsWith("**") && line.endsWith("**")) {
      htmlParts.push(`<p><strong>${line.replace(/^\*\*|\*\*$/g, "")}</strong></p>`);
    } else {
      htmlParts.push(`<p>${line}</p>`);
    }
  }
  if (inList) htmlParts.push("</ul>");
  htmlParts.push("</div>");
}

htmlParts.push("</body></html>");
fs.writeFileSync(htmlPath, htmlParts.join("\n"));

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
await page.pdf({ path: outputPath, format: "A4", printBackground: true });
await browser.close();

console.log(outputPath);
