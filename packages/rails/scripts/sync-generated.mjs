import { copyFile, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const repoRoot = join(packageRoot, "../..");

const tokenCss = join(repoRoot, "packages/tokens/dist/generated/aurelglyph.css");
const cssPackageSource = join(repoRoot, "packages/css/src/index.css");
const fontSource = join(repoRoot, "packages/css/src/fonts/ofl");
const railsFonts = join(packageRoot, "app/assets/fonts/aurelglyph");
const reactStyles = join(repoRoot, "packages/react/src/styles.css");
const railsCss = join(packageRoot, "app/assets/stylesheets/aurelglyph.css");
const generatedRuby = join(repoRoot, "packages/tokens/dist/generated/aurelglyph_tokens.rb");
const railsRuby = join(packageRoot, "lib/aurelglyph/tokens.rb");

const tokenCssContent = await readFile(tokenCss, "utf8");
const cssPackageContent = await readFile(cssPackageSource, "utf8");
const fontFaces = [...cssPackageContent.matchAll(/@font-face\s*\{[^}]+\}/gu)]
  .map(([rule]) => rule.replaceAll('url("./fonts/ofl/', 'url("aurelglyph/'))
  .join("\n\n");
const componentCss = (await readFile(reactStyles, "utf8")).replace(/^@import\s+"@aurelglyph\/tokens\/generated\.css";\s*/u, "").trimStart();

if (!fontFaces.includes("Libre Baskerville") || !fontFaces.includes("Atkinson Hyperlegible") || !fontFaces.includes("Space Mono")) {
  throw new Error("Unable to extract the Aurelglyph web font declarations.");
}

await mkdir(dirname(railsCss), { recursive: true });
await rm(railsFonts, { recursive: true, force: true });
await cp(fontSource, railsFonts, { recursive: true });
await writeFile(
  railsCss,
  `${fontFaces}\n\n${tokenCssContent.trimEnd()}\n\n/* Shared component classes used by the React and Rails adapters. */\n${componentCss}`,
  "utf8"
);

await mkdir(dirname(railsRuby), { recursive: true });
await copyFile(generatedRuby, railsRuby);
