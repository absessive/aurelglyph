import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const workspace = new URL("../", import.meta.url);
const policy = JSON.parse(await readFile(new URL("../security/npm-audit-policy.json", import.meta.url), "utf8"));
const today = new Date().toISOString().slice(0, 10);

if (today > policy.expires) {
  throw new Error(`The npm audit exception policy expired on ${policy.expires}; review upstream React Native tooling again.`);
}

const audit = spawnSync("npm", ["audit", "--json"], {
  cwd: workspace,
  encoding: "utf8",
  maxBuffer: 32 * 1024 * 1024
});
if (!audit.stdout) {
  throw new Error(`npm audit did not return JSON: ${audit.stderr || `exit ${audit.status}`}`);
}

const report = JSON.parse(audit.stdout);
if (report.error || !report.metadata || typeof report.vulnerabilities !== "object") {
  throw new Error(`npm audit did not return a vulnerability report: ${report.message ?? audit.stderr ?? `exit ${audit.status}`}`);
}

const vulnerabilities = report.vulnerabilities ?? {};
const critical = Object.values(vulnerabilities).filter((vulnerability) => vulnerability.severity === "critical");
if (critical.length > 0) {
  throw new Error(`Critical npm advisories are never allowed: ${critical.map(({ name }) => name).join(", ")}`);
}

function directAdvisory(via) {
  const id = /\/advisories\/([^/?#]+)/u.exec(via.url ?? "")?.[1] ?? `npm:${via.source}`;
  return {
    id,
    source: via.source,
    url: via.url,
    severity: via.severity,
    range: via.range
  };
}

function collectAdvisories(packageName, visited = new Set()) {
  if (visited.has(packageName)) return [];
  const vulnerability = vulnerabilities[packageName];
  if (!vulnerability) {
    throw new Error(`npm audit references ${packageName}, but did not include its vulnerability record.`);
  }

  const nextVisited = new Set(visited).add(packageName);
  const advisories = vulnerability.via.flatMap((via) => (
    typeof via === "string" ? collectAdvisories(via, nextVisited) : [directAdvisory(via)]
  ));
  return [...new Map(advisories.map((advisory) => [JSON.stringify(advisory), advisory])).values()];
}

function fingerprint(advisory, affected) {
  return JSON.stringify({
    advisory: {
      id: advisory.id,
      source: advisory.source,
      url: advisory.url,
      severity: advisory.severity,
      range: advisory.range
    },
    affected: {
      package: affected.package,
      severity: affected.severity,
      range: affected.range,
      path: affected.path
    }
  });
}

function policyFingerprints() {
  if (!Array.isArray(policy.allowedAdvisories)) {
    throw new Error("security/npm-audit-policy.json must define allowedAdvisories as an array.");
  }

  return policy.allowedAdvisories.flatMap((advisory) => {
    const advisoryFields = [advisory.id, advisory.url, advisory.severity, advisory.range];
    if (advisoryFields.some((field) => typeof field !== "string") || !Number.isInteger(advisory.source)) {
      throw new Error("Every reviewed advisory must fingerprint its id, npm source, URL, severity, and affected range.");
    }
    if (!Array.isArray(advisory.affected) || advisory.affected.length === 0) {
      throw new Error(`${advisory.id} must list at least one exact affected package path.`);
    }

    return advisory.affected.map((affected) => {
      if ([affected.package, affected.severity, affected.range, affected.path].some((field) => typeof field !== "string")) {
        throw new Error(`${advisory.id} has an affected entry without package, severity, range, and path fingerprints.`);
      }
      return fingerprint(advisory, affected);
    });
  });
}

const actualFingerprints = Object.entries(vulnerabilities).flatMap(([packageName, vulnerability]) => {
  const advisories = collectAdvisories(packageName);
  if (advisories.length === 0) {
    throw new Error(`Unable to resolve an advisory identity for ${packageName}.`);
  }
  if (!Array.isArray(vulnerability.nodes) || vulnerability.nodes.length === 0) {
    throw new Error(`npm audit did not report an installed dependency path for ${packageName}.`);
  }
  return advisories.flatMap((advisory) => vulnerability.nodes.map((path) => fingerprint(advisory, {
    package: packageName,
    severity: vulnerability.severity,
    range: vulnerability.range,
    path
  })));
});
const reviewedFingerprints = policyFingerprints();

const actual = new Set(actualFingerprints);
const reviewed = new Set(reviewedFingerprints);
if (actual.size !== actualFingerprints.length || reviewed.size !== reviewedFingerprints.length) {
  throw new Error("The npm audit report or exception policy contains duplicate advisory fingerprints.");
}

const unreviewed = [...actual].filter((entry) => !reviewed.has(entry));
const stale = [...reviewed].filter((entry) => !actual.has(entry));
if (unreviewed.length > 0) {
  throw new Error(`Unreviewed npm advisory fingerprints: ${unreviewed.join("; ")}`);
}
if (stale.length > 0) {
  throw new Error(`Remove stale fingerprints from security/npm-audit-policy.json: ${stale.join("; ")}`);
}

const publicPackagePaths = [
  "packages/tokens/package.json",
  "packages/css/package.json",
  "packages/react/package.json",
  "packages/react-native/package.json"
];
for (const path of publicPackagePaths) {
  const manifest = JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));
  for (const dependency of Object.keys(manifest.dependencies ?? {})) {
    if (!dependency.startsWith("@aurelglyph/")) {
      throw new Error(`${join(path, "dependencies", dependency)} is an unreviewed published runtime dependency.`);
    }
  }
}

process.stdout.write(
  `npm security policy passed: ${actual.size} exact private-tooling advisory fingerprints, `
    + `0 unreviewed, 0 critical; policy expires ${policy.expires}.\n`
);
