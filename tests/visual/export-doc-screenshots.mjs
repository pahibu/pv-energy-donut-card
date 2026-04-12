import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";
import { docsScreenshotBackgrounds, docsScreenshotScenarios } from "./docs-scenarios.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outputRoot = path.join(repoRoot, "docs", "images");
const visualBaseDate = "2026-04-01T12:00:00.000Z";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png"
};

const serveFile = async (requestPath) => {
  const pathname = decodeURIComponent(new URL(requestPath, "http://127.0.0.1").pathname);
  const normalizedPath = path.normalize(path.join(repoRoot, pathname));

  if (!normalizedPath.startsWith(repoRoot)) {
    return { status: 403, body: Buffer.from("Forbidden"), contentType: "text/plain; charset=utf-8" };
  }

  try {
    const stat = await fs.stat(normalizedPath);
    const filePath = stat.isDirectory() ? path.join(normalizedPath, "index.html") : normalizedPath;
    const body = await fs.readFile(filePath);
    return {
      status: 200,
      body,
      contentType: contentTypes[path.extname(filePath).toLowerCase()] ?? "application/octet-stream"
    };
  } catch {
    return { status: 404, body: Buffer.from("Not found"), contentType: "text/plain; charset=utf-8" };
  }
};

const startServer = async () => {
  const server = http.createServer(async (request, response) => {
    const { status, body, contentType } = await serveFile(request.url ?? "/");
    response.writeHead(status, {
      "Content-Type": contentType,
      "Cache-Control": "no-store"
    });
    response.end(body);
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to resolve docs screenshot server address.");
  }

  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
};

const installFixedDate = async (page) => {
  await page.evaluateOnNewDocument((fixedIso) => {
    const fixedTime = new Date(fixedIso).getTime();
    const RealDate = Date;

    class MockDate extends RealDate {
      constructor(...args) {
        if (args.length === 0) {
          super(fixedTime);
          return;
        }

        super(...args);
      }

      static now() {
        return fixedTime;
      }
    }

    MockDate.parse = RealDate.parse;
    MockDate.UTC = RealDate.UTC;
    window.Date = MockDate;
  }, visualBaseDate);
};

for (const language of Object.keys(docsScreenshotScenarios)) {
  for (const background of Object.keys(docsScreenshotBackgrounds)) {
    await fs.mkdir(path.join(outputRoot, language, "screenshots", background), { recursive: true });
  }
}

const { server, baseUrl } = await startServer();
const launchArgs = process.env.CI ? ["--no-sandbox", "--disable-setuid-sandbox"] : [];
const browser = await puppeteer.launch({ headless: true, args: launchArgs });

try {
  for (const [language, scenarios] of Object.entries(docsScreenshotScenarios)) {
    for (const background of Object.keys(docsScreenshotBackgrounds)) {
      for (const [index, scenario] of scenarios.entries()) {
        const page = await browser.newPage();
        await page.setViewport(scenario.viewport);
        await page.emulateTimezone("UTC");
        await installFixedDate(page);
        await page.goto(
          `${baseUrl}/tests/visual/docs-card-harness.html?language=${encodeURIComponent(language)}&background=${encodeURIComponent(background)}&index=${String(index)}`,
          { waitUntil: "networkidle0" }
        );
        await page.waitForFunction(() => window.__PV_VISUAL_READY__ === true, {
          timeout: 15000
        });

        const target = await page.$("[data-visual-root]");
        if (!target) {
          throw new Error(`Could not find screenshot target for ${language}/${background}/${scenario.fileName}.`);
        }

        const outputPath = path.join(outputRoot, language, "screenshots", background, scenario.fileName);
        await target.screenshot({ path: outputPath });
        console.log(`WROTE: ${path.relative(repoRoot, outputPath)}`);
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}
