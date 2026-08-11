import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

type PackageJson = {
  description?: string;
  version?: string;
};

type ComponentManifest = {
  schemaVersion: number;
  release: string;
  scope: string;
  platforms: Array<{ id: string; label: string }>;
  components: Array<{
    id: string;
    name: string;
    category: string;
    introduced: string;
    evidence: Record<string, string>;
  }>;
};

export type PagesBuildResult = {
  files: string[];
};

type IconGlyphs = Record<string, string>;

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const githubPagesCustomDomain = "aurelglyph.absessive.com";
const iconCatalog = [
  "home",
  "dashboard",
  "user",
  "users",
  "bell",
  "mail",
  "calendar",
  "clock",
  "plus",
  "minus",
  "upload",
  "download",
  "attachment",
  "share",
  "send",
  "copy",
  "save",
  "lock",
  "unlock",
  "shield",
  "eye",
  "eye-off",
  "search",
  "filter",
  "sort",
  "menu",
  "more-horizontal",
  "more-vertical",
  "settings",
  "edit",
  "delete",
  "close",
  "back",
  "forward",
  "chevron-down",
  "chevron-up",
  "external-link",
  "refresh",
  "sync",
  "check",
  "warning",
  "info",
  "success",
  "cloud",
  "database",
  "server",
  "terminal",
  "code",
  "archive",
  "star",
  "heart",
  "bookmark",
  "tag",
  "map-pin",
  "location",
  "phone",
  "message",
  "chat",
  "grid",
  "list",
  "columns",
  "table",
  "layout",
  "panel",
  "sidebar",
  "command",
  "package",
  "cube",
  "layers",
  "workflow",
  "branch",
  "git-branch",
  "link",
  "unlink",
  "log-in",
  "log-out",
  "power",
  "play",
  "pause",
  "stop",
  "record",
  "microphone",
  "camera",
  "video",
  "image",
  "music",
  "volume",
  "mute",
  "wallet",
  "credit-card",
  "cart",
  "receipt",
  "chart-line",
  "chart-bar",
  "activity",
  "spark",
  "bolt",
  "target",
  "compass",
  "thumbs-up",
  "thumbs-down",
  "help",
  "notification",
  "expand",
  "contract"
];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fallbackIconGlyph(name: string): string {
  const seed = [...name].reduce((total, character) => total + character.charCodeAt(0), 0);
  const x = 5 + (seed % 5);
  const y = 5 + (seed % 7);

  return `M4 12h16M12 4v16M${x} ${y}h.01`;
}

async function loadIconGlyphs(root: string): Promise<IconGlyphs> {
  const iconSourcePath = join(root, "packages", "react", "src", "components", "Icon.tsx");

  try {
    const source = await readFile(iconSourcePath, "utf8");
    const glyphBlock = /const glyphs:[\s\S]*?=\s*\{([\s\S]*?)\n\};/u.exec(source)?.[1];

    if (!glyphBlock) {
      throw new Error("Could not locate React icon glyph map.");
    }

    const glyphs: IconGlyphs = {};
    const entryPattern = /^\s*(?:"([^"]+)"|([A-Za-z][A-Za-z0-9_-]*)):\s*"([^"]+)",?/gmu;
    let entry: RegExpExecArray | null;

    while ((entry = entryPattern.exec(glyphBlock)) !== null) {
      glyphs[entry[1] ?? entry[2]] = entry[3];
    }

    const missing = iconCatalog.filter((name) => !glyphs[name]);
    if (missing.length > 0) {
      throw new Error(`Missing React icon glyphs for: ${missing.join(", ")}`);
    }

    return glyphs;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    return Object.fromEntries(iconCatalog.map((name) => [name, fallbackIconGlyph(name)]));
  }
}

function renderStaticIcon(name: string, glyphs: IconGlyphs): string {
  return `<span class="ag-demo-icon-symbol" aria-hidden="true" data-icon-name="${escapeHtml(name)}"><svg focusable="false" viewBox="0 0 24 24"><path d="${escapeHtml(glyphs[name])}" /></svg></span>`;
}

function renderInlineMarkdown(value: string): string {
  const escaped = escapeHtml(value);
  return escaped.replace(/`([^`]+)`/g, "<code>$1</code>");
}

function renderMarkdown(markdown: string): string {
  const lines = markdown.trim().split(/\r?\n/u);
  const html: string[] = [];
  let inList = false;

  const closeList = (): void => {
    if (!inList) return;
    html.push("</ul>");
    inList = false;
  };

  for (const line of lines) {
    if (line.trim() === "") {
      closeList();
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/u.exec(line);
    if (heading) {
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const listItem = /^-\s+(.+)$/u.exec(line);
    if (listItem) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${renderInlineMarkdown(listItem[1])}</li>`);
      continue;
    }

    if (inList && /^\s{2,}\S/u.test(line)) {
      const previous = html.at(-1);
      if (previous?.startsWith("<li>") && previous.endsWith("</li>")) {
        html[html.length - 1] = previous.replace("</li>", ` ${renderInlineMarkdown(line.trim())}</li>`);
        continue;
      }
    }

    closeList();
    html.push(`<p>${renderInlineMarkdown(line)}</p>`);
  }

  closeList();
  return html.join("\n");
}

