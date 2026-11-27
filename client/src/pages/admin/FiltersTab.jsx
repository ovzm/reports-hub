import { useState } from "react";
import { Pencil, Trash2, Plus, Info } from "lucide-react";
import { api } from "../../lib/api.js";
import { sortByName, sortWeeks } from "../../lib/book.js";
import { useFeedback } from "../../context/FeedbackContext.jsx";

const GROUPS = [
  { key: "weeks", url: "/api/book/weeks", label: "Week", title: "Weeks", hint: "Períodos personalizados", placeholder: "Ex.: Week 49", letter: "W", tone: "orange", sort: sortWeeks },
  { key: "classes", url: "/api/book/classes", label: "Classe", title: "Classes", hint: "Classificação do relatório", placeholder: "Ex.: Renda Variável", letter: "C", tone: "blue", sort: sortByName },
  { key: "strategies", url: "/api/book/strategies", label: "Estratégia", title: "Estratégias", hint: "Estratégia de investimento", placeholder: "Ex.: Long Only", letter: "E", tone: "green", sort: sortByName }
];

function FilterGroup({ group, items, reload }) {
  const { toast, confirm, prompt } = useFeedback();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(event) {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api(group.url, { method: "POST", body: { nome: name.trim() } });
      toast(`${group.label} criada.`);
      setName("");
      await reload();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function rename(item) {
    const nome = await prompt({ title: `Renomear ${group.label}`, defaultValue: item.nome, confirmLabel: "Salvar" });
    if (!nome || nome === item.nome) return;
    try {
      await api(`${group.url}/${item.id}`, { method: "PUT", body: { nome } });
      toast(`${group.label} atualizada.`);
      await reload();
    } catch (err) {
      toast(err.message, "error");
    }
  }

  async function remove(item) {
    const ok = await confirm({
      title: `Excluir ${group.label}`,
      message: `Excluir "${item.nome}"? Os relatórios associados ficarão sem esse filtro.`,
      confirmLabel: "Excluir",
      danger: true
    });
    if (!ok) return;
    try {
      await api(`${group.url}/${item.id}`, { method: "DELETE" });
      toast(`${group.label} excluída.`);
      await reload();
    } catch (err) {
      toast(err.message, "error");
    }
  }

  return (
    <section className="card filter-group">
      <header className="filter-group-head">
        <span className={`letter ${group.tone}`}>{group.letter}</span>
        <div>
          <h3>{group.title}</h3>
          <p className="muted small">{group.hint}</p>
        </div>
        <span className="pill">{items.length}</span>
      </header>
      <form className="inline-form" onSubmit={create}>
        <input className="input" placeholder={group.placeholder} value={name} onChange={e => setName(e.target.value)} aria-label={`Nome da ${group.label}`} />
        <button className="btn primary" disabled={busy} aria-label={`Criar ${group.label}`}><Plus size={16} /></button>
      </form>
      <ul className="option-list">
        {!items.length && <li className="muted small">Nenhuma opção cadastrada ainda.</li>}
        {group.sort(items).map(item => (
          <li key={item.id}>
            <span>{item.nome}</span>
            <button className="icon-btn" title="Renomear" aria-label="Renomear" onClick={() => rename(item)}><Pencil size={15} /></button>
            <button className="icon-btn danger" title="Excluir" aria-label="Excluir" onClick={() => remove(item)}><Trash2 size={15} /></button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function FiltersTab({ book }) {
  return (
    <>
      <div className="filter-grid">
        {GROUPS.map(group => <FilterGroup key={group.key} group={group} items={book[group.key]} reload={book.reload} />)}
      </div>
      <div className="notice info">
        <Info size={18} />
        <span><strong>Relevância</strong> (High, Middle e Low) é um filtro fixo, disponível no upload e na edição de cada relatório.</span>
      </div>
    </>
  );
}
