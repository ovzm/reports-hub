import { useSearchParams } from "react-router-dom";
import { UploadCloud, FolderOpen, SlidersHorizontal } from "lucide-react";
import { useBookData } from "../../lib/book.js";
import PageHeader from "../../components/PageHeader.jsx";
import Spinner from "../../components/Spinner.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import UploadTab from "./UploadTab.jsx";
import ManageTab from "./ManageTab.jsx";
import FiltersTab from "./FiltersTab.jsx";

const TABS = [
  { id: "upload", label: "Upload", icon: UploadCloud, subtitle: "Cadastre e classifique um novo conteúdo.", Component: UploadTab },
  { id: "relatorios", label: "Gerenciar relatórios", icon: FolderOpen, subtitle: "Edite os dados e a classificação dos relatórios.", Component: ManageTab },
  { id: "filtros", label: "Filtros", icon: SlidersHorizontal, subtitle: "Gerencie as opções usadas para organizar os relatórios.", Component: FiltersTab }
];

export default function AdminPage() {
  const book = useBookData();
  const [params, setParams] = useSearchParams();
  const active = TABS.find(tab => tab.id === params.get("tab")) || TABS[0];

  return (
    <>
      <PageHeader eyebrow="Investments Book · Administração" title={active.label} subtitle={active.subtitle} />
      <div className="tabs" role="tablist">
        {TABS.map(tab => (
          <button key={tab.id} role="tab" aria-selected={tab.id === active.id} className={tab.id === active.id ? "active" : ""} onClick={() => setParams({ tab: tab.id })}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>
      {book.loading ? <Spinner /> : book.error ? <EmptyState title="Erro" tone="error">{book.error}</EmptyState> : <active.Component book={book} />}
    </>
  );
}
