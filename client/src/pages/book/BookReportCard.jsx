import { FileText, AlignLeft, ArrowUpRight } from "lucide-react";
import RelevanceBadge from "../../components/RelevanceBadge.jsx";

export default function BookReportCard({ report, onOpen }) {
  const Icon = report.tipo === "texto" ? AlignLeft : FileText;
  return (
    <article className="book-card">
      <div className="book-card-icon">
        <Icon size={20} />
      </div>
      <div className="book-card-body">
        <h3>{report.nome}</h3>
        <p>{report.descricao || "Sem descrição cadastrada."}</p>
        <div className="chips">
          <span className="chip">{report.ano}</span>
          {report.weekNome && <span className="chip">{report.weekNome}</span>}
          {report.classeNome && <span className="chip">Classe: {report.classeNome}</span>}
          {report.estrategiaNome && <span className="chip">Estratégia: {report.estrategiaNome}</span>}
          <RelevanceBadge value={report.relevancia} />
        </div>
      </div>
      <button className="btn primary sm" onClick={() => onOpen(report)}>
        {report.tipo === "texto" ? "Abrir conteúdo" : "Abrir PDF"} <ArrowUpRight size={16} />
      </button>
    </article>
  );
}
