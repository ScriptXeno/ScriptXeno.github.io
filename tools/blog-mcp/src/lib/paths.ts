import { fileURLToPath } from "node:url";
import path from "node:path";

// This file lives at <repoRoot>/tools/blog-mcp/build/lib/paths.js once compiled,
// so the repo root is four levels up. Resolved from import.meta.url rather than
// process.cwd() so it's correct no matter what cwd the MCP host spawns us with.
const here = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(here, "..", "..", "..", "..");
export const postsDir = path.join(repoRoot, "_posts");
export const authorsFile = path.join(repoRoot, "_data", "authors.yml");
export const generatedDir = path.join(repoRoot, "tools", "blog-mcp", "generated");
