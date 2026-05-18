import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

type PackageJson = {
  description?: string;
  version?: string;
};

export type PagesBuildResult = {
  files: string[];
};

type IconGlyphs = Record<string, string>;

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const componentGroups = [
  {
    title: "Implemented starter controls",
    items: ["Button", "Icon", "Text field", "Text area", "File upload"]
  },
  {
    title: "Core controls",
    items: ["Icon button", "Link", "Search field", "Select", "Checkbox", "Radio", "Toggle", "Slider"]
  },
  {
    title: "Navigation",
    items: ["Navbar", "Sidebar", "Navs", "Tabs", "Breadcrumbs", "Pagination", "Menu"]
  },
  {
    title: "Content and layout",
    items: ["Card", "Panel", "List group", "Accordion", "Toolbar", "App shell", "Modal", "Drawer"]
  },
  {
    title: "Feedback",
    items: ["Alert", "Badge", "Toast", "Progress", "Spinner", "Skeleton", "Tooltip"]
  },
  {
    title: "Forms",
    items: ["Input group", "Validation", "Field help", "File states", "Upload progress", "Error state"]
  }
];

const platformTargets = ["CSS/Web", "React", "React Native", "SwiftUI", "Rails"];
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

  return `<!doctype html>
<html lang="en" data-mode="dark" data-theme="royal-purple">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="color-scheme" content="dark light">
  <style>
    @font-face {
      font-family: "Newsreader";
      src: url("./assets/fonts/ofl/newsreader-400.woff2") format("woff2");
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: "Newsreader";
      src: url("./assets/fonts/ofl/newsreader-500.woff2") format("woff2");
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: "Newsreader";
      src: url("./assets/fonts/ofl/newsreader-700.woff2") format("woff2");
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: "IBM Plex Serif";
      src: url("./assets/fonts/ofl/ibm-plex-serif-400.woff2") format("woff2");
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: "IBM Plex Serif";
      src: url("./assets/fonts/ofl/ibm-plex-serif-500.woff2") format("woff2");
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: "IBM Plex Serif";
      src: url("./assets/fonts/ofl/ibm-plex-serif-700.woff2") format("woff2");
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: "IBM Plex Sans";
      src: url("./assets/fonts/ofl/ibm-plex-sans-400.woff2") format("woff2");
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: "IBM Plex Sans";
      src: url("./assets/fonts/ofl/ibm-plex-sans-500.woff2") format("woff2");
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: "IBM Plex Sans";
      src: url("./assets/fonts/ofl/ibm-plex-sans-700.woff2") format("woff2");
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: "JetBrains Mono";
      src: url("./assets/fonts/ofl/jetbrains-mono-400.woff2") format("woff2");
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: "JetBrains Mono";
      src: url("./assets/fonts/ofl/jetbrains-mono-500.woff2") format("woff2");
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: "JetBrains Mono";
      src: url("./assets/fonts/ofl/jetbrains-mono-700.woff2") format("woff2");
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }

    :root {
      color-scheme: dark light;
      --font-display: "Newsreader", "IBM Plex Serif", Georgia, serif;
      --font-ui: "IBM Plex Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --font-mono: "JetBrains Mono", "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
      --radius-sm: 8px;
      --radius-lg: 18px;
      --radius-panel: 28px;
      --shadow-panel: 0 18px 60px var(--color-shadow);
      --shadow-inset: inset 0 1px 0 var(--color-highlight);
    }

    :root[data-mode="dark"] {
      --color-bg: #0d0d0b;
      --color-bg-elevated: #12120f;
      --color-surface: #171714;
      --color-surface-2: #1f1e1a;
      --color-border: #34312b;
      --color-border-soft: rgba(231, 223, 209, 0.10);
      --color-text: #e7dfd1;
      --color-text-muted: #a59b8b;
      --color-text-subtle: #6e685e;
      --color-shadow: rgba(0, 0, 0, 0.55);
      --color-highlight: rgba(255, 255, 255, 0.06);
    }

    :root[data-theme="royal-purple"] {
      --accent-100: #d8c0ff;
      --accent-200: #b88cff;
      --accent-300: #9358e8;
      --accent-500: #562a93;
      --accent-rgb: 147, 88, 232;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      background:
        linear-gradient(rgba(231, 223, 209, 0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(231, 223, 209, 0.025) 1px, transparent 1px),
        var(--color-bg);
      background-size: 44px 44px;
      color: var(--color-text);
      font-family: var(--font-ui);
    }

    a {
      color: var(--accent-100);
      text-decoration-color: rgba(var(--accent-rgb), 0.45);
      text-underline-offset: 0.22em;
    }

    a:focus-visible {
      outline: 1px solid rgba(var(--accent-rgb), 0.85);
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
      color: var(--color-text-muted);
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
      border: 1px solid rgba(231, 223, 209, 0.06);
      border-radius: calc(var(--radius-panel) - 10px);
      pointer-events: none;
    }

    .eyebrow {
      color: var(--accent-200);
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
      font-weight: 500;
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
      color: var(--color-text-muted);
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
      min-height: 42px;
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
      color: var(--color-text-muted);
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
      background: rgba(0, 0, 0, 0.18);
      color: var(--accent-100);
      font-family: var(--font-mono);
      font-size: 0.9em;
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

    .preview-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
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
      border-color: var(--accent-200);
      background: linear-gradient(180deg, var(--accent-300), var(--accent-500));
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
      color: var(--color-text-muted);
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
      color: var(--accent-200);
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
      color: var(--color-text-muted);
      animation: ag-demo-disclosure-reveal var(--duration-base) var(--ease-standard);
    }

    @keyframes ag-demo-disclosure-reveal {
      from { opacity: 0; transform: translateY(-0.25rem); }
      to { opacity: 1; transform: translateY(0); }
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
      color: var(--color-text-muted);
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
      stroke: var(--accent-100);
      stroke-linecap: square;
      stroke-linejoin: miter;
      stroke-width: 1.75;
    }

    @media (max-width: 640px) {
      .rail {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="rail">
      <a class="brand" href="index.html">Aurelglyph<span class="dot"></span></a>
      <nav aria-label="Pages">
        ${navItems
          .map(
            ([id, href, label]) =>
              `<a href="${href}"${id === active ? ' aria-current="page"' : ""}>${label}</a>`
          )
          .join("\n        ")}
      </nav>
    </header>
${body}
  </main>
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
      <p class="lead">Shared design tokens and starter components for apps across web, Rails, and SwiftUI.</p>
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

function renderUsage(): string {
  return pageShell(
    "Aurelglyph Usage",
    `    <article class="panel markdown">
      <h1>Usage</h1>
      <p>Use Aurelglyph by installing the package for your platform, importing the generated styles or token values, then setting the theme attributes on the root surface. Pin exact versions for applications and loosen ranges only when you are ready to adopt compatible updates.</p>
      <h2>React and CSS exact version</h2>
      <pre><code>npm install @aurelglyph/css@0.1.0 @aurelglyph/react@0.1.0</code></pre>
      <h2>React and CSS compatible range</h2>
      <pre><code>npm install @aurelglyph/css@^0.1.0 @aurelglyph/react@^0.1.0</code></pre>
      <pre><code>import "@aurelglyph/css";
