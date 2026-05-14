# Aurelglyph Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working Aurelglyph package workspace with canonical tokens, generated platform outputs, starter adapters, and a React example app that consumes the system.

**Architecture:** Use npm workspaces with a token-first core. Canonical JSON tokens feed a TypeScript compiler that writes CSS variables, TypeScript token exports, React Native theme objects, Swift token files, and Rails-friendly stylesheet/helper files. Starter React components and an example Vite app prove package consumption before broader platform component work.

**Tech Stack:** npm workspaces, TypeScript, Vitest, React, Vite, CSS variables, Swift Package Manager files, Rails helper/stub package files.

---

## Scope

This plan implements Phase 1 from the approved spec at `docs/superpowers/specs/2026-05-14-aurelglyph-design.md`. It creates package boundaries and a working token/compiler foundation. It does not attempt the entire v1 component catalog in one pass; it proves the architecture with representative controls and generated outputs.

## File Structure

- `package.json`: root workspace scripts and dev dependencies.
- `tsconfig.base.json`: shared TypeScript compiler settings.
- `vitest.config.ts`: workspace test configuration.
- `README.md`: project overview and local commands.
- `packages/tokens/`: canonical tokens, compiler, generated outputs, and tests.
- `packages/css/`: CSS package entry that re-exports generated CSS.
- `packages/react/`: starter React components consuming tokens/CSS.
- `packages/react-native/`: generated theme package entry for React Native/Expo.
- `packages/swift/`: Swift package exposing generated Swift tokens.
- `packages/rails/`: Rails-facing stylesheet and helper package skeleton.
- `examples/react-vite/`: Vite React example app consuming `@aurelglyph/css` and `@aurelglyph/react`.

Initial relevant test command after Task 1: `npm test`

---

### Task 1: Workspace Tooling

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `vitest.config.ts`
- Create: `README.md`

- [ ] **Step 1: Create root package metadata**

Create `package.json`:

```json
{
  "name": "aurelglyph",
  "version": "0.1.0",
  "private": true,
  "description": "A token-first UX design language and component system for SwiftUI, React, React Native, and Rails.",
  "type": "module",
  "workspaces": [
    "packages/*",
    "examples/*"
  ],
  "scripts": {
    "build": "npm run build -ws --if-present",
    "build:tokens": "npm run build -w @aurelglyph/tokens",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc -p tsconfig.base.json --noEmit",
    "verify": "npm run build && npm test && npm run typecheck"
  },
  "devDependencies": {
    "@types/node": "^22.15.18",
    "@vitejs/plugin-react": "^4.4.1",
    "typescript": "^5.8.3",
    "vite": "^6.3.5",
    "vitest": "^3.1.3",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "@types/react": "^19.1.4",
    "@types/react-dom": "^19.1.5"
  }
}
```

- [ ] **Step 2: Create shared TypeScript config**

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@aurelglyph/tokens": ["packages/tokens/src/index.ts"],
      "@aurelglyph/react": ["packages/react/src/index.ts"],
      "@aurelglyph/react-native": ["packages/react-native/src/index.ts"]
    }
  },
  "include": [
    "packages/**/*.ts",
    "packages/**/*.tsx",
    "examples/**/*.ts",
    "examples/**/*.tsx",
    "vitest.config.ts"
  ]
}
```

- [ ] **Step 3: Create Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/**/*.test.ts", "examples/**/*.test.ts"],
    globals: false
  }
});
```

- [ ] **Step 4: Create README**

Create `README.md`:

