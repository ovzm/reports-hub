import path from "path";
import { fileURLToPath } from "url";

export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DATA_DIR = path.join(ROOT_DIR, "data");
export const SEED_DIR = path.join(ROOT_DIR, "seed");
export const PUBLIC_DIR = path.join(ROOT_DIR, "public");
export const USERS_FILE = path.join(DATA_DIR, "users.json");
