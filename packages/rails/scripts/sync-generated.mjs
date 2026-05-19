import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const repoRoot = join(packageRoot, "../..");

const tokenCss = join(repoRoot, "packages/tokens/dist/generated/aurelglyph.css");
const reactStyles = join(repoRoot, "packages/react/src/styles.css");
const railsCss = join(packageRoot, "app/assets/stylesheets/aurelglyph.css");
const generatedRuby = join(repoRoot, "packages/tokens/dist/generated/aurelglyph_tokens.rb");
const railsRuby = join(packageRoot, "lib/aurelglyph/tokens.rb");

const tokenCssContent = await readFile(tokenCss, "utf8");
const componentCss = (await readFile(reactStyles, "utf8")).replace(/^@import\s+"@aurelglyph\/tokens\/generated\.css";\s*/u, "").trimStart();

await mkdir(dirname(railsCss), { recursive: true });
await writeFile(
  railsCss,
  `${tokenCssContent.trimEnd()}\n\n/* Shared component classes used by the React and Rails adapters. */\n${componentCss}`,
  "utf8"
);

await mkdir(dirname(railsRuby), { recursive: true });
await copyFile(generatedRuby, railsRuby);
