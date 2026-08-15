import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

type Platform = {
  id: string;
  label: string;
};

type Component = {
  id: string;
  name: string;
  category: string;
  introduced: string;
  evidence: Record<string, string>;
};

type ComponentManifest = {
  schemaVersion: number;
  release: string;
  scope: string;
  platforms: Platform[];
  components: Component[];
};

type JsonSchema = {
  additionalProperties?: boolean | JsonSchema;
  const?: unknown;
  enum?: unknown[];
  items?: JsonSchema;
  maxItems?: number;
  minItems?: number;
  minLength?: number;
  pattern?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  type?: "array" | "object" | "string";
  uniqueItems?: boolean;
};

const declaredPlatformIds = ["css", "react", "reactNative", "swiftUI", "rails"];

const root = fileURLToPath(new URL("../", import.meta.url));

async function read(path: string): Promise<string> {
  return readFile(join(root, path), "utf8");
}

async function readDirectorySources(path: string, extension: string): Promise<string> {
  const directory = join(root, path);
  const entries = await readdir(directory, { withFileTypes: true });
  const sources = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
      .map((entry) => readFile(join(directory, entry.name), "utf8"))
  );
  return sources.join("\n");
}

async function loadManifest(): Promise<ComponentManifest> {
  return JSON.parse(await read("component-manifest.json")) as ComponentManifest;
}

function sameJsonValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * Validate the JSON Schema features used by the published component-manifest
 * schema. Keeping this small validator in the test avoids adding a runtime
 * dependency solely for release metadata while still testing the schema file
 * itself instead of duplicating its rules in assertions.
 */
function validateSchema(value: unknown, schema: JsonSchema, path = "$"): string[] {
  const errors: string[] = [];

  if (Object.hasOwn(schema, "const") && !sameJsonValue(value, schema.const)) {
    errors.push(`${path} must equal ${JSON.stringify(schema.const)}`);
    return errors;
  }

  if (schema.enum && !schema.enum.some((candidate) => sameJsonValue(value, candidate))) {
    errors.push(`${path} must be one of ${schema.enum.map((candidate) => JSON.stringify(candidate)).join(", ")}`);
  }

  if (schema.type === "string") {
    if (typeof value !== "string") {
      errors.push(`${path} must be a string`);
      return errors;
    }
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${path} must contain at least ${schema.minLength} character(s)`);
    }
    if (schema.pattern && !new RegExp(schema.pattern, "u").test(value)) {
      errors.push(`${path} must match ${schema.pattern}`);
    }
    return errors;
  }

  if (schema.type === "array") {
    if (!Array.isArray(value)) {
      errors.push(`${path} must be an array`);
      return errors;
    }
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${path} must contain at least ${schema.minItems} item(s)`);
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(`${path} must contain at most ${schema.maxItems} item(s)`);
    }
    if (schema.uniqueItems) {
      const serialized = value.map((item) => JSON.stringify(item));
      if (new Set(serialized).size !== serialized.length) errors.push(`${path} must contain unique items`);
    }
    if (schema.items) {
      value.forEach((item, index) => errors.push(...validateSchema(item, schema.items!, `${path}[${index}]`)));
    }
    return errors;
  }

  if (schema.type === "object") {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      errors.push(`${path} must be an object`);
      return errors;
    }

    const record = value as Record<string, unknown>;
    for (const required of schema.required ?? []) {
      if (!Object.hasOwn(record, required)) errors.push(`${path}.${required} is required`);
    }
    for (const [key, entry] of Object.entries(record)) {
      const propertySchema = schema.properties?.[key];
      if (propertySchema) {
        errors.push(...validateSchema(entry, propertySchema, `${path}.${key}`));
      } else if (schema.additionalProperties === false) {
        errors.push(`${path}.${key} is not allowed`);
      } else if (typeof schema.additionalProperties === "object") {
        errors.push(...validateSchema(entry, schema.additionalProperties, `${path}.${key}`));
      }
    }
  }

  return errors;
}

describe("component manifest", () => {
  it("conforms to its published JSON Schema", async () => {
    const manifest = JSON.parse(await read("component-manifest.json")) as unknown;
    const schema = JSON.parse(await read("schemas/component-manifest.schema.json")) as JsonSchema;

    expect(validateSchema(manifest, schema)).toEqual([]);
  });

  it("has a schema that rejects incomplete or undocumented support claims", async () => {
    const manifest = JSON.parse(await read("component-manifest.json")) as Record<string, unknown>;
    const schema = JSON.parse(await read("schemas/component-manifest.schema.json")) as JsonSchema;
    const firstComponent = (manifest.components as Array<Record<string, unknown>>)[0];
    const incompleteEvidence = { ...(firstComponent.evidence as Record<string, string>) };
    delete incompleteEvidence.rails;
    const manifestWithoutSchema = { ...manifest };
    delete manifestWithoutSchema.$schema;
    const invalidManifests = [
      manifestWithoutSchema,
      { ...manifest, release: "v0.5.0" },
      { ...manifest, platforms: [{ id: "android", label: "Android" }] },
      { ...manifest, platforms: (manifest.platforms as unknown[]).slice(0, 4) },
      { ...manifest, components: [{ ...firstComponent, evidence: incompleteEvidence }] },
      { ...manifest, undocumentedClaim: true }
    ];

    for (const invalidManifest of invalidManifests) {
      expect(validateSchema(invalidManifest, schema)).not.toEqual([]);
    }
  });

  it("is versioned, unique, and complete for every declared platform", async () => {
    const manifest = await loadManifest();
    const workspace = JSON.parse(await read("package.json")) as { version: string };
    const platformIds = manifest.platforms.map(({ id }) => id);
    const componentIds = manifest.components.map(({ id }) => id);

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.release).toBe(workspace.version);
    expect(manifest.scope).toBe("Interaction foundations");
    expect(platformIds).toEqual(declaredPlatformIds);
    expect(new Set(platformIds).size).toBe(platformIds.length);
    expect(new Set(manifest.platforms.map(({ label }) => label)).size).toBe(manifest.platforms.length);
    expect(new Set(componentIds).size).toBe(componentIds.length);
    expect(manifest.components).toHaveLength(18);

    for (const component of manifest.components) {
      expect(component.id).toMatch(/^[a-z][a-z0-9-]*$/u);
      expect(component.name.length).toBeGreaterThan(0);
      expect(component.category.length).toBeGreaterThan(0);
      expect(component.introduced).toMatch(/^\d+\.\d+\.\d+$/u);
      expect(Object.keys(component.evidence).sort()).toEqual([...platformIds].sort());
    }
  });

  it("keeps every cross-platform support claim backed by a shipped implementation", async () => {
    const manifest = await loadManifest();
    const sourceByPlatform: Record<string, string> = {
      css: await read("packages/react/src/styles.css"),
      react: await read("packages/react/src/index.ts"),
      reactNative: await read("packages/react-native/src/index.ts"),
      swiftUI: await readDirectorySources("packages/swift/Sources/AurelglyphUI", ".swift"),
      rails: [
        await read("packages/rails/lib/aurelglyph/rails/helper.rb"),
        await read("packages/rails/lib/aurelglyph/rails/interaction_helper.rb")
      ].join("\n")
    };

    for (const component of manifest.components) {
      for (const [platform, evidence] of Object.entries(component.evidence)) {
        expect(
          sourceByPlatform[platform],
          `${component.name} is declared for ${platform}, but ${JSON.stringify(evidence)} was not found.`
        ).toContain(evidence);
      }
    }
  });
});