```md
# Aurelglyph

Aurelglyph is a token-first UX design language and component system for SwiftUI,
React, React Native, and Ruby on Rails apps.

## Phase 1

Phase 1 establishes:

- Canonical design tokens
- Generated CSS, TypeScript, React Native, Swift, and Rails-friendly outputs
- Starter React components
- A Vite React example app that consumes the packages

## Commands

```bash
npm install
npm run build
npm test
npm run typecheck
npm run verify
```
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created and dependencies install successfully.

- [ ] **Step 6: Verify baseline test command**

Run: `npm test`

Expected: Vitest runs and reports no tests found or no failing tests. If Vitest exits non-zero because no tests exist yet, continue; Task 2 adds the first tests.

- [ ] **Step 7: Commit workspace tooling**

```bash
git add package.json package-lock.json tsconfig.base.json vitest.config.ts README.md
git commit -m "chore: scaffold aurelglyph workspace"
```

---

### Task 2: Token Package And Compiler

**Files:**
- Create: `packages/tokens/package.json`
- Create: `packages/tokens/src/tokens.json`
- Create: `packages/tokens/src/types.ts`
- Create: `packages/tokens/src/build.ts`
- Create: `packages/tokens/src/index.ts`
- Create: `packages/tokens/src/build.test.ts`

- [ ] **Step 1: Create token package metadata**

Create `packages/tokens/package.json`:

```json
{
  "name": "@aurelglyph/tokens",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./generated.css": "./dist/generated/aurelglyph.css",
    "./react-native": {
      "types": "./dist/generated/react-native.d.ts",
      "default": "./dist/generated/react-native.js"
    }
  },
  "scripts": {
    "build": "tsx src/build.ts && tsc -p tsconfig.json",
    "test": "vitest run src/build.test.ts"
  },
  "devDependencies": {
    "tsx": "^4.19.4"
  }
}
```

- [ ] **Step 2: Add package TypeScript config**

Create `packages/tokens/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": false,
    "declaration": true,
    "emitDeclarationOnly": false,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts"]
}
```

- [ ] **Step 3: Add canonical token source**

Create `packages/tokens/src/tokens.json` with semantic and primitive tokens:

```json
{
  "color": {
    "primitive": {
      "aurel-50": "#fff8df",
      "aurel-100": "#f3e3a5",
      "aurel-500": "#b88a18",
      "aurel-700": "#77520c",
      "ink-50": "#f7f8f8",
      "ink-100": "#e7eaec",
      "ink-300": "#aeb7bd",
      "ink-600": "#4f5d66",
      "ink-800": "#26323a",
      "ink-950": "#11181d",
      "green-600": "#287a4d",
      "red-600": "#b52d3b",
      "blue-600": "#286fb8",
      "amber-600": "#a86405"
    },
    "semantic": {
      "background": "{color.primitive.ink-50}",
      "foreground": "{color.primitive.ink-950}",
      "surface": "#ffffff",
      "surface-muted": "{color.primitive.ink-100}",
      "border": "{color.primitive.ink-100}",
      "border-strong": "{color.primitive.ink-300}",
      "accent": "{color.primitive.aurel-500}",
      "accent-foreground": "{color.primitive.ink-950}",
      "focus": "{color.primitive.blue-600}",
      "danger": "{color.primitive.red-600}",
      "success": "{color.primitive.green-600}",
      "warning": "{color.primitive.amber-600}",
      "info": "{color.primitive.blue-600}",
      "muted": "{color.primitive.ink-600}",
      "disabled": "{color.primitive.ink-300}",
      "overlay": "rgba(17, 24, 29, 0.48)"
    }
  },
  "space": {
    "0": "0",
    "1": "0.25rem",
    "2": "0.5rem",
    "3": "0.75rem",
    "4": "1rem",
    "5": "1.25rem",
    "6": "1.5rem",
    "8": "2rem",
    "10": "2.5rem",
    "12": "3rem"
  },
  "radius": {
    "none": "0",
    "sm": "0.25rem",
    "md": "0.5rem",
    "lg": "0.75rem",
    "pill": "999px"
  },
  "font": {
    "family": {
      "body": "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
      "mono": "\"SFMono-Regular\", Consolas, \"Liberation Mono\", monospace"
    },
    "size": {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "md": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem",
      "2xl": "1.5rem"
    },
    "lineHeight": {
      "tight": "1.2",
      "normal": "1.5",
      "loose": "1.7"
    },
    "weight": {
      "regular": "400",
      "medium": "500",
      "semibold": "600",
      "bold": "700"
    }
  },
  "motion": {
    "duration": {
      "fast": "120ms",
      "normal": "180ms",
      "slow": "260ms"
    },
    "easing": {
      "standard": "cubic-bezier(0.2, 0, 0, 1)",
      "emphasized": "cubic-bezier(0.2, 0, 0, 1.2)"
    }
  }
}
```

- [ ] **Step 4: Add token types**

Create `packages/tokens/src/types.ts`:

```ts
export type TokenLeaf = string;
export type TokenTree = { [key: string]: TokenLeaf | TokenTree };

