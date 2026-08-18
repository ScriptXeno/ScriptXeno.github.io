import path from "node:path";
import dotenv from "dotenv";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { repoRoot } from "./lib/paths.js";
import { registerPostTools } from "./tools/posts.js";
import { registerImageTools } from "./tools/images.js";
import { registerGenerateImageTool } from "./tools/generate_image.js";
import { registerPublishTool } from "./tools/publish.js";
import { registerThumbnailTool } from "./tools/thumbnail.js";

dotenv.config({ path: path.join(repoRoot, "tools", "blog-mcp", ".env") });

const server = new McpServer({ name: "scriptxeno-blog", version: "1.0.0" });

registerPostTools(server);
registerImageTools(server);
registerGenerateImageTool(server);
registerPublishTool(server);
registerThumbnailTool(server);

const transport = new StdioServerTransport();
await server.connect(transport);
