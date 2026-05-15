import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const repoRoot = join(packageRoot, "../..");

const copies = [
  [
    join(repoRoot, "packages/tokens/dist/generated/aurelglyph.css"),
    join(packageRoot, "app/assets/stylesheets/aurelglyph.css")
  ],
  [
    join(repoRoot, "packages/tokens/dist/generated/aurelglyph_tokens.rb"),
    join(packageRoot, "lib/aurelglyph/tokens.rb")
  ]
];

for (const [source, destination] of copies) {
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
}
