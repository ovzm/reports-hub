import { RELEVANCE, sortByName, sortWeeks } from "../../lib/book.js";

const currentYear = new Date().getFullYear();

export function yearOptions(extra = []) {
  const years = new Set(extra.filter(Boolean).map(String));
  for (let year = currentYear - 6; year <= currentYear + 2; year++) years.add(String(year));
  return [...years].sort((a, b) => Number(b) - Number(a));
}

export function emptyReport() {
  return { nome: "", descricao: "", ano: String(currentYear), weekId: "", classeId: "", estrategiaId: "", relevancia: "Middle", link: "", texto: "" };
}

export function toForm(report) {
  return {
    nome: report.nome || "",
    descricao: report.descricao || "",
    ano: String(report.ano || currentYear),
    weekId: report.weekId ? String(report.weekId) : "",
    classeId: report.classeId ? String(report.classeId) : "",
    estrategiaId: report.estrategiaId ? String(report.estrategiaId) : "",
    relevancia: report.relevancia || "Middle",
    link: report.link || "",
    texto: report.texto || ""
  };
}

export default function ReportFields({ value, onChange, weeks, classes, strategies, years, showText }) {
  const set = key => event => onChange({ ...value, [key]: event.target.value });

  return (
    <div className="form-grid">
      <label className="field full">
        <span>Nome do relatório <em>*</em></span>
        <input className="input" value={value.nome} onChange={set("nome")} placeholder="Ex.: Relatório semanal de mercado" required />
      </label>
      <label className="field full">
        <span>Descrição <em>*</em></span>
        <textarea className="input" rows={3} value={value.descricao} onChange={set("descricao")} placeholder="Resuma o conteúdo deste relatório..." required />
      </label>
      <label className="field">
        <span>Ano <em>*</em></span>
        <select className="input" value={value.ano} onChange={set("ano")} required>
          {years.map(year => <option key={year} value={year}>{year}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Week <em>*</em></span>
        <select className="input" value={value.weekId} onChange={set("weekId")} required>
          <option value="">Selecione uma Week</option>
          {sortWeeks(weeks).map(week => <option key={week.id} value={week.id}>{week.nome}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Classe</span>
        <select className="input" value={value.classeId} onChange={set("classeId")}>
          <option value="">Sem classe</option>
          {sortByName(classes).map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Estratégia</span>
        <select className="input" value={value.estrategiaId} onChange={set("estrategiaId")}>
          <option value="">Sem estratégia</option>
          {sortByName(strategies).map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}
        </select>
      </label>
      <div className="field full">
        <span>Relevância <em>*</em></span>
        <div className="segmented">
          {RELEVANCE.map(item => (
            <button
              type="button"
              key={item.value}
              className={value.relevancia === item.value ? `active ${item.value.toLowerCase()}` : ""}
              onClick={() => onChange({ ...value, relevancia: item.value })}
            >
              {item.label} <small>· {item.description}</small>
            </button>
          ))}
        </div>
      </div>
      {showText && (
        <>
          <label className="field full">
            <span>Link (opcional)</span>
            <input className="input" type="url" value={value.link} onChange={set("link")} placeholder="https://..." />
          </label>
          <label className="field full">
            <span>Conteúdo</span>
            <textarea className="input" rows={6} value={value.texto} onChange={set("texto")} placeholder="Digite o conteúdo..." />
          </label>
        </>
      )}
    </div>
  );
}
