import fs from "node:fs";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolvePostPath } from "../lib/paths.js";
import { parsePostFile } from "../lib/frontmatter.js";
import { THUMBNAIL_HOUSE_STYLE } from "../lib/thumbnailStyle.js";

function textResult(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

/** Crude fallback when no headline is supplied: cuts at the first colon/paren/dash (these
 * post titles commonly append a parenthetical clarifier) and keeps the first few words.
 * Callers should generally pass a hand-crafted `headline` instead — this is only a floor. */
function deriveHeadline(title: string): string {
  const primary = title.split(/[:(—-]/)[0].trim();
  return primary.split(/\s+/).slice(0, 6).join(" ").toUpperCase();
}

export function registerThumbnailTool(server: McpServer) {
  server.registerTool(
    "build_thumbnail_prompt",
    {
      title: "Build thumbnail prompt",
      description:
        "Build a detailed, ready-to-use image-generation prompt for a post's thumbnail, grounded in the site's actual brand (the black-and-white 'SX' monogram and its real accent color) rather than an ad-hoc one-off style. Every call applies the same fixed house style, so thumbnails stay visually consistent across posts over time. Returns a prompt string — pass it to generate_image yourself; this tool does not generate anything.",
      inputSchema: {
        filename: z.string().describe("Existing post filename, e.g. 2026-08-19-my-post.md"),
        headline: z
          .string()
          .optional()
          .describe(
            "Short punchy headline to render on the thumbnail (3-6 words, e.g. \"CLAUDE CODE, UNLIMITED\"). Strongly recommended — a hand-crafted headline reads far better than the automatic fallback (a truncated version of the post title)."
          ),
        subjectOverride: z
          .string()
          .optional()
          .describe("What the supporting graphic/icon should depict, if different from the post's description."),
        aspectRatio: z.string().default("16:9"),
      },
    },
    async ({ filename, headline, subjectOverride, aspectRatio }) => {
      const filePath = resolvePostPath(filename);
      if (!fs.existsSync(filePath)) return errorResult(`No such post: ${filename}`);
      const raw = fs.readFileSync(filePath, "utf8");
      const { data } = parsePostFile(raw);

      const finalHeadline = headline ?? deriveHeadline(data.title);
      const subject = subjectOverride ?? data.description;

      const prompt = [
        `Design a blog thumbnail image for a post titled "${data.title}".`,
        `Subject / core concept for the supporting graphic: ${subject}`,
        `Headline text to render prominently and legibly on the thumbnail (exact wording): "${finalHeadline}"`,
        "",
        THUMBNAIL_HOUSE_STYLE,
        "",
        `Aspect ratio: ${aspectRatio}.`,
      ].join("\n");

      return textResult({ filename, prompt, headline: finalHeadline, aspectRatio });
    }
  );
}
