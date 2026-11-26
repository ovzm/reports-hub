const API = "/api/book";

const accessCheck = (async function verifyBookAdminAccess() {
  const token = localStorage.getItem("jwt");
  if (!token) {
    window.location.replace("/index.html");
    return false;
  }
  try {
    const response = await fetch("/auth/user", { headers: { Authorization: `Bearer ${token}` } });
    const user = await response.json().catch(() => ({}));
    if (response.status === 401) {
      localStorage.clear();
      window.location.replace("/index.html");
      return false;
    }
    if (!response.ok || !user.isBookAdmin) {
      document.body.innerHTML = '<main style="font-family:Arial,sans-serif;padding:40px;max-width:640px;margin:auto"><h1>Acesso não autorizado</h1><p>Você não tem permissão para administrar o Investments Book.</p><a href="/page/home.html">Voltar ao menu</a></main>';
      return false;
    }
    return true;
  } catch {
    window.location.replace("/index.html");
    return false;
  }
})();
const pages = document.querySelectorAll(".page");
const menuBtns = document.querySelectorAll(".menu-btn");
const reportsList = document.getElementById("reportsList");
const reportSearch = document.getElementById("reportSearch");
const uploadForm = document.getElementById("uploadForm");
const pdfInput = document.getElementById("pdfInput");
const uploadPdfArea = document.getElementById("uploadPdfArea");
const textoArea = document.getElementById("textoArea");

let weeksCache = [], classesCache = [], strategiesCache = [], reportsCache = [];

const filters = {
  week: { url: "/weeks", list: "weeksList", form: "weekForm", input: "weekName", label: "Week" },
  classe: { url: "/classes", list: "classesList", form: "classForm", input: "className", label: "Classe" },
  estrategia: { url: "/strategies", list: "strategiesList", form: "strategyForm", input: "strategyName", label: "Estratégia" }
};

