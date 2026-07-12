import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { buildGithubPages } from "./pages";

let tempRoots: string[] = [];

const fontFiles = [
  "libre-baskerville-400.woff2",
  "libre-baskerville-700.woff2",
  "atkinson-hyperlegible-400.woff2",
  "atkinson-hyperlegible-700.woff2",
  "space-mono-400.woff2",
  "space-mono-700.woff2"
];

async function createWorkspace(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "aurelglyph-pages-"));
  tempRoots.push(root);
  const fontRoot = join(root, "packages", "css", "src", "fonts", "ofl");

  await mkdir(fontRoot, { recursive: true });
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({ name: "aurelglyph", version: "1.2.3", description: "A token-first design system." }, null, 2)
  );
  await writeFile(
    join(root, "CHANGELOG.md"),
    [
      "# Changelog",
      "",
      "## 1.2.3",
      "",
      "- Add <raw> GitHub Pages output.",
      "- Keep `CHANGELOG.md` as the source of truth.",
      "  Continued release note text stays inside the same list item.",
      "Unindented release context becomes its own paragraph."
    ].join("\n")
  );
  await Promise.all(fontFiles.map((file) => writeFile(join(fontRoot, file), `test font ${file}`)));
  await writeFile(join(fontRoot, "OFL-1.1.txt"), "test OFL font notices");

  return root;
}

afterEach(async () => {
  await Promise.all(tempRoots.map((root) => rm(root, { recursive: true, force: true })));
  tempRoots = [];
});

describe("GitHub Pages generator", () => {
  it("builds raw Pages HTML including a changelog generated from CHANGELOG.md", async () => {
    const root = await createWorkspace();

    const result = await buildGithubPages(root);

    expect(result.files).toEqual([
      "docs/index.html",
      "docs/usage.html",
      "docs/components.html",
      "docs/changelog.html",
      "docs/CNAME"
    ]);

    const index = await readFile(join(root, "docs", "index.html"), "utf8");
    const usage = await readFile(join(root, "docs", "usage.html"), "utf8");
    const components = await readFile(join(root, "docs", "components.html"), "utf8");
    const changelog = await readFile(join(root, "docs", "changelog.html"), "utf8");
    const cname = await readFile(join(root, "docs", "CNAME"), "utf8");

    expect(index).toContain("<title>Aurelglyph</title>");
    expect(index).toContain('href="usage.html"');
    expect(index).toContain('href="components.html"');
    expect(index).toContain('href="changelog.html"');
    expect(index).toContain("Version 1.2.3");
    expect(index).toContain("Shared design tokens and starter components for apps across web, Rails, and SwiftUI.");
    expect(index).toContain("Shared source files");

    expect(usage).toContain("<title>Aurelglyph Usage</title>");
    expect(usage).toContain("npm install @aurelglyph/css@1.2.3 @aurelglyph/react@1.2.3");
    expect(usage).toContain('tag: "v1.2.3"');
    expect(usage).toContain('exact: "1.2.3"');
    expect(usage).toContain("aurelglyph-rails");
    expect(usage).toContain("SwiftUI");
    expect(usage).toContain("aurelglyph_icon");
    expect(usage).toContain("AurelglyphIcon.creditCard");
    expect(usage).toContain("AurelglyphFontRegistry.registerFonts");
    expect(usage).toContain("AurelglyphTypography.displayLarge");
    expect(usage).toContain("does not bundle the web WOFF2 files");
    expect(usage).toContain("Apple-platform TTF files");
    expect(usage).toContain("Libre Baskerville");
    expect(usage).toContain("Atkinson Hyperlegible");
    expect(usage).toContain("Space Mono");
    expect(usage).toContain("aurelglyphFontAssets");
    expect(usage).toContain('.product(name: "AurelglyphUI", package: "aurelglyph")');
    expect(usage).toContain("app/assets/fonts/aurelglyph");
    expect(usage).toContain('url("./assets/fonts/ofl/libre-baskerville-400.woff2")');
    expect(usage).toContain('url("./assets/fonts/ofl/atkinson-hyperlegible-400.woff2")');
    expect(usage).toContain('url("./assets/fonts/ofl/space-mono-400.woff2")');
    expect(usage).toContain("ExpandableSection");
    expect(usage).toContain("AurelglyphExpandableSection");
    expect(usage).toContain("aurelglyph_expandable_section");
    expect(usage).toContain("TextField");
    await expect(
      readFile(join(root, "docs", "assets", "fonts", "ofl", "space-mono-400.woff2"), "utf8")
    ).resolves.toBe("test font space-mono-400.woff2");
    await expect(
      readFile(join(root, "docs", "assets", "fonts", "ofl", "OFL-1.1.txt"), "utf8")
    ).resolves.toBe("test OFL font notices");
    expect(usage).toContain('class="mode-toggle"');
    expect(usage).toContain("localStorage.setItem");
    expect(usage).toContain("--color-accent-ink: var(--accent-500)");
    expect(usage).toContain("linear-gradient(180deg, var(--accent-500), var(--accent-600))");
    expect(usage).toContain("overflow-x: auto");

    expect(components).toContain("<title>Aurelglyph Components</title>");
    expect(components).toContain("CSS/Web");
    expect(components).toContain("React Native");
    expect(components).toContain("SwiftUI");
    expect(components).toContain("Rails");
    expect(components).toContain("Preview");
    expect(components).toContain("Primary action");
    expect(components).toContain("Project name");
    expect(components).toContain("Generated outputs");
    expect(components).toContain('aria-label="Project name"');
    expect(components).toContain("Icon catalog");
    expect(components).toContain("<svg");
    expect(components).toContain('data-icon-name="help"');
    expect(components).toContain("external-link");
    expect(components).toContain("terminal");
    expect(components).toContain("credit-card");
    expect(components).toContain("compass");
    expect(components).toContain("thumbs-up");
    expect(components).toContain("help");
    expect(components).toContain("notification");
    expect(components).toContain("expand");
    expect(components).toContain("contract");
    expect(components).toContain("Alert: generated package outputs are in sync.");

    expect(changelog).toContain("<title>Aurelglyph Changelog</title>");
    expect(changelog).toContain("<h1>Changelog</h1>");
    expect(changelog).toContain("<h2>1.2.3</h2>");
    expect(changelog).toContain("Add &lt;raw&gt; GitHub Pages output.");
    expect(changelog).toContain("<code>CHANGELOG.md</code> as the source of truth. Continued release note text stays inside the same list item.");
    expect(changelog).not.toContain("<p>Continued release note text");
    expect(changelog).toContain("</ul>\n<p>Unindented release context becomes its own paragraph.</p>");

    expect(cname).toBe("aurelglyph.absessive.com\n");
  });
});
