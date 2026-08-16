import React from "react";
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

const IconPlaceholder: React.FC<{ className?: string }> = ({ className }) => (
  <span className={`icon ${className ?? ""}`} aria-hidden="true" />
);

interface SidebarProps {
  activeItem?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem = "Dashboard" }) => {
  return (
    <aside className="sidenav">
      <div className="sidenav-margin">
        <div className="sidenav-container">
          <div className="sidenav-heading">
            <h1 className="brand">AdventureWorks</h1>
          </div>
          <div className="sidenav-subtitle-container">
            <p className="subtitle">Sistema de Gestión de RRHH</p>
          </div>
        </div>
      </div>

      <nav className="nav">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className={`nav-link ${
              item.label === activeItem ? "nav-link--active" : ""
            }`}
          >
            <IconPlaceholder className="nav-icon" />
            <span className="nav-text">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;