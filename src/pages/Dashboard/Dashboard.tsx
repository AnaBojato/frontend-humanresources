import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import { apiFetch, ApiError } from "../../services/api";
import "./dashboard.css";

/* =========================================================
   TIPOS
   ========================================================= */

interface Estadisticas {
  totalEmpleados: {
    total: number;
    activos: number;
    inactivos: number;
  };
  totalDepartamentos: number;
  totalTurnos: number;
  totalCandidatos: number;
  balanceVacacionesPromedioDias: number;
  candidatosActivos: {
    total: number;
    enEntrevistaFinal: number;
  };
  cambiosTurno: {
    total: number;
    pendientesAprobacion: number;
  };
}

interface EmpleadoReciente {
  idEmpleado: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  cargo: string;
  departamento: string | null;
  fechaContratacion: string;
}

interface DepartamentoResumen {
  division: string;
  departamento: string;
  totalEmpleados: number;
}

interface CandidatoReciente {
  idCandidato: number;
  nombre: string;
  cargoAplicado: string | null;
  etapa: string;
  tieneHojaDeVida: number;
  fechaRegistro: string;
}

/* =========================================================
   ICONOS
   ========================================================= */

const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="svg-icon"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </svg>
);

const BellIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="svg-icon"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);

const UsersIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="svg-icon"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const BuildingIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="svg-icon"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 21h18" />
    <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
    <path d="M9 7h2" />
    <path d="M13 7h2" />
    <path d="M9 11h2" />
    <path d="M13 11h2" />
    <path d="M9 15h2" />
    <path d="M13 15h2" />
  </svg>
);

const ClockIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="svg-icon"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const UserPlusIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="svg-icon"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <path d="M19 8v6" />
    <path d="M22 11h-6" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="small-icon"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 19V5" />
    <path d="m5 12 7-7 7 7" />
  </svg>
);

const FileIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="small-icon"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
);

/* =========================================================
   HELPERS
   ========================================================= */

function formatearNumero(numero: number): string {
  return new Intl.NumberFormat("es-CO").format(numero);
}