function pageShell(title: string, body: string, active = "index"): string {
  const navItems = [
    ["index", "index.html", "Overview"],
    ["usage", "usage.html", "Usage"],
    ["components", "components.html", "Components"],
    ["changelog", "changelog.html", "Changelog"]
  ];
  const accessibleBody = body.replaceAll("<pre><code>", '<pre aria-label="Code example" tabindex="0"><code>');

  return `<!doctype html>
<html lang="en" data-mode="dark" data-theme="royal-purple">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="color-scheme" content="dark light">
  <script>
    (() => {
      try {
        const storedMode = localStorage.getItem("aurelglyph-mode");
        const preferredMode = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
        document.documentElement.dataset.mode = storedMode === "light" || storedMode === "dark" ? storedMode : preferredMode;
      } catch {}
    })();
  </script>
  <style>
    @font-face {
      font-family: "Libre Baskerville";
      src: url("./assets/fonts/ofl/libre-baskerville-400.woff2") format("woff2");
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: "Libre Baskerville";
      src: url("./assets/fonts/ofl/libre-baskerville-700.woff2") format("woff2");
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: "Atkinson Hyperlegible";
      src: url("./assets/fonts/ofl/atkinson-hyperlegible-400.woff2") format("woff2");
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: "Atkinson Hyperlegible";
      src: url("./assets/fonts/ofl/atkinson-hyperlegible-700.woff2") format("woff2");
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: "Space Mono";
      src: url("./assets/fonts/ofl/space-mono-400.woff2") format("woff2");
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: "Space Mono";
      src: url("./assets/fonts/ofl/space-mono-700.woff2") format("woff2");
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }

    :root {
      color-scheme: dark light;
      --font-display: "Libre Baskerville", Georgia, serif;
      --font-ui: "Atkinson Hyperlegible", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --font-mono: "Space Mono", "SFMono-Regular", Consolas, monospace;
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 18px;
      --radius-panel: 28px;
      --shadow-panel: 0 18px 60px var(--color-shadow);
      --shadow-inset: inset 0 1px 0 var(--color-highlight);
      --duration-base: 220ms;
      --ease-standard: cubic-bezier(0.2, 0.8, 0.2, 1);
      --color-on-accent: #e7dfd1;
    }

    :root[data-mode="dark"] {
      color-scheme: dark;
      --color-bg: #0d0d0b;
      --color-bg-elevated: #12120f;
      --color-surface: #171714;
      --color-surface-2: #1f1e1a;
      --color-border: #34312b;
      --color-border-soft: rgba(231, 223, 209, 0.10);
      --color-text: #e7dfd1;
      --color-text-muted: #a59b8b;
      --color-text-readable-muted: var(--color-text-muted);
      --color-text-subtle: #6e685e;
      --color-shadow: rgba(0, 0, 0, 0.55);
      --color-highlight: rgba(255, 255, 255, 0.06);
      --color-grid-line: rgba(231, 223, 209, 0.035);
      --color-grid-line-soft: rgba(231, 223, 209, 0.025);
      --color-frame-line: rgba(231, 223, 209, 0.06);
      --color-code-bg: rgba(0, 0, 0, 0.18);
      --color-accent-ink: var(--accent-100);
      --color-accent-ink-muted: var(--accent-200);
      --color-focus: var(--accent-200);
    }

    :root[data-mode="light"] {
      color-scheme: light;
      --color-bg: #ece4d8;
      --color-bg-elevated: #f3ecdf;
      --color-surface: #e2d8ca;
      --color-surface-2: #d8ccb9;
      --color-border: #b9a993;
      --color-border-soft: rgba(42, 36, 30, 0.14);
      --color-text: #2a241e;
      --color-text-muted: #64594c;
      --color-text-readable-muted: #584d41;
      --color-text-subtle: #8c7e6c;
      --color-shadow: rgba(42, 36, 30, 0.18);
      --color-highlight: rgba(255, 255, 255, 0.45);
      --color-grid-line: rgba(42, 36, 30, 0.055);
      --color-grid-line-soft: rgba(42, 36, 30, 0.04);
      --color-frame-line: rgba(42, 36, 30, 0.08);
      --color-code-bg: rgba(42, 36, 30, 0.08);
      --color-accent-ink: var(--accent-500);
      --color-accent-ink-muted: var(--accent-500);
      --color-focus: var(--accent-500);
    }

    :root[data-theme="royal-purple"] {
      --accent-100: #d8c0ff;
      --accent-200: #b88cff;
      --accent-300: #9358e8;
      --accent-400: #7a3fd1;
      --accent-500: #562a93;
      --accent-600: #2d174f;
      --accent-rgb: 147, 88, 232;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      background:
        linear-gradient(var(--color-grid-line) 1px, transparent 1px),
        linear-gradient(90deg, var(--color-grid-line-soft) 1px, transparent 1px),
        var(--color-bg);
      background-size: 44px 44px;
      color: var(--color-text);
      font-family: var(--font-ui);
    }

    a {
      color: var(--color-accent-ink);
      text-decoration-color: rgba(var(--accent-rgb), 0.45);
      text-underline-offset: 0.22em;
    }

    a:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 4px;
      border-radius: var(--radius-sm);
    }

    .page {
      width: min(1040px, calc(100% - 32px));
      margin: 0 auto;
      padding: 32px 0 56px;
    }

    .rail {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      padding: 14px 0 28px;
      color: var(--color-text-readable-muted);
      font-size: 0.8rem;
    }

    .brand {
      color: var(--color-text);
      font-family: var(--font-display);
      font-size: 1.45rem;
    }

    .dot {
      display: inline-block;
      width: 0.45rem;
      height: 0.45rem;
      margin-left: 0.12rem;
      border-radius: 999px;
      background: var(--accent-300);
      box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.42);
    }

    nav {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      font-family: var(--font-mono);
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .rail nav a {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      padding: 0 8px;
    }

    .rail-controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
      gap: 14px;
    }

    .mode-toggle {
      min-height: 44px;
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-sm);
      padding: 0 11px;
      color: var(--color-text);
      background: var(--color-surface);
      box-shadow: var(--shadow-inset);
      cursor: pointer;
      font: 0.72rem/1 var(--font-mono);
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .mode-toggle:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 3px;
    }

    nav a[aria-current="page"] {
      color: var(--color-text);
      text-decoration-color: var(--accent-300);
    }

    .hero,
    .panel {
      position: relative;
      overflow: hidden;
      background: linear-gradient(180deg, var(--color-surface), var(--color-bg-elevated));
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-panel);
      box-shadow: var(--shadow-panel), var(--shadow-inset);
    }

    .hero {
      padding: clamp(32px, 7vw, 76px);
    }

    .panel {
      margin-top: 22px;
      padding: clamp(24px, 5vw, 48px);
    }

    .hero::before,
    .panel::before {
      content: "";
      position: absolute;
      inset: 16px;
      border: 1px solid var(--color-frame-line);
      border-radius: calc(var(--radius-panel) - 10px);
      pointer-events: none;
    }

    .eyebrow {
      color: var(--color-accent-ink-muted);
      font-family: var(--font-mono);
      font-size: 0.74rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    h1,
    h2,
    h3 {
      margin: 0;
      color: var(--color-text);
      font-family: var(--font-display);
      font-weight: 400;
      line-height: 0.98;
    }

    h1 {
      max-width: 760px;
      margin-top: 18px;
      font-size: clamp(3rem, 8vw, 6rem);
    }

    h2 {
      margin-top: 28px;
      padding-top: 26px;
      border-top: 1px solid var(--color-border-soft);
      font-size: clamp(2rem, 5vw, 3.25rem);
    }

    h3 {
      margin-top: 24px;
      font-size: 1.45rem;
    }

    p,
    li {
      max-width: 760px;
      color: var(--color-text-readable-muted);
      font-size: 1rem;
      line-height: 1.7;
    }

    .lead {
      margin: 24px 0 0;
      font-size: 1.12rem;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 30px;
    }

    .button {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      padding: 0 16px;
      border: 1px solid rgba(var(--accent-rgb), 0.42);
      border-radius: var(--radius-sm);
      background: rgba(var(--accent-rgb), 0.16);
      box-shadow: var(--shadow-inset);
      color: var(--color-text);
      font-family: var(--font-mono);
      font-size: 0.76rem;
      letter-spacing: 0.08em;
      text-decoration: none;
      text-transform: uppercase;
    }

    .meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-top: 22px;
    }

    .metric {
      padding: 16px;
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-lg);
      background: var(--color-surface-2);
      font-family: var(--font-mono);
      font-size: 0.78rem;
      color: var(--color-text);
    }

    .metric strong {
      display: block;
      margin-top: 8px;
      color: var(--color-text);
      font-family: var(--font-ui);
      font-size: 1rem;
      font-weight: 500;
    }

    .catalog {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
      margin-top: 24px;
    }

    .catalog-card {
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-lg);
      padding: 18px;
      background: var(--color-surface-2);
      box-shadow: var(--shadow-inset);
    }

    .catalog-card h3 {
      margin-top: 0;
      font-family: var(--font-ui);
      font-size: 1rem;
      font-weight: 600;
    }

    .catalog-card ul {
      display: grid;
      gap: 8px;
      margin: 14px 0 0;
      padding: 0;
      list-style: none;
    }

    .catalog-card li {
      max-width: none;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      line-height: 1.4;
    }

    .support-matrix-wrap {
      max-width: 100%;
      margin-top: 24px;
      overflow-x: auto;
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-lg);
      background: var(--color-surface-2);
      box-shadow: var(--shadow-inset);
    }

    .support-matrix {
      width: 100%;
      min-width: 760px;
      border-collapse: collapse;
    }

    .support-matrix th,
    .support-matrix td {
      border-bottom: 1px solid var(--color-border-soft);
      padding: 12px 14px;
      text-align: start;
      vertical-align: middle;
    }

    .support-matrix th {
      color: var(--color-text-readable-muted);
      font: 0.72rem/1.35 var(--font-mono);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .support-matrix tbody tr:last-child td {
      border-bottom: 0;
    }

    .support-matrix td {
      color: var(--color-text);
      font-size: 0.9rem;
    }

    .support-matrix td:not(:first-child) {
      color: var(--color-accent-ink-muted);
      font: 0.72rem/1.35 var(--font-mono);
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .support-matrix__category {
      display: block;
      margin-top: 3px;
      color: var(--color-text-readable-muted);
      font: 0.72rem/1.35 var(--font-mono);
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .markdown h1:first-child {
      margin-top: 0;
      font-size: clamp(2.6rem, 7vw, 5rem);
    }

    .markdown ul {
      margin: 18px 0 0;
      padding-left: 1.15rem;
    }

    code {
      padding: 0.1rem 0.28rem;
      border: 1px solid var(--color-border-soft);
      border-radius: 6px;
      background: var(--color-code-bg);
      color: var(--color-accent-ink);
      font-family: var(--font-mono);
      font-size: 0.9em;
    }

    pre {
      max-width: 100%;
      margin: 18px 0 0;
      overflow-x: auto;
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-sm);
      padding: 16px;
      background: var(--color-code-bg);
      scrollbar-color: var(--color-border) transparent;
    }

    pre code {
      border: 0;
      padding: 0;
      background: transparent;
      font-size: 0.82rem;
      line-height: 1.65;
      white-space: pre;
    }

    .preview-stack {
      display: grid;
      gap: 18px;
      margin-top: 24px;
    }

    .preview-card {
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-lg);
      padding: 18px;
      background: var(--color-surface-2);
      box-shadow: var(--shadow-inset);
    }

    .preview-card h3 {
      margin: 0 0 14px;
      font-family: var(--font-ui);
      font-size: 1rem;
      font-weight: 600;
    }

    .ag-demo-mobile {
      overflow: hidden;
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-panel);
      background: var(--color-bg);
      box-shadow: var(--shadow-inset);
    }

    .ag-demo-topbar,
    .ag-demo-tabbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      background: linear-gradient(180deg, var(--color-surface), var(--color-bg-elevated));
      border-bottom: 1px solid var(--color-border-soft);
    }

    .ag-demo-topbar strong {
      display: block;
      font-family: var(--font-display);
      font-size: 1.35rem;
      font-weight: 400;
    }

    .ag-demo-topbar small,
    .ag-demo-row small {
      color: var(--color-text-readable-muted);
    }

    .ag-demo-mobile-body {
      display: grid;
      gap: 12px;
      padding: 14px;
    }

    .ag-demo-search {
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-md);
      padding: 12px;
      color: var(--color-text-readable-muted);
      background: var(--color-bg-elevated);
    }

    .ag-demo-card,
    .ag-demo-list {
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-lg);
      background: linear-gradient(180deg, var(--color-surface), var(--color-bg-elevated));
      box-shadow: var(--shadow-inset);
    }

    .ag-demo-card {
      padding: 16px;
    }

    .ag-demo-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      padding: 14px;
      border-top: 1px solid var(--color-border-soft);
    }

    .ag-demo-row:first-child {
      border-top: 0;
    }

    .ag-demo-switch {
      width: 44px;
      height: 26px;
      border-radius: 999px;
      background: var(--accent-300);
    }

    .ag-demo-tabbar {
      border-top: 1px solid var(--color-border-soft);
      border-bottom: 0;
      justify-content: space-around;
      color: var(--color-text-readable-muted);
      font-family: var(--font-mono);
      font-size: 0.7rem;
      text-transform: uppercase;
    }

    .preview-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
    }

    .ag-badge {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      border: 1px solid rgba(var(--accent-rgb), 0.34);
      border-radius: 999px;
      padding: 4px 10px;
      color: var(--color-text);
      background: rgba(var(--accent-rgb), 0.16);
      font-family: var(--font-mono);
      font-size: 0.7rem;
      text-transform: uppercase;
    }

    .ag-avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border: 1px solid rgba(var(--accent-rgb), 0.36);
      border-radius: 50%;
      color: var(--color-text);
      background: rgba(var(--accent-rgb), 0.16);
      font-family: var(--font-mono);
    }

    .ag-alert {
      display: flex;
      min-width: min(100%, 18rem);
      align-items: flex-start;
      gap: 10px;
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-md);
      padding: 12px;
      color: var(--color-text);
      background: var(--color-bg-elevated);
    }

    .ag-alert__dot {
      width: 8px;
      height: 8px;
      margin-top: 6px;
      border-radius: 50%;
      background: #7fad68;
    }

    .ag-alert__content,
    .ag-alert__body {
      display: block;
      min-width: 0;
    }

    .ag-alert__body {
      margin-top: 2px;
      color: var(--color-text-readable-muted);
      font-size: 0.85rem;
    }

    .ag-segmented {
      display: flex;
      max-width: 100%;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 14px;
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-sm);
      padding: 4px;
      background: var(--color-bg-elevated);
    }

    .ag-segmented__item {
      min-width: 0;
      min-height: 44px;
      flex: 1 1 7rem;
      border: 0;
      border-radius: 6px;
      padding: 0 12px;
      color: var(--color-text);
      background: transparent;
      font: 0.75rem/1 var(--font-mono);
    }

    .ag-segmented__item.is-active {
      background: rgba(var(--accent-rgb), 0.18);
      box-shadow: var(--shadow-inset);
    }

    .ag-metric {
      display: grid;
      gap: 4px;
      width: min(100%, 18rem);
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-md);
      padding: 14px;
      background: var(--color-bg-elevated);
    }

    .ag-metric__label,
    .ag-metric__value {
      margin: 0;
    }

    .ag-metric__label,
    .ag-metric__delta {
      color: var(--color-text-readable-muted);
      font-family: var(--font-mono);
      font-size: 0.72rem;
    }

    .ag-metric__value {
      color: var(--color-text);
      font-family: var(--font-display);
      font-size: 1.8rem;
      font-weight: 400;
    }

    .ag-progress {
      overflow: hidden;
      width: min(100%, 18rem);
      height: 10px;
      margin-top: 12px;
      border-radius: 999px;
      background: var(--color-border-soft);
    }

    .ag-progress__bar {
      display: block;
      height: 100%;
      background: var(--accent-300);
    }

    .ag-command-palette {
      display: grid;
      width: min(100%, 30rem);
      max-width: 100%;
      gap: 8px;
      margin-top: 14px;
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-md);
      padding: 10px;
      background: var(--color-bg-elevated);
    }

    .ag-command-palette__search {
      display: grid;
      gap: 6px;
    }

    .ag-command-palette__label {
      color: var(--color-text-readable-muted);
      font-family: var(--font-mono);
      font-size: 0.72rem;
      text-transform: uppercase;
    }

    .ag-command-palette__input,
    .ag-command-palette__item {
      width: 100%;
      min-width: 0;
      min-height: 44px;
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-sm);
      color: var(--color-text);
      background: var(--color-surface);
      font: inherit;
    }

    .ag-command-palette__input {
      padding: 0 12px;
    }

    .ag-command-palette__list {
      min-width: 0;
    }

    .ag-command-palette__item {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      text-align: left;
    }

    .ag-command-palette__item-label {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .ag-command-palette__shortcut {
      color: var(--color-text-readable-muted);
      font-family: var(--font-mono);
      font-size: 0.7rem;
    }

    .ag-demo-button,
    .ag-demo-tab {
      display: inline-flex;
      align-items: center;
      min-height: 40px;
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-sm);
      padding: 0 14px;
      color: var(--color-text);
      background: linear-gradient(180deg, var(--color-surface), var(--color-bg-elevated));
      box-shadow: var(--shadow-inset);
      font-family: var(--font-mono);
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .ag-demo-button.primary {
      border-color: var(--accent-400);
      background: linear-gradient(180deg, var(--accent-500), var(--accent-600));
      color: var(--color-on-accent);
    }

    .ag-demo-input,
    .ag-demo-textarea {
      width: min(100%, 360px);
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-sm);
      padding: 12px;
      color: var(--color-text);
      background: var(--color-bg-elevated);
      font: inherit;
    }

    .ag-demo-textarea {
      min-height: 80px;
    }

    .ag-demo-upload,
    .ag-demo-alert,
    .ag-demo-content-card {
      border: 1px solid rgba(var(--accent-rgb), 0.32);
      border-radius: var(--radius-lg);
      padding: 16px;
      background: rgba(var(--accent-rgb), 0.1);
      color: var(--color-text-readable-muted);
    }

    .ag-demo-disclosure {
      overflow: hidden;
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-lg);
      background: linear-gradient(180deg, var(--color-surface), var(--color-bg-elevated));
      box-shadow: var(--shadow-inset);
    }

    .ag-demo-disclosure summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem;
      cursor: pointer;
      list-style: none;
    }

    .ag-demo-disclosure summary::-webkit-details-marker {
      display: none;
    }

    .ag-demo-disclosure summary::after {
      color: var(--color-accent-ink-muted);
      content: "+";
      transition: transform var(--duration-base) var(--ease-standard);
    }

    .ag-demo-disclosure[open] summary::after {
      content: "-";
      transform: rotate(180deg);
    }

    .ag-demo-disclosure p {
      margin: 0;
      border-top: 1px solid var(--color-border-soft);
      padding: 0 1rem 1rem;
      color: var(--color-text-readable-muted);
      animation: ag-demo-disclosure-reveal var(--duration-base) var(--ease-standard);
    }

    @keyframes ag-demo-disclosure-reveal {
      from { opacity: 0; transform: translateY(-0.25rem); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (prefers-reduced-motion: reduce) {
      .ag-demo-disclosure summary::after {
        transition: none;
      }

      .ag-demo-disclosure p {
        animation: none;
      }
    }

    .ag-demo-badge {
      border: 1px solid rgba(var(--accent-rgb), 0.34);
      border-radius: 999px;
      padding: 6px 10px;
      color: var(--color-text);
      background: rgba(var(--accent-rgb), 0.16);
      font-family: var(--font-mono);
      font-size: 0.7rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .ag-demo-progress {
      overflow: hidden;
      width: min(100%, 360px);
      height: 10px;
      border-radius: 999px;
      background: var(--color-border-soft);
    }

    .ag-demo-progress span {
      display: block;
      width: 64%;
      height: 100%;
      background: var(--accent-300);
    }

    .ag-demo-skeleton {
      display: grid;
      gap: 8px;
      width: min(100%, 360px);
    }

    .ag-demo-skeleton span {
      height: 12px;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--color-surface-2), var(--color-border-soft), var(--color-surface-2));
    }

    .ag-demo-icon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
      gap: 10px;
    }

    .ag-demo-icon {
      display: grid;
      grid-template-columns: 32px minmax(0, 1fr);
      align-items: center;
      gap: 10px;
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-sm);
      padding: 8px;
      color: var(--color-text-readable-muted);
      background: rgba(var(--accent-rgb), 0.08);
      font-family: var(--font-mono);
      font-size: 0.72rem;
      overflow-wrap: anywhere;
    }

    .ag-demo-icon-symbol {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: 1px solid rgba(var(--accent-rgb), 0.3);
      border-radius: var(--radius-sm);
      background: rgba(var(--accent-rgb), 0.1);
    }

    .ag-demo-icon-symbol svg {
      width: 18px;
      height: 18px;
      fill: none;
      stroke: var(--color-accent-ink);
      stroke-linecap: square;
      stroke-linejoin: miter;
      stroke-width: 1.75;
    }

    @media (max-width: 640px) {
      .rail {
        align-items: flex-start;
        flex-direction: column;
      }

      .rail-controls {
        align-items: flex-start;
        justify-content: flex-start;
        width: 100%;
      }

      .rail nav {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        width: 100%;
        gap: 8px;
      }

      .hero {
        padding: 24px;
      }

      .panel {
        padding: 20px;
      }

      h1 {
        font-size: clamp(2.35rem, 14vw, 3rem);
        overflow-wrap: anywhere;
      }
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="rail">
      <a class="brand" href="index.html">Aurelglyph<span class="dot"></span></a>
      <div class="rail-controls">
        <nav aria-label="Pages">
          ${navItems
            .map(
              ([id, href, label]) =>
                `<a href="${href}"${id === active ? ' aria-current="page"' : ""}>${label}</a>`
            )
            .join("\n          ")}
        </nav>
        <button aria-label="Use light mode" aria-pressed="false" class="mode-toggle" data-mode-toggle type="button">Light mode</button>
      </div>
    </header>
${accessibleBody}
  </main>
  <script>
    (() => {
      const toggle = document.querySelector("[data-mode-toggle]");
      if (!(toggle instanceof HTMLButtonElement)) return;

      const updateToggle = () => {
        const light = document.documentElement.dataset.mode === "light";
        toggle.textContent = light ? "Dark mode" : "Light mode";
        toggle.setAttribute("aria-label", light ? "Use dark mode" : "Use light mode");
        toggle.setAttribute("aria-pressed", String(light));
      };

      toggle.addEventListener("click", () => {
        const nextMode = document.documentElement.dataset.mode === "light" ? "dark" : "light";
        document.documentElement.dataset.mode = nextMode;
        try { localStorage.setItem("aurelglyph-mode", nextMode); } catch {}
        updateToggle();
      });

      updateToggle();
    })();
  </script>
</body>
</html>
`;
}

