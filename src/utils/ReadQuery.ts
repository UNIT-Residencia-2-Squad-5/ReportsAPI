import { readFileSync } from "node:fs";
import { join } from "node:path";

export function readQuery(file: string): string {
  const fullPath = join(
    __dirname,
    "..",
    "infrastructure",
    "db",
    "sql",
    file
  );

  return readFileSync(fullPath, "utf8");
}
