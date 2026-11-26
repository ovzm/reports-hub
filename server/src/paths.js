import path from "path";
import { fileURLToPath } from "url";

export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DATA_DIR = path.join(ROOT_DIR, "data");
export const SEED_DIR = path.join(ROOT_DIR, "seed");
export const SHEETS_DIR = path.join(DATA_DIR, "sheets");
export const UPLOAD_DIR = path.join(ROOT_DIR, "uploads");
export const PUBLIC_DIR = path.join(ROOT_DIR, "public");
export const USERS_FILE = path.join(DATA_DIR, "users.json");
export const BOOK_FILE = path.join(DATA_DIR, "book.json");
export const REPORTS_FILE = path.join(DATA_DIR, "reports.json");