function renderIndex(version: string, description: string): string {
  return pageShell(
    "Aurelglyph",
    `    <section class="hero">
      <div class="eyebrow">Systems operational</div>
      <h1>Aurelglyph</h1>
      <p class="lead">Shared design tokens and components for apps across web, React Native, Rails, and SwiftUI.</p>
      <p>${escapeHtml(description)}</p>
      <div class="actions">
        <a class="button" href="components.html">View components</a>
        <a class="button" href="usage.html">Use in apps</a>
      </div>
      <div class="meta" aria-label="Project metadata">
        <div class="metric">Current release<strong>Version ${escapeHtml(version)}</strong></div>
        <div class="metric">Package model<strong>Shared source files</strong></div>
        <div class="metric">Surface<strong>Raw GitHub Pages</strong></div>
      </div>
    </section>`
  , "index");
}

function renderUsage(version: string): string {
  return pageShell(
    "Aurelglyph Usage",
    `    <article class="panel markdown">
      <h1>Usage</h1>
      <p>Use Aurelglyph by installing the package for your platform, importing the generated styles or token values, then setting the theme attributes on the root surface. Pin exact versions for applications and loosen ranges only when you are ready to adopt compatible updates.</p>
      <h2>React and CSS exact version</h2>
      <pre><code>npm install @aurelglyph/css@${escapeHtml(version)} @aurelglyph/react@${escapeHtml(version)}</code></pre>
      <h2>React and CSS compatible range</h2>
      <pre><code>npm install @aurelglyph/css@^${escapeHtml(version)} @aurelglyph/react@^${escapeHtml(version)}</code></pre>
      <pre><code>import "@aurelglyph/css";</code></pre>
      <p><code>@aurelglyph/css</code> includes tokens, packaged fonts, base styles, and the shared component class layer. <code>@aurelglyph/react/styles.css</code> is also exported for React-only adopters that want just the component class layer.</p>
      <h2>React icons</h2>
      <pre><code>import { Alert, AppShell, Avatar, Badge, Breadcrumbs, Button, ButtonGroup, Card, Checkbox, Combobox, CommandPalette, Container, DataTable, Dialog, Divider, Drawer, EmptyState, ExpandableSection, FileUpload, Grid, Icon, IconButton, ListRow, ListSection, Menu, Metric, NavigationPage, NavigationStack, NumberField, Pagination, Popover, Progress, RadioGroup, SearchField, SegmentedControl, Select, Sheet, Skeleton, Slider, Spinner, Stack, Surface, Switch, Tabs, TabBar, TextArea, TextField, Toast, Toolbar, Tooltip, TopBar } from "@aurelglyph/react";

&lt;Icon name="dashboard" title="Dashboard" /&gt;
&lt;Icon name="thumbs-up" title="Approve" /&gt;
&lt;Icon decorative name="sync" /&gt;
&lt;Button icon="external-link"&gt;Open&lt;/Button&gt;</code></pre>
      <h2>React components</h2>
      <pre><code>&lt;Button icon="save" type="submit"&gt;Save&lt;/Button&gt;
&lt;Button icon="delete" variant="danger"&gt;Delete&lt;/Button&gt;

&lt;ExpandableSection defaultOpen eyebrow="System" title="Advanced settings"&gt;
  &lt;p&gt;Animated content with accessible disclosure semantics.&lt;/p&gt;
&lt;/ExpandableSection&gt;

&lt;TextField label="Project name" name="projectName" helpText="Use a short name." /&gt;
&lt;TextField label="Version" name="version" error="Use a supported version." /&gt;
&lt;TextArea label="Notes" name="notes" placeholder="Describe the app surface." /&gt;
&lt;FileUpload accept=".json,.css,.ts,.tsx,.swift,.rb" label="Generated outputs" name="outputs" /&gt;

&lt;AppShell
  topBar={&lt;TopBar title="Workbench" subtitle="Systems" /&gt;}
  footer={&lt;TabBar activeId="systems" items={[{ id: "systems", label: "Systems", href: "#systems", icon: "settings" }]} /&gt;}
&gt;
  &lt;SearchField label="Search systems" name="query" /&gt;
  &lt;Card eyebrow="Live" title="Status"&gt;Systems operational&lt;/Card&gt;
  &lt;ListSection title="Settings"&gt;
    &lt;ListRow icon="bell" selected title="Quiet mode" description="Enabled" trailing="On" /&gt;
  &lt;/ListSection&gt;
  &lt;Switch label="Quiet mode" name="quiet" /&gt;
  &lt;NavigationStack title="Workbench"&gt;
    &lt;NavigationPage actions={&lt;Toolbar&gt;&lt;Button icon="save"&gt;Save&lt;/Button&gt;&lt;/Toolbar&gt;} title="Systems"&gt;
      &lt;SegmentedControl activeId="grid" items={[{ id: "grid", label: "Grid" }, { id: "list", label: "List" }]} /&gt;
      &lt;Select label="Theme" name="theme" options={[{ label: "Royal purple", value: "royal-purple" }]} /&gt;
      &lt;Alert title="Package ready" tone="success"&gt;Design tokens and native controls are ready to use.&lt;/Alert&gt;
      &lt;Avatar name="Ajit Chakrapani" /&gt;
      &lt;Badge tone="accent"&gt;Live&lt;/Badge&gt;
      &lt;EmptyState title="No archived releases"&gt;Use this state when a filtered list has no records.&lt;/EmptyState&gt;
      &lt;Button onClick={() =&gt; setDetailsOpen(true)} variant="secondary"&gt;Open sheet&lt;/Button&gt;
      &lt;Sheet onOpenChange={setDetailsOpen} open={detailsOpen} title="Details"&gt;Use sheets for focused edits without leaving the current page.&lt;/Sheet&gt;
    &lt;/NavigationPage&gt;
  &lt;/NavigationStack&gt;
  &lt;Breadcrumbs items={[{ href: "#workbench", label: "Workbench" }, { current: true, label: "Systems" }]} /&gt;
  &lt;Tabs activeId="overview" items={[{ id: "overview", label: "Overview" }]}&gt;Review generated package status.&lt;/Tabs&gt;
  &lt;Metric label="Latency" value="42ms" delta="Stable" /&gt;
  &lt;Progress value={72} /&gt;
  &lt;Skeleton /&gt;
  &lt;DataTable columns={[{ header: "System", key: "system", render: (row) =&gt; row.system }]} getRowId={(row) =&gt; row.system} rows={[{ system: "Pages" }]} /&gt;
  &lt;Pagination currentPage={2} totalPages={3} /&gt;
  &lt;Toast title="Settings saved" tone="success"&gt;The toast reports a non-blocking outcome.&lt;/Toast&gt;
  &lt;CommandPalette items={[{ icon: "search", id: "search", label: "Search systems", shortcut: "Cmd-K" }]} /&gt;
  &lt;Dialog open={dialogOpen} onOpenChange={setDialogOpen} title="Publish release?"&gt;Run the verified package gate.&lt;/Dialog&gt;
  &lt;Menu label="Actions" items={[{ id: "archive", label: "Archive", icon: "archive" }]} /&gt;
  &lt;Combobox label="Accent" options={themes} value={theme} onValueChange={setTheme} /&gt;
  &lt;Checkbox label="Automated verification" checked={verify} onChange={handleVerify} /&gt;
  &lt;Grid columns={{ base: 1, md: 2, lg: 3 }} minItemWidth="12rem"&gt;
    &lt;Surface&gt;Primary system&lt;/Surface&gt;
    &lt;Surface elevation="floating"&gt;Live inspection&lt;/Surface&gt;
  &lt;/Grid&gt;
&lt;/AppShell&gt;</code></pre>
      <h2>React Native components</h2>
      <pre><code>import { AurelglyphProvider, Button, Checkbox, Combobox, Stack, Surface } from "@aurelglyph/react-native";

&lt;AurelglyphProvider accent="royal-purple" mode="system"&gt;
  &lt;Surface elevation="raised"&gt;
    &lt;Stack gap={4}&gt;
      &lt;Combobox label="Operating mode" options={modes} value={mode} onValueChange={setMode} /&gt;
      &lt;Checkbox checked={verify} label="Automated verification" onCheckedChange={setVerify} /&gt;
      &lt;Button onPress={save}&gt;Save changes&lt;/Button&gt;
    &lt;/Stack&gt;
  &lt;/Surface&gt;
&lt;/AurelglyphProvider&gt;</code></pre>
      <p>The native adapter targets React Native 0.86 and React 19.2.3 or newer. It uses native modal and accessibility behavior, has no runtime UI dependency, and accepts a host document-picker callback for file uploads.</p>
      <h2>React Native typography</h2>
      <pre><code>import { aurelglyphTheme } from "@aurelglyph/react-native";
import { aurelglyphFontAssets, aurelglyphFontFamilies } from "@aurelglyph/react-native/fonts";

const bodyStyle = {
  fontFamily: aurelglyphTheme["font.family.body"]
};

// Register aurelglyphFontAssets with Expo Font or link the packaged TTF files.
const strongLabelStyle = { fontFamily: aurelglyphFontFamilies.uiBold };</code></pre>
      <h2>Rails Git tag</h2>
      <pre><code>gem "aurelglyph-rails",
  git: "https://github.com/absessive/aurelglyph",
  glob: "packages/rails/aurelglyph-rails.gemspec",
  tag: "v${escapeHtml(version)}"</code></pre>
      <p>The Rails gem includes the same six WOFF2 files and <code>@font-face</code> declarations as the CSS adapter. Keep the packaged <code>app/assets/fonts/aurelglyph</code> directory with the stylesheet.</p>
      <h2>Rails interactive sheets</h2>
      <p>Load the packaged <code>aurelglyph.js</code> controller when using sheets. It synchronizes server intent with the native modal lifecycle, dismissal, and focus restoration.</p>
      <pre><code>&lt;%= javascript_include_tag "aurelglyph", defer: true, data: { turbo_track: "reload" } %&gt;
&lt;%= button_tag "Open details", type: "button", data: { aurelglyph_sheet_trigger: "details" } %&gt;
&lt;%= aurelglyph_sheet("Details", id: "details") do %&gt;
  Systems operational.
&lt;% end %&gt;</code></pre>
      <h2>Rails icons</h2>
      <pre><code>&lt;%= aurelglyph_icon("dashboard", title: "Dashboard") %&gt;
&lt;%= aurelglyph_icon("sync", decorative: true, class: "toolbar-icon") %&gt;</code></pre>
      <h2>Rails expandable section</h2>
      <pre><code>&lt;%= aurelglyph_expandable_section("Advanced settings", eyebrow: "System", open: true) do %&gt;
  &lt;p&gt;Server-rendered disclosure content.&lt;/p&gt;
&lt;% end %&gt;</code></pre>
      <h2>Rails Phase 1 helpers</h2>
      <pre><code>&lt;%= aurelglyph_search_field(name: "query", label: "Search systems") %&gt;
&lt;%= aurelglyph_card(title: "Status", eyebrow: "Live") { "Systems operational" } %&gt;
&lt;%= aurelglyph_list_section(title: "Settings") do %&gt;
  &lt;%= aurelglyph_list_row("Quiet mode", description: "Enabled", icon: "bell", selected: true, trailing: "On") %&gt;
&lt;% end %&gt;
&lt;%= aurelglyph_switch(name: "quiet", label: "Quiet mode", checked: true) %&gt;
&lt;%= aurelglyph_alert("Package ready", tone: "success") { "Design tokens and native controls are ready to use." } %&gt;
&lt;%= aurelglyph_segmented_control([{ id: "grid", label: "Grid" }, { id: "list", label: "List" }], active: "grid") %&gt;
&lt;%= aurelglyph_badge("Live", tone: "accent") %&gt;
&lt;%= aurelglyph_metric(label: "Latency", value: "42ms", delta: "Stable") %&gt;
&lt;%= aurelglyph_progress(value: 72) %&gt;
&lt;%= aurelglyph_command_palette([{ id: "search", label: "Search systems", icon: "search", shortcut: "Cmd-K" }]) %&gt;
&lt;%= aurelglyph_menu(label: "System actions", items: [{ label: "Archive", value: "archive" }]) %&gt;
&lt;%= aurelglyph_combobox(name: "system_id", label: "System", options: systems) %&gt;
&lt;%= aurelglyph_grid(columns: { base: 1, md: 2, lg: 3 }, min_item_width: "16rem") do %&gt;
  &lt;%= render @systems %&gt;
&lt;% end %&gt;</code></pre>
      <h2>SwiftUI exact version</h2>
      <pre><code>.package(url: "https://github.com/absessive/aurelglyph", exact: "${escapeHtml(version)}")</code></pre>
      <h2>SwiftUI compatible version</h2>
      <pre><code>.package(url: "https://github.com/absessive/aurelglyph", from: "${escapeHtml(version)}")</code></pre>
      <h2>SwiftUI product dependency</h2>
      <pre><code>.product(name: "AurelglyphUI", package: "aurelglyph")</code></pre>
      <h2>Swift icons</h2>
      <pre><code>let icon = AurelglyphIcon.creditCard
let assetName = icon.rawValue
let label = icon.accessibilityLabel</code></pre>
      <h2>SwiftUI typography</h2>
      <pre><code>AurelglyphFontRegistry.registerFonts()

Text("Aurelglyph")
  .font(AurelglyphTypography.displayLarge)

Text("System status")
  .font(AurelglyphTypography.body)

Text("color.accent.royal-purple.300")
  .font(AurelglyphTypography.monoLabel)

Text("Calibrated systems")
  .font(AurelglyphTypography.display(size: 48, relativeTo: .largeTitle))</code></pre>
      <p>The Swift package does not bundle the web WOFF2 files from <code>@aurelglyph/css</code>. It bundles Apple-platform TTF files for Libre Baskerville, Atkinson Hyperlegible, and Space Mono. Custom methods preserve their requested baseline and scale relative to the supplied Dynamic Type role; the generic role factory uses role-specific defaults. <code>AurelglyphTypography</code> registers and uses each available face independently, with native SwiftUI fallbacks.</p>
      <h2>SwiftUI interaction foundations</h2>
      <pre><code>WorkbenchView()
  .aurelglyphTheme(AurelglyphTheme(mode: .system, accent: .royalPurple))

AurelglyphContainer {
  AurelglyphStack(spacing: 16) {
    AurelglyphNumberField("Retries", value: $retries, in: 0...10, step: 1)
    AurelglyphCombobox("Destination", options: destinations, query: $query, selection: $destination)
    AurelglyphCheckbox("Automated verification", isChecked: $verify)
  }
}
.aurelglyphDialog(isPresented: $showingArchive, title: "Archive system") {
  Text("The current system will move to Archive.")
} actions: {
  Button("Cancel", role: .cancel) { showingArchive = false }
  Button("Archive", role: .destructive) { archive() }
}</code></pre>
      <h2>SwiftUI expandable section</h2>
      <pre><code>@State private var expanded = true

AurelglyphExpandableSection("Advanced settings", eyebrow: "System", isExpanded: $expanded) {
  Text("Advanced settings stay visible while details expand.")
}</code></pre>
      <h2>SwiftUI Phase 1 components</h2>
      <pre><code>AurelglyphAppShell {
  AurelglyphTopBar("Workbench", subtitle: "Systems") { EmptyView() } actions: { Text("Edit") }
} content: {
  AurelglyphSearchField(text: $query)
  AurelglyphCard(title: "Status", eyebrow: "Live") { Text("Systems operational") }
  AurelglyphListSection("Settings") {
    AurelglyphListRow("Quiet mode", subtitle: "Enabled", systemImage: "bell", isSelected: true) { Text("On") }
  }
  AurelglyphSwitch("Quiet mode", isOn: $quiet)
} tabBar: {
  AurelglyphTabBar(items: tabs, selection: $selectedTab)
}

AurelglyphNavigationStack("Workbench") {
  AurelglyphSegmentedControl(items: [AurelglyphSegmentedItem(id: "grid", title: "Grid")], selection: $viewMode)
  AurelglyphAlert("Package ready") { Text("Design tokens and native controls are ready to use.") }
  AurelglyphBadge("Live")
  AurelglyphMetric(label: "Latency", value: "42ms", delta: "Stable")
  AurelglyphProgress(value: 72)
  AurelglyphCommandPalette(items: [AurelglyphCommandItem(id: "search", title: "Search", systemImage: "magnifyingglass", shortcut: "Cmd-K")])
}</code></pre>
      <h2>Packaged fonts</h2>
      <p>The CSS package bundles OFL WOFF2 files for Libre Baskerville, Atkinson Hyperlegible, and Space Mono. System UI fonts remain fallbacks.</p>
      <h2>Theme</h2>
      <pre><code>&lt;html data-mode="dark" data-theme="royal-purple"&gt;</code></pre>
    </article>`,
    "usage"
  );
}