export type FlatToken = {
  path: string[];
  name: string;
  value: string;
};
```

- [ ] **Step 5: Write failing compiler tests**

Create `packages/tokens/src/build.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import tokens from "./tokens.json";
import {
  flattenTokens,
  resolveTokenValue,
  toCssCustomPropertyName,
  toSwiftIdentifier
} from "./build";

describe("token compiler helpers", () => {
  it("flattens nested tokens into stable paths", () => {
    const flat = flattenTokens(tokens);
    expect(flat.find((token) => token.name === "color.semantic.background")).toEqual({
      path: ["color", "semantic", "background"],
      name: "color.semantic.background",
      value: "{color.primitive.ink-50}"
    });
  });

  it("resolves token references", () => {
    expect(resolveTokenValue("{color.primitive.ink-50}", tokens)).toBe("#f7f8f8");
  });

  it("creates CSS custom property names", () => {
    expect(toCssCustomPropertyName("color.semantic.surface-muted")).toBe("--ag-color-semantic-surface-muted");
  });

  it("creates Swift-safe identifiers", () => {
    expect(toSwiftIdentifier("color.semantic.surface-muted")).toBe("colorSemanticSurfaceMuted");
  });
});
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `npm test -w @aurelglyph/tokens`

Expected: FAIL because `packages/tokens/src/build.ts` does not exist.

- [ ] **Step 7: Implement compiler**

Create `packages/tokens/src/build.ts`:

```ts
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import tokens from "./tokens.json" assert { type: "json" };
import type { FlatToken, TokenTree } from "./types";

const generatedDir = join(process.cwd(), "dist", "generated");

export function flattenTokens(tree: TokenTree, path: string[] = []): FlatToken[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const nextPath = [...path, key];
    if (typeof value === "string") {
      return [{ path: nextPath, name: nextPath.join("."), value }];
    }
    return flattenTokens(value, nextPath);
  });
}

export function resolveTokenValue(value: string, tree: TokenTree): string {
  const match = value.match(/^\{(.+)\}$/);
  if (!match) return value;

  const resolved = match[1].split(".").reduce<TokenTree | string | undefined>((current, part) => {
    if (typeof current === "string" || current == null) return undefined;
    return current[part];
  }, tree);

  if (typeof resolved !== "string") {
    throw new Error(`Unable to resolve token reference ${value}`);
  }

  return resolveTokenValue(resolved, tree);
}

export function toCssCustomPropertyName(name: string): string {
  return `--ag-${name.replace(/\./g, "-")}`;
}

export function toSwiftIdentifier(name: string): string {
  return name
    .split(/[\.-]/)
    .map((part, index) => (index === 0 ? part : `${part[0].toUpperCase()}${part.slice(1)}`))
    .join("");
}

function jsIdentifier(name: string): string {
  return name.replace(/[-.](\w)/g, (_, char: string) => char.toUpperCase());
}

function renderCss(flat: FlatToken[]): string {
  const lines = flat.map((token) => `  ${toCssCustomPropertyName(token.name)}: ${resolveTokenValue(token.value, tokens)};`);
  return `:root {\n${lines.join("\n")}\n}\n`;
}

function renderTypeScript(flat: FlatToken[]): string {
  const body = flat
    .map((token) => `  "${token.name}": "${resolveTokenValue(token.value, tokens)}"`)
    .join(",\n");
  return `export const tokens = {\n${body}\n} as const;\n\nexport type AurelglyphTokenName = keyof typeof tokens;\n`;
}

function renderReactNative(flat: FlatToken[]): string {
  const body = flat
    .map((token) => `  "${token.name}": "${resolveTokenValue(token.value, tokens)}"`)
    .join(",\n");
  return `export const aurelglyphTheme = {\n${body}\n} as const;\n`;
}

function renderSwift(flat: FlatToken[]): string {
  const body = flat
    .map((token) => `  public static let ${toSwiftIdentifier(token.name)} = "${resolveTokenValue(token.value, tokens)}"`)
    .join("\n");
  return `public enum AurelglyphTokens {\n${body}\n}\n`;
}

function renderRails(flat: FlatToken[]): string {
  const body = flat
    .map((token) => `    "${token.name}" => "${resolveTokenValue(token.value, tokens)}"`)
    .join(",\n");
  return `module Aurelglyph\n  TOKENS = {\n${body}\n  }.freeze\nend\n`;
}

async function writeGeneratedFile(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

export async function buildTokens(): Promise<void> {
  const flat = flattenTokens(tokens);
  await writeGeneratedFile(join(generatedDir, "aurelglyph.css"), renderCss(flat));
  await writeGeneratedFile(join(generatedDir, "tokens.ts"), renderTypeScript(flat));
  await writeGeneratedFile(join(generatedDir, "react-native.ts"), renderReactNative(flat));
  await writeGeneratedFile(join(generatedDir, "AurelglyphTokens.swift"), renderSwift(flat));
  await writeGeneratedFile(join(generatedDir, "aurelglyph_tokens.rb"), renderRails(flat));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await buildTokens();
}
```

