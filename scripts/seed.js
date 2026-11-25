import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { USERS_FILE, BOOK_FILE, SEED_DIR, UPLOAD_DIR } from "../src/paths.js";
import { readJson, writeJson } from "../src/store.js";
import { hashPassword, normalizeEmail } from "../src/users.js";
import { extractPdfText } from "../src/book.js";

export function seedUsers() {
  const demo = readJson(path.join(SEED_DIR, "users.json"), []);
  const users = demo.map(({ senha, ...user }) => ({ ...user, email: normalizeEmail(user.email), senhaHash: hashPassword(senha) }));
  writeJson(USERS_FILE, users);
  return users.length;
}

export async function seedBook() {
  const book = readJson(path.join(SEED_DIR, "book.json"), { reports: [], weeks: [], classes: [], strategies: [] });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  for (const report of book.reports) {
    if (report.tipo !== "pdf" || !report.amostra) continue;
    const source = path.join(SEED_DIR, "samples", report.amostra);
    const target = path.join(UPLOAD_DIR, report.amostra);
    fs.copyFileSync(source, target);
    report.arquivo = `uploads/${report.amostra}`;
    report.textoPDF = await extractPdfText(target);
    delete report.amostra;
  }
  writeJson(BOOK_FILE, book);
  return book.reports.length;
}

export async function ensureSeed() {
  if (!fs.existsSync(USERS_FILE)) {
    const count = seedUsers();
    console.log(`Usuários de demonstração criados (${count}).`);
  }
  if (!fs.existsSync(BOOK_FILE)) {
    const count = await seedBook();
    console.log(`Investments Book de demonstração criado (${count} relatórios).`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const users = seedUsers();
  const reports = await seedBook();
  console.log(`Dados de demonstração restaurados: ${users} usuários e ${reports} relatórios no Book.`);
}