function renderComponents(glyphs: IconGlyphs, manifest: ComponentManifest): string {
  return pageShell(
    "Aurelglyph Components",
    `    <article class="panel markdown">
      <h1>Components</h1>
      <p>This page shows the Aurelglyph component contract across CSS/Web, React, React Native, SwiftUI, and Rails. Version ${escapeHtml(manifest.release)} declares ${manifest.components.length} interaction-foundation families without replacing each platform's native behavior.</p>
      <h2>Platform targets</h2>
      <div class="catalog">
        <section class="catalog-card">
          <h3>Supported surfaces</h3>
          <ul>
            ${manifest.platforms.map((platform) => `<li>${escapeHtml(platform.label)}</li>`).join("\n            ")}
          </ul>
        </section>
      </div>
      <h2>${escapeHtml(manifest.scope)}</h2>
      <p>Every stable cell is checked for shipped implementation evidence during <code>npm test</code>. Adapter and browser suites exercise applicable behavior and accessibility separately. The schema-validated, machine-readable source of truth is <a href="component-manifest.json">component-manifest.json</a>.</p>
      <div class="support-matrix-wrap" tabindex="0" role="region" aria-label="Cross-platform interaction foundation support">
        <table class="support-matrix">
          <thead>
            <tr>
              <th scope="col">Component</th>
              ${manifest.platforms.map((platform) => `<th scope="col">${escapeHtml(platform.label)}</th>`).join("\n              ")}
            </tr>
          </thead>
          <tbody>
            ${manifest.components
              .map(
                (component) => `<tr>
              <td><strong>${escapeHtml(component.name)}</strong><span class="support-matrix__category">${escapeHtml(component.category)}</span></td>
              ${manifest.platforms
                .map(
                  (platform) => `<td aria-label="${escapeHtml(component.name)} is stable on ${escapeHtml(platform.label)}">Stable</td>`
                )
                .join("\n              ")}
            </tr>`
              )
              .join("\n            ")}
          </tbody>
        </table>
      </div>
      <h2>Preview</h2>
      <div class="preview-stack">
        <section class="preview-card">
          <h3>Phase 1 mobile foundation</h3>
          <div class="ag-demo-mobile">
            <div class="ag-demo-topbar">
              <span><strong>Workbench</strong><small>Systems online</small></span>
              <button class="ag-demo-button" type="button">Edit</button>
            </div>
            <div class="ag-demo-mobile-body">
              <div class="ag-demo-search">Search systems</div>
              <div class="ag-demo-card"><span class="ag-demo-badge">Live</span><p>The same component language carries from web previews into native apps.</p></div>
              <div class="ag-demo-list">
                <div class="ag-demo-row"><span><strong>Quiet mode</strong><br><small>Reduce notification noise</small></span><span class="ag-demo-switch"></span></div>
                <div class="ag-demo-row"><span><strong>Sync</strong><br><small>All generated packages aligned</small></span><small>Now</small></div>
              </div>
            </div>
            <div class="ag-demo-tabbar"><span>Workbench</span><span>Systems</span><span>Settings</span></div>
          </div>
        </section>
        <section class="preview-card">
          <h3>Phase 2 app controls</h3>
          <p>Use these controls for nested pages, toolbar actions, bounded choices, status messages, identity, and compact state labels.</p>
          <div class="preview-row">
            <span class="ag-badge ag-badge--accent">Live</span>
            <span class="ag-avatar" role="img" aria-label="Ajit Chakrapani"><span class="ag-avatar__initials">AC</span></span>
            <span class="ag-alert ag-alert--success"><span class="ag-alert__dot" aria-hidden="true"></span><span class="ag-alert__content"><strong class="ag-alert__title">Package ready</strong><span class="ag-alert__body">Design tokens are ready.</span></span></span>
          </div>
          <div class="ag-segmented" role="radiogroup" aria-label="View">
            <button class="ag-segmented__item is-active" role="radio" aria-checked="true" type="button">Grid</button>
            <button class="ag-segmented__item" role="radio" aria-checked="false" type="button">List</button>
          </div>
        </section>
        <section class="preview-card">
          <h3>Phase 3 workbench controls</h3>
          <p>Use these controls for data-heavy workbenches that need location, measured state, loading feedback, and keyboard-first actions.</p>
          <div class="ag-metric"><p class="ag-metric__label">Latency</p><strong class="ag-metric__value">42ms</strong><span class="ag-metric__delta">Stable</span></div>
          <div class="ag-progress" role="progressbar" aria-label="Release readiness" aria-valuemin="0" aria-valuemax="100" aria-valuenow="72"><span class="ag-progress__bar" style="inline-size: 72%"></span></div>
          <div class="ag-command-palette" role="dialog" aria-label="Command palette">
            <label class="ag-command-palette__search"><span class="ag-command-palette__label">Command palette</span><input class="ag-command-palette__input" placeholder="Type a command" type="search"></label>
            <div class="ag-command-palette__list" role="listbox" aria-label="Commands"><button class="ag-command-palette__item" role="option" type="button"><span class="ag-command-palette__item-label">Search systems</span><kbd class="ag-command-palette__shortcut">Cmd-K</kbd></button></div>
          </div>
        </section>
        <section class="preview-card">
          <h3>Buttons</h3>
          <div class="preview-row">
            <button class="ag-demo-button primary" type="button">Primary action</button>
            <button class="ag-demo-button" type="button">Secondary</button>
            <button class="ag-demo-button" type="button">Ghost</button>
          </div>
        </section>
        <section class="preview-card">
          <h3>Forms</h3>
          <div class="preview-row">
            <input aria-label="Project name" class="ag-demo-input" placeholder="Project name" />
            <textarea aria-label="Notes" class="ag-demo-textarea" placeholder="Notes"></textarea>
            <div class="ag-demo-upload">Generated outputs · .json .css .swift .rb</div>
          </div>
        </section>
        <section class="preview-card">
          <h3>Navigation</h3>
          <div class="preview-row">
            <a class="ag-demo-tab" href="index.html">Overview</a>
            <a class="ag-demo-tab" href="usage.html">Usage</a>
            <a class="ag-demo-tab" href="components.html">Components</a>
          </div>
        </section>
        <section class="preview-card">
          <h3>Expandable sections</h3>
          <details class="ag-demo-disclosure" open>
            <summary>Release readiness</summary>
            <p>Animated content reveal for React and SwiftUI, with a server-rendered Rails disclosure helper.</p>
          </details>
        </section>
        <section class="preview-card">
          <h3>Icon catalog</h3>
          <div class="ag-demo-icon-grid" aria-label="Supported icon names">
            ${iconCatalog
              .map(
                (name) => `<span class="ag-demo-icon">${renderStaticIcon(name, glyphs)}${escapeHtml(name)}</span>`
              )
              .join("\n            ")}
          </div>
        </section>
        <section class="preview-card">
          <h3>Feedback and content</h3>
          <div class="preview-row">
            <span class="ag-demo-badge">Active</span>
            <div class="ag-demo-alert">Alert: generated package outputs are in sync.</div>
            <div class="ag-demo-progress"><span></span></div>
            <div class="ag-demo-skeleton" aria-label="Skeleton loading preview" role="status">
              <span></span>
              <span style="width: 78%"></span>
              <span style="width: 52%"></span>
            </div>
          </div>
        </section>
      </div>
    </article>`,
    "components"
  );
}

