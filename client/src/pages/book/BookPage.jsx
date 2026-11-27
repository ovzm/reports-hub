import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen, Search, SlidersHorizontal } from "lucide-react";
import { EMPTY_FILTERS, matchesReport, sortReports, useBookData } from "../../lib/book.js";
import Spinner from "../../components/Spinner.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import PeriodTree from "./PeriodTree.jsx";
import FilterPanel from "./FilterPanel.jsx";
import BookReportCard from "./BookReportCard.jsx";
import DocumentViewer from "./DocumentViewer.jsx";

function describe(filters, weeks) {
  const week = weeks.find(item => String(item.id) === String(filters.weekId));
  if (filters.query) return "Resultados da pesquisa";
  if (week && filters.ano) return `${week.nome} · ${filters.ano}`;
  if (filters.ano) return `Relatórios de ${filters.ano}`;
  return "Todos os relatórios";
}

export default function BookPage() {
  const { reports, weeks, classes, strategies, loading, error } = useBookData();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [params, setParams] = useSearchParams();

  const results = useMemo(() => sortReports(reports.filter(report => matchesReport(report, filters))), [reports, filters]);
  const openReport = reports.find(report => String(report.id) === params.get("doc"));

  const closeDoc = () => params.get("doc") && setParams({});
  const setFilter = (key, value) => {
    closeDoc();
    setFilters(current => ({ ...current, [key]: value }));
  };
  const selectPeriod = period => {
    closeDoc();
    setFilters(current => ({ ...current, ...period }));
  };
  const open = report => setParams({ doc: String(report.id) });
  const close = () => setParams({});

  if (loading) return <Spinner />;
  if (error) return <EmptyState title="Falha ao carregar o Investments Book" tone="error">{error}</EmptyState>;

  return (
    <div className="book-layout">
      <aside className="book-side">
        <span className="eyebrow">Navegação</span>
        <h2>Períodos</h2>
        <PeriodTree reports={reports} weeks={weeks} filters={filters} onSelect={selectPeriod} />
      </aside>

      <section className="book-main">
        {openReport ? (
          <DocumentViewer report={openReport} onBack={close} />
        ) : (
          <>
            <header className="book-main-header">
              <div>
                <span className="eyebrow">Central de documentos</span>
                <h1>{describe(filters, weeks)}</h1>
              </div>
              <div className="book-main-actions">
                <span className="pill">{results.length} {results.length === 1 ? "relatório" : "relatórios"}</span>
                <button className="btn ghost filters-toggle" onClick={() => setShowFilters(v => !v)}>
                  <SlidersHorizontal size={16} /> Filtros
                </button>
              </div>
            </header>

            {!reports.length ? (
              <EmptyState icon={BookOpen} title="Nenhum relatório cadastrado">
                Quando um administrador enviar relatórios, eles aparecerão aqui organizados por ano e Week.
              </EmptyState>
            ) : !results.length ? (
              <EmptyState icon={Search} title="Nenhum relatório encontrado">
                Tente alterar a pesquisa ou remover algum filtro.
              </EmptyState>
            ) : (
              <div className="book-list">
                {results.map(report => <BookReportCard key={report.id} report={report} onOpen={open} />)}
              </div>
            )}
          </>
        )}
      </section>

      <aside className={`book-filters ${showFilters ? "open" : ""}`}>
        <span className="eyebrow">Localização</span>
        <h2>Pesquisar</h2>
        <FilterPanel
          filters={filters}
          setFilter={setFilter}
          onClear={() => { closeDoc(); setFilters(EMPTY_FILTERS); }}
          reports={reports}
          weeks={weeks}
          classes={classes}
          strategies={strategies}
        />
      </aside>
    </div>
  );
}
