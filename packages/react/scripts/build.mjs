import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const source = join(packageRoot, "src", "styles.css");
const destination = join(packageRoot, "dist", "styles.css");

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
