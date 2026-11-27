import { Search } from "lucide-react";
import { RELEVANCE, sortByName, sortWeeks, sortYears } from "../../lib/book.js";

function Select({ label, value, onChange, placeholder, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select className="input" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.id} value={option.id}>{option.nome}</option>
        ))}
      </select>
    </label>
  );
}

export default function FilterPanel({ filters, setFilter, onClear, reports, weeks, classes, strategies }) {
  const years = sortYears(reports.map(report => report.ano)).map(year => ({ id: year, nome: year }));
  const active = Object.values(filters).some(Boolean);

  return (
    <div className="filter-panel">
      <label className="field">
        <span>Pesquisa rápida</span>
        <div className="search-box">
          <Search size={16} />
          <input type="search" placeholder="Buscar..." value={filters.query} onChange={e => setFilter("query", e.target.value)} />
        </div>
        <small className="muted">Busca também dentro do texto dos PDFs.</small>
      </label>

      <div className="filter-heading">
        <h3>Filtros avançados</h3>
        {active && <button className="link-btn" onClick={onClear}>Limpar</button>}
      </div>

      <Select label="Ano" value={filters.ano} onChange={v => setFilter("ano", v)} placeholder="Todos os anos" options={years} />
      <Select label="Week" value={filters.weekId} onChange={v => setFilter("weekId", v)} placeholder="Todas as Weeks" options={sortWeeks(weeks)} />
      <Select label="Classe" value={filters.classeId} onChange={v => setFilter("classeId", v)} placeholder="Todas as Classes" options={sortByName(classes)} />
      <Select label="Estratégia" value={filters.estrategiaId} onChange={v => setFilter("estrategiaId", v)} placeholder="Todas as Estratégias" options={sortByName(strategies)} />

      <div className="field">
        <span>Relevância</span>
        <div className="segmented">
          <button className={!filters.relevancia ? "active" : ""} onClick={() => setFilter("relevancia", "")}>Todas</button>
          {RELEVANCE.map(item => (
            <button key={item.value} className={filters.relevancia === item.value ? `active ${item.value.toLowerCase()}` : ""} onClick={() => setFilter("relevancia", item.value)}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
