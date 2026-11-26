import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Table2, BookOpen, Settings, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import PageHeader from "../components/PageHeader.jsx";

export default function Home() {
  const { user, isAdmin } = useAuth();
  const [counts, setCounts] = useState({ reports: null, book: null });

  useEffect(() => {
    Promise.all([api("/api/reports"), api("/api/book/reports")])
      .then(([reports, book]) => setCounts({ reports: reports.length, book: book.length }))
      .catch(() => {});
  }, []);

  const cards = [
    {
      to: "/relatorios",
      icon: Table2,
      label: "Análise e indicadores",
      title: "Relatórios",
      text: "Planilhas e indicadores disponíveis para o seu perfil, atualizados automaticamente.",
      stat: counts.reports,
      statLabel: "liberados para você"
    },
    {
      to: "/book",
      icon: BookOpen,
      label: "Biblioteca de documentos",
      title: "Investments Book",
      text: "Relatórios em PDF organizados por ano e Week, com busca no conteúdo dos documentos.",
      stat: counts.book,
      statLabel: "documentos"
    },
    ...(isAdmin
      ? [{
          to: "/book/admin",
          icon: Settings,
          label: "Acesso restrito",
          title: "Administração do Book",
          text: "Cadastre relatórios, gerencie filtros e edite os documentos do Investments Book.",
          tone: "dark"
        }]
      : [])
  ];

  return (
    <>
      <PageHeader eyebrow="Menu principal" title={`Olá, ${user.nome.split(" ")[0]}`} subtitle="Escolha a área que deseja acessar." />
      <div className="choice-grid">
        {cards.map(card => (
          <Link key={card.to} to={card.to} className={`choice-card ${card.tone || ""}`}>
            <div className="choice-icon">
              <card.icon size={22} />
            </div>
            <span className="eyebrow">{card.label}</span>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
            <footer>
              {card.stat != null ? (
                <span className="choice-stat">
                  <strong>{card.stat}</strong> {card.statLabel}
                </span>
              ) : <span />}
              <ArrowRight size={18} />
            </footer>
          </Link>
        ))}
      </div>
    </>
  );
}
