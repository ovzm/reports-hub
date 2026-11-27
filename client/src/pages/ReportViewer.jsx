import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ZoomIn, ZoomOut, RotateCcw, RefreshCw, ShieldAlert } from "lucide-react";
import { api } from "../lib/api.js";
import { useZoomPan } from "../lib/useZoomPan.js";
import Spinner from "../components/Spinner.jsx";
import EmptyState from "../components/EmptyState.jsx";

const REFRESH_MS = 15000;
const NUMERIC = /^-?[\d.,]+%?$/;

function SheetTable({ cabecalho, linhas }) {
  return (
    <table className="sheet">
      <thead>
        <tr>
          {cabecalho.map((cell, index) => <th key={index}>{cell}</th>)}
        </tr>
      </thead>
      <tbody>
        {linhas.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => {
              const numeric = NUMERIC.test(cell.trim());
              const negative = numeric && cell.trim().startsWith("-");
              return (
                <td key={cellIndex} className={`${numeric ? "num" : ""} ${negative ? "neg" : ""}`}>
                  {cell}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ReportViewer() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const version = useRef(null);
  const { zoom, zoomIn, zoomOut, reset, locked, stageProps } = useZoomPan();

  useEffect(() => {
    let active = true;
    async function load(silent) {
      if (silent) setRefreshing(true);
      try {
        const data = await api(`/api/reports/${encodeURIComponent(id)}`);
        if (!active) return;
        if (data.atualizadoEm !== version.current || !silent) {
          version.current = data.atualizadoEm;
          setReport(data);
        }
        setError(null);
      } catch (err) {
        if (active && !silent) setError(err);
      } finally {
        if (active) setRefreshing(false);
      }
    }
    load(false);
    const timer = setInterval(() => load(true), REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [id]);

  return (
    <div className="viewer-page">
      <div className="viewer-toolbar">
        <Link to="/relatorios" className="btn ghost">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <h1>{report?.title || "Relatório"}</h1>
        <div className="toolbar-group">
          <button className="icon-btn bordered" onClick={zoomOut} title="Diminuir zoom (-)"><ZoomOut size={18} /></button>
          <span className="zoom-label">{Math.round(zoom * 100)}%</span>
          <button className="icon-btn bordered" onClick={zoomIn} title="Aumentar zoom (+)"><ZoomIn size={18} /></button>
          <button className="icon-btn bordered" onClick={reset} title="Resetar (0)"><RotateCcw size={18} /></button>
        </div>
        {report?.atualizadoEm && (
          <span className={`updated-at ${refreshing ? "spinning" : ""}`}>
            <RefreshCw size={14} />
            Atualizado {new Date(report.atualizadoEm).toLocaleString("pt-BR")}
          </span>
        )}
      </div>

      <div className="viewer-canvas">
        {error && (
          <EmptyState icon={ShieldAlert} title={error.status === 403 ? "Acesso negado" : "Não foi possível abrir"} tone="error">
            {error.message}
          </EmptyState>
        )}
        {!report && !error && <Spinner />}
        {report && (
          <div className="viewer-stage" {...stageProps}>
            <div className={`sheet-frame ${locked ? "locked" : ""}`}>
              {report.tipo === "embed" ? (
                report.url ? <iframe src={report.url} title={report.title} /> : <EmptyState title="URL não configurada" />
              ) : (
                <SheetTable cabecalho={report.cabecalho} linhas={report.linhas} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
