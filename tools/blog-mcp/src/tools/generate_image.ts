import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { generatedDir } from "../lib/paths.js";

function textResult(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

function isBase64ImageLike(s: unknown): s is string {
  return typeof s === "string" && s.length > 100 && /^[A-Za-z0-9+/=]+$/.test(s.slice(0, 200));
}

/** The Interactions API's exact response field names for image output weren't fully
 * pinned down at design time (no API key was available to test against), so this walks
 * the response tree looking for a long base64-looking `data` field rather than assuming
 * one exact path. If this ever fails, the thrown error includes the raw JSON so the real
 * field name can be dropped in here directly. */
function findImageData(obj: unknown): { data: string; mimeType: string } | null {
  if (obj === null || typeof obj !== "object") return null;
  const rec = obj as Record<string, unknown>;
  if (isBase64ImageLike(rec.data)) {
    const mimeType = (rec.mime_type ?? rec.mimeType ?? rec.mime ?? "image/png") as string;
    return { data: rec.data as string, mimeType };
  }
  for (const value of Object.values(rec)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findImageData(item);
        if (found) return found;
      }
    } else if (value && typeof value === "object") {
      const found = findImageData(value);
      if (found) return found;
    }
  }
  return null;
}

function extFromMime(mime: string): string {
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  return "png";
}

async function callNanoBanana(
  prompt: string,
  opts: { mimeType?: string; aspectRatio?: string } = {}
): Promise<{ buffer: Buffer; mimeType: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set — add it to tools/blog-mcp/.env (see .env.example).");
  }
  const model = process.env.NANOBANANA_MODEL || "gemini-3.1-flash-image";
  const body = {
    model,
    input: [{ type: "text", text: prompt }],
    response_format: {
      type: "image",
      // Confirmed live: the Interactions API currently only accepts "image/jpeg" here —
      // "image/png" is rejected with an invalid_request error despite being documented
      // elsewhere as a general Gemini image capability.
      mime_type: opts.mimeType ?? "image/jpeg",
      ...(opts.aspectRatio ? { aspect_ratio: opts.aspectRatio } : {}),
    },
  };

  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Nano Banana request failed (HTTP ${res.status}, model ${model}): ${JSON.stringify(json)}`);
  }
  const found = findImageData(json);
  if (!found) {
    throw new Error(
      `Could not locate image data in the Nano Banana response (API shape may have changed since this was built) — raw response: ${JSON.stringify(json)}`
    );
  }
  return { buffer: Buffer.from(found.data, "base64"), mimeType: found.mimeType };
}

export function registerGenerateImageTool(server: McpServer) {
  server.registerTool(
    "generate_image",
    {
      title: "Generate image",
      description:
        "Generate an image from a text prompt using Gemini's image model (nano banana). Saves the result to a local staging folder for review — it is NOT uploaded automatically; use upload_image afterward once you've looked at it.",
      inputSchema: {
        prompt: z.string(),
        aspectRatio: z.string().optional().describe('e.g. "16:9", "1:1"'),
      },
    },
    async ({ prompt, aspectRatio }) => {
      try {
        const { buffer, mimeType } = await callNanoBanana(prompt, { aspectRatio });
        fs.mkdirSync(generatedDir, { recursive: true });
        const filename = `${Date.now()}.${extFromMime(mimeType)}`;
        const outPath = path.join(generatedDir, filename);
        fs.writeFileSync(outPath, buffer);
        return textResult({ localPath: outPath, mimeType });
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    }
  );
}
