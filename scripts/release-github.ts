import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

type GitHubRelease = {
  draft: boolean;
  name: string | null;
  prerelease: boolean;
  tag_name: string;
};

export type GitHubReleaseAction = "create" | "skip";

export function isPrereleaseTag(tag: string): boolean {
  return tag.includes("-");
}

export function planGitHubRelease(
  tag: string,
  title: string,
  prerelease: boolean,
  existing: GitHubRelease | null
): GitHubReleaseAction {
  if (!existing) return "create";
  if (
    existing.tag_name !== tag
    || existing.name !== title
    || existing.draft
    || existing.prerelease !== prerelease
  ) {
    throw new Error(`GitHub release ${tag} exists with unexpected metadata.`);
  }
  return "skip";
}

function requiredEnvironment(name: "GH_TOKEN" | "GITHUB_REF_NAME" | "GITHUB_REPOSITORY"): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required to publish the GitHub release.`);
  return value;
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const token = requiredEnvironment("GH_TOKEN");
  try {
    return await fetch(`https://api.github.com${path}`, {
      ...init,
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        "x-github-api-version": "2022-11-28",
        ...init.headers
      },
      signal: AbortSignal.timeout(30_000)
    });
  } catch (error) {
    throw new Error(`GitHub release request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function readRelease(repository: string, tag: string): Promise<GitHubRelease | null> {
  const response = await request(`/repos/${repository}/releases/tags/${encodeURIComponent(tag)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub release lookup returned HTTP ${response.status}.`);
  return await response.json() as GitHubRelease;
}

async function publishGitHubRelease(): Promise<void> {
  const repository = requiredEnvironment("GITHUB_REPOSITORY");
  const tag = requiredEnvironment("GITHUB_REF_NAME");
  if (!/^[\w.-]+\/[\w.-]+$/u.test(repository) || !/^v\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/u.test(tag)) {
    throw new Error("GITHUB_REPOSITORY or GITHUB_REF_NAME has an invalid release identity.");
  }

  const title = `Aurelglyph ${tag}`;
  const prerelease = isPrereleaseTag(tag);
  const existing = await readRelease(repository, tag);
  if (planGitHubRelease(tag, title, prerelease, existing) === "skip") {
    process.stdout.write(`Verified existing GitHub release ${tag}.\n`);
    return;
  }

  let publicationError: Error | undefined;
  try {
    const response = await request(`/repos/${repository}/releases`, {
      body: JSON.stringify({ draft: false, generate_release_notes: true, name: title, prerelease, tag_name: tag }),
      method: "POST"
    });
    if (!response.ok) publicationError = new Error(`GitHub release creation returned HTTP ${response.status}.`);
  } catch (error) {
    publicationError = error instanceof Error ? error : new Error(String(error));
  }

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const published = await readRelease(repository, tag);
    if (published) {
      planGitHubRelease(tag, title, prerelease, published);
      process.stdout.write(`${publicationError ? "Recovered and verified" : "Published and verified"} GitHub release ${tag}.\n`);
      return;
    }
    if (attempt < 3) await new Promise((resolveWait) => setTimeout(resolveWait, 1_000));
  }
  throw publicationError ?? new Error(`GitHub release ${tag} was not visible after publication.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  publishGitHubRelease().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
