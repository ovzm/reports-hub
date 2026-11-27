import { useRef, useState } from "react";
import { FileText, AlignLeft, UploadCloud, X } from "lucide-react";
import { api } from "../../lib/api.js";
import { useFeedback } from "../../context/FeedbackContext.jsx";
import ReportFields, { emptyReport, yearOptions } from "./ReportFields.jsx";

const MAX_MB = 50;

export default function UploadTab({ book }) {
  const { toast } = useFeedback();
  const [form, setForm] = useState(emptyReport);
  const [tipo, setTipo] = useState("pdf");
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  function pickFile(selected) {
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".pdf")) return toast("Envie um arquivo PDF.", "error");
    if (selected.size > MAX_MB * 1024 * 1024) return toast(`O arquivo passa de ${MAX_MB} MB.`, "error");
    setFile(selected);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (tipo === "pdf" && !file) return toast("Selecione o arquivo PDF.", "error");
    if (tipo === "texto" && !form.texto.trim() && !form.link.trim()) return toast("Informe o conteúdo ou um link.", "error");

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    data.append("tipo", tipo);
    if (tipo === "pdf") data.append("pdf", file);

    setBusy(true);
    try {
      const result = await api("/api/book/upload", { method: "POST", body: data });
      toast(result.message);
      setForm(emptyReport());
      setFile(null);
      await book.reload();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="card-head">
        <span className="eyebrow">Novo relatório</span>
        <h2>Informações do relatório</h2>
        <p className="muted">Preencha os dados que serão exibidos na consulta.</p>
      </div>

      {!book.weeks.length && (
        <div className="notice">Cadastre ao menos uma Week na aba <strong>Filtros</strong> antes de enviar relatórios.</div>
      )}

      <ReportFields value={form} onChange={setForm} weeks={book.weeks} classes={book.classes} strategies={book.strategies} years={yearOptions()} showText={tipo === "texto"} />

      <div className="type-picker">
        <div>
          <strong>Tipo de conteúdo</strong>
          <p className="muted small">Arquivo PDF ou conteúdo de texto com link.</p>
        </div>
        <div className="type-options">
          <button type="button" className={tipo === "pdf" ? "active" : ""} onClick={() => setTipo("pdf")}>
            <FileText size={18} /> PDF
          </button>
          <button type="button" className={tipo === "texto" ? "active" : ""} onClick={() => setTipo("texto")}>
            <AlignLeft size={18} /> Texto e link
          </button>
        </div>
      </div>

      {tipo === "pdf" && (
        <div
          className={`dropzone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files[0]); }}
        >
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" hidden onChange={e => pickFile(e.target.files[0])} />
          {file ? (
            <div className="file-chip" onClick={e => e.stopPropagation()}>
              <FileText size={18} />
              <span>{file.name}</span>
              <small>{(file.size / 1024 / 1024).toFixed(2)} MB</small>
              <button type="button" className="icon-btn" onClick={() => setFile(null)} aria-label="Remover arquivo"><X size={16} /></button>
            </div>
          ) : (
            <>
              <UploadCloud size={28} />
              <strong>Arraste o PDF aqui ou clique para selecionar</strong>
              <small>Tamanho máximo: {MAX_MB} MB</small>
            </>
          )}
        </div>
      )}

      <footer className="form-footer">
        <span className="muted small"><em>*</em> Campos obrigatórios</span>
        <button className="btn primary" disabled={busy}>{busy ? "Enviando..." : "Salvar relatório"}</button>
      </footer>
    </form>
  );
}
