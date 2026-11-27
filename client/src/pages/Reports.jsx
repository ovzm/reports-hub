import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, LineChart, Lock, ChevronRight } from "lucide-react";
import { api } from "../lib/api.js";
import PageHeader from "../components/PageHeader.jsx";
import Spinner from "../components/Spinner.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function Reports() {
  const [reports, setReports] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    api("/api/reports").then(setReports).catch(err => setError(err.message));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (reports || []).filter(report => `${report.title} ${report.descricao}`.toLowerCase().includes(q));
  }, [reports, query]);

  return (
    <>
      <PageHeader eyebrow="Análise e indicadores" title="Relatórios" subtitle="Somente os relatórios liberados para o seu usuário aparecem aqui." />

      <div className="search-box large">
        <Search size={18} />
        <input placeholder="Buscar relatório ou fundo..." value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      {error && <EmptyState title="Erro ao carregar" tone="error">{error}</EmptyState>}
      {!reports && !error && <Spinner />}
      {reports && !reports.length && (
        <EmptyState icon={Lock} title="Nenhum relatório liberado">
          Seu usuário ainda não tem acesso a nenhuma planilha. Peça a um administrador para liberar.
        </EmptyState>
      )}
      {reports && reports.length > 0 && !visible.length && <EmptyState icon={Search} title="Nada encontrado">Tente outro termo de busca.</EmptyState>}

      <div className="report-list">
        {visible.map(report => (
          <Link key={report.id} to={`/relatorios/${encodeURIComponent(report.id)}`} className="report-row">
            <span className="report-row-icon">
              <LineChart size={20} />
            </span>
            <span className="report-row-text">
              <strong>{report.title}</strong>
              <small>{report.descricao}</small>
            </span>
            <span className="badge">{report.tipo === "embed" ? "Online" : "Planilha"}</span>
            <ChevronRight size={18} className="muted" />
          </Link>
        ))}
      </div>
    </>
  );
}
