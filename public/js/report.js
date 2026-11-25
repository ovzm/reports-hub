const stage = document.getElementById("stage");
const zoomValue = document.getElementById("zoomValue");
const tableWrap = document.getElementById("tableWrap");
const updatedAt = document.getElementById("updatedAt");

const REFRESH_MS = 15000;
const minZoom = 0.5;
const maxZoom = 3;
const step = 0.15;

let zoom = 1;
let currentX = 0;
let currentY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;
let lastVersion = null;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function applyTransform() {
  stage.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px)) scale(${zoom})`;
}

function setZoom(value) {
  zoom = clamp(value, minZoom, maxZoom);
  if (zoom <= 1) {
    currentX = 0;
    currentY = 0;
  }
  tableWrap.classList.toggle("iframe-locked", zoom > 1);
  stage.style.cursor = zoom > 1 ? "grab" : "default";
  applyTransform();
  zoomValue.textContent = `Zoom: ${zoom.toFixed(2)}×`;
}

document.getElementById("zoomInBtn").addEventListener("click", () => setZoom(zoom + step));
document.getElementById("zoomOutBtn").addEventListener("click", () => setZoom(zoom - step));
document.getElementById("resetBtn").addEventListener("click", () => setZoom(1));

window.addEventListener("keydown", event => {
  if (event.key === "+" || event.key === "=") setZoom(zoom + step);
  if (event.key === "-") setZoom(zoom - step);
  if (event.key === "0") setZoom(1);
});

stage.addEventListener("mousedown", event => {
  if (zoom <= 1) return;
  isDragging = true;
  startX = event.clientX - currentX;
  startY = event.clientY - currentY;
  stage.style.cursor = "grabbing";
});

window.addEventListener("mousemove", event => {
  if (!isDragging) return;
  currentX = event.clientX - startX;
  currentY = event.clientY - startY;
  applyTransform();
});

window.addEventListener("mouseup", () => {
  if (!isDragging) return;
  isDragging = false;
  stage.style.cursor = zoom > 1 ? "grab" : "default";
});

function showMessage(text, error = false) {
  tableWrap.innerHTML = "";
  const box = document.createElement("div");
  box.className = `table-message${error ? " error" : ""}`;
  box.textContent = text;
  tableWrap.appendChild(box);
}

function isNumeric(value) {
  return /^-?[\d.,]+%?$/.test(String(value).trim());
}

function renderTable(report) {
  const table = document.createElement("table");
  table.className = "sheet";
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  report.cabecalho.forEach(cell => {
    const th = document.createElement("th");
    th.textContent = cell;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);

  const tbody = document.createElement("tbody");
  report.linhas.forEach(row => {
    const tr = document.createElement("tr");
    row.forEach(cell => {
      const td = document.createElement("td");
      td.textContent = cell;
      if (isNumeric(cell)) td.classList.add("num");
      if (/^-/.test(String(cell).trim()) && isNumeric(cell)) td.classList.add("neg");
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.append(thead, tbody);
  tableWrap.innerHTML = "";
  tableWrap.appendChild(table);
}

function renderEmbed(report) {
  if (!report.url) return showMessage("Este relatório não possui URL configurada.", true);
  const iframe = document.createElement("iframe");
  iframe.src = report.url;
  iframe.title = report.title;
  tableWrap.innerHTML = "";
  tableWrap.appendChild(iframe);
}

async function loadReport(id, silent = false) {
  try {
    const report = await Session.fetch(`/api/reports/${encodeURIComponent(id)}`);
    document.getElementById("reportTitle").textContent = report.title;
    document.title = `${report.title} - Reports Hub`;
    if (report.tipo === "embed") {
      if (!silent) renderEmbed(report);
      return;
    }
    if (report.atualizadoEm !== lastVersion) {
      lastVersion = report.atualizadoEm;
      renderTable(report);
    }
    updatedAt.textContent = `Atualizado: ${new Date(report.atualizadoEm).toLocaleString("pt-BR")}`;
    if (!silent) setInterval(() => loadReport(id, true), REFRESH_MS);
  } catch (error) {
    if (!silent) showMessage(error.message, true);
  }
}

const reportId = new URLSearchParams(window.location.search).get("id");
setZoom(1);
if (!Session.token()) Session.logout();
else if (!reportId) showMessage("Nenhum relatório selecionado.", true);
else loadReport(reportId);
