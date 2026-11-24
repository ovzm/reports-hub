import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { USERS_FILE, SEED_DIR } from "../src/paths.js";
import { readJson, writeJson } from "../src/store.js";
import { hashPassword, normalizeEmail } from "../src/users.js";

export function seedUsers() {
  const demo = readJson(path.join(SEED_DIR, "users.json"), []);
  const users = demo.map(({ senha, ...user }) => ({ ...user, email: normalizeEmail(user.email), senhaHash: hashPassword(senha) }));
  writeJson(USERS_FILE, users);
  return users.length;
}

export async function ensureSeed() {
  if (!fs.existsSync(USERS_FILE)) {
    const count = seedUsers();
    console.log(`Usuários de demonstração criados (${count}).`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const users = seedUsers();
  console.log(`Usuários de demonstração restaurados: ${users}.`);
}
