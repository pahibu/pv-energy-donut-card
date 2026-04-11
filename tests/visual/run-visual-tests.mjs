import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import puppeteer from "puppeteer";
import { visualScenarioNames, visualScenarios } from "./scenarios.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const testsRoot = path.resolve(repoRoot, "tests", "visual");
const goldenDir = path.join(testsRoot, "golden");
const actualDir = path.join(testsRoot, "actual");
const diffDir = path.join(testsRoot, "diff");
const updateSnapshots = process.argv.includes("--update");
const visualBaseDate = "2026-04-01T12:00:00.000Z";

const textEncoder = new TextEncoder();
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ts": "text/plain; charset=utf-8"
};

const ensureCleanDir = async (directoryPath) => {
  await fs.rm(directoryPath, { recursive: true, force: true });
  await fs.mkdir(directoryPath, { recursive: true });
};

const ensureDir = async (directoryPath) => {
  await fs.mkdir(directoryPath, { recursive: true });
};

const readPng = async (filePath) => PNG.sync.read(await fs.readFile(filePath));

const writePng = async (filePath, png) => {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, PNG.sync.write(png));
};

const serveFile = async (requestPath) => {
  const pathname = decodeURIComponent(new URL(requestPath, "http://127.0.0.1").pathname);
  const normalizedPath = path.normalize(path.join(repoRoot, pathname));

  if (!normalizedPath.startsWith(repoRoot)) {
    return {
      status: 403,
      body: textEncoder.encode("Forbidden"),
      contentType: "text/plain; charset=utf-8"
    };
  }

  try {
    const stat = await fs.stat(normalizedPath);
    const filePath = stat.isDirectory() ? path.join(normalizedPath, "index.html") : normalizedPath;
    const body = await fs.readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    return {
      status: 200,
      body,
      contentType: contentTypes[extension] ?? "application/octet-stream"
    };
  } catch {
    return {
      status: 404,
      body: textEncoder.encode("Not found"),
      contentType: "text/plain; charset=utf-8"
    };
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
    throw new Error("Failed to resolve local visual test server address.");
  }

  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`
  };
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

const compareSnapshot = async (scenarioName, actualPath) => {
  const goldenPath = path.join(goldenDir, `${scenarioName}.png`);
  const diffPath = path.join(diffDir, `${scenarioName}.png`);

  try {
    await fs.access(goldenPath);
  } catch {
    if (!updateSnapshots) {
      throw new Error(`Missing golden snapshot for "${scenarioName}". Run npm run test:visual:update to create it.`);
    }

    await fs.copyFile(actualPath, goldenPath);
    return {
      scenarioName,
      status: "created",
      diffPixels: 0
    };
  }

  if (updateSnapshots) {
    await fs.copyFile(actualPath, goldenPath);
    return {
      scenarioName,
      status: "updated",
      diffPixels: 0
    };
  }

  const actual = await readPng(actualPath);
  const expected = await readPng(goldenPath);

  if (actual.width !== expected.width || actual.height !== expected.height) {
    throw new Error(
      `Snapshot size mismatch for "${scenarioName}": got ${actual.width}x${actual.height}, expected ${expected.width}x${expected.height}.`
    );
  }

  const diff = new PNG({ width: actual.width, height: actual.height });
  const diffPixels = pixelmatch(actual.data, expected.data, diff.data, actual.width, actual.height, {
    threshold: 0.1
  });

  if (diffPixels > 0) {
    await writePng(diffPath, diff);
    return {
      scenarioName,
      status: "failed",
      diffPixels
    };
  }

  await fs.rm(diffPath, { force: true });
  return {
    scenarioName,
    status: "passed",
    diffPixels: 0
  };
};

const run = async () => {
  await ensureDir(goldenDir);
  await ensureCleanDir(actualDir);
  await ensureCleanDir(diffDir);

  const { server, baseUrl } = await startServer();
  const launchArgs = process.env.CI ? ["--no-sandbox", "--disable-setuid-sandbox"] : [];
  const browser = await puppeteer.launch({
    headless: true,
    args: launchArgs
  });

  const results = [];

  try {
    for (const scenarioName of visualScenarioNames) {
      const scenario = visualScenarios[scenarioName];
      const page = await browser.newPage();
      await page.setViewport(scenario.viewport);
      await page.emulateTimezone("UTC");
      await installFixedDate(page);
      const scenarioPage = scenario.page ?? "harness.html";
      await page.goto(`${baseUrl}/tests/visual/${scenarioPage}?scenario=${encodeURIComponent(scenarioName)}`, {
        waitUntil: "networkidle0"
      });
      await page.waitForFunction(() => window.__PV_VISUAL_READY__ === true, {
        timeout: 15000
      });

      const targetSelector = await page.evaluate(() => window.__PV_VISUAL_TARGET__ ?? "[data-visual-root]");
      const target = await page.$(targetSelector);
      if (!target) {
        throw new Error(`Could not find screenshot target "${targetSelector}" for scenario "${scenarioName}".`);
      }

      const actualPath = path.join(actualDir, `${scenarioName}.png`);
      await target.screenshot({ path: actualPath });
      results.push(await compareSnapshot(scenario.snapshotName, actualPath));
      await page.close();
    }
  } finally {
    await browser.close();
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }

  const created = results.filter((result) => result.status === "created");
  const updated = results.filter((result) => result.status === "updated");
  const failed = results.filter((result) => result.status === "failed");
  const passed = results.filter((result) => result.status === "passed");

  for (const result of results) {
    const suffix = result.diffPixels > 0 ? ` (${result.diffPixels} diff pixels)` : "";
    console.log(`${result.status.toUpperCase()}: ${result.scenarioName}${suffix}`);
  }

  console.log(
    `Visual test summary: ${passed.length} passed, ${failed.length} failed, ${created.length} created, ${updated.length} updated.`
  );

  if (failed.length > 0) {
    throw new Error(`Visual regression detected in ${failed.length} scenario(s). Review tests/visual/diff/.`);
  }
};

await run();
