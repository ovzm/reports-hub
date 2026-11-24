import express from "express";
import fs from "fs";
import path from "path";
import { REPORTS_FILE, SHEETS_DIR } from "./paths.js";
import { readJson } from "./store.js";
import { requireAuth } from "./auth.js";
import { canAccessReport } from "./users.js";

export function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  const input = text.replace(/^﻿/, "");
  const delimiter = (input.split("\n")[0].match(/;/g) || []).length > (input.split("\n")[0].match(/,/g) || []).length ? ";" : ",";
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === delimiter) { row.push(field); field = ""; }
    else if (char === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += char;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  return rows.filter(r => r.some(cell => cell.trim() !== ""));
}

function loadCatalog() {
  return readJson(REPORTS_FILE, []);
}

function summary(report) {
  return { id: report.id, title: report.title, tipo: report.tipo, descricao: report.descricao || "" };
}

export const reportsRouter = express.Router();

reportsRouter.use(requireAuth);

reportsRouter.get("/", (req, res) => {
  res.json(loadCatalog().filter(report => canAccessReport(req.user, report.id)).map(summary));
});

reportsRouter.get("/:id", (req, res) => {
  const report = loadCatalog().find(item => item.id === req.params.id);
  if (!report) return res.status(404).json({ error: "Relatório não encontrado." });
  if (!canAccessReport(req.user, report.id)) return res.status(403).json({ error: "Acesso negado a este relatório." });

  if (report.tipo === "embed") {
    return res.json({ ...summary(report), url: report.url });
  }

  const file = path.resolve(SHEETS_DIR, path.basename(report.arquivo || ""));
  if (!file.startsWith(SHEETS_DIR + path.sep) || !fs.existsSync(file)) {
    return res.status(404).json({ error: "Arquivo da planilha não encontrado." });
  }
  const stat = fs.statSync(file);
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  res.json({ ...summary(report), atualizadoEm: stat.mtime.toISOString(), cabecalho: rows[0] || [], linhas: rows.slice(1) });
});