function formatearFecha(fecha: string): string {
  if (!fecha) return "—";

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) {
    return fecha;
  }

  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function obtenerIniciales(nombre: string): string {
  if (!nombre) return "?";

  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

function obtenerClaseEtapa(etapa: string): string {
  switch (etapa) {
    case "Applied":
      return "stage-badge stage-applied";

    case "Interviewed":
      return "stage-badge stage-interviewed";

    case "Offer":
      return "stage-badge stage-offer";

    case "Hired":
      return "stage-badge stage-hired";

    case "Rejected":
      return "stage-badge stage-rejected";

    default:
      return "stage-badge";
  }
}

function traducirEtapa(etapa: string): string {
  switch (etapa) {
    case "Applied":
      return "Aplicado";

    case "Interviewed":
      return "Entrevista";

    case "Offer":
      return "Oferta";

    case "Hired":
      return "Contratado";

    case "Rejected":
      return "Rechazado";

    default:
      return etapa;
  }
}

/* =========================================================
   DASHBOARD
   ========================================================= */

const Dashboard: React.FC = () => {
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);

  const [ultimosEmpleados, setUltimosEmpleados] = useState<
    EmpleadoReciente[]
  >([]);

  const [empleadosPorDepartamento, setEmpleadosPorDepartamento] = useState<
    DepartamentoResumen[]
  >([]);

  const [ultimosCandidatos, setUltimosCandidatos] = useState<
    CandidatoReciente[]
  >([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* =========================================================
     CARGAR DATOS DEL BACKEND
     ========================================================= */

  useEffect(() => {
    async function cargarDashboard() {
      try {
        setCargando(true);
        setError(null);

        const [
          stats,
          empleados,
          departamentos,
          candidatos,
        ] = await Promise.all([
          apiFetch<Estadisticas>("/dashboard/stats"),
          apiFetch<EmpleadoReciente[]>(
            "/dashboard/contrataciones-recientes"
          ),
          apiFetch<DepartamentoResumen[]>(
            "/dashboard/distribucion-departamentos"
          ),
          apiFetch<CandidatoReciente[]>(
            "/dashboard/candidatos-recientes"
          ),
        ]);

        setEstadisticas(stats);
        setUltimosEmpleados(empleados);
        setEmpleadosPorDepartamento(departamentos);
        setUltimosCandidatos(candidatos);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("No se pudieron cargar los datos del Dashboard.");
        }
      } finally {
        setCargando(false);
      }
    }

    cargarDashboard();
  }, []);

  /* =========================================================
     LOADING
     ========================================================= */

  if (cargando) {
    return (
      <div className="dashboard-layout">
        <Sidebar activeItem="Dashboard" />

        <div className="content-margin">
          <main className="main-canvas dashboard-loading">
            <div className="loading-spinner" />
            <p>Cargando información del Dashboard...</p>
          </main>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
     ========================================================= */

  if (error || !estadisticas) {
    return (
      <div className="dashboard-layout">
        <Sidebar activeItem="Dashboard" />

        <div className="content-margin">
          <main className="main-canvas">
            <div className="error-card">
              <div className="error-icon">!</div>
              <h2>No se pudo cargar el Dashboard</h2>
              <p>{error || "No hay información disponible."}</p>
              <button
                className="btn-primary"
                onClick={() => window.location.reload()}
              >
                Intentar nuevamente
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="dashboard-layout">
      <Sidebar activeItem="Dashboard" />

      <div className="content-margin">
        {/* =====================================================
            TOP NAV
        ===================================================== */}

        <header className="topnav">
          <div className="search-bg">
            <span className="search-icon-margin">
              <SearchIcon />
            </span>

            <input
              className="search-input"
              type="text"
              placeholder="Buscar empleados, departamentos o turnos..."
            />
          </div>

          <div className="topnav-actions">
            <button
              className="icon-button notification-button"
              aria-label="Notificaciones"
            >
              <BellIcon />
              <span className="notification-dot" />
            </button>

            <div className="user-block">
              <div className="user-info">
                <span className="user-name">Alex Thompson</span>
                <span className="user-role">Gerente de RRHH</span>
              </div>

              <div className="user-avatar">AT</div>
            </div>
          </div>
        </header>

        <main className="main-canvas">
          {/* ===================================================
              HERO
          =================================================== */}

          <section className="hero">
            <div className="hero-decoration hero-decoration-one" />
            <div className="hero-decoration hero-decoration-two" />

            <div className="hero-content">
              <div className="hero-eyebrow">
                <span className="hero-dot" />
                SISTEMA DE GESTIÓN DE RRHH
              </div>

              <h2 className="hero-title">
                Bienvenido de nuevo, Alex
              </h2>

              <p className="hero-subtitle">
                AdventureWorks sigue creciendo. Aquí tienes un resumen
                del estado actual de los registros de la empresa.
              </p>

              <div className="hero-actions">
                <button className="btn-outline">
                  <FileIcon />
                  Ver todos los reportes
                </button>
              </div>
            </div>
          </section>

          {/* ===================================================
              KPIs
          =================================================== */}

          <section className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-top">
                <div className="kpi-icon">
                  <UsersIcon />
                </div>

                <span className="kpi-status">
                  <ArrowUpIcon />
                  Activos
                </span>
              </div>

              <span className="kpi-label">TOTAL EMPLEADOS</span>

              <span className="kpi-value">
                {formatearNumero(estadisticas.totalEmpleados.total)}
              </span>

              <span className="kpi-description">
                {formatearNumero(estadisticas.totalEmpleados.activos)} empleados activos
              </span>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <div className="kpi-icon">
                  <BuildingIcon />
                </div>
              </div>

              <span className="kpi-label">TOTAL DEPARTAMENTOS</span>

              <span className="kpi-value">
                {formatearNumero(estadisticas.totalDepartamentos)}
              </span>

              <span className="kpi-description">
                Departamentos registrados
              </span>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <div className="kpi-icon">
                  <ClockIcon />
                </div>
              </div>

              <span className="kpi-label">TOTAL TURNOS</span>

              <span className="kpi-value">
                {formatearNumero(estadisticas.totalTurnos)}
              </span>

              <span className="kpi-description">
                Turnos disponibles
              </span>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <div className="kpi-icon">
                  <UserPlusIcon />
                </div>

                <span className="kpi-status kpi-status-blue">
                  {estadisticas.candidatosActivos.total} activos
                </span>
              </div>

              <span className="kpi-label">TOTAL CANDIDATOS</span>

              <span className="kpi-value">
                {formatearNumero(estadisticas.totalCandidatos)}
              </span>

              <span className="kpi-description">
                Candidatos en proceso
              </span>
            </div>
          </section>

          {/* ===================================================
              TABLAS
          =================================================== */}

          <section className="tables-row">
            {/* =================================================
                EMPLEADOS
            ================================================= */}

            <div className="table-card">
              <div className="table-card-header">
                <div>
                  <span className="section-kicker">RECURSOS HUMANOS</span>
                  <h3 className="table-title">
                    Últimos Empleados Registrados
                  </h3>
                </div>

                <span className="record-count">
                  {ultimosEmpleados.length}
                </span>
              </div>

              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Empleado</th>
                      <th>Cargo</th>
                      <th>Departamento</th>
                      <th>Fecha de ingreso</th>
                    </tr>
                  </thead>

                  <tbody>
                    {ultimosEmpleados.length > 0 ? (
                      ultimosEmpleados.map((emp) => (
                        <tr key={emp.idEmpleado}>
                          <td>
                            <div className="employee-cell">
                              <div className="employee-avatar">
                                {obtenerIniciales(emp.nombreCompleto)}
                              </div>

                              <div>
                                <span className="cell-strong">
                                  {emp.nombreCompleto}
                                </span>
                                <span className="cell-id">
                                  ID #{emp.idEmpleado}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>{emp.cargo || "—"}</td>

                          <td>
                            <span className="department-badge">
                              {emp.departamento || "Sin departamento"}
                            </span>
                          </td>

                          <td>
                            {formatearFecha(emp.fechaContratacion)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="empty-state">
                          No hay empleados registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* =================================================
                DEPARTAMENTOS
            ================================================= */}

            <div className="table-card">
              <div className="table-card-header">
                <div>
                  <span className="section-kicker">ORGANIZACIÓN</span>
                  <h3 className="table-title">
                    Empleados por Departamento
                  </h3>
                </div>

                <span className="record-count">
                  {empleadosPorDepartamento.length}
                </span>
              </div>

              <div className="table-scroll">
                <table className="data-table data-table--two-col">
                  <thead>
                    <tr>
                      <th>Departamento</th>
                      <th className="align-right">Empleados</th>
                    </tr>
                  </thead>

                  <tbody>
                    {empleadosPorDepartamento.length > 0 ? (
                      empleadosPorDepartamento.map((dep) => (
                        <tr key={dep.departamento}>
                          <td>
                            <div className="department-cell">
                              <div className="department-icon">
                                <BuildingIcon />
                              </div>

                              <div>
                                <span className="cell-strong">
                                  {dep.departamento}
                                </span>

                                <span className="cell-id">
                                  {dep.division}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="align-right">
                            <span className="department-total">
                              {formatearNumero(dep.totalEmpleados)}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="empty-state">
                          No hay departamentos registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ===================================================
              CANDIDATOS
          =================================================== */}

          <section className="table-card table-card--full">
            <div className="table-card-header">
              <div>
                <span className="section-kicker">RECRUITMENT</span>
                <h3 className="table-title">
                  Últimos Candidatos Registrados
                </h3>
              </div>

              <span className="record-count">
                {ultimosCandidatos.length}
              </span>
            </div>

            <div className="table-scroll">
              <table className="data-table data-table--candidates">
                <thead>
                  <tr>
                    <th>Candidato</th>
                    <th>Cargo aplicado</th>
                    <th>Etapa</th>
                    <th>Hoja de vida</th>
                    <th>Fecha de registro</th>
                  </tr>
                </thead>

                <tbody>
                  {ultimosCandidatos.length > 0 ? (
                    ultimosCandidatos.map((cand) => (
                      <tr key={cand.idCandidato}>
                        <td>
                          <div className="employee-cell">
                            <div className="candidate-avatar">
                              {obtenerIniciales(cand.nombre)}
                            </div>

                            <div>
                              <span className="cell-strong">
                                {cand.nombre}
                              </span>

                              <span className="cell-id">
                                Candidato #{cand.idCandidato}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {cand.cargoAplicado || "No especificado"}
                        </td>

                        <td>
                          <span className={obtenerClaseEtapa(cand.etapa)}>
                            {traducirEtapa(cand.etapa)}
                          </span>
                        </td>

                        <td>
                          {cand.tieneHojaDeVida ? (
                            <span className="resume-yes">
                              Disponible
                            </span>
                          ) : (
                            <span className="resume-no">
                              No disponible
                            </span>
                          )}
                        </td>

                        <td>
                          {formatearFecha(cand.fechaRegistro)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        No hay candidatos registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;