import "@aurelglyph/react/styles.css";</code></pre>
      <h2>React icons</h2>
      <pre><code>import { Button, ExpandableSection, Icon } from "@aurelglyph/react";

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
&lt;FileUpload accept=".json,.css,.ts,.tsx,.swift,.rb" label="Generated outputs" name="outputs" /&gt;</code></pre>
      <h2>Rails Git tag</h2>
      <pre><code>gem "aurelglyph-rails",
  git: "https://github.com/absessive/aurelglyph",
  glob: "packages/rails/aurelglyph-rails.gemspec",
  tag: "v0.1.0"</code></pre>
      <h2>Rails icons</h2>
      <pre><code>&lt;%= aurelglyph_icon("dashboard", title: "Dashboard") %&gt;
&lt;%= aurelglyph_icon("sync", decorative: true, class: "toolbar-icon") %&gt;</code></pre>
      <h2>Rails expandable section</h2>
      <pre><code>&lt;%= aurelglyph_expandable_section("Advanced settings", eyebrow: "System", open: true) do %&gt;
  &lt;p&gt;Server-rendered disclosure content.&lt;/p&gt;
&lt;% end %&gt;</code></pre>
      <h2>SwiftUI exact version</h2>
      <pre><code>.package(url: "https://github.com/absessive/aurelglyph", exact: "0.1.0")</code></pre>
      <h2>SwiftUI compatible version</h2>
      <pre><code>.package(url: "https://github.com/absessive/aurelglyph", from: "0.1.0")</code></pre>
      <h2>Swift icons</h2>
      <pre><code>let icon = AurelglyphIcon.creditCard
