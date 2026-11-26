import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import Modal from "../components/Modal.jsx";

const FeedbackContext = createContext(null);

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const resolver = useRef(null);

  const toast = useCallback((message, type = "success") => {
    const id = crypto.randomUUID();
    setToasts(current => [...current, { id, message, type }]);
    setTimeout(() => setToasts(current => current.filter(item => item.id !== id)), 4000);
  }, []);

  const open = useCallback(options => {
    setInputValue(options.defaultValue || "");
    setDialog(options);
    return new Promise(resolve => {
      resolver.current = resolve;
    });
  }, []);

  const confirm = useCallback((options) => open({ kind: "confirm", ...options }), [open]);
  const prompt = useCallback((options) => open({ kind: "prompt", ...options }), [open]);

  function close(result) {
    resolver.current?.(result);
    resolver.current = null;
    setDialog(null);
  }

  function submit(event) {
    event.preventDefault();
    if (dialog.kind === "prompt") {
      if (!inputValue.trim()) return;
      close(inputValue.trim());
    } else close(true);
  }

  return (
    <FeedbackContext.Provider value={{ toast, confirm, prompt }}>
      {children}
      <div className="toast-region" aria-live="polite">
        {toasts.map(item => (
          <div key={item.id} className={`toast ${item.type}`}>
            {item.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{item.message}</span>
          </div>
        ))}
      </div>
      {dialog && (
        <Modal title={dialog.title} onClose={() => close(dialog.kind === "prompt" ? null : false)}>
          <form onSubmit={submit} className="dialog-form">
            {dialog.message && <p className="dialog-message">{dialog.message}</p>}
            {dialog.kind === "prompt" && (
              <input autoFocus className="input" value={inputValue} onChange={e => setInputValue(e.target.value)} />
            )}
            <div className="dialog-actions">
              <button type="button" className="btn ghost" onClick={() => close(dialog.kind === "prompt" ? null : false)}>
                Cancelar
              </button>
              <button type="submit" autoFocus={dialog.kind === "confirm"} className={`btn ${dialog.danger ? "danger" : "primary"}`}>
                {dialog.confirmLabel || "Confirmar"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  return useContext(FeedbackContext);
}