function esc(v = "") {
  return String(v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
async function api(url, options = {}) {
  const token = localStorage.getItem("jwt");
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const r = await fetch(API + url, { ...options, headers });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "Não foi possível concluir a operação.");
  return data;
}
function toast(message, error = false) {
  const el = document.createElement("div");
  el.className = "toast" + (error ? " error" : "");
  el.textContent = message;
  document.getElementById("toastRegion").appendChild(el);
  setTimeout(() => el.remove(), 4000);
}
function handleError(e) { console.error(e); toast(e.message || "Ocorreu um erro.", true); }
function setBusy(btn, busy, label = "Salvando...") {
  if (!btn) return;
  if (busy) { btn.dataset.oldText = btn.textContent; btn.textContent = label; btn.disabled = true; }
  else { btn.textContent = btn.dataset.oldText || btn.textContent; btn.disabled = false; }
}
function idOrNull(v) { return v ? Number(v) : null; }

function selectOptions(items, selected = "", empty = "Selecione") {
  return `<option value="">${esc(empty)}</option>` + items.map(x =>
    `<option value="${x.id}" ${Number(selected) === Number(x.id) ? "selected" : ""}>${esc(x.nome)}</option>`
  ).join("");
}
function yearOptions(selected = "") {
  const years = new Set();
  for (let y = 2020; y <= 2035; y++) years.add(String(y));
  reportsCache.forEach(r => { if (r.ano) years.add(String(r.ano)); });
  if (selected) years.add(String(selected));
  return '<option value="">Selecione o ano</option>' + [...years].sort((a, b) => Number(a) - Number(b)).map(y =>
    `<option value="${esc(y)}" ${String(selected) === y ? "selected" : ""}>${esc(y)}</option>`
  ).join("");
}
function fillUploadSelects() {
  document.getElementById("uploadYear").innerHTML = yearOptions(String(new Date().getFullYear()));
  document.getElementById("uploadWeek").innerHTML = selectOptions(weeksCache, "", "Selecione uma Week");
  document.getElementById("uploadClass").innerHTML = selectOptions(classesCache, "", "Sem classe");
  document.getElementById("uploadStrategy").innerHTML = selectOptions(strategiesCache, "", "Sem estratégia");
}
function pageHeader(page) {
  const d = {
    upload: ["Novo relatório", "Cadastre e classifique um novo conteúdo."],
    reports: ["Gerenciar relatórios", "Edite os dados, filtros e conteúdo dos relatórios."],
    filters: ["Criação de filtros", "Gerencie as opções usadas para organizar os relatórios."]
  }[page] || ["Novo relatório", "Cadastre e classifique um novo conteúdo."];
  document.getElementById("pageTitle").textContent = d[0];
  document.getElementById("pageSubtitle").textContent = d[1];
}
menuBtns.forEach(btn => btn.addEventListener("click", () => {
  menuBtns.forEach(b => b.classList.toggle("active", b === btn));
  pages.forEach(p => p.classList.toggle("active-page", p.id === `${btn.dataset.page}Page`));
  pageHeader(btn.dataset.page);
}));

function updateType(type) {
  const pdf = type === "pdf";
  uploadPdfArea.hidden = !pdf;
  textoArea.hidden = pdf;
  pdfInput.required = pdf;
  document.getElementById("texto").required = !pdf;
}
document.querySelectorAll('input[name="tipo"]').forEach(r => r.addEventListener("change", () => {
  if (r.checked) updateType(r.value);
}));

uploadForm.addEventListener("submit", async e => {
  e.preventDefault();
  const btn = uploadForm.querySelector('button[type="submit"]');
  const data = new FormData(uploadForm);
  if (data.get("tipo") === "texto") data.delete("pdf");
  setBusy(btn, true, "Enviando...");
  try {
    const result = await api("/upload", { method: "POST", body: data });
    toast(result.message || "Relatório cadastrado.");
    uploadForm.reset();
    document.querySelector('input[name="tipo"][value="pdf"]').checked = true;
    updateType("pdf");
    fillUploadSelects();
    await loadReports();
  } catch (err) { handleError(err); }
  finally { setBusy(btn, false); }
});

async function loadFilter(kind) {
  const cfg = filters[kind];
  const items = await api(cfg.url);
  if (kind === "week") weeksCache = items;
  if (kind === "classe") classesCache = items;
  if (kind === "estrategia") strategiesCache = items;
  renderFilter(kind, items);
  fillUploadSelects();
}
function renderFilter(kind, items) {
  const cfg = filters[kind], list = document.getElementById(cfg.list);
  list.innerHTML = "";
  if (!items.length) {
    list.innerHTML = '<div class="empty">Nenhuma opção cadastrada ainda.<br>Crie a primeira usando o campo acima.</div>';
    return;
  }
  items.forEach(item => {
    const row = document.createElement("div");
    row.className = "filter-option";
    row.innerHTML = `<span class="filter-option-name">${esc(item.nome)}</span><div class="option-actions">
      <button class="icon-btn" type="button" title="Renomear" aria-label="Renomear">✎</button>
      <button class="icon-btn delete" type="button" title="Excluir" aria-label="Excluir">×</button></div>`;
    row.querySelector(".icon-btn:not(.delete)").addEventListener("click", async () => {
      const v = prompt(`Novo nome para ${cfg.label}:`, item.nome);
      if (v === null) return;
      if (!v.trim()) return toast("O nome não pode ficar vazio.", true);
      try {
        await api(`${cfg.url}/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: v.trim() }) });
        toast(`${cfg.label} atualizada.`);
        await refreshAll();
      } catch (err) { handleError(err); }
    });
    row.querySelector(".delete").addEventListener("click", async () => {
      if (!confirm(`Excluir "${item.nome}"? Os relatórios associados ficarão sem esse filtro.`)) return;
      try {
        await api(`${cfg.url}/${item.id}`, { method: "DELETE" });
        toast(`${cfg.label} excluída.`);
        await refreshAll();
      } catch (err) { handleError(err); }
    });
    list.appendChild(row);
  });
}
Object.entries(filters).forEach(([kind, cfg]) => {
  document.getElementById(cfg.form).addEventListener("submit", async e => {
    e.preventDefault();
    const form = e.currentTarget, input = document.getElementById(cfg.input), btn = form.querySelector("button");
    const nome = input.value.trim();
    if (!nome) return;
    setBusy(btn, true, "Criando...");
    try {
      await api(cfg.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome }) });
      form.reset();
      toast(`${cfg.label} criada.`);
      await refreshAll();
    } catch (err) { handleError(err); }
    finally { setBusy(btn, false); }
  });
});

async function loadReports() {
  reportsCache = await api("/reports");
  renderReports();
}
function renderReports() {
  const q = reportSearch.value.trim().toLowerCase();
  const results = reportsCache.filter(r => [r.nome, r.descricao, r.ano, r.weekNome, r.classeNome, r.estrategiaNome, r.relevancia].join(" ").toLowerCase().includes(q));
  reportsList.innerHTML = "";
  if (!results.length) {
    reportsList.innerHTML = `<div class="empty">${reportsCache.length ? "Nenhum relatório corresponde à busca." : "Nenhum relatório cadastrado ainda."}</div>`;
    return;
  }
  results.forEach(r => {
    const isText = r.tipo === "texto";
    const card = document.createElement("article");
    card.className = "report-card";
    card.innerHTML = `<div class="report-info">
      <label for="nome-${r.id}">Nome do relatório *</label><input id="nome-${r.id}" value="${esc(r.nome)}" required>
      <label for="descricao-${r.id}">Descrição *</label><textarea id="descricao-${r.id}" rows="3" required>${esc(r.descricao || "")}</textarea>
      <label for="ano-${r.id}">Ano *</label><select id="ano-${r.id}" required>${yearOptions(r.ano)}</select>
      <label for="week-${r.id}">Week *</label><select id="week-${r.id}" required>${selectOptions(weeksCache, r.weekId, "Selecione uma Week")}</select>
      <label for="classe-${r.id}">Classe</label><select id="classe-${r.id}">${selectOptions(classesCache, r.classeId, "Sem classe")}</select>
      <label for="estrategia-${r.id}">Estratégia</label><select id="estrategia-${r.id}">${selectOptions(strategiesCache, r.estrategiaId, "Sem estratégia")}</select>
      <label for="relevancia-${r.id}">Relevância *</label><select id="relevancia-${r.id}" required>
        <option value="High" ${r.relevancia === "High" ? "selected" : ""}>High — Alta</option>
        <option value="Middle" ${!r.relevancia || r.relevancia === "Middle" ? "selected" : ""}>Middle — Média</option>
        <option value="Low" ${r.relevancia === "Low" ? "selected" : ""}>Low — Baixa</option></select>
      ${isText ? `<label for="link-${r.id}">Link</label><input id="link-${r.id}" type="url" value="${esc(r.link || "")}" placeholder="https://...">
        <label for="texto-${r.id}">Conteúdo</label><textarea id="texto-${r.id}" rows="6">${esc(r.texto || "")}</textarea>` : `<p class="file-hint">Arquivo PDF ${r.arquivo ? "cadastrado" : "não localizado"}.</p>`}
      <p class="tipo-label">Tipo: <b>${isText ? "Texto e link" : "PDF"}</b></p>
      </div><div class="report-actions"><button class="primary-btn" type="button" data-save>Salvar alterações</button><button class="danger-btn" type="button" data-delete>Excluir relatório</button></div>`;
    card.querySelector("[data-save]").addEventListener("click", () => saveReport(r.id));
    card.querySelector("[data-delete]").addEventListener("click", () => deleteReport(r.id));
    reportsList.appendChild(card);
  });
}
reportSearch.addEventListener("input", renderReports);

async function saveReport(id) {
  const r = reportsCache.find(x => Number(x.id) === Number(id));
  if (!r) return toast("Relatório não encontrado.", true);
  const nome = document.getElementById(`nome-${id}`).value.trim();
  const descricao = document.getElementById(`descricao-${id}`).value.trim();
  const ano = document.getElementById(`ano-${id}`).value;
  const weekId = document.getElementById(`week-${id}`).value;
  if (!nome || !descricao || !ano || !weekId) return toast("Preencha nome, descrição, ano e Week.", true);
  const body = {
    nome, descricao, ano, weekId: idOrNull(weekId),
    classeId: idOrNull(document.getElementById(`classe-${id}`).value),
    estrategiaId: idOrNull(document.getElementById(`estrategia-${id}`).value),
    relevancia: document.getElementById(`relevancia-${id}`).value, tipo: r.tipo
  };
  if (r.tipo === "texto") {
    body.link = document.getElementById(`link-${id}`).value.trim();
    body.texto = document.getElementById(`texto-${id}`).value;
  }
  const btn = reportsList.querySelector(`#nome-${id}`)?.closest(".report-card")?.querySelector("[data-save]");
  setBusy(btn, true, "Salvando...");
  try {
    const result = await api(`/reports/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    toast(result.message || "Relatório atualizado.");
    await loadReports();
  } catch (err) { handleError(err); }
  finally { setBusy(btn, false); }
}
async function deleteReport(id) {
  if (!confirm("Deseja excluir este relatório?")) return;
  try { const d = await api(`/reports/${id}`, { method: "DELETE" }); toast(d.message || "Relatório excluído."); await loadReports(); }
  catch (err) { handleError(err); }
}
async function refreshAll() {
  await Promise.all([loadFilter("week"), loadFilter("classe"), loadFilter("estrategia")]);
  await loadReports();
}
async function init() {
  if (!(await accessCheck)) return;
  updateType("pdf");
  try { await refreshAll(); } catch (err) { handleError(err); }
}
init();