- [ ] **Step 8: Add token package index**

Create `packages/tokens/src/index.ts`:

```ts
export { buildTokens } from "./build";
export type { FlatToken, TokenTree } from "./types";
```

- [ ] **Step 9: Run token tests**

Run: `npm test -w @aurelglyph/tokens`

Expected: PASS.

- [ ] **Step 10: Build token outputs**

Run: `npm run build -w @aurelglyph/tokens`

Expected: files appear under `packages/tokens/dist/generated/`, including `aurelglyph.css`, `tokens.ts`, `react-native.ts`, `AurelglyphTokens.swift`, and `aurelglyph_tokens.rb`.

- [ ] **Step 11: Commit token compiler**

```bash
git add packages/tokens package.json package-lock.json
git commit -m "feat: add token compiler"
```

---

### Task 3: CSS, React Native, Swift, And Rails Adapter Skeletons

**Files:**
- Create: `packages/css/package.json`
- Create: `packages/css/src/index.css`
- Create: `packages/react-native/package.json`
- Create: `packages/react-native/src/index.ts`
- Create: `packages/swift/Package.swift`
- Create: `packages/swift/Sources/AurelglyphUI/AurelglyphTokens.swift`
- Create: `packages/rails/package.json`
- Create: `packages/rails/app/assets/stylesheets/aurelglyph.css`
- Create: `packages/rails/lib/aurelglyph/tokens.rb`

- [ ] **Step 1: Create CSS adapter package**

Create `packages/css/package.json`:

```json
{
  "name": "@aurelglyph/css",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.css"
  },
  "scripts": {
    "build": "npm run build -w @aurelglyph/tokens"
  }
}
```

Create `packages/css/src/index.css`:

```css
@import "../../tokens/dist/generated/aurelglyph.css";

* {
  box-sizing: border-box;
}

html {
  background: var(--ag-color-semantic-background);
  color: var(--ag-color-semantic-foreground);
  font-family: var(--ag-font-family-body);
}

.ag-focus-ring:focus-visible {
  outline: 2px solid var(--ag-color-semantic-focus);
  outline-offset: 2px;
}
```

- [ ] **Step 2: Create React Native adapter package**

Create `packages/react-native/package.json`:

```json
{
  "name": "@aurelglyph/react-native",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "npm run build -w @aurelglyph/tokens"
  },
  "dependencies": {
    "@aurelglyph/tokens": "0.1.0"
  }
}
```

Create `packages/react-native/src/index.ts`:

```ts
export { aurelglyphTheme } from "../../tokens/dist/generated/react-native";
```

