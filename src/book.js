import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { BOOK_FILE, UPLOAD_DIR } from "./paths.js";
import { readJson, writeJson } from "./store.js";
import { requireAuth, requireAdmin } from "./auth.js";

const EMPTY_BOOK = { reports: [], weeks: [], classes: [], strategies: [] };

function load() {
  return { ...EMPTY_BOOK, ...readJson(BOOK_FILE, EMPTY_BOOK) };
}

function save(book) {
  writeJson(BOOK_FILE, book);
}

function newId(items) {
  return Math.max(Date.now(), ...items.map(item => Number(item.id) || 0)) + 1;
}

function optionalId(value) {
  if (value === "" || value === undefined || value === null) return null;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function lookup(items, id) {
  return id == null ? null : items.find(item => Number(item.id) === Number(id)) || null;
}

function normalize(book, report) {
  return {
    ...report,
    weekNome: lookup(book.weeks, report.weekId)?.nome || null,
    classeNome: lookup(book.classes, report.classeId)?.nome || null,
    estrategiaNome: lookup(book.strategies, report.estrategiaId)?.nome || null
  };
}

function validate(book, body) {
  const nome = typeof body.nome === "string" ? body.nome.trim() : "";
  const descricao = typeof body.descricao === "string" ? body.descricao.trim() : "";
  const ano = String(body.ano || "").trim();
  const weekId = optionalId(body.weekId);
  const relevancia = String(body.relevancia || "Middle");
  const classeId = optionalId(body.classeId);
  const estrategiaId = optionalId(body.estrategiaId);
  if (!nome || !descricao || !ano || !weekId) return { error: "Nome, descrição, ano e Week são obrigatórios." };
  if (!lookup(book.weeks, weekId)) return { error: "A Week selecionada não existe. Atualize os filtros e tente novamente." };
  if (!["High", "Middle", "Low"].includes(relevancia)) return { error: "Relevância inválida. Use High, Middle ou Low." };
  if (classeId !== null && !lookup(book.classes, classeId)) return { error: "A Classe selecionada não existe." };
  if (estrategiaId !== null && !lookup(book.strategies, estrategiaId)) return { error: "A Estratégia selecionada não existe." };
  return { value: { nome, descricao, ano, weekId, classeId, estrategiaId, relevancia } };
}

export async function extractPdfText(filePath) {
  try {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const doc = await getDocument({ data, isEvalSupported: false, useSystemFonts: true, verbosity: 0 }).promise;
    const pages = [];
    for (let number = 1; number <= doc.numPages; number++) {
      const content = await (await doc.getPage(number)).getTextContent();
      pages.push(content.items.map(item => item.str).join(" "));
    }
    await doc.destroy();
    return pages.join("\n");
  } catch (error) {
    console.error("Erro ao extrair texto do PDF:", error.message);
    return "";
  }
}

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const safeName = path.basename(file.originalname).replace(/[^\w.\-() ]/g, "_");
      cb(null, `${Date.now()}-${safeName}`);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const valid = file.mimetype === "application/pdf" || path.extname(file.originalname).toLowerCase() === ".pdf";
    cb(valid ? null : new Error("Envie um arquivo PDF válido."), valid);
  }
});

export const bookRouter = express.Router();

bookRouter.use(requireAuth);
bookRouter.use("/uploads", express.static(UPLOAD_DIR));

function registerFilterRoutes(url, key, label, reportField) {
  bookRouter.get(url, (_req, res) => res.json(load()[key]));

  bookRouter.post(url, requireAdmin, (req, res) => {
    const book = load();
    const nome = typeof req.body.nome === "string" ? req.body.nome.trim() : "";
    if (!nome) return res.status(400).json({ error: `Nome da ${label} é obrigatório.` });
    if (book[key].some(item => item.nome.toLowerCase() === nome.toLowerCase())) {
      return res.status(409).json({ error: `Já existe uma ${label} com esse nome.` });
    }
    const item = { id: newId(book[key]), nome };
    book[key].push(item);
    save(book);
    res.status(201).json(item);
  });

  bookRouter.put(`${url}/:id`, requireAdmin, (req, res) => {
    const book = load();
    const id = Number(req.params.id);
    const item = book[key].find(entry => Number(entry.id) === id);
    if (!item) return res.status(404).json({ error: `${label} não encontrada.` });
    const nome = typeof req.body.nome === "string" ? req.body.nome.trim() : "";
    if (!nome) return res.status(400).json({ error: `Nome da ${label} é obrigatório.` });
    if (book[key].some(entry => Number(entry.id) !== id && entry.nome.toLowerCase() === nome.toLowerCase())) {
      return res.status(409).json({ error: `Já existe uma ${label} com esse nome.` });
    }
    item.nome = nome;
    save(book);
    res.json(item);
  });

  bookRouter.delete(`${url}/:id`, requireAdmin, (req, res) => {
    const book = load();
    const id = Number(req.params.id);
    if (!book[key].some(entry => Number(entry.id) === id)) return res.status(404).json({ error: `${label} não encontrada.` });
    book[key] = book[key].filter(entry => Number(entry.id) !== id);
    book.reports = book.reports.map(report => Number(report[reportField]) === id ? { ...report, [reportField]: null } : report);
    save(book);
    res.json({ message: `${label} excluída.` });
  });
}