let assetName = icon.rawValue
let label = icon.accessibilityLabel</code></pre>
      <h2>SwiftUI expandable section</h2>
      <pre><code>@State private var expanded = true

AurelglyphExpandableSection("Advanced settings", eyebrow: "System", isExpanded: $expanded) {
  Text("Animated SwiftUI content")
}</code></pre>
      <h2>Packaged fonts</h2>
      <p>The CSS package bundles OFL WOFF2 files for Newsreader, IBM Plex Serif, IBM Plex Sans, and JetBrains Mono. System UI fonts remain fallbacks.</p>
      <h2>Theme</h2>
      <pre><code>&lt;html data-mode="dark" data-theme="royal-purple"&gt;</code></pre>
    </article>`,
    "usage"
  );
}

function renderComponents(glyphs: IconGlyphs): string {
  return pageShell(
    "Aurelglyph Components",
    `    <article class="panel markdown">
      <h1>Components</h1>
      <p>This page shows the starter visual contract for Aurelglyph components across CSS/Web, React, React Native, SwiftUI, and Rails. React has the first live implementation, but naming, variants, states, and accessibility expectations should carry across every platform package.</p>
      <h2>Platform targets</h2>
      <div class="catalog">
        <section class="catalog-card">
          <h3>Supported surfaces</h3>
          <ul>
            ${platformTargets.map((target) => `<li>${escapeHtml(target)}</li>`).join("\n            ")}
          </ul>
        </section>
      </div>
      <h2>Preview</h2>
      <div class="preview-stack">
        <section class="preview-card">
          <h3>Buttons</h3>
          <div class="preview-row">
            <button class="ag-demo-button primary">Primary action</button>
            <button class="ag-demo-button">Secondary</button>
            <button class="ag-demo-button">Ghost</button>
          </div>
        </section>
        <section class="preview-card">
          <h3>Forms</h3>
          <div class="preview-row">
            <input class="ag-demo-input" placeholder="Project name" />
            <textarea class="ag-demo-textarea" placeholder="Notes"></textarea>
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
            <div class="ag-demo-skeleton" aria-label="Skeleton loading preview">
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
  const iconGlyphs = await loadIconGlyphs(root);
  const docsRoot = join(root, "docs");
  const fontSourceRoot = join(root, "packages", "css", "src", "fonts", "ofl");
  const fontDocsRoot = join(docsRoot, "assets", "fonts", "ofl");

  await mkdir(docsRoot, { recursive: true });
  await rm(fontDocsRoot, { recursive: true, force: true });
  await cp(fontSourceRoot, fontDocsRoot, { recursive: true });
  await writeFile(join(docsRoot, "index.html"), renderIndex(version, description));
  await writeFile(join(docsRoot, "usage.html"), renderUsage());
  await writeFile(join(docsRoot, "components.html"), renderComponents(iconGlyphs));
  await writeFile(join(docsRoot, "changelog.html"), renderChangelog(changelog));

  return { files: ["docs/index.html", "docs/usage.html", "docs/components.html", "docs/changelog.html"] };
}

async function main(): Promise<void> {
  const result = await buildGithubPages();
  console.log(`Built GitHub Pages assets: ${result.files.join(", ")}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
