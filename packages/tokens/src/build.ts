import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { FlatToken, TokenTree } from "./types";

const tokenSourcePath = fileURLToPath(new URL("./tokens.json", import.meta.url));
const generatedDir = fileURLToPath(new URL("../dist/generated/", import.meta.url));

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
  return `:root {\n${lines.join("\n")}\n}\n`;
}

function renderTypeScript(flat: FlatToken[], tree: TokenTree): string {
  const body = flat
    .map((token) => `  ${JSON.stringify(token.name)}: ${JSON.stringify(resolveTokenValue(token.value, tree))}`)
    .join(",\n");
  return `export const tokens = {\n${body}\n} as const;\n\nexport type AurelglyphTokenName = keyof typeof tokens;\n`;
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
  await writeGeneratedFile(join(generatedDir, "react-native.ts"), renderReactNative(flat, tokenTree));
  await writeGeneratedFile(join(generatedDir, "react-native.js"), renderReactNativeJavaScript(flat, tokenTree));
  await writeGeneratedFile(join(generatedDir, "react-native.d.ts"), renderReactNativeTypes(flat, tokenTree));
  await writeGeneratedFile(join(generatedDir, "AurelglyphTokens.swift"), renderSwift(flat, tokenTree));
  await writeGeneratedFile(join(generatedDir, "aurelglyph_tokens.rb"), renderRails(flat, tokenTree));
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  await buildTokens();
}
