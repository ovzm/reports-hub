import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { LogIn, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { tokenStore } from "../lib/api.js";
import Brand from "../components/Brand.jsx";

const DEMO_USERS = [
  { email: "admin@demo.com", senha: "admin123", perfil: "Admin · todos os relatórios" },
  { email: "analista@demo.com", senha: "analista123", perfil: "3 relatórios" },
  { email: "cliente@demo.com", senha: "cliente123", perfil: "1 relatório" },
  { email: "visitante@demo.com", senha: "visitante123", perfil: "Só o Investments Book" }
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = params.get("token");
    if (token) {
      tokenStore.set(token);
      window.location.replace("/");
    }
  }, [params]);

  if (user) return <Navigate to={location.state?.from?.pathname || "/"} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, senha);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function fillDemo(demo) {
    setEmail(demo.email);
    setSenha(demo.senha);
    setError("");
  }

  return (
    <div className="login-page">
      <section className="login-card">
        <Brand />
        <h1>Entrar</h1>
        <p className="muted">Acesse os relatórios liberados para o seu perfil.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="field">
            <span>E-mail</span>
            <input className="input" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label className="field">
            <span>Senha</span>
            <input className="input" type="password" autoComplete="current-password" value={senha} onChange={e => setSenha(e.target.value)} required />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn primary block" disabled={busy}>
            <LogIn size={18} />
            {busy ? "Entrando..." : "Entrar"}
          </button>
          {/*
          <a className="btn ghost block" href="/auth/microsoft">Entrar com Microsoft</a>
          */}
        </form>

        <details className="demo-users">
          <summary>
            Usuários de demonstração <ChevronDown size={16} />
          </summary>
          <ul>
            {DEMO_USERS.map(demo => (
              <li key={demo.email}>
                <button type="button" onClick={() => fillDemo(demo)}>
                  <strong>{demo.email}</strong>
                  <span>{demo.perfil}</span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      </section>

      <section className="login-hero">
        <span className="eyebrow">Portal de indicadores</span>
        <h2>Relatórios em tempo real, cada um com o acesso certo.</h2>
        <p>Planilhas atualizadas automaticamente, permissões por usuário e uma biblioteca de documentos com busca no conteúdo dos PDFs.</p>
      </section>
    </div>
  );
}
