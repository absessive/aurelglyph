import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { fontLicenseFile, nativeFontAssets, webFontAssets } from "./font-assets";

const root = join(import.meta.dirname, "..");

async function sha256(path: string): Promise<string> {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

describe("font asset contract", () => {
  it("locks the canonical web and native font checksums", async () => {
    for (const [file, expectedHash] of Object.entries(webFontAssets)) {
      await expect(sha256(join(root, "packages/css/src/fonts/ofl", file))).resolves.toBe(expectedHash);
    }

    for (const [file, expectedHash] of Object.entries(nativeFontAssets)) {
      await expect(
        sha256(join(root, "packages/swift/Sources/AurelglyphUI/Resources/Fonts", file))
      ).resolves.toBe(expectedHash);
    }
  });

  it("keeps every web distribution byte-identical to the CSS source", async () => {
    const destinations = [
      "docs/assets/fonts/ofl",
      "preview/assets/fonts",
      "packages/rails/app/assets/fonts/aurelglyph"
    ];

    for (const [file, expectedHash] of Object.entries(webFontAssets)) {
      for (const destination of destinations) {
        await expect(sha256(join(root, destination, file))).resolves.toBe(expectedHash);
      }
    }

    const expectedFiles = [...Object.keys(webFontAssets), fontLicenseFile].sort();
    for (const destination of destinations) {
      await expect(readdir(join(root, destination)).then((files) => files.sort())).resolves.toEqual(expectedFiles);
    }
  });

  it("keeps the React Native font assets aligned with Swift", async () => {
    for (const [file, expectedHash] of Object.entries(nativeFontAssets)) {
      await expect(sha256(join(root, "packages/react-native/assets/fonts", file))).resolves.toBe(expectedHash);
    }

    await expect(
      readdir(join(root, "packages/react-native/assets/fonts")).then((files) => files.sort())
    ).resolves.toEqual([...Object.keys(nativeFontAssets), fontLicenseFile].sort());
  });

  it("ships complete OFL notices beside every distributed font set", async () => {
    const licensePaths = [
      "packages/css/src/fonts/ofl/OFL-1.1.txt",
      "packages/css/dist/fonts/ofl/OFL-1.1.txt",
      "packages/swift/Sources/AurelglyphUI/Resources/Fonts/OFL-1.1.txt",
      "packages/react-native/assets/fonts/OFL-1.1.txt",
      "packages/rails/app/assets/fonts/aurelglyph/OFL-1.1.txt",
      "docs/assets/fonts/ofl/OFL-1.1.txt",
      "preview/assets/fonts/OFL-1.1.txt"
    ];

    for (const path of licensePaths) {
      const license = await readFile(join(root, path), "utf8");
      expect(license).toContain("Libre Baskerville Project Authors");
      expect(license).toContain("Braille Institute of America");
      expect(license).toContain("Space Mono Project Authors");
      expect(license).toContain("SIL OPEN FONT LICENSE Version 1.1");
    }
  });
});