function renderChangelog(changelog: string): string {
  return pageShell("Aurelglyph Changelog", `    <article class="panel markdown">\n${renderMarkdown(changelog)}\n    </article>`, "changelog");
}

export async function buildGithubPages(root = repoRoot): Promise<PagesBuildResult> {
  const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8")) as PackageJson;
  const version = packageJson.version ?? "0.0.0";
  const description = packageJson.description ?? "Aurelglyph is a token-first design-system workspace.";
  const changelog = await readFile(join(root, "CHANGELOG.md"), "utf8");
  const componentManifestSource = await readFile(join(root, "component-manifest.json"), "utf8");
  const componentManifest = JSON.parse(componentManifestSource) as ComponentManifest;
  const componentSchemaSource = await readFile(join(root, "schemas", "component-manifest.schema.json"), "utf8");
  const iconGlyphs = await loadIconGlyphs(root);
  const docsRoot = join(root, "docs");
  const docsSchemaRoot = join(docsRoot, "schemas");
  const fontSourceRoot = join(root, "packages", "css", "src", "fonts", "ofl");
  const fontDocsRoot = join(docsRoot, "assets", "fonts", "ofl");

  if (componentManifest.release !== version) {
    throw new Error(`component-manifest.json release ${componentManifest.release} does not match workspace ${version}.`);
  }

  await mkdir(docsRoot, { recursive: true });
  await mkdir(docsSchemaRoot, { recursive: true });
  await rm(fontDocsRoot, { recursive: true, force: true });
  await cp(fontSourceRoot, fontDocsRoot, { recursive: true });
  await writeFile(join(docsRoot, "index.html"), renderIndex(version, description));
  await writeFile(join(docsRoot, "usage.html"), renderUsage(version));
  await writeFile(join(docsRoot, "components.html"), renderComponents(iconGlyphs, componentManifest));
  await writeFile(join(docsRoot, "component-manifest.json"), componentManifestSource);
  await writeFile(join(docsSchemaRoot, "component-manifest.schema.json"), componentSchemaSource);
  await writeFile(join(docsRoot, "changelog.html"), renderChangelog(changelog));
  await writeFile(join(docsRoot, "CNAME"), `${githubPagesCustomDomain}\n`);

  return {
    files: [
      "docs/index.html",
      "docs/usage.html",
      "docs/components.html",
      "docs/component-manifest.json",
      "docs/schemas/component-manifest.schema.json",
      "docs/changelog.html",
      "docs/CNAME"
    ]
  };
}

async function main(): Promise<void> {
  const result = await buildGithubPages();
  console.log(`Built GitHub Pages assets: ${result.files.join(", ")}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
