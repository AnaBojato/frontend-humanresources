import React, { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import Modal from "../../components/Modal/Modal";
import { ApiError } from "../../services/api";
import {
  listarEmpleados,
  obtenerEmpleado,
  actualizarEmpleado,
  desactivarEmpleado,
  obtenerDepartamentosParaFiltro,
  reasignarEmpleado,
  obtenerTurnos,
  type EmpleadoListado,
  type EmpleadoDetalle,
  type Paginacion,
  type DatosActualizarEmpleado,
  type DepartamentoOpcion,
  type Turno,
} from "../../services/directoryService";
import "./directory.css";

/* =========================================================
   ICONOS
   ========================================================= */

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" className="svg-icon" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" className="svg-icon" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" className="small-icon" fill="none" stroke="currentColor" strokeWidth="2.4">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" className="small-icon" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg viewBox="0 0 24 24" className="small-icon" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" className="small-icon" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const BadgeIcon = () => (
  <svg viewBox="0 0 24 24" className="tiny-icon" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="7" width="18" height="14" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <circle cx="12" cy="14" r="2" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="tiny-icon" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const FolderIcon = () => (
  <svg viewBox="0 0 24 24" className="small-icon" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
  </svg>
);

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" className="small-icon" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

/* =========================================================
   HELPERS
   ========================================================= */

function formatearFechaCorta(fecha: string): string {
  if (!fecha) return "—";
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return fecha;
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

function obtenerIniciales(nombre: string, apellido: string): string {
  const n = nombre?.[0] || "";
  const a = apellido?.[0] || "";
  return (n + a).toUpperCase() || "?";
}

function traducirEstadoCivil(codigo: string): string {
  return codigo === "M" ? `Casado/a (${codigo})` : `Soltero/a (${codigo})`;
}

function traducirGenero(codigo: string): string {
  return codigo === "M" ? "Masculino" : codigo === "F" ? "Femenino" : "No especificado";
}

function formatearMoneda(valor: number): string {
  return `$${valor.toFixed(2)}/hr`;
}

/* =========================================================
   DIRECTORY
   ========================================================= */

const LIMITE_POR_PAGINA = 8;

const Directory: React.FC = () => {
  // Tabla
  const [empleados, setEmpleados] = useState<EmpleadoListado[]>([]);
  const [paginacion, setPaginacion] = useState<Paginacion>({
    total: 0,
    pagina: 1,
    limite: LIMITE_POR_PAGINA,
    totalPaginas: 1,
  });
  const [cargandoTabla, setCargandoTabla] = useState(true);
  const [errorTabla, setErrorTabla] = useState<string | null>(null);

  // Filtros
  const [departamentoFiltro, setDepartamentoFiltro] = useState("");
  const [turnoFiltro, setTurnoFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<"" | "activo" | "inactivo">("activo");
  const [busqueda, setBusqueda] = useState("");
  const [busquedaDebounced, setBusquedaDebounced] = useState("");
  const [pagina, setPagina] = useState(1);

  // Catálogos para selects
  const [departamentosOpciones, setDepartamentosOpciones] = useState<DepartamentoOpcion[]>([]);
  const [turnosOpciones, setTurnosOpciones] = useState<Turno[]>([]);

  // Modal / Perfil 360
  const [modalAbierto, setModalAbierto] = useState(false);
  const [idSeleccionado, setIdSeleccionado] = useState<number | null>(null);
  const [empleadoDetalle, setEmpleadoDetalle] = useState<EmpleadoDetalle | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null);
  const [tabActiva, setTabActiva] = useState<"personal" | "historial" | "salario">("personal");
  const [procesando, setProcesando] = useState(false);

  // Edición inline
  const [editando, setEditando] = useState(false);
  const [formEdicion, setFormEdicion] = useState<DatosActualizarEmpleado>({});

  // Reasignación
  const [mostrarReasignar, setMostrarReasignar] = useState(false);
  const [formReasignar, setFormReasignar] = useState({ idDepartamento: "", idTurno: "" });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------------------------------------------------------
     Debounce de búsqueda
  --------------------------------------------------------- */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setBusquedaDebounced(busqueda);
      setPagina(1);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [busqueda]);

  /* ---------------------------------------------------------
     Cargar catálogos (departamentos y turnos) una sola vez
  --------------------------------------------------------- */
  useEffect(() => {
    obtenerDepartamentosParaFiltro().then(setDepartamentosOpciones).catch(() => {});
    obtenerTurnos().then(setTurnosOpciones).catch(() => {});
  }, []);

  /* ---------------------------------------------------------
     Cargar tabla de empleados
  --------------------------------------------------------- */
  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        setCargandoTabla(true);
        setErrorTabla(null);

        const { empleados: lista, paginacion: pag } = await listarEmpleados({
          departamento: departamentoFiltro,
          turno: turnoFiltro,
          estado: estadoFiltro,
          busqueda: busquedaDebounced,
          pagina,
          limite: LIMITE_POR_PAGINA,
        });

        if (cancelado) return;
        setEmpleados(lista);
        setPaginacion(pag);
      } catch (err) {
        if (cancelado) return;
        setErrorTabla(err instanceof ApiError ? err.message : "No se pudo cargar el directorio.");
      } finally {
        if (!cancelado) setCargandoTabla(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [departamentoFiltro, turnoFiltro, estadoFiltro, busquedaDebounced, pagina]);

  /* ---------------------------------------------------------
     Abrir / cerrar perfil 360
  --------------------------------------------------------- */
  const abrirPerfil = async (id: number) => {
    setIdSeleccionado(id);
    setModalAbierto(true);
    setTabActiva("personal");
    setEditando(false);
    setMostrarReasignar(false);
    setErrorDetalle(null);
    setCargandoDetalle(true);

    try {
      const detalle = await obtenerEmpleado(id);
      setEmpleadoDetalle(detalle);
    } catch (err) {
      setErrorDetalle(err instanceof ApiError ? err.message : "No se pudo cargar el perfil.");
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEmpleadoDetalle(null);
    setIdSeleccionado(null);
  };

  const recargarListaSilenciosa = async () => {
    try {
      const { empleados: lista, paginacion: pag } = await listarEmpleados({
        departamento: departamentoFiltro,
        turno: turnoFiltro,
        estado: estadoFiltro,
        busqueda: busquedaDebounced,
        pagina,
        limite: LIMITE_POR_PAGINA,
      });
      setEmpleados(lista);
      setPaginacion(pag);
    } catch {
      // Silencioso: no interrumpe el modal si falla el refresco de fondo.
    }
  };

  /* ---------------------------------------------------------
     Editar empleado
  --------------------------------------------------------- */
  const iniciarEdicion = () => {
    if (!empleadoDetalle) return;
    setFormEdicion({
      cargo: empleadoDetalle.cargo,
      numeroIdentificacion: empleadoDetalle.numeroIdentificacion,
      estadoCivil: empleadoDetalle.estadoCivil,
      genero: empleadoDetalle.genero,
      asalariado: empleadoDetalle.asalariado,
      horasVacaciones: empleadoDetalle.horasVacaciones,
      horasIncapacidad: empleadoDetalle.horasIncapacidad,
    });
    setEditando(true);
  };

  const guardarEdicion = async () => {
    if (!idSeleccionado) return;
    setProcesando(true);
    try {
      await actualizarEmpleado(idSeleccionado, formEdicion);
      const detalle = await obtenerEmpleado(idSeleccionado);
      setEmpleadoDetalle(detalle);
      setEditando(false);
      recargarListaSilenciosa();
    } catch (err) {
      setErrorDetalle(err instanceof ApiError ? err.message : "No se pudo guardar el cambio.");
    } finally {
      setProcesando(false);
    }
  };

  /* ---------------------------------------------------------
     Dar de baja
  --------------------------------------------------------- */
  const manejarBaja = async () => {
    if (!idSeleccionado) return;
    const confirmado = window.confirm(
      "¿Confirmas dar de baja a este empleado? Esta acción cierra su asignación actual."
    );
    if (!confirmado) return;

    setProcesando(true);
    try {
      await desactivarEmpleado(idSeleccionado);
      const detalle = await obtenerEmpleado(idSeleccionado);
      setEmpleadoDetalle(detalle);
      recargarListaSilenciosa();
    } catch (err) {
      setErrorDetalle(err instanceof ApiError ? err.message : "No se pudo dar de baja al empleado.");
    } finally {
      setProcesando(false);
    }
  };

  /* ---------------------------------------------------------
     Reasignar departamento
  --------------------------------------------------------- */
  const confirmarReasignacion = async () => {
    if (!idSeleccionado || !formReasignar.idDepartamento || !formReasignar.idTurno) return;

    setProcesando(true);
    try {
      await reasignarEmpleado(
        Number(formReasignar.idDepartamento),
        idSeleccionado,
        Number(formReasignar.idTurno)
      );
      const detalle = await obtenerEmpleado(idSeleccionado);
      setEmpleadoDetalle(detalle);
      setMostrarReasignar(false);
      setFormReasignar({ idDepartamento: "", idTurno: "" });
      recargarListaSilenciosa();
    } catch (err) {
      setErrorDetalle(err instanceof ApiError ? err.message : "No se pudo reasignar al empleado.");
    } finally {
      setProcesando(false);
    }
  };

  /* ---------------------------------------------------------
     Chart de salario (barras CSS)
  --------------------------------------------------------- */
  const historialOrdenado = useMemo(() => {
    if (!empleadoDetalle) return [];
    return [...empleadoDetalle.historialPagos].sort(
      (a, b) => new Date(a.fechaCambio).getTime() - new Date(b.fechaCambio).getTime()
    );
  }, [empleadoDetalle]);

  const tarifaMaxima = useMemo(
    () => Math.max(...historialOrdenado.map((h) => h.tarifa), 1),
    [historialOrdenado]
  );

  const nombresDepartamentosUnicos = useMemo(() => {
    const set = new Set(departamentosOpciones.map((d) => d.nombre));
    return Array.from(set);
  }, [departamentosOpciones]);

  const nombresTurnosUnicos = useMemo(() => turnosOpciones.map((t) => t.nombre), [turnosOpciones]);

  const desde = paginacion.total === 0 ? 0 : (paginacion.pagina - 1) * paginacion.limite + 1;
  const hasta = Math.min(paginacion.pagina * paginacion.limite, paginacion.total);

  /* ---------------------------------------------------------
     RENDER
  --------------------------------------------------------- */

  return (
    <div className="directory-layout">
      <Sidebar activeItem="Directory" />

      <div className="directory-content">
        {/* TOP NAV */}
        <header className="directory-topnav">
          <div className="directory-topnav-left">
            <h2 className="directory-page-title">Directorio de Empleados</h2>
            <div className="directory-search-bg">
              <span className="directory-search-icon">
                <SearchIcon />
              </span>
              <input
                className="directory-search-input"
                type="text"
                placeholder="Buscar empleados, IDs o cargos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          <div className="directory-topnav-actions">
            <button className="directory-icon-button" aria-label="Notificaciones">
              <BellIcon />
            </button>
            <div className="directory-user-avatar">AT</div>
          </div>
        </header>

        {/* FILTER BAR */}
        <div className="directory-filter-bar">
          <div className="directory-filters">
            <select
              className="directory-select"
              value={departamentoFiltro}
              onChange={(e) => {
                setDepartamentoFiltro(e.target.value);
                setPagina(1);
              }}
            >
              <option value="">Departamento: Todos</option>
              {nombresDepartamentosUnicos.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>

            <select
              className="directory-select"
              value={turnoFiltro}
              onChange={(e) => {
                setTurnoFiltro(e.target.value);
                setPagina(1);
              }}
            >
              <option value="">Turno: Todos</option>
              {nombresTurnosUnicos.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>

            <select
              className="directory-select"
              value={estadoFiltro}
              onChange={(e) => {
                setEstadoFiltro(e.target.value as "" | "activo" | "inactivo");
                setPagina(1);
              }}
            >
              <option value="">Estado: Todos</option>
              <option value="activo">Estado: Activo</option>
              <option value="inactivo">Estado: Inactivo</option>
            </select>
          </div>

          <button
            className="directory-btn-primary"
            onClick={() => {
              window.alert("Próximamente: formulario de contratación de empleados.");
            }}
          >
            <PlusIcon />
            Contratar Empleado
          </button>
        </div>

        {/* TABLA */}
        <main className="directory-main">
          <div className="directory-table-card">
            {cargandoTabla ? (
              <div className="directory-state">
                <div className="directory-spinner" />
                <p>Cargando empleados...</p>
              </div>
            ) : errorTabla ? (
              <div className="directory-state">
                <p className="directory-error-text">{errorTabla}</p>
              </div>
            ) : (
              <>
                <div className="directory-table-scroll">
                  <table className="directory-table">
                    <thead>
                      <tr>
                        <th>Nombre &amp; ID</th>
                        <th>Login ID</th>
                        <th>Cargo</th>
                        <th>Departamento</th>
                        <th>Turno</th>
                        <th>Fecha de ingreso</th>
                        <th>Estado</th>
                        <th className="align-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empleados.length > 0 ? (
                        empleados.map((emp) => (
                          <tr
                            key={emp.idEmpleado}
                            className={idSeleccionado === emp.idEmpleado ? "is-selected" : ""}
                            onClick={() => abrirPerfil(emp.idEmpleado)}
                          >
                            <td>
                              <div className="directory-employee-cell">
                                <div className="directory-avatar">
                                  {obtenerIniciales(emp.nombre, emp.apellido)}
                                </div>
                                <div>
                                  <span className="cell-strong">
                                    {emp.nombre} {emp.apellido}
                                  </span>
                                  <span className="cell-id">ID: {emp.numeroIdentificacion}</span>
                                </div>
                              </div>
                            </td>
                            <td className="directory-mono">{emp.loginId}</td>
                            <td>{emp.cargo}</td>
                            <td>
                              <span className="directory-tag">
                                {emp.departamento || "Sin asignar"}
                              </span>
                            </td>
                            <td>{emp.turno || "—"}</td>
                            <td>{formatearFechaCorta(emp.fechaContratacion)}</td>
                            <td>
                              <span
                                className={`directory-status ${
                                  emp.estado === "ACTIVE" ? "is-active" : "is-inactive"
                                }`}
                              >
                                {emp.estado === "ACTIVE" ? "ACTIVO" : "INACTIVO"}
                              </span>
                            </td>
                            <td className="align-right">
                              <button
                                className="directory-row-action"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirPerfil(emp.idEmpleado);
                                }}
                                aria-label="Ver perfil 360"
                              >
                                <EyeIcon />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="directory-empty">
                            No se encontraron empleados con estos filtros.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="directory-pagination">
                  <span className="directory-pagination-text">
                    Mostrando {desde}-{hasta} de {paginacion.total} empleados
                  </span>
                  <div className="directory-pagination-buttons">
                    <button
                      className="directory-page-btn"
                      disabled={paginacion.pagina <= 1}
                      onClick={() => setPagina((p) => Math.max(1, p - 1))}
                      aria-label="Página anterior"
                    >
                      <ChevronLeftIcon />
                    </button>
                    <button
                      className="directory-page-btn"
                      disabled={paginacion.pagina >= paginacion.totalPaginas}
                      onClick={() => setPagina((p) => Math.min(paginacion.totalPaginas, p + 1))}
                      aria-label="Página siguiente"
                    >
                      <ChevronRightIcon />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* MODAL: PERFIL 360 */}
      <Modal abierto={modalAbierto} onCerrar={cerrarModal} ancho="700px">
        {cargandoDetalle ? (
          <div className="directory-modal-state">
            <div className="directory-spinner" />
            <p>Cargando perfil...</p>
          </div>
        ) : errorDetalle && !empleadoDetalle ? (
          <div className="directory-modal-state">
            <p className="directory-error-text">{errorDetalle}</p>
          </div>
        ) : empleadoDetalle ? (
          <>
            {/* Header */}
            <div className="directory-modal-header">
              <h3>Perfil 360 del Empleado</h3>
              <div className="directory-modal-header-actions">
                {editando ? (
                  <>
                    <button className="directory-btn-ghost" onClick={() => setEditando(false)} disabled={procesando}>
                      Cancelar
                    </button>
                    <button className="directory-btn-primary directory-btn-sm" onClick={guardarEdicion} disabled={procesando}>
                      {procesando ? "Guardando..." : "Guardar"}
                    </button>
                  </>
                ) : (
                  <>
                    <button className="directory-btn-ghost" onClick={iniciarEdicion}>
                      <PencilIcon />
                      Editar
                    </button>
                    {empleadoDetalle.estado === "ACTIVE" && (
                      <button className="directory-btn-danger" onClick={manejarBaja} disabled={procesando}>
                        {procesando ? "Procesando..." : "Dar de baja"}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {errorDetalle && <p className="directory-inline-error">{errorDetalle}</p>}

            {/* Hero */}
            <div className="directory-modal-hero">
              <div className="directory-modal-avatar">
                {obtenerIniciales(empleadoDetalle.nombre, empleadoDetalle.apellido)}
              </div>
              <div>
                <h4>
                  {empleadoDetalle.nombre} {empleadoDetalle.apellido}
                </h4>
                <p className="directory-modal-subtitle">
                  {empleadoDetalle.cargo} · {empleadoDetalle.departamento || "Sin departamento"}
                </p>
                <div className="directory-modal-badges">
                  <span className="directory-pill">
                    <BadgeIcon />
                    ID {empleadoDetalle.idEmpleado}
                  </span>
                  <span className="directory-pill directory-pill--muted">
                    <CalendarIcon />
                    Ingreso: {formatearFechaCorta(empleadoDetalle.fechaContratacion)}
                  </span>
                  <span
                    className={`directory-status ${
                      empleadoDetalle.estado === "ACTIVE" ? "is-active" : "is-inactive"
                    }`}
                  >
                    {empleadoDetalle.estado === "ACTIVE" ? "ACTIVO" : "INACTIVO"}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="directory-tabs">
              <button
                className={`directory-tab ${tabActiva === "personal" ? "is-active" : ""}`}
                onClick={() => setTabActiva("personal")}
              >
                Personal y Empleo
              </button>
              <button
                className={`directory-tab ${tabActiva === "historial" ? "is-active" : ""}`}
                onClick={() => setTabActiva("historial")}
              >
                Historial de Asignación
              </button>
              <button
                className={`directory-tab ${tabActiva === "salario" ? "is-active" : ""}`}
                onClick={() => setTabActiva("salario")}
              >
                Salario y Rendimiento
              </button>
            </div>

            {/* Tab content */}
            <div className="directory-tab-content">
              {tabActiva === "personal" && (
                <div className="directory-tab-panel">
                  <div className="directory-info-grid">
                    <div className="directory-info-card">
                      <p className="directory-info-label">Fecha de nacimiento</p>
                      <p className="directory-info-value">
                        {formatearFechaCorta(empleadoDetalle.fechaNacimiento)}
                      </p>
                    </div>

                    <div className="directory-info-card">
                      <p className="directory-info-label">Estado civil</p>
                      {editando ? (
                        <select
                          className="directory-select directory-select--inline"
                          value={formEdicion.estadoCivil}
                          onChange={(e) =>
                            setFormEdicion((f) => ({ ...f, estadoCivil: e.target.value as "S" | "M" }))
                          }
                        >
                          <option value="S">Soltero/a (S)</option>
                          <option value="M">Casado/a (M)</option>
                        </select>
                      ) : (
                        <p className="directory-info-value">
                          {traducirEstadoCivil(empleadoDetalle.estadoCivil)}
                        </p>
                      )}
                    </div>

                    <div className="directory-info-card">
                      <p className="directory-info-label">Horas de vacaciones</p>
                      {editando ? (
                        <input
                          type="number"
                          className="directory-input directory-input--inline"
                          value={formEdicion.horasVacaciones}
                          onChange={(e) =>
                            setFormEdicion((f) => ({ ...f, horasVacaciones: Number(e.target.value) }))
                          }
                        />
                      ) : (
                        <p className="directory-info-value directory-info-value--big">
                          {empleadoDetalle.horasVacaciones}
                          <span> hrs restantes</span>
                        </p>
                      )}
                    </div>

                    <div className="directory-info-card">
                      <p className="directory-info-label">Horas de incapacidad</p>
                      {editando ? (
                        <input
                          type="number"
                          className="directory-input directory-input--inline"
                          value={formEdicion.horasIncapacidad}
                          onChange={(e) =>
                            setFormEdicion((f) => ({ ...f, horasIncapacidad: Number(e.target.value) }))
                          }
                        />
                      ) : (
                        <p className="directory-info-value directory-info-value--big directory-info-value--muted">
                          {empleadoDetalle.horasIncapacidad}
                          <span> hrs restantes</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="directory-details-card">
                    <h5>
                      <FolderIcon />
                      Detalles organizacionales
                    </h5>

                    <div className="directory-details-row">
                      <span>Cargo</span>
                      {editando ? (
                        <input
                          type="text"
                          className="directory-input directory-input--inline"
                          value={formEdicion.cargo}
                          onChange={(e) => setFormEdicion((f) => ({ ...f, cargo: e.target.value }))}
                        />
                      ) : (
                        <span className="directory-mono">{empleadoDetalle.cargo}</span>
                      )}
                    </div>

                    <div className="directory-details-row">
                      <span>Número de ID Nacional</span>
                      {editando ? (
                        <input
                          type="text"
                          className="directory-input directory-input--inline"
                          value={formEdicion.numeroIdentificacion}
                          onChange={(e) =>
                            setFormEdicion((f) => ({ ...f, numeroIdentificacion: e.target.value }))
                          }
                        />
                      ) : (
                        <span className="directory-mono">{empleadoDetalle.numeroIdentificacion}</span>
                      )}
                    </div>

                    <div className="directory-details-row">
                      <span>Género</span>
                      {editando ? (
                        <select
                          className="directory-select directory-select--inline"
                          value={formEdicion.genero}
                          onChange={(e) =>
                            setFormEdicion((f) => ({ ...f, genero: e.target.value as "M" | "F" }))
                          }
                        >
                          <option value="M">Masculino</option>
                          <option value="F">Femenino</option>
                        </select>
                      ) : (
                        <span>{traducirGenero(empleadoDetalle.genero)}</span>
                      )}
                    </div>

                    <div className="directory-details-row">
                      <span>Tipo de salario</span>
                      {editando ? (
                        <label className="directory-checkbox-inline">
                          <input
                            type="checkbox"
                            checked={!!formEdicion.asalariado}
                            onChange={(e) =>
                              setFormEdicion((f) => ({ ...f, asalariado: e.target.checked }))
                            }
                          />
                          Exento (asalariado)
                        </label>
                      ) : (
                        <span className="directory-tag">
                          {empleadoDetalle.asalariado ? "Exento" : "No exento"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {tabActiva === "historial" && (
                <div className="directory-tab-panel">
                  <div className="directory-timeline">
                    <div className="directory-timeline-dot" />
                    <div className="directory-timeline-card">
                      <div className="directory-timeline-top">
                        <span className="directory-timeline-division">
                          {empleadoDetalle.departamento || "Sin departamento"}
                        </span>
                        <span className="directory-timeline-current">ACTUAL</span>
                      </div>
                      <h6>{empleadoDetalle.cargo}</h6>
                      <p>
                        Desde {formatearFechaCorta(empleadoDetalle.fechaContratacion)} · Turno:{" "}
                        {empleadoDetalle.turno || "Sin turno"}
                      </p>
                    </div>
                  </div>

                  <p className="directory-note">
                    El historial completo de reasignaciones anteriores requiere un endpoint adicional en
                    el backend (por ejemplo <code>GET /api/empleados/:id/historial-departamentos</code>),
                    ya que los controllers actuales solo exponen la asignación vigente por empleado.
                  </p>
                </div>
              )}

              {tabActiva === "salario" && (
                <div className="directory-tab-panel">
                  <div className="directory-chart-card">
                    <h5>Tendencia de compensación</h5>

                    {historialOrdenado.length > 0 ? (
                      <>
                        <div className="directory-chart">
                          {historialOrdenado.map((h, i) => (
                            <div
                              key={i}
                              className="directory-chart-bar"
                              style={{ height: `${(h.tarifa / tarifaMaxima) * 100}%` }}
                              title={`${formatearFechaCorta(h.fechaCambio)}: ${formatearMoneda(h.tarifa)}`}
                            />
                          ))}
                        </div>
                        <div className="directory-chart-labels">
                          {historialOrdenado.map((h, i) => (
                            <span key={i}>{new Date(h.fechaCambio).getFullYear()}</span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="directory-note">Sin historial de pagos registrado.</p>
                    )}
                  </div>

                  {historialOrdenado.length > 0 && (
                    <div className="directory-salary-summary">
                      <div>
                        <p className="directory-info-label">Tarifa actual</p>
                        <p className="directory-info-value directory-info-value--big">
                          {formatearMoneda(historialOrdenado[historialOrdenado.length - 1].tarifa)}
                        </p>
                      </div>
                      <div>
                        <p className="directory-info-label">Frecuencia de pago</p>
                        <p className="directory-info-value">
                          {historialOrdenado[historialOrdenado.length - 1].frecuenciaPago === 1
                            ? "Mensual"
                            : "Quincenal"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="directory-modal-footer">
              {mostrarReasignar ? (
                <div className="directory-reassign-form">
                  <select
                    className="directory-select"
                    value={formReasignar.idDepartamento}
                    onChange={(e) =>
                      setFormReasignar((f) => ({ ...f, idDepartamento: e.target.value }))
                    }
                  >
                    <option value="">Selecciona departamento</option>
                    {departamentosOpciones.map((d) => (
                      <option key={d.idDepartamento} value={d.idDepartamento}>
                        {d.nombre}
                      </option>
                    ))}
                  </select>

                  <select
                    className="directory-select"
                    value={formReasignar.idTurno}
                    onChange={(e) => setFormReasignar((f) => ({ ...f, idTurno: e.target.value }))}
                  >
                    <option value="">Selecciona turno</option>
                    {turnosOpciones.map((t) => (
                      <option key={t.idTurno} value={t.idTurno}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>

                  <div className="directory-reassign-actions">
                    <button className="directory-btn-ghost" onClick={() => setMostrarReasignar(false)}>
                      Cancelar
                    </button>
                    <button
                      className="directory-btn-primary directory-btn-sm"
                      onClick={confirmarReasignacion}
                      disabled={procesando || !formReasignar.idDepartamento || !formReasignar.idTurno}
                    >
                      {procesando ? "Guardando..." : "Confirmar"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    className="directory-btn-secondary"
                    onClick={() => setMostrarReasignar(true)}
                  >
                    Reasignar Departamento
                  </button>
                  <button className="directory-btn-outline" onClick={() => window.print()}>
                    Imprimir Reporte 360
                  </button>
                </>
              )}
            </div>
          </>
        ) : null}
      </Modal>
    </div>
  );
};

export default Directory;