import { ArrowLeft, ExternalLink, Download } from "lucide-react";
import { withToken } from "../../lib/api.js";
import RelevanceBadge from "../../components/RelevanceBadge.jsx";

export default function DocumentViewer({ report, onBack }) {
  const pdfUrl = report.arquivo ? withToken(`/api/book/${report.arquivo}`) : "";

  return (
    <div className="document-viewer">
      <div className="document-toolbar">
        <button className="btn ghost" onClick={onBack}>
          <ArrowLeft size={16} /> Voltar para a lista
        </button>
        <div className="document-actions">
          {report.link && (
            <a className="btn ghost" href={report.link} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={16} /> Link relacionado
            </a>
          )}
          {pdfUrl && (
            <a className="btn ghost" href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <Download size={16} /> Abrir em nova aba
            </a>
          )}
        </div>
      </div>

      <section className="document-panel">
        <header className="document-header">
          <h2>{report.nome}</h2>
          <p>{report.descricao}</p>
          <div className="chips">
            <span className="chip">{report.ano}</span>
            {report.weekNome && <span className="chip">{report.weekNome}</span>}
            {report.classeNome && <span className="chip">Classe: {report.classeNome}</span>}
            {report.estrategiaNome && <span className="chip">Estratégia: {report.estrategiaNome}</span>}
            <RelevanceBadge value={report.relevancia} />
          </div>
        </header>

        {report.tipo === "texto" ? (
          <div className="document-text">{report.texto || "Este relatório não possui conteúdo textual."}</div>
        ) : pdfUrl ? (
          <iframe className="document-frame" src={pdfUrl} title={`PDF: ${report.nome}`} />
        ) : (
          <div className="document-text">O arquivo PDF não está disponível neste registro.</div>
        )}
      </section>
    </div>
  );
}
