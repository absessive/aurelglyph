import { homedir, tmpdir } from "node:os";
import { dirname, join, parse, resolve, sep } from "node:path";

function isDescendant(parent, candidate) {
  return candidate.startsWith(`${parent}${sep}`);
}

export function resolveUxOutputRoot(value, options = {}) {
  const workspace = resolve(options.workspace ?? resolve(import.meta.dirname, ".."));
  const temporaryRoot = resolve(options.temporaryRoot ?? tmpdir());
  const home = resolve(options.home ?? homedir());
  const candidate = resolve(value || join(temporaryRoot, "aurelglyph-ux-regression"));
  const filesystemRoot = parse(candidate).root;

  const forbidden = new Set([filesystemRoot, home, temporaryRoot, workspace]);
  if (forbidden.has(candidate) || isDescendant(candidate, workspace) || isDescendant(candidate, home)) {
    throw new Error(`Refusing unsafe Aurelglyph UX output root: ${candidate}`);
  }
  if (!isDescendant(temporaryRoot, candidate) && !isDescendant(workspace, candidate)) {
    throw new Error(
      `Aurelglyph UX output must be inside the workspace or temporary directory: ${candidate}`
    );
  }
  if (dirname(candidate) === candidate) {
    throw new Error(`Refusing filesystem root as Aurelglyph UX output: ${candidate}`);
  }
  return candidate;
}
