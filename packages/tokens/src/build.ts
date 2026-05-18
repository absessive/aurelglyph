import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { FlatToken, TokenTree } from "./types";

const packageRoot = fileURLToPath(new URL("../", import.meta.url)).replace(/\/dist\/?$/, "");
const tokenSourcePath = join(packageRoot, "src", "tokens.json");
const generatedDir = join(packageRoot, "dist", "generated");

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

function renderCss(flat: FlatToken[], tree: TokenTree): string {
  const lines = flat.map((token) => `  ${toCssCustomPropertyName(token.name)}: ${resolveTokenValue(token.value, tree)};`);
  return `:root {\n${lines.join("\n")}\n}\n
:root {
  color-scheme: dark light;
  --ag-accent-50: var(--ag-color-accent-royal-purple-50);
  --ag-accent-100: var(--ag-color-accent-royal-purple-100);
  --ag-accent-200: var(--ag-color-accent-royal-purple-200);
  --ag-accent-300: var(--ag-color-accent-royal-purple-300);
  --ag-accent-400: var(--ag-color-accent-royal-purple-400);
  --ag-accent-500: var(--ag-color-accent-royal-purple-500);
  --ag-accent-600: var(--ag-color-accent-royal-purple-600);
  --ag-accent-rgb: var(--ag-color-accent-royal-purple-rgb);
}

:root,
:root[data-mode="dark"] {
  --ag-color-semantic-background: var(--ag-color-mode-dark-background);
  --ag-color-semantic-background-elevated: var(--ag-color-mode-dark-background-elevated);
  --ag-color-semantic-foreground: var(--ag-color-mode-dark-text);
  --ag-color-semantic-surface: var(--ag-color-mode-dark-surface);
  --ag-color-semantic-surface-muted: var(--ag-color-mode-dark-surface-2);
  --ag-color-semantic-surface-strong: var(--ag-color-mode-dark-surface-3);
  --ag-color-semantic-border: var(--ag-color-mode-dark-border-soft);
  --ag-color-semantic-border-strong: var(--ag-color-mode-dark-border);
  --ag-color-semantic-muted: var(--ag-color-mode-dark-text-muted);
  --ag-color-semantic-subtle: var(--ag-color-mode-dark-text-subtle);
  --ag-color-semantic-disabled: var(--ag-color-mode-dark-text-subtle);
  --ag-color-semantic-highlight: var(--ag-color-mode-dark-highlight);
  --ag-color-semantic-shadow: var(--ag-color-mode-dark-shadow);
  --ag-color-semantic-overlay: rgba(13, 13, 11, 0.72);
}

:root[data-mode="light"] {
  --ag-color-semantic-background: var(--ag-color-mode-light-background);
  --ag-color-semantic-background-elevated: var(--ag-color-mode-light-background-elevated);
  --ag-color-semantic-foreground: var(--ag-color-mode-light-text);
  --ag-color-semantic-surface: var(--ag-color-mode-light-surface);
  --ag-color-semantic-surface-muted: var(--ag-color-mode-light-surface-2);
  --ag-color-semantic-surface-strong: var(--ag-color-mode-light-surface-3);
  --ag-color-semantic-border: var(--ag-color-mode-light-border-soft);
  --ag-color-semantic-border-strong: var(--ag-color-mode-light-border);
  --ag-color-semantic-muted: var(--ag-color-mode-light-text-muted);
  --ag-color-semantic-subtle: var(--ag-color-mode-light-text-subtle);
  --ag-color-semantic-disabled: var(--ag-color-mode-light-text-subtle);
  --ag-color-semantic-highlight: var(--ag-color-mode-light-highlight);
  --ag-color-semantic-shadow: var(--ag-color-mode-light-shadow);
  --ag-color-semantic-overlay: rgba(42, 36, 30, 0.42);
}

:root[data-theme="amber"] {
  --ag-accent-50: var(--ag-color-accent-amber-50);
  --ag-accent-100: var(--ag-color-accent-amber-100);
  --ag-accent-200: var(--ag-color-accent-amber-200);
  --ag-accent-300: var(--ag-color-accent-amber-300);
  --ag-accent-400: var(--ag-color-accent-amber-400);
  --ag-accent-500: var(--ag-color-accent-amber-500);
  --ag-accent-600: var(--ag-color-accent-amber-600);
  --ag-accent-rgb: var(--ag-color-accent-amber-rgb);
}

:root[data-theme="forest"] {
  --ag-accent-50: var(--ag-color-accent-forest-50);
  --ag-accent-100: var(--ag-color-accent-forest-100);
  --ag-accent-200: var(--ag-color-accent-forest-200);
  --ag-accent-300: var(--ag-color-accent-forest-300);
  --ag-accent-400: var(--ag-color-accent-forest-400);
  --ag-accent-500: var(--ag-color-accent-forest-500);
  --ag-accent-600: var(--ag-color-accent-forest-600);
  --ag-accent-rgb: var(--ag-color-accent-forest-rgb);
}

:root[data-theme="royal-purple"] {
  --ag-accent-50: var(--ag-color-accent-royal-purple-50);
  --ag-accent-100: var(--ag-color-accent-royal-purple-100);
  --ag-accent-200: var(--ag-color-accent-royal-purple-200);
  --ag-accent-300: var(--ag-color-accent-royal-purple-300);
  --ag-accent-400: var(--ag-color-accent-royal-purple-400);
  --ag-accent-500: var(--ag-color-accent-royal-purple-500);
  --ag-accent-600: var(--ag-color-accent-royal-purple-600);
  --ag-accent-rgb: var(--ag-color-accent-royal-purple-rgb);
}

:root[data-theme="deep-blue"] {
  --ag-accent-50: var(--ag-color-accent-deep-blue-50);
  --ag-accent-100: var(--ag-color-accent-deep-blue-100);
  --ag-accent-200: var(--ag-color-accent-deep-blue-200);
  --ag-accent-300: var(--ag-color-accent-deep-blue-300);
  --ag-accent-400: var(--ag-color-accent-deep-blue-400);
  --ag-accent-500: var(--ag-color-accent-deep-blue-500);
  --ag-accent-600: var(--ag-color-accent-deep-blue-600);
  --ag-accent-rgb: var(--ag-color-accent-deep-blue-rgb);
}

:root[data-theme="cyan"] {
  --ag-accent-50: var(--ag-color-accent-cyan-50);
  --ag-accent-100: var(--ag-color-accent-cyan-100);
  --ag-accent-200: var(--ag-color-accent-cyan-200);
  --ag-accent-300: var(--ag-color-accent-cyan-300);
  --ag-accent-400: var(--ag-color-accent-cyan-400);
  --ag-accent-500: var(--ag-color-accent-cyan-500);
  --ag-accent-600: var(--ag-color-accent-cyan-600);
  --ag-accent-rgb: var(--ag-color-accent-cyan-rgb);
}

:root[data-theme="steel"] {
  --ag-accent-50: var(--ag-color-accent-steel-50);
  --ag-accent-100: var(--ag-color-accent-steel-100);
  --ag-accent-200: var(--ag-color-accent-steel-200);
  --ag-accent-300: var(--ag-color-accent-steel-300);
  --ag-accent-400: var(--ag-color-accent-steel-400);
  --ag-accent-500: var(--ag-color-accent-steel-500);
  --ag-accent-600: var(--ag-color-accent-steel-600);
  --ag-accent-rgb: var(--ag-color-accent-steel-rgb);
}

:root {
  --ag-color-semantic-accent: var(--ag-accent-300);
  --ag-color-semantic-accent-foreground: var(--ag-color-mode-dark-text);
  --ag-color-semantic-accent-control: var(--ag-accent-500);
  --ag-color-semantic-accent-control-strong: var(--ag-accent-600);
  --ag-color-semantic-accent-muted: rgba(var(--ag-accent-rgb), 0.14);
  --ag-color-semantic-focus: var(--ag-accent-300);
}
`;
}

