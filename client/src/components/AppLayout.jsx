import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Table2, BookOpen, Settings, LogOut, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import Brand from "./Brand.jsx";

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join("");
}

export default function AppLayout() {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: "/", label: "Início", icon: LayoutDashboard, end: true },
    { to: "/relatorios", label: "Relatórios", icon: Table2 },
    { to: "/book", label: "Investments Book", icon: BookOpen, end: true },
    ...(isAdmin ? [{ to: "/book/admin", label: "Administração", icon: Settings }] : [])
  ];

  return (
    <div className={`app ${open ? "nav-open" : ""}`}>
      <aside className="sidebar" onClick={() => setOpen(false)}>
        <Brand light />
        <nav>
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="nav-link">
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <span className="avatar">{initials(user.nome)}</span>
          <div>
            <strong>{user.nome}</strong>
            <small>{isAdmin ? "Administrador" : "Usuário"}</small>
          </div>
          <button className="icon-btn light" onClick={logout} title="Sair" aria-label="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <div className="sidebar-overlay" onClick={() => setOpen(false)} />
      <div className="app-main">
        <header className="mobile-bar">
          <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu size={20} />
          </button>
          <Brand />
        </header>
        <main className="content" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
