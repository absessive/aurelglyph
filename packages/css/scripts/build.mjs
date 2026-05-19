import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const repoRoot = join(packageRoot, "../..");
const source = join(packageRoot, "src", "index.css");
const destination = join(packageRoot, "dist", "index.css");
const fontSource = join(packageRoot, "src", "fonts");
const fontDestination = join(packageRoot, "dist", "fonts");
const reactStyles = join(repoRoot, "packages/react/src/styles.css");

const baseCss = await readFile(source, "utf8");
const componentCss = (await readFile(reactStyles, "utf8")).replace(/^@import\s+"@aurelglyph\/tokens\/generated\.css";\s*/u, "").trimStart();

await mkdir(dirname(destination), { recursive: true });
await writeFile(
  destination,
  `${baseCss.trimEnd()}\n\n/* Shared component classes used by the React and Rails adapters. */\n${componentCss}`,
  "utf8"
);
await rm(fontDestination, { recursive: true, force: true });
await cp(fontSource, fontDestination, { recursive: true });
