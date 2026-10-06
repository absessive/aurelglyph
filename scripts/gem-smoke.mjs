import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const temporaryRoot = await mkdtemp(join(tmpdir(), "aurelglyph-gem-smoke-"));
const gemPath = join(temporaryRoot, "aurelglyph-rails.gem");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", ...options });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed:\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout;
}

try {
  const version = JSON.parse(await readFile(join(root, "package.json"), "utf8")).version;
  run("gem", ["build", "aurelglyph-rails.gemspec", "--output", gemPath], {
    cwd: join(root, "packages/rails")
  });
  run("ruby", [
    "-rrubygems/package",
    "-e",
    [
      "package = Gem::Package.new(ARGV.fetch(0))",
      `abort "wrong version" unless package.spec.version.to_s == ${JSON.stringify(version)}`,
      "files = package.contents",
      "%w[lib/aurelglyph.rb lib/aurelglyph/rails/helper.rb app/assets/stylesheets/aurelglyph.css app/assets/javascripts/aurelglyph.js].each { |path| abort \"missing #{path}\" unless files.include?(path) }"
    ].join("; "),
    gemPath
  ]);
  run("gem", ["unpack", gemPath, "--target", temporaryRoot]);
  const unpackedEntries = await readdir(temporaryRoot, { withFileTypes: true });
  const unpackedName = unpackedEntries
    .find((entry) => entry.isDirectory() && entry.name.startsWith("aurelglyph-rails"))?.name;
  if (!unpackedName) {
    throw new Error(`Gem unpack did not create an Aurelglyph package directory: ${unpackedEntries.map(({ name }) => name).join(", ")}`);
  }
  run("bundle", [
    "exec",
    "ruby",
    "-I",
    join(temporaryRoot, unpackedName, "lib"),
    "-e",
    `require "aurelglyph"; abort "load failed" unless Aurelglyph::Rails::VERSION == ${JSON.stringify(version)}; %i[aurelglyph_link aurelglyph_chip aurelglyph_password_field aurelglyph_input_group aurelglyph_validation_summary aurelglyph_accordion aurelglyph_stepper aurelglyph_rating].each { |name| abort "missing #{name}" unless Aurelglyph::Rails::Helper.instance_methods.include?(name) }`
  ]);
  process.stdout.write(`Gem smoke passed: aurelglyph-rails ${version} builds, contains its runtime assets, and loads.\n`);
} finally {
  await rm(temporaryRoot, { force: true, recursive: true });
}