- [ ] **Step 3: Create Swift package skeleton**

Create `packages/swift/Package.swift`:

```swift
// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "AurelglyphUI",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(name: "AurelglyphUI", targets: ["AurelglyphUI"])
    ],
    targets: [
        .target(name: "AurelglyphUI")
    ]
)
```

Create `packages/swift/Sources/AurelglyphUI/AurelglyphTokens.swift` by copying the generated file from `packages/tokens/dist/generated/AurelglyphTokens.swift` after Task 2 build.

- [ ] **Step 4: Create Rails adapter skeleton**

Create `packages/rails/package.json`:

```json
{
  "name": "aurelglyph-rails",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "npm run build -w @aurelglyph/tokens"
  }
}
```

Create `packages/rails/app/assets/stylesheets/aurelglyph.css` by copying `packages/tokens/dist/generated/aurelglyph.css`.

Create `packages/rails/lib/aurelglyph/tokens.rb` by copying `packages/tokens/dist/generated/aurelglyph_tokens.rb`.

- [ ] **Step 5: Build adapters**

Run: `npm run build`

Expected: token build succeeds, adapter packages complete without errors.

- [ ] **Step 6: Commit adapter skeletons**

```bash
git add packages/css packages/react-native packages/swift packages/rails
git commit -m "feat: add platform adapter skeletons"
```

---

### Task 4: Starter React Components

**Files:**
- Create: `packages/react/package.json`
- Create: `packages/react/tsconfig.json`
- Create: `packages/react/src/index.ts`
- Create: `packages/react/src/components/Icon.tsx`
- Create: `packages/react/src/components/Button.tsx`
- Create: `packages/react/src/components/TextField.tsx`
- Create: `packages/react/src/components/TextArea.tsx`
- Create: `packages/react/src/components/FileUpload.tsx`
- Create: `packages/react/src/styles.css`
- Create: `packages/react/src/components/Button.test.ts`

- [ ] **Step 1: Create React package metadata**

Create `packages/react/package.json`:

```json
{
  "name": "@aurelglyph/react",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./styles.css": "./src/styles.css"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run src/**/*.test.ts"
  },
  "peerDependencies": {
    "react": "^19.1.0"
  },
  "dependencies": {
    "@aurelglyph/tokens": "0.1.0"
  }
}
```

- [ ] **Step 2: Create React package TypeScript config**

Create `packages/react/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": false,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["src/**/*.test.ts"]
}
```

- [ ] **Step 3: Add icon contract**

Create `packages/react/src/components/Icon.tsx`:

```tsx
export type AurelglyphIconName =
  | "upload"
  | "attachment"
  | "microphone"
  | "camera"
  | "video"
  | "image"
  | "play"
  | "pause"
  | "record"
  | "stop"
  | "send"
  | "save"
  | "search"
  | "filter"
  | "settings"
  | "edit"
  | "delete"
  | "close"
  | "back"
  | "forward"
  | "check"
  | "warning"
  | "info"
  | "success";

const labels: Record<AurelglyphIconName, string> = {
  upload: "Upload",
  attachment: "Attachment",
  microphone: "Microphone",
  camera: "Camera",
  video: "Video",
  image: "Image",
  play: "Play",
  pause: "Pause",
  record: "Record",
  stop: "Stop",
  send: "Send",
  save: "Save",
  search: "Search",
  filter: "Filter",
  settings: "Settings",
  edit: "Edit",
  delete: "Delete",
  close: "Close",
  back: "Back",
  forward: "Forward",
  check: "Check",
  warning: "Warning",
  info: "Info",
  success: "Success"
};

export function Icon({ name, title }: { name: AurelglyphIconName; title?: string }) {
  return (
    <span className="ag-icon" aria-label={title ?? labels[name]} role="img" data-icon={name}>
      {name}
    </span>
  );
}
```

- [ ] **Step 4: Add Button component**

Create `packages/react/src/components/Button.tsx`:

```tsx
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type AurelglyphIconName } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: AurelglyphIconName;
  children: ReactNode;
};

export function Button({ variant = "primary", icon, children, className = "", ...props }: ButtonProps) {
  return (
    <button className={`ag-button ag-button--${variant} ${className}`.trim()} {...props}>
      {icon ? <Icon name={icon} /> : null}
      <span>{children}</span>
    </button>
  );
}
```

- [ ] **Step 5: Add form components and file upload**

Create `packages/react/src/components/TextField.tsx`:

```tsx
import type { InputHTMLAttributes } from "react";

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function TextField({ label, error, id, className = "", ...props }: TextFieldProps) {
  const inputId = id ?? `ag-field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label className={`ag-field ${className}`.trim()} htmlFor={inputId}>
      <span className="ag-field__label">{label}</span>
      <input id={inputId} className="ag-input" aria-invalid={Boolean(error)} {...props} />
      {error ? <span className="ag-field__error">{error}</span> : null}
    </label>
  );
}
```

Create `packages/react/src/components/TextArea.tsx`:

```tsx
import type { TextareaHTMLAttributes } from "react";

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export function TextArea({ label, error, id, className = "", ...props }: TextAreaProps) {
  const inputId = id ?? `ag-area-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label className={`ag-field ${className}`.trim()} htmlFor={inputId}>
      <span className="ag-field__label">{label}</span>
      <textarea id={inputId} className="ag-textarea" aria-invalid={Boolean(error)} {...props} />
      {error ? <span className="ag-field__error">{error}</span> : null}
    </label>
  );
}
```

Create `packages/react/src/components/FileUpload.tsx`:

```tsx
import type { InputHTMLAttributes } from "react";
import { Icon } from "./Icon";

export type FileUploadProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helpText?: string;
};

export function FileUpload({ label, helpText = "Choose a file or drop one here.", id, className = "", ...props }: FileUploadProps) {
  const inputId = id ?? `ag-upload-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label className={`ag-upload ${className}`.trim()} htmlFor={inputId}>
      <Icon name="upload" />
      <span className="ag-upload__label">{label}</span>
      <span className="ag-upload__help">{helpText}</span>
      <input id={inputId} className="ag-upload__input" type="file" {...props} />
    </label>
  );
}
```

- [ ] **Step 6: Add React styles**

Create `packages/react/src/styles.css`:

```css
.ag-button {
  align-items: center;
  border: 1px solid transparent;
  border-radius: var(--ag-radius-md);
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-weight: var(--ag-font-weight-semibold);
  gap: var(--ag-space-2);
  min-height: 2.5rem;
  padding: 0 var(--ag-space-4);
  transition: background var(--ag-motion-duration-fast) var(--ag-motion-easing-standard), border-color var(--ag-motion-duration-fast) var(--ag-motion-easing-standard);
}

.ag-button:focus-visible,
.ag-input:focus-visible,
.ag-textarea:focus-visible,
.ag-upload:focus-within {
  outline: 2px solid var(--ag-color-semantic-focus);
  outline-offset: 2px;
}

.ag-button--primary {
  background: var(--ag-color-semantic-accent);
  color: var(--ag-color-semantic-accent-foreground);
}

.ag-button--secondary {
  background: var(--ag-color-semantic-surface);
  border-color: var(--ag-color-semantic-border-strong);
  color: var(--ag-color-semantic-foreground);
}

.ag-button--danger {
  background: var(--ag-color-semantic-danger);
  color: white;
}

.ag-button--ghost {
  background: transparent;
  color: var(--ag-color-semantic-foreground);
}

.ag-field {
  display: grid;
  gap: var(--ag-space-2);
}

.ag-field__label {
  color: var(--ag-color-semantic-foreground);
  font-size: var(--ag-font-size-sm);
  font-weight: var(--ag-font-weight-medium);
}

.ag-input,
.ag-textarea {
  background: var(--ag-color-semantic-surface);
  border: 1px solid var(--ag-color-semantic-border-strong);
  border-radius: var(--ag-radius-md);
  color: var(--ag-color-semantic-foreground);
  font: inherit;
  min-height: 2.5rem;
  padding: var(--ag-space-2) var(--ag-space-3);
}

