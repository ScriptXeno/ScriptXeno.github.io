import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const HOST = "scriptxeno.github.io";
const KEY = "8224327bc30e4fd28859be57075c7439";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

function textResult(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function registerIndexNowTool(server: McpServer) {
  server.registerTool(
    "submit_indexnow",
    {
      title: "Submit URLs to IndexNow",
      description:
        "Notify IndexNow (Bing, and other participating search engines) that one or more scriptxeno.github.io URLs are new or updated, so they get crawled faster than waiting on discovery. Pass full URLs (e.g. from publish_post's result).",
      inputSchema: {
        urls: z.array(z.string().url()).min(1).max(10000),
      },
    },
    async ({ urls }) => {
      const offHost = urls.filter((u) => new URL(u).host !== HOST);
      if (offHost.length > 0) {
        return errorResult(`All URLs must be on ${HOST}. Off-host: ${offHost.join(", ")}`);
      }

      try {
        const res = await fetch("https://api.indexnow.org/indexnow", {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls }),
        });
        // IndexNow returns 200/202 on success with an empty body -- text() rather than
        // json() since a non-2xx error body isn't guaranteed to be valid JSON either.
        const body = await res.text();
        return textResult({ submitted: urls.length, status: res.status, ok: res.ok, body: body || undefined });
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    }
  );
}
