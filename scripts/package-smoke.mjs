import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
          'import { Button, Combobox, Dialog, MoreInformation } from "@aurelglyph/react";',
          'for (const value of [Button, Combobox, Dialog, MoreInformation]) if (typeof value !== "function") throw new Error("React export failed");',
          'const markup = renderToStaticMarkup(createElement(MoreInformation, { label: "Details" }, "Supporting copy"));',
          'if (!markup.includes("Supporting copy")) throw new Error("React server render failed");'
        ].join("\n")
      ],
      { cwd: consumer }
    );
  }

  for (const reactNativeVersion of ["0.86.0", "0.87.1"]) {
    const consumer = await createConsumer(`react-native-${reactNativeVersion.replaceAll(".", "-")}`);
    install(consumer, [
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
        'import type { ButtonProps, MoreInformationProps } from "@aurelglyph/react-native";',
        'const button: ButtonProps = { children: "Run" };',
        'const information: MoreInformationProps = { children: "Details", label: "System information" };',
        "void button;",
        "void information;",
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
  }

  process.stdout.write(
    `Package smoke passed: ${packages.length} tarballs fit budgets; React 19.1/19.2 and React Native 0.86/0.87 install with strict peers in clean consumers.\n`
  );
} finally {
  await rm(temporaryRoot, { force: true, recursive: true });
}
