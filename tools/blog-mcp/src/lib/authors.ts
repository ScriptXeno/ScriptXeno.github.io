import fs from "node:fs";
import matter from "gray-matter";
import { authorsFile } from "./paths.js";

/** _data/authors.yml is plain YAML, not front matter — reuse gray-matter's YAML engine
 * by wrapping it in `---` delimiters rather than pulling in a second YAML dependency. */
export function readAuthorIds(): string[] {
  const raw = fs.readFileSync(authorsFile, "utf8");
  const { data } = matter(`---\n${raw}---\n`);
  return Object.keys(data);
}
