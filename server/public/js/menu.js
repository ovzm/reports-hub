const reportsList = document.getElementById("reportsList");
const searchInput = document.getElementById("searchInput");

let reports = [];

function createCard(report) {
  const wrapper = document.createElement("div");
  wrapper.className = "report-card";

  const left = document.createElement("div");
  left.className = "report-info";

  const icon = document.createElement("i");
  icon.className = "fa-solid fa-chart-line report-icon";

  const text = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = report.title;
  const description = document.createElement("small");
  description.textContent = report.descricao || "";
  text.append(title, description);

  left.append(icon, text);

  const button = document.createElement("button");
  button.textContent = "Abrir";
  button.addEventListener("click", event => {
    event.stopPropagation();
    openReport(report.id);
  });

  wrapper.append(left, button);
  wrapper.addEventListener("click", () => openReport(report.id));
  return wrapper;
}

function renderList(filter = "") {
  reportsList.innerHTML = "";
  const query = filter.trim().toLowerCase();
  const visible = reports.filter(report => report.title.toLowerCase().includes(query));

  if (!visible.length) {
    const empty = document.createElement("div");
    empty.className = "empty-list";
    empty.textContent = reports.length ? "Nenhum relatório corresponde à busca." : "Nenhum relatório disponível para o seu usuário.";
    reportsList.appendChild(empty);
    return;
  }

  visible.forEach(report => reportsList.appendChild(createCard(report)));
}

function openReport(id) {
  window.location.href = `/page/report.html?id=${encodeURIComponent(id)}`;
}

async function initMenu() {
  try {
    const [user, list] = await Promise.all([Session.user(), Session.fetch("/api/reports")]);
    document.getElementById("userLabel").textContent = user.nome;
    reports = list;
    renderList();
  } catch (error) {
    console.error(error);
  }
}

document.getElementById("logoutBtn").addEventListener("click", Session.logout);
searchInput.addEventListener("input", event => renderList(event.target.value));

const userDropdown = document.querySelector(".user-dropdown");
const dropdownContent = document.querySelector(".dropdown-content");
userDropdown.addEventListener("mouseenter", () => { dropdownContent.style.display = "block"; });
userDropdown.addEventListener("mouseleave", () => { dropdownContent.style.display = "none"; });

initMenu();