.ag-textarea {
  min-height: 6rem;
  resize: vertical;
}

.ag-field__error {
  color: var(--ag-color-semantic-danger);
  font-size: var(--ag-font-size-sm);
}

.ag-upload {
  align-items: center;
  background: var(--ag-color-semantic-surface);
  border: 1px dashed var(--ag-color-semantic-border-strong);
  border-radius: var(--ag-radius-lg);
  cursor: pointer;
  display: grid;
  gap: var(--ag-space-2);
  justify-items: center;
  padding: var(--ag-space-6);
  text-align: center;
}

.ag-upload__input {
  inline-size: 1px;
  opacity: 0;
  position: absolute;
}
```

- [ ] **Step 7: Add exports**

Create `packages/react/src/index.ts`:

```ts
export { Button, type ButtonProps, type ButtonVariant } from "./components/Button";
export { FileUpload, type FileUploadProps } from "./components/FileUpload";
export { Icon, type AurelglyphIconName } from "./components/Icon";
export { TextArea, type TextAreaProps } from "./components/TextArea";
export { TextField, type TextFieldProps } from "./components/TextField";
```

- [ ] **Step 8: Add component test**

Create `packages/react/src/components/Button.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("is a function component", () => {
    expect(typeof Button).toBe("function");
  });
});
```

- [ ] **Step 9: Run React package tests**

Run: `npm test -w @aurelglyph/react`

Expected: PASS.

- [ ] **Step 10: Build React package**

Run: `npm run build -w @aurelglyph/react`

Expected: PASS and `packages/react/dist/` is created.

- [ ] **Step 11: Commit React starters**

```bash
git add packages/react
git commit -m "feat: add starter react components"
```

---

### Task 5: React Example App

**Files:**
- Create: `examples/react-vite/package.json`
- Create: `examples/react-vite/index.html`
- Create: `examples/react-vite/src/main.tsx`
- Create: `examples/react-vite/src/App.tsx`
- Create: `examples/react-vite/src/app.css`

- [ ] **Step 1: Create example app metadata**

Create `examples/react-vite/package.json`:

```json
{
  "name": "@aurelglyph/example-react-vite",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@aurelglyph/css": "0.1.0",
    "@aurelglyph/react": "0.1.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "vite": "^6.3.5",
    "@vitejs/plugin-react": "^4.4.1"
  },
  "devDependencies": {}
}
```

- [ ] **Step 2: Create Vite HTML entry**

Create `examples/react-vite/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Aurelglyph Example</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Create app entry**

Create `examples/react-vite/src/main.tsx`:

```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import "@aurelglyph/css";
import "@aurelglyph/react/styles.css";
import "./app.css";
import { App } from "./App";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 4: Create adoption proof screen**

Create `examples/react-vite/src/App.tsx`:

```tsx
import { Button, FileUpload, Icon, TextArea, TextField } from "@aurelglyph/react";