function renderTypeScript(flat: FlatToken[], tree: TokenTree): string {
  const body = flat
    .map((token) => `  ${JSON.stringify(token.name)}: ${JSON.stringify(resolveTokenValue(token.value, tree))}`)
    .join(",\n");
  return `export const tokens = {\n${body}\n} as const;\n\nexport type AurelglyphTokenName = keyof typeof tokens;\n`;
}

function renderJavaScriptTokens(flat: FlatToken[], tree: TokenTree): string {
  const body = flat
    .map((token) => `  ${JSON.stringify(token.name)}: ${JSON.stringify(resolveTokenValue(token.value, tree))}`)
    .join(",\n");
  return `export const tokens = {\n${body}\n};\n`;
}

function renderTokenTypes(flat: FlatToken[], tree: TokenTree): string {
  const body = flat
    .map((token) => `  readonly ${JSON.stringify(token.name)}: ${JSON.stringify(resolveTokenValue(token.value, tree))};`)
    .join("\n");
  return `export declare const tokens: {\n${body}\n};\n\nexport type AurelglyphTokenName = keyof typeof tokens;\n`;
}

function renderReactNative(flat: FlatToken[], tree: TokenTree): string {
  const body = flat
    .map((token) => `  ${JSON.stringify(token.name)}: ${JSON.stringify(resolveTokenValue(token.value, tree))}`)
    .join(",\n");
  return `export const aurelglyphTheme = {\n${body}\n} as const;\n`;
}

