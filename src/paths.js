import path from "path";
import { fileURLToPath } from "url";

export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PUBLIC_DIR = path.join(ROOT_DIR, "public");
