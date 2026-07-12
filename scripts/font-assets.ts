import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const webFontAssets = {
  "atkinson-hyperlegible-400.woff2": "d64ba838ef5472bba248620ec4fd8b5aa7cf0db2908e0bb230600caf279ba7bc",
  "atkinson-hyperlegible-700.woff2": "140e2bd25a7315c8a062508391426b0d8c3297400c947b8d847be28f73a199f0",
  "libre-baskerville-400.woff2": "3eb80fbca70498126925ce16ff5c20b2fa35e67ae7123ddb46302d2778dfbf0e",
  "libre-baskerville-700.woff2": "96fa63376eed93029fa2514a02f5cb80276b016e239426858787de6e794d8619",
  "space-mono-400.woff2": "fb4a81a2d0a893e5c38c394a7e716a1cef0b24610a0af49c96f6d529bd66bf2b",
  "space-mono-700.woff2": "2d46bd159b53f55c41167a4f1540a074649464194fd1e416f5b4694a6c0f282c"
} as const;

export const nativeFontAssets = {
  "AtkinsonHyperlegible-Bold.ttf": "5a3b0c8cc8ca545155150b4512a1fa248298df121c50d6557e651e61fbdab92f",
  "AtkinsonHyperlegible-Regular.ttf": "7fb917c89019896d0b52ee84b7cbb3304c18cb90b19a62f5e32712bd23e97669",
  "LibreBaskerville-Regular.ttf": "05a95421961341c5b2556285e8415df9db27dab4f4abe22b446b3c6a8b916c5d",
  "SpaceMono-Bold.ttf": "405e73d41afb7e5906efce206a326af5c956f38e255f35421c260e861e599c59",
  "SpaceMono-Regular.ttf": "95837e182baeeada83368f7748db28357f0a1b75c6b84ff7065b5edf933c8e18"
} as const;

export const fontLicenseFile = "OFL-1.1.txt";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));

async function sha256(path: string): Promise<string> {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function verifyAssets(source: string, assets: Record<string, string>): Promise<void> {
  for (const [file, expectedHash] of Object.entries(assets)) {
    const actualHash = await sha256(join(source, file));
    if (actualHash !== expectedHash) {
      throw new Error(`${file} checksum mismatch: ${actualHash} !== ${expectedHash}`);
    }
  }
}

async function copyAssets(source: string, destination: string, files: readonly string[]): Promise<void> {
  await mkdir(destination, { recursive: true });
  await Promise.all(files.map((file) => copyFile(join(source, file), join(destination, file))));
}

export async function syncFontAssets(root = repoRoot): Promise<void> {
  const resolvedWebSource = join(root, "packages/css/src/fonts/ofl");
  const resolvedNativeSource = join(root, "packages/swift/Sources/AurelglyphUI/Resources/Fonts");
  const license = await readFile(join(resolvedWebSource, fontLicenseFile), "utf8");

  for (const requiredNotice of [
    "Libre Baskerville Project Authors",
    "Braille Institute of America",
    "Space Mono Project Authors",
    "SIL OPEN FONT LICENSE Version 1.1"
  ]) {
    if (!license.includes(requiredNotice)) {
      throw new Error(`${fontLicenseFile} is missing ${requiredNotice}.`);
    }
  }

  await verifyAssets(resolvedWebSource, webFontAssets);
  await verifyAssets(resolvedNativeSource, nativeFontAssets);

  const docsFonts = join(root, "docs/assets/fonts/ofl");
  const previewFonts = join(root, "preview/assets/fonts");
  const reactNativeFonts = join(root, "packages/react-native/assets/fonts");

  await Promise.all([
    rm(docsFonts, { recursive: true, force: true }),
    rm(previewFonts, { recursive: true, force: true }),
    rm(reactNativeFonts, { recursive: true, force: true })
  ]);

  await Promise.all([
    copyAssets(resolvedWebSource, docsFonts, [...Object.keys(webFontAssets), fontLicenseFile]),
    copyAssets(resolvedWebSource, previewFonts, [...Object.keys(webFontAssets), fontLicenseFile]),
    copyAssets(resolvedNativeSource, reactNativeFonts, Object.keys(nativeFontAssets)),
    copyFile(join(resolvedWebSource, fontLicenseFile), join(resolvedNativeSource, fontLicenseFile))
  ]);

  await copyFile(join(resolvedWebSource, fontLicenseFile), join(reactNativeFonts, fontLicenseFile));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await syncFontAssets();
  console.log("Aurelglyph font assets are synchronized and checksum-verified.");
}
