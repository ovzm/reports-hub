import express from "express";
import jwt from "jsonwebtoken";
import { findUser, checkPassword, publicUser, isAdmin } from "./users.js";

const SECRET = () => process.env.JWT_SECRET || "dev-secret-troque-no-env";

export function signToken(user) {
  return jwt.sign({ email: user.email, nome: user.nome }, SECRET(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h"
  });
}

function readToken(req) {
  const bearer = req.get("authorization") || "";
  return bearer.replace(/^Bearer\s+/i, "") || req.query.token || "";
}

export function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ error: "Autenticação necessária." });
  try {
    const decoded = jwt.verify(token, SECRET());
    const user = findUser(decoded.email);
    if (!user) return res.status(401).json({ error: "Usuário não encontrado." });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Sessão inválida ou expirada. Entre novamente." });
  }
}

export function requireAdmin(req, res, next) {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ error: "Você não tem permissão para administrar o Investments Book." });
  }
  next();
}

export const authRouter = express.Router();

authRouter.post("/login", (req, res) => {
  const { email, senha } = req.body || {};
  const user = findUser(email);
  if (!user || !checkPassword(user, senha)) {
    return res.status(401).json({ error: "E-mail ou senha inválidos." });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

authRouter.get("/user", requireAuth, (req, res) => {
  res.json(publicUser(req.user));
});
