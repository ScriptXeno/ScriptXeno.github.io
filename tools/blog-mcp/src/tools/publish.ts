import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { repoRoot } from "../lib/paths.js";

function runGit(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd: repoRoot, maxBuffer: 1024 * 1024 * 20 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(`git ${args.join(" ")} failed: ${stderr || err.message}`));
        return;
      }
      resolve(stdout);
    });
  });
}

function textResult(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function registerPublishTool(server: McpServer) {
  server.registerTool(
    "publish_post",
    {
      title: "Publish post",
      description:
        "Commit and push a single post file to main. This deploys the live site via pages-deploy.yml — only the specified post file is committed, regardless of any other pending changes in the working tree.",
      inputSchema: {
        filename: z.string(),
        message: z.string().optional(),
      },
    },
    async ({ filename, message }) => {
      const withExt = filename.endsWith(".md") ? filename : `${filename}.md`;
      const relPath = path.join("_posts", withExt);
      const absPath = path.join(repoRoot, relPath);
      if (!fs.existsSync(absPath)) return errorResult(`No such post: ${filename}`);

      try {
        await runGit(["add", relPath]);
        await runGit(["commit", "-m", message ?? `Publish ${withExt}`, "--", relPath]);
        await runGit(["push"]);
        const sha = (await runGit(["rev-parse", "HEAD"])).trim();
        return textResult({ filename: withExt, commitSha: sha, pushed: true });
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    }
  );
}