function renderReactNativeJavaScript(flat: FlatToken[], tree: TokenTree): string {
  const body = flat
    .map((token) => `  ${JSON.stringify(token.name)}: ${JSON.stringify(resolveTokenValue(token.value, tree))}`)
    .join(",\n");
  return `export const aurelglyphTheme = {\n${body}\n};\n`;
}

function renderReactNativeTypes(flat: FlatToken[], tree: TokenTree): string {
  const body = flat
    .map((token) => `  readonly ${JSON.stringify(token.name)}: ${JSON.stringify(resolveTokenValue(token.value, tree))};`)
    .join("\n");
  return `export declare const aurelglyphTheme: {\n${body}\n};\n`;
}

function renderSwift(flat: FlatToken[], tree: TokenTree): string {
  const body = flat
    .map((token) => `  public static let ${toSwiftIdentifier(token.name)} = ${JSON.stringify(resolveTokenValue(token.value, tree))}`)
    .join("\n");
  return `public enum AurelglyphTokens {\n${body}\n}\n`;
}

function renderRails(flat: FlatToken[], tree: TokenTree): string {
  const body = flat
    .map((token) => `    ${JSON.stringify(token.name)} => ${JSON.stringify(resolveTokenValue(token.value, tree))}`)
    .join(",\n");
  return `module Aurelglyph\n  TOKENS = {\n${body}\n  }.freeze\nend\n`;
}

async function readTokens(): Promise<TokenTree> {
  return JSON.parse(await readFile(tokenSourcePath, "utf8")) as TokenTree;
}

async function writeGeneratedFile(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

export async function buildTokens(): Promise<void> {
  const tokenTree = await readTokens();
  const flat = flattenTokens(tokenTree);

  await writeGeneratedFile(join(generatedDir, "aurelglyph.css"), renderCss(flat, tokenTree));
  await writeGeneratedFile(join(generatedDir, "tokens.ts"), renderTypeScript(flat, tokenTree));
  await writeGeneratedFile(join(generatedDir, "tokens.js"), renderJavaScriptTokens(flat, tokenTree));
  await writeGeneratedFile(join(generatedDir, "tokens.d.ts"), renderTokenTypes(flat, tokenTree));
  await writeGeneratedFile(join(generatedDir, "react-native.ts"), renderReactNative(flat, tokenTree));
  await writeGeneratedFile(join(generatedDir, "react-native.js"), renderReactNativeJavaScript(flat, tokenTree));
  await writeGeneratedFile(join(generatedDir, "react-native.d.ts"), renderReactNativeTypes(flat, tokenTree));
  await writeGeneratedFile(join(generatedDir, "AurelglyphTokens.swift"), renderSwift(flat, tokenTree));
  await writeGeneratedFile(join(generatedDir, "aurelglyph_tokens.rb"), renderRails(flat, tokenTree));
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  await buildTokens();
}
