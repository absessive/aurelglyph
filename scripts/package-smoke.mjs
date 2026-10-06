import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const temporaryRoot = await mkdtemp(join(tmpdir(), "aurelglyph-package-smoke-"));
const cache = join(temporaryRoot, "npm-cache");

const packages = [
  {
    name: "@aurelglyph/tokens",
    path: "packages/tokens",
    maxBytes: 300_000,
    required: ["dist/index.js", "dist/index.d.ts", "dist/generated/aurelglyph.css", "src/tokens.json"]
  },
  {
    name: "@aurelglyph/css",
    path: "packages/css",
    maxBytes: 700_000,
    required: ["dist/index.css", "dist/fonts/ofl/OFL-1.1.txt", "README.md", "LICENSE.md"]
  },
  {
    name: "@aurelglyph/react",
    path: "packages/react",
    maxBytes: 400_000,
    required: ["dist/index.js", "dist/index.d.ts", "dist/styles.css", "README.md"]
  },
  {
    name: "@aurelglyph/react-native",
    path: "packages/react-native",
    maxBytes: 2_500_000,
    required: ["dist/index.js", "dist/index.d.ts", "assets/fonts/OFL-1.1.txt", "README.md"]
  }
];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, npm_config_cache: cache },
    maxBuffer: 32 * 1024 * 1024,
    ...options
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed:\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout;
}

async function pack(directory) {
  const output = run(
    "npm",
    ["pack", ".", "--ignore-scripts", "--json", "--pack-destination", temporaryRoot],
    { cwd: join(root, directory) }
  );
  let result;
  for (let index = output.lastIndexOf("["); index >= 0; index = output.lastIndexOf("[", index - 1)) {
    try {
      const parsed = JSON.parse(output.slice(index).trim());
      if (Array.isArray(parsed) && parsed[0]?.filename) {
        [result] = parsed;
        break;
      }
    } catch {
      // npm 10 may print workspace lifecycle output before its final JSON payload.
    }
  }
  if (!result) {
    throw new Error(`npm pack did not return a package result:\n${output}`);
  }
  return { ...result, tarball: join(temporaryRoot, result.filename) };
}

async function createConsumer(name) {
  const consumer = join(temporaryRoot, name);
  await mkdir(consumer, { recursive: true });
  await writeFile(
    join(consumer, "package.json"),
    `${JSON.stringify({ name: `aurelglyph-${name}`, private: true, type: "module" }, null, 2)}\n`
  );
  return consumer;
}

function install(consumer, dependencies) {
  run(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-package-lock",
      "--strict-peer-deps",
      ...dependencies
    ],
    { cwd: consumer }
  );
}