registerFilterRoutes("/weeks", "weeks", "Week", "weekId");
registerFilterRoutes("/classes", "classes", "Classe", "classeId");
registerFilterRoutes("/strategies", "strategies", "Estratégia", "estrategiaId");

bookRouter.post("/upload", requireAdmin, upload.single("pdf"), async (req, res) => {
  try {
    const book = load();
    const tipo = req.body.tipo === "texto" ? "texto" : "pdf";
    const validation = validate(book, req.body);
    if (validation.error) {
      if (req.file?.path) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: validation.error });
    }
    if (tipo === "pdf" && !req.file) return res.status(400).json({ error: "Nenhum PDF foi enviado." });
    if (tipo === "texto" && !String(req.body.texto || "").trim() && !String(req.body.link || "").trim()) {
      return res.status(400).json({ error: "Informe o conteúdo ou um link para o relatório de texto." });
    }
    const report = {
      id: newId(book.reports),
      ...validation.value,
      tipo,
      link: typeof req.body.link === "string" ? req.body.link.trim() : "",
      texto: typeof req.body.texto === "string" ? req.body.texto : "",
      arquivo: null,
      textoPDF: ""
    };
    if (tipo === "pdf") {
      report.arquivo = `uploads/${path.basename(req.file.path)}`;
      report.textoPDF = await extractPdfText(req.file.path);
    }
    book.reports.push(report);
    save(book);
    res.status(201).json({ message: "Relatório cadastrado com sucesso.", report: normalize(book, report) });
  } catch (error) {
    console.error("Erro no upload do Book:", error);
    res.status(500).json({ error: "Erro ao cadastrar relatório." });
  }
});

bookRouter.get("/reports", (_req, res) => {
  const book = load();
  res.json(book.reports.map(report => normalize(book, report)));
});

bookRouter.put("/reports/:id", requireAdmin, (req, res) => {
  const book = load();
  const report = book.reports.find(entry => Number(entry.id) === Number(req.params.id));
  if (!report) return res.status(404).json({ error: "Relatório não encontrado." });
  const validation = validate(book, req.body);
  if (validation.error) return res.status(400).json({ error: validation.error });
  Object.assign(report, validation.value);
  if (report.tipo === "texto") {
    if (typeof req.body.link === "string") report.link = req.body.link.trim();
    if (typeof req.body.texto === "string") report.texto = req.body.texto;
  }
  save(book);
  res.json({ message: "Relatório atualizado com sucesso.", report: normalize(book, report) });
});

bookRouter.delete("/reports/:id", requireAdmin, (req, res) => {
  const book = load();
  const report = book.reports.find(entry => Number(entry.id) === Number(req.params.id));
  if (!report) return res.status(404).json({ error: "Relatório não encontrado." });
  if (report.arquivo) {
    const filePath = path.resolve(UPLOAD_DIR, path.basename(report.arquivo));
    if (filePath.startsWith(UPLOAD_DIR + path.sep)) {
      fs.unlink(filePath, error => {
        if (error && error.code !== "ENOENT") console.error("Erro excluindo PDF:", error.message);
      });
    }
  }
  book.reports = book.reports.filter(entry => entry !== report);
  save(book);
  res.json({ message: "Relatório excluído com sucesso." });
});

bookRouter.get("/search", (req, res) => {
  const book = load();
  const { nome, ano, weekId, classeId, estrategiaId, relevancia } = req.query;
  let results = book.reports.map(report => normalize(book, report));
  if (nome) {
    const query = String(nome).toLocaleLowerCase("pt-BR");
    results = results.filter(report =>
      [report.nome, report.descricao, report.weekNome, report.classeNome, report.estrategiaNome, report.textoPDF]
        .some(value => String(value || "").toLocaleLowerCase("pt-BR").includes(query))
    );
  }
  if (ano) results = results.filter(report => String(report.ano) === String(ano));
  if (weekId) results = results.filter(report => Number(report.weekId) === Number(weekId));
  if (classeId) results = results.filter(report => Number(report.classeId) === Number(classeId));
  if (estrategiaId) results = results.filter(report => Number(report.estrategiaId) === Number(estrategiaId));
  if (relevancia) results = results.filter(report => report.relevancia === relevancia);
  res.json(results);
});

bookRouter.use((error, _req, res, _next) => {
  res.status(400).json({ error: error.message || "Requisição inválida." });
});
