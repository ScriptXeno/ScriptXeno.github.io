import { execFile } from "node:child_process";

interface GhResult {
  status: number | null;
  data: any;
  raw: string;
}

/** ScriptXeno (the account these repos actually live under) is a separate GitHub account
 * from whichever one `gh auth login` is signed into locally — that account may only have
 * collaborator push-access to the blog repo itself, not account-level rights to create
 * new repos under ScriptXeno. So every call in this file authenticates via a PAT generated
 * from the ScriptXeno account, passed as GH_TOKEN, which `gh` honors as an override that
 * takes precedence over stored credentials — rather than relying on ambient `gh auth`. */
function scriptxenoToken(): string {
  const token = process.env.SCRIPTXENO_GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "SCRIPTXENO_GITHUB_TOKEN is not set — add a personal access token generated from the ScriptXeno account to tools/blog-mcp/.env (see .env.example)."
    );
  }
  return token;
}

function execGh(args: string[], stdin?: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      "gh",
      args,
      { maxBuffer: 1024 * 1024 * 50, env: { ...process.env, GH_TOKEN: scriptxenoToken() } },
      (err, stdout, stderr) => {
        if (err && typeof (err as NodeJS.ErrnoException).code !== "number") {
          // Spawn-level failure (e.g. `gh` missing from PATH) rather than a nonzero exit
          // from an HTTP error — that's a real failure, not something to parse.
          reject(err);
          return;
        }
        resolve({ stdout, stderr });
      }
    );
    if (stdin !== undefined) {
      child.stdin!.write(stdin);
      child.stdin!.end();
    }
  });
}

/** Runs `gh api --include <args>`, tolerating HTTP error statuses instead of throwing, so
 * callers can treat 404/409 as meaningful results rather than exceptions. `--include`
 * prepends the real HTTP status line to stdout — `gh` does NOT otherwise report the
 * numeric status anywhere (confirmed live: without it, a successful 201 Create looks
 * identical to any other non-empty response, which previously caused a real bug where a
 * successful repo creation was misreported as a failure). */
async function ghApi(args: string[], stdin?: string): Promise<GhResult> {
  const { stdout, stderr } = await execGh(["api", "--include", ...args], stdin);
  const statusMatch = stdout.match(/^HTTP\/[\d.]+ (\d+)/);
  const status = statusMatch ? Number(statusMatch[1]) : null;
  if (status === null) {
    throw new Error(`gh api ${args.join(" ")} failed: ${stderr.trim() || stdout.trim()}`);
  }
  const bodyMatch = stdout.match(/\r?\n\r?\n([\s\S]*)$/);
  const bodyText = bodyMatch ? bodyMatch[1].trim() : "";
  let data: any = null;
  if (bodyText) {
    try {
      data = JSON.parse(bodyText);
    } catch {
      data = bodyText;
    }
  }
  return { status, data, raw: stdout };
}

export interface RepoInfo {
  name: string;
  fullName: string;
  defaultBranch: string;
  htmlUrl: string;
}

export async function getRepo(owner: string, repo: string): Promise<RepoInfo | null> {
  const res = await ghApi([`repos/${owner}/${repo}`]);
  if (res.status === 404) return null;
  if (res.status !== 200) throw new Error(`Unexpected status checking repo ${owner}/${repo}: ${res.status}`);
  return {
    name: res.data.name,
    fullName: res.data.full_name,
    defaultBranch: res.data.default_branch,
    htmlUrl: res.data.html_url,
  };
}

/** Creates a repo with `auto_init: true` so it (a) reports its real default_branch directly
 * in the response and (b) already has a first commit, so Pages can be enabled immediately
 * without an empty-repo/no-branches ordering hazard. */
export async function createRepo(
  owner: string,
  name: string,
  opts: { description?: string } = {}
): Promise<RepoInfo> {
  const body: Record<string, unknown> = {
    name,
    private: false,
    auto_init: true,
  };
  if (opts.description) body.description = opts.description;
  const res = await ghApi(["user/repos", "--method", "POST", "--input", "-"], JSON.stringify(body));
  if (res.status !== 201) {
    throw new Error(`Failed to create repo ${owner}/${name}: HTTP ${res.status} ${JSON.stringify(res.data)}`);
  }
  return {
    name: res.data.name,
    fullName: res.data.full_name,
    defaultBranch: res.data.default_branch,
    htmlUrl: res.data.html_url,
  };
}

export async function enablePages(owner: string, repo: string, branch: string): Promise<{ url: string }> {
  const body = JSON.stringify({ source: { branch, path: "/" } });
  const res = await ghApi([`repos/${owner}/${repo}/pages`, "--method", "POST", "--input", "-"], body);
  if (res.status !== 201 && res.status !== 409) {
    throw new Error(`Failed to enable Pages for ${owner}/${repo}: HTTP ${res.status} ${JSON.stringify(res.data)}`);
  }
  const info = await ghApi([`repos/${owner}/${repo}/pages`]);
  const url = info.data?.html_url ?? `https://${owner.toLowerCase()}.github.io/${repo}/`;
  return { url };
}

/** Upserts a file at the repo root via the Contents API: GETs first to find an existing
 * `sha` (update) or 404 (create), then PUTs accordingly. `branch` is deliberately omitted
 * from the request body so it always targets the repo's actual default branch. */
export async function putFileContents(
  owner: string,
  repo: string,
  filePath: string,
  contentBuffer: Buffer,
  message: string
): Promise<{ htmlUrl: string }> {
  const existing = await ghApi([`repos/${owner}/${repo}/contents/${filePath}`]);
  const sha = existing.status === 200 ? existing.data.sha : undefined;

  const body: Record<string, unknown> = {
    message,
    content: contentBuffer.toString("base64"),
  };
  if (sha) body.sha = sha;

  const res = await ghApi(
    [`repos/${owner}/${repo}/contents/${filePath}`, "--method", "PUT", "--input", "-"],
    JSON.stringify(body)
  );
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Failed to upload ${filePath} to ${owner}/${repo}: HTTP ${res.status} ${JSON.stringify(res.data)}`);
  }
  return { htmlUrl: res.data.content.html_url };
}
