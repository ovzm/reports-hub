import bcrypt from "bcryptjs";
import { USERS_FILE } from "./paths.js";
import { readJson, writeJson } from "./store.js";

export const ROLES = ["admin", "user"];

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function loadUsers() {
  return readJson(USERS_FILE, []);
}

export function saveUsers(users) {
  writeJson(USERS_FILE, users);
}

export function findUser(email) {
  const target = normalizeEmail(email);
  return loadUsers().find(user => user.email === target) || null;
}

export function hashPassword(password) {
  return bcrypt.hashSync(String(password), 10);
}

export function checkPassword(user, password) {
  return Boolean(user?.senhaHash) && bcrypt.compareSync(String(password || ""), user.senhaHash);
}

export function isAdmin(user) {
  return user?.role === "admin";
}

export function canAccessReport(user, reportId) {
  const acessos = Array.isArray(user?.acessos) ? user.acessos : [];
  return acessos.includes("*") || acessos.includes(reportId);
}

export function publicUser(user) {
  return {
    email: user.email,
    nome: user.nome,
    role: user.role,
    acessos: user.acessos || [],
    isBookAdmin: isAdmin(user)
  };
}
