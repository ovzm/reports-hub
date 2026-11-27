import { useMemo, useState } from "react";
import { Pencil, Trash2, Search, FileText, AlignLeft, Inbox } from "lucide-react";
import { api } from "../../lib/api.js";
import { normalize, sortReports } from "../../lib/book.js";
import { useFeedback } from "../../context/FeedbackContext.jsx";
import Modal from "../../components/Modal.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import RelevanceBadge from "../../components/RelevanceBadge.jsx";
import ReportFields, { toForm, yearOptions } from "./ReportFields.jsx";

function EditReportModal({ report, book, onClose, onSaved }) {
  const { toast } = useFeedback();
  const [form, setForm] = useState(() => toForm(report));
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const body = {
        ...form,
        weekId: Number(form.weekId) || null,
        classeId: Number(form.classeId) || null,
        estrategiaId: Number(form.estrategiaId) || null
      };
      const result = await api(`/api/book/reports/${report.id}`, { method: "PUT", body });
      toast(result.message);
      await onSaved();
      onClose();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Editar relatório" onClose={onClose}>
      <form onSubmit={handleSubmit} className="modal-form">
        <ReportFields
          value={form}
          onChange={setForm}
          weeks={book.weeks}
          classes={book.classes}
          strategies={book.strategies}
          years={yearOptions([report.ano])}
          showText={report.tipo === "texto"}
        />
        <div className="dialog-actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn primary" disabled={busy}>{busy ? "Salvando..." : "Salvar alterações"}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function ManageTab({ book }) {
  const { toast, confirm } = useFeedback();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);

  const list = useMemo(() => {
    const q = normalize(query);
    return sortReports(book.reports).filter(report =>
      normalize([report.nome, report.descricao, report.ano, report.weekNome, report.classeNome, report.estrategiaNome, report.relevancia].join(" ")).includes(q)
    );
  }, [book.reports, query]);

  async function remove(report) {
    const ok = await confirm({ title: "Excluir relatório", message: `Deseja excluir "${report.nome}"? Esta ação não pode ser desfeita.`, confirmLabel: "Excluir", danger: true });
    if (!ok) return;
    try {
      const result = await api(`/api/book/reports/${report.id}`, { method: "DELETE" });
      toast(result.message);
      await book.reload();
    } catch (err) {
      toast(err.message, "error");
    }
  }

  return (
    <div className="card">
      <div className="card-head row">
        <div>
          <span className="eyebrow">Biblioteca</span>
          <h2>Gerenciar relatórios</h2>
          <p className="muted">{book.reports.length} relatórios cadastrados.</p>
        </div>
        <div className="search-box">
          <Search size={16} />
          <input type="search" placeholder="Buscar relatório ou filtro..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>

      {!list.length ? (
        <EmptyState icon={Inbox} title={book.reports.length ? "Nada encontrado" : "Nenhum relatório cadastrado"} />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Relatório</th>
                <th>Período</th>
                <th>Classificação</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {list.map(report => (
                <tr key={report.id}>
                  <td>
                    <div className="cell-title">
                      {report.tipo === "texto" ? <AlignLeft size={18} /> : <FileText size={18} />}
                      <div>
                        <strong>{report.nome}</strong>
                        <small>{report.descricao}</small>
                      </div>
                    </div>
                  </td>
                  <td className="nowrap">{report.weekNome || "—"} · {report.ano}</td>
                  <td>
                    <div className="chips">
                      {report.classeNome && <span className="chip">{report.classeNome}</span>}
                      {report.estrategiaNome && <span className="chip">{report.estrategiaNome}</span>}
                      <RelevanceBadge value={report.relevancia} />
                    </div>
                  </td>
                  <td className="actions">
                    <button className="icon-btn bordered" title="Editar" aria-label="Editar" onClick={() => setEditing(report)}><Pencil size={16} /></button>
                    <button className="icon-btn bordered danger" title="Excluir" aria-label="Excluir" onClick={() => remove(report)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && <EditReportModal report={editing} book={book} onClose={() => setEditing(null)} onSaved={book.reload} />}
    </div>
  );
}
