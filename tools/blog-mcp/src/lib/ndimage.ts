/** Client for the N&D Co. Image API (a Cloudflare Worker in front of Workers AI). This is
 * the default thumbnail-generation backend — picked over Gemini/nano-banana in generate_image
 * because it actually works today (nano-banana is blocked on Gemini billing) and gives
 * real width/height control, which matters for hitting the site's 16:9 thumbnail convention. */

interface NdModel {
  id: string;
  name: string;
  type: string;
  free_plan_candidate: boolean;
  supports: { width: boolean; height: boolean; steps?: boolean; seed?: boolean; guidance?: boolean; negative_prompt?: boolean };
}

/** Empirically the best default as of 2026-09-12: a live side-by-side trial against every
 * width/height-capable model on this deployment (Leonardo Phoenix 1.0, Leonardo Lucid Origin,
 * FLUX.2 Klein 4B, FLUX.2 Dev) at 1920x1080 with the real house-style prompt from
 * thumbnailStyle.ts found Phoenix rendered the headline text as garbled gibberish, Lucid
 * Origin rendered the correct headline but in the wrong color (white, not the required
 * sky-blue) plus a hallucinated extra line of text, and FLUX.2 Dev timed out (HTTP 408) at
 * 30 steps against the Worker's request timeout, making it unreliable for a synchronous
 * tool call. FLUX.2 Klein 4B was the only one that got the headline text, color, and flat
 * vector/line-art style all correct. See DEFAULT_HEIGHT below for the one caveat found. */
export const DEFAULT_MODEL = "@cf/black-forest-labs/flux-2-klein-4b";

/** 1920x1080 is the site's exact 16:9 target, but Klein 4B silently snapped a requested
 * height of 1080 down to 1072 (the nearest multiple of 16) instead of erroring or matching
 * exactly. Requesting 1072 directly means the delivered image is exactly what was asked for
 * rather than a silent, undocumented resize — 1920x1072 is ~1.5% off pure 16:9, invisible in
 * practice for a blog thumbnail. */
export const DEFAULT_WIDTH = 1920;
export const DEFAULT_HEIGHT = 1072;

function apiUrl(): string {
  const url = process.env.CLOUDFLARE_SERVICE_WORKER_API_ENDPOINT;
  if (!url) {
    throw new Error(
      "CLOUDFLARE_SERVICE_WORKER_API_ENDPOINT is not set — add it to tools/blog-mcp/.env (see .env.example)."
    );
  }
  return url.replace(/\/+$/, "");
}

function apiKey(): string {
  const key = process.env.CLOUDFLARE_IMAGE_GENERATION_API_KEY;
  if (!key) {
    throw new Error(
      "CLOUDFLARE_IMAGE_GENERATION_API_KEY is not set — add it to tools/blog-mcp/.env (see .env.example)."
    );
  }
  return key;
}

export async function listNdModels(): Promise<NdModel[]> {
  const res = await fetch(`${apiUrl()}/models`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Failed to list N&D image models (HTTP ${res.status}): ${JSON.stringify(json)}`);
  }
  return json.models as NdModel[];
}

export interface NdGenerateOpts {
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  guidance?: number;
  negativePrompt?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postGenerate(model: string, prompt: string, opts: NdGenerateOpts): Promise<Response> {
  const body: Record<string, unknown> = { model, prompt };
  if (opts.width !== undefined) body.width = opts.width;
  if (opts.height !== undefined) body.height = opts.height;
  if (opts.steps !== undefined) body.steps = opts.steps;
  if (opts.seed !== undefined) body.seed = opts.seed;
  if (opts.guidance !== undefined) body.guidance = opts.guidance;
  if (opts.negativePrompt !== undefined) body.negative_prompt = opts.negativePrompt;

  return fetch(apiUrl() + "/", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Generates one image. Handles the API's documented error cases: 429 (daily free-quota
 * exhausted) throws immediately with no retry, 503 (temporary model capacity) retries once
 * after a short delay, 403 (this model needs Workers Paid) retries once against the first
 * other free-plan, width/height-capable model reported by /models. Everything else (400/401/
 * unexpected) throws with the API's own error message. */
export async function generateNdImage(
  prompt: string,
  opts: NdGenerateOpts = {}
): Promise<{ buffer: Buffer; contentType: string; model: string }> {
  const requestedModel = opts.model ?? DEFAULT_MODEL;

  if (opts.model) {
    const models = await listNdModels();
    if (!models.some((m) => m.id === opts.model)) {
      throw new Error(
        `Model "${opts.model}" was not found in the live /models list. Available: ${models.map((m) => m.id).join(", ")}`
      );
    }
  }

  let model = requestedModel;
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await postGenerate(model, prompt, opts);

    if (res.ok) {
      const contentType = res.headers.get("content-type") ?? "image/jpeg";
      const buffer = Buffer.from(await res.arrayBuffer());
      return { buffer, contentType, model };
    }

    const json = await res.json().catch(() => ({}));

    if (res.status === 429) {
      throw new Error(
        `Image generation is temporarily unavailable — daily free Neuron quota exhausted (resets 00:00 UTC): ${JSON.stringify(json)}`
      );
    }

    if (res.status === 503 && attempt === 0) {
      await sleep(3000);
      continue;
    }

    if (res.status === 403 && attempt === 0) {
      const models = await listNdModels();
      const fallback = models.find(
        (m) => m.id !== model && m.type === "text-to-image" && m.free_plan_candidate && m.supports.width && m.supports.height
      );
      if (fallback) {
        model = fallback.id;
        continue;
      }
    }

    throw new Error(`N&D image generation failed (HTTP ${res.status}, model ${model}): ${JSON.stringify(json)}`);
  }

  throw new Error(`N&D image generation failed after retry (model ${model}).`);
}