try {
  const rootVersion = JSON.parse(await readFile(join(root, "package.json"), "utf8")).version;
  const tarballs = new Map();

  for (const definition of packages) {
    const packed = await pack(definition.path);
    const files = new Set(packed.files.map(({ path }) => path));
    if (packed.size > definition.maxBytes) {
      throw new Error(`${definition.name} tarball is ${packed.size} bytes; budget is ${definition.maxBytes}.`);
    }
    for (const required of definition.required) {
      if (!files.has(required)) throw new Error(`${definition.name} tarball is missing ${required}.`);
    }
    if (packed.version !== rootVersion) {
      throw new Error(`${definition.name} packed ${packed.version}; workspace is ${rootVersion}.`);
    }
    tarballs.set(definition.name, packed.tarball);
  }

  const tokensTarball = tarballs.get("@aurelglyph/tokens");
  const cssTarball = tarballs.get("@aurelglyph/css");
  const reactTarball = tarballs.get("@aurelglyph/react");
  const reactNativeTarball = tarballs.get("@aurelglyph/react-native");
  if (!tokensTarball || !cssTarball || !reactTarball || !reactNativeTarball) {
    throw new Error("A publishable package tarball was not created.");
  }

  const sharedConsumer = await createConsumer("shared-consumer");
  install(sharedConsumer, [tokensTarball, cssTarball]);
  run(
    "node",
    [
      "--input-type=module",
      "--eval",
      [
        'import { tokens } from "@aurelglyph/tokens/tokens";',
        'if (!tokens["color.mode.dark.background"]) throw new Error("Token import failed");',
      ].join("\n")
    ],
    { cwd: sharedConsumer }
  );
  await readFile(join(sharedConsumer, "node_modules/@aurelglyph/css/dist/index.css"), "utf8");

  for (const reactVersion of ["19.1.0", "19.2.3"]) {
    const consumer = await createConsumer(`react-${reactVersion.replaceAll(".", "-")}`);
    install(consumer, [
      `react@${reactVersion}`,
      `react-dom@${reactVersion}`,
      tokensTarball,
      reactTarball
    ]);
    run(
      "node",
      [
        "--input-type=module",
        "--eval",
        [
          'import { createElement } from "react";',
          'import { renderToStaticMarkup } from "react-dom/server";',
          'import { Accordion, Button, Chip, Combobox, Dialog, InputGroup, Link, MoreInformation, PasswordField, Rating, Stepper, ValidationSummary } from "@aurelglyph/react";',
          'for (const value of [Accordion, Button, Chip, Combobox, Dialog, InputGroup, Link, MoreInformation, PasswordField, Rating, Stepper, ValidationSummary]) if (typeof value !== "function") throw new Error("React export failed");',
          'const markup = renderToStaticMarkup(createElement(MoreInformation, { label: "Details" }, "Supporting copy"));',
          'if (!markup.includes("Supporting copy")) throw new Error("React server render failed");',
          'const essentials = renderToStaticMarkup(createElement("div", null, createElement(Link, { href: "#guide" }, "Guide"), createElement(Chip, { label: "Local" }), createElement(PasswordField, { label: "Password" }), createElement(InputGroup, { label: "Amount", leading: "$" }), createElement(ValidationSummary, { errors: [{ id: "amount", message: "Check amount" }] }), createElement(Accordion, { items: [{ id: "local", title: "Local", content: "Panel" }] }), createElement(Stepper, { items: [{ id: "review", label: "Review" }] }), createElement(Rating, { label: "Experience", defaultValue: 3 })));',
          'if (!essentials.includes("type=\\"password\\"") || !essentials.includes("type=\\"radio\\"")) throw new Error("Catalog SSR failed");'
        ].join("\n")
      ],
      { cwd: consumer }
    );
  }

  for (const reactNativeVersion of ["0.86.0", "0.87.1"]) {
    const consumer = await createConsumer(`react-native-${reactNativeVersion.replaceAll(".", "-")}`);
    install(consumer, [
      "@react-native-community/cli@20.2.0",
      `@react-native/metro-config@${reactNativeVersion}`,
      "@types/react@19.2.0",
      "react@19.2.3",
      `react-native@${reactNativeVersion}`,
      "react-native-safe-area-context@5.5.2",
      tokensTarball,
      reactNativeTarball
    ]);
    await writeFile(
      join(consumer, "index.tsx"),
      [
        'import type { AccordionProps, ButtonProps, ChipProps, InputGroupProps, LinkProps, MoreInformationProps, PasswordFieldProps, RatingProps, StepperProps, ValidationSummaryProps } from "@aurelglyph/react-native";',
        'const button: ButtonProps = { children: "Run" };',
        'const information: MoreInformationProps = { children: "Details", label: "System information" };',
        "void button;",
        "void information;",
        'const link: LinkProps = { children: "Guide", href: "https://example.com" };',
        'const chip: ChipProps = { label: "Local", defaultSelected: true };',
        'const password: PasswordFieldProps = { label: "Password", purpose: "new" };',
        'const group: InputGroupProps = { label: "Amount", prefix: "$", suffix: "USD", addonDescription: "US dollars" };',
        'const summary: ValidationSummaryProps = { errors: [{ id: "amount", message: "Check amount" }], focusKey: 1 };',
        'const accordion: AccordionProps = { items: [], defaultValue: [], type: "multiple" };',
        'const stepper: StepperProps = { items: [{ id: "review", label: "Review" }], currentId: "review" };',
        'const rating: RatingProps = { label: "Experience", defaultValue: 3, max: 5 };',
        "void [link, chip, password, group, summary, accordion, stepper, rating];",
        ""
      ].join("\n")
    );
    const runtimeMarker = `Aurelglyph RN ${reactNativeVersion} clean-consumer runtime`;
    await writeFile(
      join(consumer, "index.js"),
      [
        'import React from "react";',
        'import { AppRegistry, Text } from "react-native";',
        'import { Accordion, AurelglyphProvider, Chip, InputGroup, Link, MoreInformation, PasswordField, Rating, Select, Stepper, ValidationSummary } from "@aurelglyph/react-native";',
        `const marker = ${JSON.stringify(runtimeMarker)};`,
        "function App() {",
        "  return React.createElement(AurelglyphProvider, { mode: 'light' },",
        "    React.createElement(Text, null, marker),",
        "    React.createElement(Select, { label: 'Mode', options: [{ label: 'Quiet', value: 'quiet' }] }),",
        "    React.createElement(MoreInformation, { label: 'Details' }, React.createElement(Text, null, 'Supporting copy')),",
        "    React.createElement(Link, { href: 'https://example.com' }, 'Guide'),",
        "    React.createElement(Chip, { label: 'Local', defaultSelected: true }),",
        "    React.createElement(PasswordField, { label: 'Password' }),",
        "    React.createElement(InputGroup, { label: 'Amount', prefix: '$', suffix: 'USD', addonDescription: 'US dollars' }),",
        "    React.createElement(ValidationSummary, { errors: [{ id: 'amount', message: 'Check amount' }] }),",
        "    React.createElement(Accordion, { items: [{ id: 'local', title: 'Local', content: React.createElement(Text, null, 'Panel') }] }),",
        "    React.createElement(Stepper, { items: [{ id: 'review', label: 'Review' }] }),",
        "    React.createElement(Rating, { label: 'Experience', defaultValue: 3 })",
        "  );",
        "}",
        "AppRegistry.registerComponent('AurelglyphConsumer', () => App);",
        ""
      ].join("\n")
    );
    await writeFile(
      join(consumer, "metro.config.cjs"),
      [
        'const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");',
        "module.exports = mergeConfig(getDefaultConfig(__dirname), {});",
        ""
      ].join("\n")
    );
    await writeFile(
      join(consumer, "tsconfig.json"),
      `${JSON.stringify({
        compilerOptions: {
          jsx: "react-jsx",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          noEmit: true,
          skipLibCheck: true,
          strict: true,
          target: "ES2022"
        },
        include: ["index.tsx"]
      }, null, 2)}\n`
    );
    run(join(root, "node_modules/.bin/tsc"), ["-p", "tsconfig.json"], { cwd: consumer });

    const bundleOutput = join(consumer, "runtime.ios.jsbundle");
    const assetsDestination = join(consumer, "runtime-assets");
    await mkdir(assetsDestination, { recursive: true });
    run(
      "node",
      [
        "node_modules/react-native/cli.js",
        "bundle",
        "--entry-file",
        "index.js",
        "--platform",
        "ios",
        "--dev",
        "false",
        "--minify",
        "true",
        "--bundle-output",
        bundleOutput,
        "--assets-dest",
        assetsDestination,
        "--config",
        "metro.config.cjs"
      ],
      { cwd: consumer }
    );
    const bundle = await readFile(bundleOutput, "utf8");
    const bundleSize = (await stat(bundleOutput)).size;
    if (bundleSize < 1_024 || !bundle.includes(runtimeMarker)) {
      throw new Error(`React Native ${reactNativeVersion} clean-consumer runtime bundle was incomplete.`);
    }
  }

  process.stdout.write(
    `Package smoke passed: ${packages.length} tarballs fit budgets; React 19.1/19.2 and React Native 0.86/0.87 install, typecheck, and bundle with strict peers in clean consumers.\n`
  );
} finally {
  await rm(temporaryRoot, { force: true, recursive: true });
}
