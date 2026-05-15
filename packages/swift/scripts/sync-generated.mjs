import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const repoRoot = join(packageRoot, "../..");
const source = join(repoRoot, "packages/tokens/dist/generated/AurelglyphTokens.swift");
const destination = join(packageRoot, "Sources/AurelglyphUI/AurelglyphTokens.swift");

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
