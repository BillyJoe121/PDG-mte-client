import { gzipSync } from "node:zlib";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const assetsDirectory = join(process.cwd(), "dist", "assets");
const indexHtml = readFileSync(join(process.cwd(), "dist", "index.html"), "utf8");
const entryMatch = indexHtml.match(/<script[^>]+src="\/assets\/([^"]+\.js)"/);

if (!entryMatch) throw new Error("No se encontró el JavaScript de entrada en dist/index.html.");

const files = readdirSync(assetsDirectory);
const budgets = [
  { label: "JavaScript de entrada", file: entryMatch[1], maxGzipKb: 120 },
  { label: "CSS global", file: files.find((file) => /^index-.*\.css$/.test(file)), maxGzipKb: 50 },
  { label: "Gráficos diferidos", file: files.find((file) => /^DashboardCoverageChart-.*\.js$/.test(file)), maxGzipKb: 120 },
];

let failed = false;
for (const budget of budgets) {
  if (!budget.file) throw new Error(`No se encontró el artefacto para ${budget.label}.`);
  const gzipKb = gzipSync(readFileSync(join(assetsDirectory, budget.file))).byteLength / 1024;
  const passes = gzipKb <= budget.maxGzipKb;
  failed ||= !passes;
  console.log(`${passes ? "PASS" : "FAIL"} ${budget.label}: ${gzipKb.toFixed(2)} kB gzip / ${budget.maxGzipKb} kB`);
}

if (failed) process.exitCode = 1;
