import fs from "node:fs";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createRepo, enablePages, getRepo, putFileContents } from "../lib/github.js";
import { toPngBuffer, toTinyPlaceholderBuffer, toWebpBuffer } from "../lib/images.js";
import { STATIC_LQIP } from "../lib/frontmatter.js";

function textResult(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

function owner(): string {
  return process.env.GITHUB_OWNER || "ScriptXeno";
}

function pagesUrlFor(repo: string, filename?: string): string {
  const base = `https://${owner().toLowerCase()}.github.io/${repo}/`;
  return filename ? base + filename : base;
}

/** Resolves the source image bytes from whichever input was actually given: `imageData`
 * (base64 — e.g. an image attached directly in a chat turn, with no local file involved)
 * takes precedence when both are present, since it's the more explicit, freshest input. */
function resolveImageInput(args: { localPath?: string; imageData?: string }): Buffer | { error: string } {
  if (args.imageData) {
    try {
      return Buffer.from(args.imageData, "base64");
    } catch {
      return { error: "imageData could not be decoded as base64." };
    }
  }
  if (args.localPath) {
    if (!fs.existsSync(args.localPath)) return { error: `No such file: ${args.localPath}` };
    return fs.readFileSync(args.localPath);
  }
  return { error: "Provide either localPath or imageData." };
}

export function registerImageTools(server: McpServer) {
  server.registerTool(
    "create_image_repo",
    {
      title: "Create image repo",
      description:
        "Create (or reuse, if it already exists) a public GitHub repo to host one post's images, and enable GitHub Pages on it. Matches the site's convention of one images repo per post, named <slug>-images by default.",
      inputSchema: {
        slug: z.string().describe("Post slug, e.g. 2026-08-19-my-post"),
        addImagesSuffix: z.boolean().default(true),
        description: z.string().optional(),
      },
    },
    async ({ slug, addImagesSuffix, description }) => {
      const repoName = addImagesSuffix ? `${slug}-images` : slug;
      const acct = owner();

      let repo = await getRepo(acct, repoName);
      let created = false;
      if (!repo) {
        repo = await createRepo(acct, repoName, { description });
        created = true;
      }

      const pages = await enablePages(acct, repoName, repo.defaultBranch);

      return textResult({
        owner: acct,
        repo: repoName,
        created,
        defaultBranch: repo.defaultBranch,
        pagesUrl: pages.url,
      });
    }
  );

  server.registerTool(
    "upload_image",
    {
      title: "Upload image",
      description:
        "Convert an image to PNG + WebP and upload both to an image repo's root (created earlier via create_image_repo), matching the <basename>.png / <basename>.webp convention. Returns the public URLs and the standard lqip placeholder string ready to paste into a post's front matter. Provide the source image via `localPath` (a file already on disk — e.g. output from generate_image) or `imageData` (base64 bytes — e.g. a custom design image attached directly in the conversation); use whichever the caller actually has, no need to save an attached image to disk first.",
      inputSchema: {
        repo: z.string().describe("Repo name, e.g. 2026-08-19-my-post-images"),
        localPath: z.string().optional().describe("Absolute local path to the source image."),
        imageData: z
          .string()
          .optional()
          .describe("Base64-encoded source image bytes, e.g. an image attached in chat. Takes precedence over localPath if both are given."),
        baseName: z
          .string()
          .optional()
          .describe("Filename base (no extension). Defaults to the repo name with any -images suffix stripped."),
        includeTinyPlaceholder: z.boolean().default(true),
      },
    },
    async ({ repo, localPath, imageData, baseName, includeTinyPlaceholder }) => {
      const resolved = resolveImageInput({ localPath, imageData });
      if (!Buffer.isBuffer(resolved)) return errorResult(resolved.error);
      const input = resolved;
      const acct = owner();
      const name = baseName ?? repo.replace(/-images$/, "");

      const [pngBuffer, webpBuffer] = await Promise.all([toPngBuffer(input), toWebpBuffer(input)]);
      await putFileContents(acct, repo, `${name}.png`, pngBuffer, `Add ${name}.png`);
      await putFileContents(acct, repo, `${name}.webp`, webpBuffer, `Add ${name}.webp`);

      if (includeTinyPlaceholder) {
        const tiny = await toTinyPlaceholderBuffer(input);
        await putFileContents(acct, repo, "lqip.webp", tiny, "Add lqip.webp");
      }

      return textResult({
        pngUrl: pagesUrlFor(repo, `${name}.png`),
        webpUrl: pagesUrlFor(repo, `${name}.webp`),
        lqip: STATIC_LQIP,
      });
    }
  );
}