export function App() {
  return (
    <main className="demo-shell">
      <section className="demo-hero">
        <p className="demo-kicker">Aurelglyph Phase 1</p>
        <h1>Token-first UX language for product apps.</h1>
        <p>
          This example consumes Aurelglyph CSS variables and React components from local workspace packages.
        </p>
        <div className="demo-actions">
          <Button icon="upload">Upload file</Button>
          <Button variant="secondary" icon="microphone">Record audio</Button>
          <Button variant="ghost" icon="camera">Open camera</Button>
        </div>
      </section>

      <section className="demo-grid">
        <div className="demo-panel">
          <h2>Core fields</h2>
          <TextField label="Project name" placeholder="Aurelglyph" />
          <TextArea label="Notes" placeholder="Describe the product state..." />
        </div>
        <div className="demo-panel">
          <h2>Rich input</h2>
          <FileUpload label="Attach reference" />
          <div className="demo-icon-row" aria-label="Media controls">
            <Icon name="microphone" />
            <Icon name="camera" />
            <Icon name="video" />
            <Icon name="image" />
          </div>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Create example app styles**

Create `examples/react-vite/src/app.css`:

```css
body {
  margin: 0;
}

.demo-shell {
  display: grid;
  gap: var(--ag-space-8);
  margin: 0 auto;
  max-width: 1120px;
  padding: var(--ag-space-8);
}

.demo-hero {
  display: grid;
  gap: var(--ag-space-4);
}

.demo-kicker {
  color: var(--ag-color-semantic-accent);
  font-size: var(--ag-font-size-sm);
  font-weight: var(--ag-font-weight-bold);
  margin: 0;
  text-transform: uppercase;
}

.demo-hero h1 {
  font-size: clamp(2rem, 5vw, 4rem);
  line-height: var(--ag-font-lineHeight-tight);
  margin: 0;
  max-width: 12ch;
}

.demo-hero p {
  color: var(--ag-color-semantic-muted);
  font-size: var(--ag-font-size-lg);
  line-height: var(--ag-font-lineHeight-normal);
  margin: 0;
  max-width: 62ch;
}

.demo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ag-space-3);
}

.demo-grid {
  display: grid;
  gap: var(--ag-space-4);
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.demo-panel {
  background: var(--ag-color-semantic-surface);
  border: 1px solid var(--ag-color-semantic-border);
  border-radius: var(--ag-radius-lg);
  display: grid;
  gap: var(--ag-space-4);
  padding: var(--ag-space-5);
}

.demo-panel h2 {
  font-size: var(--ag-font-size-xl);
  margin: 0;
}

.demo-icon-row {
  display: flex;
  gap: var(--ag-space-3);
}
```

- [ ] **Step 6: Build example app**

Run: `npm run build -w @aurelglyph/example-react-vite`

Expected: PASS and Vite writes `examples/react-vite/dist/`.

- [ ] **Step 7: Commit example app**

```bash
git add examples/react-vite package.json package-lock.json
git commit -m "feat: add react adoption example"
```

---

### Task 6: Verification And Initial Commit Hygiene

**Files:**
- Modify: `.gitignore`
- Modify: `README.md`

- [ ] **Step 1: Ensure generated and build outputs are intentionally handled**

Confirm `.gitignore` includes:

```gitignore
node_modules/
dist/
build/
coverage/
.vite/
.expo/
.swiftpm/
.superpowers/
```

Keep generated package outputs ignored for Phase 1 except copied Swift and Rails adapter files committed under their package source locations.

- [ ] **Step 2: Document Phase 1 package map**

Append to `README.md`:

```md
## Packages

- `@aurelglyph/tokens`: canonical tokens and generator
- `@aurelglyph/css`: CSS variables and base styles
- `@aurelglyph/react`: starter React components
- `@aurelglyph/react-native`: React Native theme export
- `AurelglyphUI`: SwiftUI package skeleton
- `aurelglyph-rails`: Rails-facing styles and token helper skeleton

## Example

Run the React example:

```bash
npm run dev -w @aurelglyph/example-react-vite
```
```

- [ ] **Step 3: Run full verification**

Run: `npm run verify`

Expected: PASS for builds, tests, and typecheck.

- [ ] **Step 4: Inspect git state**

Run: `git status --short`

Expected: only intentional uncommitted files appear. No `node_modules/`, package `dist/`, Vite `dist/`, or `.superpowers/` files should appear.

- [ ] **Step 5: Commit verification documentation**

```bash
git add .gitignore README.md docs/superpowers/plans/2026-05-14-aurelglyph-phase-1.md
git commit -m "docs: add phase 1 implementation plan"
```

---

## Final Verification

After all tasks:

```bash
npm run verify
git status --short
```

Expected:

- `npm run verify` passes.
- `git status --short` is clean.
- The repo contains committed scaffolding, the approved spec, the Phase 1 plan, token generation, platform adapter skeletons, starter React components, and the React example app.

## Push Readiness

Before pushing, confirm the remote target and visibility with the user. If the default branch is `master`, rename it first:

```bash
git branch -M main
```

Then add the confirmed remote URL and push `main`. This push step is intentionally gated because the approved design spec requires confirming repository owner, visibility, and publication targets before the first push.
