if (!localStorage.getItem("jwt")) window.location.replace("/index.html");

const API_BASE = "/api/book";

const periodList = document.getElementById("periodList");
const pdfContainer = document.getElementById("pdfContainer");
const mainTitle = document.getElementById("mainTitle");
const mainSubtitle = document.getElementById("mainSubtitle");
const resultCount = document.getElementById("resultCount");

const searchInput = document.getElementById("searchInput");
const yearFilter = document.getElementById("yearFilter");
const weekFilter = document.getElementById("weekFilter");
const classeFilter = document.getElementById("classeFilter");
const estrategiaFilter = document.getElementById("estrategiaFilter");
const relevanceFilter = document.getElementById("relevanceFilter");
const btnBuscar = document.getElementById("btnBuscar");
const clearFilters = document.getElementById("clearFilters");

let reports = [];
let weeks = [];
let classes = [];
let strategies = [];
let selectedPeriod = null;
let selectedReport = null;
let showingViewer = false;

async function apiGet(path) {
  const token = localStorage.getItem("jwt");
  const response = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  let data;
  try { data = await response.json(); } catch { data = {}; }
  if (response.status === 401) {
    localStorage.clear();
    window.location.replace("/index.html");
  }
  if (!response.ok) throw new Error(data.error || `Falha ao consultar ${path}.`);
  return data;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function normalizeText(value) {
  return String(value ?? "").trim().toLocaleLowerCase("pt-BR");
}

function getWeekName(report) {
  return report.weekNome || weeks.find(item => Number(item.id) === Number(report.weekId))?.nome || "Week sem nome";
}

function getClasseName(report) {
  return report.classeNome || classes.find(item => Number(item.id) === Number(report.classeId))?.nome || "";
}

function getStrategyName(report) {
  return report.estrategiaNome || strategies.find(item => Number(item.id) === Number(report.estrategiaId))?.nome || "";
}

function getReportYear(report) {
  return String(report.ano ?? "").trim();
}

function sortYears(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => Number(b) - Number(a) || b.localeCompare(a));
}

function sortWeeks(items) {
  return [...items].sort((a, b) => {
    const aNum = Number(String(a.nome).match(/\d+/)?.[0]);
    const bNum = Number(String(b.nome).match(/\d+/)?.[0]);
    if (Number.isFinite(aNum) && Number.isFinite(bNum) && aNum !== bNum) return bNum - aNum;
    return String(a.nome).localeCompare(String(b.nome), "pt-BR", { numeric: true });
  });
}

function setSelectOptions(select, items, firstLabel, selectedValue = "") {
  select.innerHTML = "";
  const first = document.createElement("option");
  first.value = "";
  first.textContent = firstLabel;
  select.appendChild(first);

  items.forEach(item => {
    const option = document.createElement("option");
    option.value = String(item.id ?? item.value ?? item);
    option.textContent = String(item.nome ?? item.label ?? item);
    select.appendChild(option);
  });
  if (selectedValue && [...select.options].some(option => option.value === String(selectedValue))) {
    select.value = String(selectedValue);
  }
}

