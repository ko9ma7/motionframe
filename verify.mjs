import { readFile, access } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const errors = [];

const required = [
  "index.html",
  "404.html",
  "assets/styles.css",
  "assets/app.js",
  "assets/demo/dashboard.svg",
  "assets/demo/detail.svg",
  "assets/demo/report.svg",
  "manifest.webmanifest",
  "service-worker.js",
  "favicon.svg",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512.png",
  "og-image.png",
  "repo-social-preview.png",
  "robots.txt",
  "sitemap.xml",
  ".github/workflows/deploy.yml",
  ".nojekyll",
  "README.md",
  "START-HERE.md",
];

for (const file of required) {
  try { await access(path.join(root, file)); }
  catch { errors.push(`Missing required file: ${file}`); }
}

const html = await readFile(path.join(root, "index.html"), "utf8");
const js = await readFile(path.join(root, "assets/app.js"), "utf8");
const css = await readFile(path.join(root, "assets/styles.css"), "utf8");
const workflow = await readFile(path.join(root, ".github/workflows/deploy.yml"), "utf8");

for (const marker of [
  'id="studio"',
  'id="sceneList"',
  'id="previewCanvas"',
  'id="inspectorForm"',
  'id="exportButton"',
  'id="mobileNavigation"',
]) {
  if (!html.includes(marker)) errors.push(`Required UI marker missing: ${marker}`);
}

for (const feature of [
  "getDisplayMedia",
  "captureStream",
  "MediaRecorder",
  "indexedDB",
  "localStorage",
  "exportWebM",
  "renderAtTime",
]) {
  if (!js.includes(feature)) errors.push(`Required implementation missing: ${feature}`);
}

for (const viewport of ["980px", "700px", "390px"]) {
  if (!css.includes(viewport)) errors.push(`Responsive breakpoint missing: ${viewport}`);
}

if (!css.includes("overflow-x: clip") && !css.includes("overflow-x: hidden")) {
  errors.push("Horizontal overflow guard missing");
}
if (!css.includes("prefers-reduced-motion")) errors.push("Reduced-motion styles missing");
if (!workflow.includes("actions/deploy-pages@v4")) errors.push("GitHub Pages deploy action missing");
if (!workflow.includes("actions/upload-pages-artifact@v4")) errors.push("Pages artifact upload action missing");
if (!workflow.includes("__SITE_URL__")) errors.push("Deployment URL token replacement missing");

for (const forbidden of ["Lorem ipsum", "TODO", "FIXME", "[여기에"]) {
  if (html.includes(forbidden) || js.includes(forbidden)) errors.push(`Placeholder remains: ${forbidden}`);
}

const manifest = JSON.parse(await readFile(path.join(root, "manifest.webmanifest"), "utf8"));
if (manifest.start_url !== "./" || manifest.scope !== "./") errors.push("Manifest path is not repository-subpath safe");

if (errors.length) {
  console.error("Verification failed:\n- " + errors.join("\n- "));
  process.exit(1);
}

console.log("Verification passed.");
console.log("Checked static files, functional browser APIs, responsive guards, PWA paths, and GitHub Pages deployment workflow.");
