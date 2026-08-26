import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./sidebar.css";

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Directorio", href: "/directorio" },
  { label: "Turnos", href: "/turnos" },
  { label: "Candidatos", href: "/candidatos" },
];

/* =========================================================
   ICONOS (mismo lenguaje visual que Dashboard.tsx)
   ========================================================= */

const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" className="nav-icon" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" className="nav-icon" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" className="nav-icon" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const UserPlusIcon = () => (
  <svg viewBox="0 0 24 24" className="nav-icon" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <path d="M19 8v6" />
    <path d="M22 11h-6" />
  </svg>
);

const ICONOS_POR_LABEL: Record<string, React.FC> = {
  Dashboard: DashboardIcon,
  Directorio: UsersIcon,
  Turnos: ClockIcon,
  Candidatos: UserPlusIcon,
};

const ChevronIcon: React.FC<{ colapsado: boolean }> = ({ colapsado }) => (
  <svg
    viewBox="0 0 24 24"
    className="toggle-icon"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: colapsado ? "rotate(180deg)" : "rotate(0deg)" }}
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);

interface SidebarProps {
  activeItem?: string;
}

const STORAGE_KEY = "aw_sidebar_colapsado";
const ANCHO_EXPANDIDO = "280px";
const ANCHO_COLAPSADO = "84px";

const Sidebar: React.FC<SidebarProps> = ({ activeItem = "Dashboard" }) => {
  const [colapsado, setColapsado] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "1";
  });

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      colapsado ? ANCHO_COLAPSADO : ANCHO_EXPANDIDO
    );
    localStorage.setItem(STORAGE_KEY, colapsado ? "1" : "0");
  }, [colapsado]);

  return (
    <aside className={`sidenav ${colapsado ? "sidenav--colapsado" : ""}`}>
      <div className="sidenav-inner">
        <div className="sidenav-margin">
          <div className="sidenav-container">
            <div className="sidenav-heading">
              <h1 className="brand">{colapsado ? "AW" : "AdventureWorks"}</h1>
            </div>
            {!colapsado && (
              <div className="sidenav-subtitle-container">
                <p className="subtitle">Sistema de Gestión de RRHH</p>
              </div>
            )}
          </div>
        </div>

        <nav className="nav">
          {navItems.map((item) => {
            const Icono = ICONOS_POR_LABEL[item.label] ?? DashboardIcon;
            return (
              <Link
                key={item.label}
                to={item.href}
                className={`nav-link ${
                  item.label === activeItem ? "nav-link--active" : ""
                }`}
                title={colapsado ? item.label : undefined}
              >
                <Icono />
                {!colapsado && <span className="nav-text">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <button
        type="button"
        className="sidenav-toggle"
        onClick={() => setColapsado((v) => !v)}
        aria-label={colapsado ? "Expandir menú" : "Colapsar menú"}
      >
        <ChevronIcon colapsado={colapsado} />
      </button>
    </aside>
  );
};

export default Sidebar;