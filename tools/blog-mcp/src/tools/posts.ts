import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { postsDir } from "../lib/paths.js";
import {
  assemblePostFile,
  assembleWithRawFrontMatter,
  buildCasingVariants,
  listDistinctValues,
  listPostFiles,
  parsePostFile,
  reconcileCasing,
  STATIC_LQIP,
  type CasingAmbiguity,
  type CasingCorrection,
  type PostFrontMatter,
} from "../lib/frontmatter.js";
import { readAuthorIds } from "../lib/authors.js";

function textResult(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function todayInKolkata(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function resolvePostPath(filename: string): string {
  const withExt = filename.endsWith(".md") ? filename : `${filename}.md`;
  const resolved = path.join(postsDir, withExt);
  if (path.dirname(resolved) !== postsDir) {
    throw new Error(`Invalid filename: ${filename}`);
  }
  return resolved;
}

const imageSchema = z.object({
  path: z.string(),
  alt: z.string(),
  lqip: z.string().optional(),
});

export function registerPostTools(server: McpServer) {
  server.registerTool(
    "list_posts",
    {
      title: "List posts",
      description: "List all blog posts with filename, slug, title, date, and description.",
      inputSchema: {},
    },
    async () => {
      const posts = listPostFiles().map((filename) => {
        const raw = fs.readFileSync(path.join(postsDir, filename), "utf8");
        const { data } = parsePostFile(raw);
        return {
          filename,
          title: data.title,
          date: data.date,
          description: data.description,
        };
      });
      posts.reverse();
      return textResult(posts);
    }
  );

  server.registerTool(
    "read_post",
    {
      title: "Read post",
      description: "Read one post's parsed front matter and body content by filename (e.g. 2026-06-17-my-post.md).",
      inputSchema: { filename: z.string() },
    },
    async ({ filename }) => {
      const filePath = resolvePostPath(filename);
      if (!fs.existsSync(filePath)) return errorResult(`No such post: ${filename}`);
      const raw = fs.readFileSync(filePath, "utf8");
      const { data, content } = parsePostFile(raw);
      return textResult({ filename: path.basename(filePath), frontMatter: data, body: content });
    }
  );

  server.registerTool(
    "write_post",
    {
      title: "Write post",
      description:
        "Create a new blog post. Validates the author against _data/authors.yml and auto-corrects tag/category casing to match already-published posts (tags/categories are case-sensitive and each casing gets its own archive page).",
      inputSchema: {
        title: z.string(),
        description: z.string(),
        author: z.string().default("oceanofanything"),
        date: z.string().optional().describe("YYYY-MM-DD; defaults to today (Asia/Kolkata)"),
        categories: z.array(z.string()),
        tags: z.array(z.string()),
        image: imageSchema,
        body: z.string().describe("Markdown body content (no front matter)."),
        slug: z.string().optional().describe("Defaults to a slugified version of the title."),
      },
    },
    async ({ title, description, author, date, categories, tags, image, body, slug }) => {
      const validAuthors = readAuthorIds();
      if (!validAuthors.includes(author)) {
        return errorResult(`Unknown author "${author}". Valid authors: ${validAuthors.join(", ")}`);
      }

      const resolvedDate = date ?? todayInKolkata();
      const resolvedSlug = slugify(slug ?? title);
      const filename = `${resolvedDate}-${resolvedSlug}.md`;
      const filePath = path.join(postsDir, filename);
      if (fs.existsSync(filePath)) {
        return errorResult(`A post already exists at ${filename}`);
      }

      const categoryResult = reconcileCasing(categories, buildCasingVariants("categories"));
      const tagResult = reconcileCasing(tags, buildCasingVariants("tags"));

      const data: PostFrontMatter = {
        title,
        description,
        author,
        date: resolvedDate,
        categories: categoryResult.items,
        tags: tagResult.items,
        image: { path: image.path, alt: image.alt, lqip: image.lqip ?? STATIC_LQIP },
      };

      fs.writeFileSync(filePath, assemblePostFile(data, body), "utf8");

      return textResult({
        filename,
        categoryCorrections: categoryResult.corrections,
        tagCorrections: tagResult.corrections,
        categoryAmbiguities: categoryResult.ambiguities,
        tagAmbiguities: tagResult.ambiguities,
      });
    }
  );

  server.registerTool(
    "edit_post",
    {
      title: "Edit post",
      description:
        "Edit an existing post. Pass `body` alone for a content-only edit (front matter is left byte-for-byte untouched); pass `frontMatterPatch` to change front-matter fields (shallow-merged; `tags`/`categories`/`image` are merged/reconciled as a whole when included).",
      inputSchema: {
        filename: z.string(),
        frontMatterPatch: z
          .object({
            title: z.string().optional(),
            description: z.string().optional(),
            author: z.string().optional(),
            date: z.string().optional(),
            categories: z.array(z.string()).optional(),
            tags: z.array(z.string()).optional(),
            image: imageSchema.partial().optional(),
          })
          .optional(),
        body: z.string().optional(),
      },
    },
    async ({ filename, frontMatterPatch, body }) => {
      const filePath = resolvePostPath(filename);
      if (!fs.existsSync(filePath)) return errorResult(`No such post: ${filename}`);
      const raw = fs.readFileSync(filePath, "utf8");
      const { data, content, rawFrontMatter } = parsePostFile(raw);

      if (!frontMatterPatch || Object.keys(frontMatterPatch).length === 0) {
        if (body === undefined) return errorResult("Nothing to change: pass frontMatterPatch and/or body.");
        fs.writeFileSync(filePath, assembleWithRawFrontMatter(rawFrontMatter, body), "utf8");
        return textResult({ filename: path.basename(filePath), updated: "body-only" });
      }

      let categoryCorrections: CasingCorrection[] = [];
      let tagCorrections: CasingCorrection[] = [];
      let categoryAmbiguities: CasingAmbiguity[] = [];
      let tagAmbiguities: CasingAmbiguity[] = [];

      if (frontMatterPatch.categories) {
        const result = reconcileCasing(frontMatterPatch.categories, buildCasingVariants("categories"));
        frontMatterPatch.categories = result.items;
        categoryCorrections = result.corrections;
        categoryAmbiguities = result.ambiguities;
      }
      if (frontMatterPatch.tags) {
        const result = reconcileCasing(frontMatterPatch.tags, buildCasingVariants("tags"));
        frontMatterPatch.tags = result.items;
        tagCorrections = result.corrections;
        tagAmbiguities = result.ambiguities;
      }

      const merged: PostFrontMatter = {
        ...data,
        ...frontMatterPatch,
        image: frontMatterPatch.image ? { ...data.image, ...frontMatterPatch.image } : data.image,
      };

      fs.writeFileSync(filePath, assemblePostFile(merged, body ?? content), "utf8");
      return textResult({
        filename: path.basename(filePath),
        updated: "front-matter",
        categoryCorrections,
        tagCorrections,
        categoryAmbiguities,
        tagAmbiguities,
      });
    }
  );

  server.registerTool(
    "list_tags",
    {
      title: "List tags",
      description: "List every distinct exact-casing tag currently used across all posts, sorted.",
      inputSchema: {},
    },
    async () => textResult(listDistinctValues("tags"))
  );

  server.registerTool(
    "list_categories",
    {
      title: "List categories",
      description: "List every distinct exact-casing category currently used across all posts, sorted.",
      inputSchema: {},
    },
    async () => textResult(listDistinctValues("categories"))
  );
}