function populateFilters() {
  const oldYear = yearFilter.value;
  const oldWeek = weekFilter.value;
  const oldClasse = classeFilter.value;
  const oldStrategy = estrategiaFilter.value;

  const years = sortYears(reports.map(getReportYear)).map(year => ({ id: year, nome: year }));
  setSelectOptions(yearFilter, years, "Todos os anos", oldYear);
  setSelectOptions(weekFilter, sortWeeks(weeks), "Todas as Weeks", oldWeek);
  setSelectOptions(classeFilter, [...classes].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")), "Todas as Classes", oldClasse);
  setSelectOptions(estrategiaFilter, [...strategies].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")), "Todas as Estratégias", oldStrategy);
}

function createPeriodButton(label, className, expanded = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.setAttribute("aria-expanded", String(expanded));
  button.innerHTML = `<span class="chevron" aria-hidden="true">▶</span><span>${escapeHtml(label)}</span>`;
  return button;
}

function renderPeriodTree() {
  periodList.innerHTML = "";

  const reportWeeks = new Set(reports.map(report => `${getReportYear(report)}::${report.weekId}`));
  const years = sortYears(reports.map(getReportYear));
  if (!years.length) {
    periodList.innerHTML = '<div class="message-state">Ainda não há relatórios cadastrados.</div>';
    return;
  }

  years.forEach(year => {
    const yearReports = reports.filter(report => getReportYear(report) === year);
    const weekIds = [...new Set(yearReports.map(report => String(report.weekId)).filter(Boolean))];
    const yearNode = document.createElement("div");
    yearNode.className = "period-year";

    const yearButton = createPeriodButton(year, "period-year-button", selectedPeriod?.year === year);
    const weeksNode = document.createElement("div");
    weeksNode.className = `year-weeks${selectedPeriod?.year === year ? " open" : ""}`;

    yearButton.addEventListener("click", () => {
      const open = weeksNode.classList.toggle("open");
      yearButton.setAttribute("aria-expanded", String(open));
      if (open) {
        selectedPeriod = { year, weekId: null };
        yearFilter.value = year;
        weekFilter.value = "";
        renderPeriodTree();
        showReportList(filterReports());
        mainTitle.textContent = `Relatórios de ${year}`;
        mainSubtitle.textContent = "Selecione uma Week para refinar a lista ou consulte todos os relatórios deste ano.";
      }
    });

    const weeksForYear = weekIds.map(id => {
      const item = weeks.find(week => Number(week.id) === Number(id));
      return item || { id, nome: yearReports.find(report => String(report.weekId) === id)?.weekNome || "Week" };
    });

    sortWeeks(weeksForYear).forEach(week => {
      const count = yearReports.filter(report => Number(report.weekId) === Number(week.id)).length;
      const weekButton = document.createElement("button");
      weekButton.type = "button";
      weekButton.className = `period-week-button${selectedPeriod?.year === year && Number(selectedPeriod?.weekId) === Number(week.id) ? " selected" : ""}`;
      weekButton.innerHTML = `<span class="week-dot" aria-hidden="true"></span><span>${escapeHtml(week.nome)}</span><span class="week-count">${count}</span>`;
      weekButton.addEventListener("click", () => {
        selectedPeriod = { year, weekId: String(week.id) };
        yearFilter.value = year;
        weekFilter.value = String(week.id);
        renderPeriodTree();
        const list = filterReports();
        showReportList(list);
        mainTitle.textContent = `${week.nome} · ${year}`;
        mainSubtitle.textContent = `${count} ${count === 1 ? "relatório cadastrado" : "relatórios cadastrados"} neste período.`;
      });
      weeksNode.appendChild(weekButton);
    });

    yearNode.appendChild(yearButton);
    yearNode.appendChild(weeksNode);
    periodList.appendChild(yearNode);
  });
}

function reportMatchesSearch(report, query) {
  if (!query) return true;
  const haystack = [report.nome, report.descricao, report.texto, report.textoPDF, getWeekName(report), getClasseName(report), getStrategyName(report), report.relevancia]
    .map(normalizeText).join(" ");
  return haystack.includes(query);
}

function filterReports() {
  const query = normalizeText(searchInput.value);
  const year = yearFilter.value;
  const weekId = weekFilter.value;
  const classeId = classeFilter.value;
  const estrategiaId = estrategiaFilter.value;
  const relevance = relevanceFilter.value;

  return reports.filter(report => {
    if (!reportMatchesSearch(report, query)) return false;
    if (year && getReportYear(report) !== String(year)) return false;
    if (weekId && Number(report.weekId) !== Number(weekId)) return false;
    if (classeId && Number(report.classeId) !== Number(classeId)) return false;
    if (estrategiaId && Number(report.estrategiaId) !== Number(estrategiaId)) return false;
    if (relevance && String(report.relevancia || "Middle") !== relevance) return false;
    return true;
  }).sort((a, b) => getReportYear(b).localeCompare(getReportYear(a), "pt-BR", { numeric: true }) || getWeekName(a).localeCompare(getWeekName(b), "pt-BR", { numeric: true }) || String(a.nome).localeCompare(String(b.nome), "pt-BR"));
}

function relevanceClass(value) {
  if (value === "High") return "relevance-high";
  if (value === "Low") return "relevance-low";
  return "relevance-middle";
}

function makeChip(text, extraClass = "") {
  const span = document.createElement("span");
  span.className = `meta-chip ${extraClass}`.trim();
  span.textContent = text;
  return span;
}

function showReportList(list) {
  showingViewer = false;
  selectedReport = null;
  resultCount.textContent = `${list.length} ${list.length === 1 ? "relatório" : "relatórios"}`;
  pdfContainer.innerHTML = "";

  if (!list.length) {
    pdfContainer.innerHTML = '<div class="empty-state"><div class="empty-icon" aria-hidden="true">⌕</div><h2>Nenhum relatório encontrado</h2><p>Tente alterar a pesquisa ou remover algum filtro para ver mais resultados.</p></div>';
    return;
  }

  const listNode = document.createElement("div");
  listNode.className = "report-list";

  list.forEach(report => {
    const card = document.createElement("article");
    card.className = "report-card";

    const top = document.createElement("div");
    top.className = "report-card-top";
    const title = document.createElement("h3");
    title.textContent = report.nome || "Relatório sem nome";
    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "open-report-button";
    openButton.textContent = report.tipo === "texto" ? "Abrir conteúdo ↗" : "Abrir PDF ↗";
    openButton.addEventListener("click", () => openReport(report));
    top.append(title, openButton);

    const description = document.createElement("p");
    description.className = "report-description";
    description.textContent = report.descricao || "Sem descrição cadastrada.";

    const meta = document.createElement("div");
    meta.className = "report-meta";
    meta.appendChild(makeChip(getReportYear(report) || "Sem ano"));
    meta.appendChild(makeChip(getWeekName(report)));
    if (getClasseName(report)) meta.appendChild(makeChip(`Classe: ${getClasseName(report)}`));
    if (getStrategyName(report)) meta.appendChild(makeChip(`Estratégia: ${getStrategyName(report)}`));
    meta.appendChild(makeChip(`Relevância: ${report.relevancia || "Middle"}`, `relevance-chip ${relevanceClass(report.relevancia || "Middle")}`));

    card.append(top, description, meta);
    listNode.appendChild(card);
  });

  pdfContainer.appendChild(listNode);
}

function resolvePdfUrl(report) {
  if (!report.arquivo) return "";
  const normalized = String(report.arquivo).replace(/\\/g, "/").replace(/^\.\//, "");
  if (/^https?:\/\//i.test(normalized)) return normalized;
  const token = localStorage.getItem("jwt");
  const url = `${API_BASE}/${normalized.replace(/^\//, "")}`;
  return token ? `${url}?token=${encodeURIComponent(token)}` : url;
}

function openReport(report) {
  selectedReport = report;
  showingViewer = true;
  resultCount.textContent = "Documento aberto";
  mainTitle.textContent = report.nome || "Relatório";
  mainSubtitle.textContent = `${getWeekName(report)} · ${getReportYear(report)}`;
  pdfContainer.innerHTML = "";

  const toolbar = document.createElement("div");
  toolbar.className = "viewer-toolbar";
  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "back-button";
  backButton.textContent = "← Voltar para os relatórios";
  backButton.addEventListener("click", () => {
    showingViewer = false;
    mainTitle.textContent = selectedPeriod?.weekId
      ? `${getWeekName({ weekId: selectedPeriod.weekId })} · ${selectedPeriod.year}`
      : selectedPeriod?.year ? `Relatórios de ${selectedPeriod.year}` : "Resultados da pesquisa";
    mainSubtitle.textContent = "Selecione um relatório para visualizar seu conteúdo.";
    showReportList(filterReports());
  });
  const title = document.createElement("h2");
  title.className = "viewer-title";
  title.textContent = report.nome || "Relatório";
  toolbar.append(backButton, title);
  pdfContainer.appendChild(toolbar);

  const panel = document.createElement("section");
  panel.className = "viewer-panel";
  const details = document.createElement("div");
  details.className = "viewer-details";
  const description = document.createElement("p");
  description.textContent = report.descricao || "Sem descrição cadastrada.";
  details.appendChild(description);

  if (report.link) {
    const link = document.createElement("a");
    link.className = "viewer-link";
    link.href = report.link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Abrir link relacionado em nova aba";
    details.appendChild(link);
  }
  panel.appendChild(details);

  if (report.tipo === "texto") {
    if (report.texto) {
      const textContent = document.createElement("div");
      textContent.className = "text-viewer-content";
      textContent.textContent = report.texto;
      panel.appendChild(textContent);
    }
    if (!report.texto && !report.link) {
      const message = document.createElement("div");
      message.className = "text-viewer-content";
      message.textContent = "Este relatório não possui conteúdo textual ou link.";
      panel.appendChild(message);
    }
  } else {
    const pdfUrl = resolvePdfUrl(report);
    if (pdfUrl) {
      const frame = document.createElement("iframe");
      frame.id = "pdfFrame";
      frame.title = `Visualizador de PDF: ${report.nome || "relatório"}`;
      frame.src = pdfUrl;
      panel.appendChild(frame);
    } else {
      const message = document.createElement("div");
      message.className = "text-viewer-content";
      message.textContent = "O arquivo PDF não está disponível neste registro.";
      panel.appendChild(message);
    }
  }

  pdfContainer.appendChild(panel);
}

function applySearch() {
  selectedPeriod = null;
  renderPeriodTree();
  const list = filterReports();
  mainTitle.textContent = "Resultados da pesquisa";
  mainSubtitle.textContent = "Relatórios que correspondem aos termos e filtros selecionados.";
  showReportList(list);
}

function clearAllFilters() {
  searchInput.value = "";
  yearFilter.value = "";
  weekFilter.value = "";
  classeFilter.value = "";
  estrategiaFilter.value = "";
  relevanceFilter.value = "";
  selectedPeriod = null;
  renderPeriodTree();
  mainTitle.textContent = "Todos os relatórios";
  mainSubtitle.textContent = "Selecione um período à esquerda ou use os filtros de pesquisa.";
  showReportList(filterReports());
}

async function loadPageData() {
  periodList.innerHTML = '<div class="loading-state">Carregando períodos...</div>';
  try {
    const [reportsData, weeksData, classesData, strategiesData] = await Promise.all([
      apiGet("/reports"), apiGet("/weeks"), apiGet("/classes"), apiGet("/strategies")
    ]);
    reports = Array.isArray(reportsData) ? reportsData : [];
    weeks = Array.isArray(weeksData) ? weeksData : [];
    classes = Array.isArray(classesData) ? classesData : [];
    strategies = Array.isArray(strategiesData) ? strategiesData : [];

    populateFilters();
    renderPeriodTree();
    resultCount.textContent = `${reports.length} ${reports.length === 1 ? "relatório" : "relatórios"}`;
    if (reports.length) {
      mainTitle.textContent = "Todos os relatórios";
      mainSubtitle.textContent = "Selecione um ano e uma Week ou use os filtros para encontrar um documento.";
      showReportList(reports);
    } else {
      pdfContainer.innerHTML = '<div class="empty-state"><div class="empty-icon" aria-hidden="true">▤</div><h2>Nenhum relatório cadastrado</h2><p>Quando os relatórios forem enviados pelo administrador, eles aparecerão aqui organizados por ano e Week.</p></div>';
    }
  } catch (error) {
    console.error("Erro ao carregar Investments Book:", error);
    periodList.innerHTML = '<div class="error-state">Não foi possível carregar os períodos.</div>';
    pdfContainer.innerHTML = `<div class="error-state"><strong>Falha ao conectar com o servidor.</strong><br>${escapeHtml(error.message)}<br><br>Confirme se o servidor está rodando (npm start).</div>`;
  }
}

btnBuscar.addEventListener("click", applySearch);
clearFilters.addEventListener("click", clearAllFilters);
searchInput.addEventListener("keydown", event => { if (event.key === "Enter") applySearch(); });
searchInput.addEventListener("input", () => {
  if (!showingViewer) {
    selectedPeriod = null;
    renderPeriodTree();
    mainTitle.textContent = searchInput.value.trim() ? "Resultados da pesquisa" : "Todos os relatórios";
    mainSubtitle.textContent = "A lista é atualizada conforme você digita.";
    showReportList(filterReports());
  }
});

loadPageData();
