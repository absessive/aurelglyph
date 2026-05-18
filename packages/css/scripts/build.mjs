import { cp, copyFile, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const source = join(packageRoot, "src", "index.css");
const destination = join(packageRoot, "dist", "index.css");
const fontSource = join(packageRoot, "src", "fonts");
const fontDestination = join(packageRoot, "dist", "fonts");

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
await rm(fontDestination, { recursive: true, force: true });
await cp(fontSource, fontDestination, { recursive: true });
