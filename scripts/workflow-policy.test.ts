import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");
const workflowPaths = [".github/workflows/ci.yml", ".github/workflows/release.yml"];

describe("GitHub Actions policy", () => {
  it("pins Linux runners and every external action to immutable revisions", async () => {
    for (const path of workflowPaths) {
      const workflow = await readFile(join(root, path), "utf8");
      expect(workflow).not.toContain("ubuntu-latest");

      const actions = [...workflow.matchAll(/^\s*- uses: ([^\s#]+)/gmu)].map((match) => match[1]);
      expect(actions.length).toBeGreaterThan(0);
      for (const action of actions) {
        expect(action, `${path}: ${action}`).toMatch(/^[^@]+@[0-9a-f]{40}$/u);
      }
    }
  });

  it("pins the Android consumer gate to its reviewed Gradle distribution", async () => {
    const androidRoot = join(root, "examples/react-native-smoke/android");
    const [wrapper, properties, build, appBuild] = await Promise.all([
      readFile(join(androidRoot, "gradle/wrapper/gradle-wrapper.properties"), "utf8"),
      readFile(join(androidRoot, "gradle.properties"), "utf8"),
      readFile(join(androidRoot, "build.gradle"), "utf8"),
      readFile(join(androidRoot, "app/build.gradle"), "utf8")
    ]);

    expect(wrapper).toContain(
      "distributionUrl=https\\://services.gradle.org/distributions/gradle-9.4.1-bin.zip"
    );
    expect(wrapper).toContain(
      "distributionSha256Sum=2ab2958f2a1e51120c326cad6f385153bb11ee93b3c216c5fccebfdfbb7ec6cb"
    );
    expect(properties).toMatch(/^android\.builtInKotlin=false$/mu);
    expect(properties).toMatch(/^android\.newDsl=false$/mu);
    expect(build).toContain('buildToolsVersion = "37.0.0"');
    expect(build).toContain("compileSdkVersion = 37");
    expect(build).toContain('kotlinVersion = "2.2.0"');
    expect(appBuild).toContain(
      'def hermesCompiler = System.getProperty("os.name").startsWith("Windows") ? "hermesc.exe" : "hermesc"'
    );
    expect(appBuild).toContain(
      'hermesCommand = file("../../../../node_modules/hermes-compiler/hermesc/%OS-BIN%/${hermesCompiler}").absolutePath'
    );
    expect(appBuild).toContain('getDefaultProguardFile("proguard-android-optimize.txt")');
    expect(appBuild).not.toContain('getDefaultProguardFile("proguard-android.txt")');
  });

  it("grants release write and OIDC privileges only to the jobs that need them", async () => {
    const workflow = await readFile(join(root, ".github/workflows/release.yml"), "utf8");

    expect(workflow).toMatch(/^permissions:\n  contents: read$/mu);
    expect(workflow.match(/id-token: write/gu)).toHaveLength(1);
    expect(workflow.match(/contents: write/gu)).toHaveLength(1);
    expect(workflow).toMatch(
      /publish-registries:[\s\S]*?permissions:\n      contents: read\n      id-token: write[\s\S]*?github-release:/u
    );
    expect(workflow).toMatch(/github-release:[\s\S]*?permissions:\n      contents: write/u);
  });

  it("keeps pre-1.0 and prerelease tags source-only while requiring registry success for stable 1.0 onward", async () => {
    const workflow = await readFile(join(root, ".github/workflows/release.yml"), "utf8");

    expect(workflow).toMatch(
      /publish-registries:[\s\S]*?if: \$\{\{ startsWith\(github\.ref_name, 'v0\.'\) == false && contains\(github\.ref_name, '-'\) == false \}\}/u
    );
    expect(workflow).toMatch(
      /github-release:[\s\S]*?needs: \[validate-web, validate-rails, validate-swift, validate-react-native, publish-registries\]/u
    );
    expect(workflow).toContain(
      "(needs.publish-registries.result == 'success' || needs.publish-registries.result == 'skipped')"
    );
  });
});
