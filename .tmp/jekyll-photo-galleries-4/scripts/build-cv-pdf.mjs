import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { marked } from "marked";
import puppeteer from "puppeteer";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const sourcePath = path.join(projectRoot, "CV", "download", "cv-download.md");
const stylesheetPath = path.join(projectRoot, "CV", "assets", "css", "CV", "pdf-resume.css");
const outputPath = path.join(projectRoot, "CV", "assets", "pdf", "szilvia-varga-cv.pdf");

function parseFrontmatter(rawContent) {
  if (!rawContent.startsWith("---\n")) {
    return {
      attributes: {},
      body: rawContent
    };
  }

  const closingIndex = rawContent.indexOf("\n---\n", 4);

  if (closingIndex === -1) {
    return {
      attributes: {},
      body: rawContent
    };
  }

  const attributes = {};
  const frontmatter = rawContent.slice(4, closingIndex);
  const body = rawContent.slice(closingIndex + 5);

  frontmatter.split("\n").forEach((line) => {
    const separatorIndex = line.indexOf(":");

    if (separatorIndex === -1) {
      return;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");

    if (key) {
      attributes[key] = value;
    }
  });

  return {
    attributes,
    body
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtmlDocument(title, bodyHtml, stylesheet) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <style>
${stylesheet}
    </style>
  </head>
  <body>
    <main class="pdf-resume-shell">
${bodyHtml}
    </main>
  </body>
</html>`;
}

async function main() {
  const markdown = await fs.readFile(sourcePath, "utf8");
  const stylesheet = await fs.readFile(stylesheetPath, "utf8");
  const { attributes, body } = parseFrontmatter(markdown);
  const title = attributes.title || "CV Download";
  const bodyHtml = marked.parse(body, {
    gfm: true,
    breaks: false
  });
  const html = buildHtmlDocument(title, bodyHtml, stylesheet);
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    puppeteer.executablePath();

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    pipe: true,
    timeout: 120000,
    protocolTimeout: 120000,
    args: [
      "--disable-dev-shm-usage",
      "--no-first-run",
      "--no-default-browser-check"
    ]
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0"
    });

    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true
    });
  } finally {
    await browser.close();
  }

  process.stdout.write(`Generated ${outputPath}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
