import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import Modal from "../../components/Modal/Modal";
import { ApiError } from "../../services/api";
import {
  listarCandidatos,
  obtenerCandidato,
  descargarHojaDeVida,
  type CandidatoPipelineItem,
  type CandidatoDetalle,
} from "../../services/candidateService";
import "./candidate.css";

/*ICONOS*/
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

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" className="small-icon" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 10l5 5 5-5" />
    <path d="M12 15V3" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="tiny-icon" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const FileIcon = () => (
  <svg viewBox="0 0 24 24" className="tiny-icon" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" className="candidate-avatar-icon" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
  </svg>
);

/*HELPERS*/

function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return "--/--/----";
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return "--/--/----";
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/*CANDIDATE*/
const Candidate: React.FC = () => {
  const [candidatos, setCandidatos] = useState<CandidatoPipelineItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  // Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [candidatoDetalle, setCandidatoDetalle] = useState<CandidatoDetalle | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null);

  /*Cargar lista de candidatos*/
  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        setError(null);
        const lista = await listarCandidatos();
        setCandidatos(lista);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No se pudieron cargar los candidatos.");
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, []);

  const candidatosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return candidatos;
    const termino = busqueda.trim().toLowerCase();
    return candidatos.filter((c) => {
      const cargo = (c.cargoAplicado || "").toLowerCase();
      const idTexto = String(c.idCandidato);
      return cargo.includes(termino) || idTexto.includes(termino);
    });
  }, [candidatos, busqueda]);

  /*Abrir / cerrar modal de detalle*/
  const abrirDetalle = async (id: number) => {
    setModalAbierto(true);
    setErrorDetalle(null);
    setCandidatoDetalle(null);
    setCargandoDetalle(true);

    try {
      const detalle = await obtenerCandidato(id);
      setCandidatoDetalle(detalle);
    } catch (err) {
      setErrorDetalle(err instanceof ApiError ? err.message : "No se pudo cargar el candidato.");
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setCandidatoDetalle(null);
  };

  const manejarDescarga = async (id: number, hojaDeVida: string | null) => {
    if (hojaDeVida) {
      descargarHojaDeVida(id, hojaDeVida);
      return;
    }

    // La lista no trae la hoja de vida (solo el detalle la incluye),
    // así que la buscamos primero si aún no la tenemos.
    try {
      const detalle = await obtenerCandidato(id);
      if (detalle.hojaDeVida) {
        descargarHojaDeVida(id, detalle.hojaDeVida);
      } else {
        window.alert("Este candidato no tiene hoja de vida registrada.");
      }
    } catch {
      window.alert("No se pudo descargar la hoja de vida.");
    }
  };

     /*RENDER*/

  return (
    <div className="candidate-layout">
      <Sidebar activeItem="Candidatos" />

      <div className="candidate-content">
        {/* TOP NAV */}
        <header className="candidate-topnav">
          <div className="candidate-search-bg">
            <span className="candidate-search-icon">
              <SearchIcon />
            </span>
            <input
              className="candidate-search-input"
              type="text"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="candidate-topnav-actions">
            <button className="candidate-icon-button" aria-label="Notificaciones">
              <BellIcon />
            </button>
            <div className="candidate-user-avatar">AT</div>
          </div>
        </header>

        <main className="candidate-main">
          {/* HEADER */}
          <div className="candidate-header-row">
            <h2 className="candidate-page-title">Gestión de Candidatos</h2>
            <button
              className="candidate-btn-primary"
              onClick={() => window.alert("Está pendiente esa funcionalidad.")}
            >
              <PlusIcon />
              Agregar candidato
            </button>
          </div>

          {/* TABLA */}
          <div className="candidate-table-card">
            <div className="candidate-table-card-header">
              <h3>Candidatos</h3>
            </div>

            {cargando ? (
              <div className="candidate-state">
                <div className="candidate-spinner" />
                <p>Cargando candidatos...</p>
              </div>
            ) : error ? (
              <div className="candidate-state">
                <p className="candidate-error-text">{error}</p>
              </div>
            ) : (
              <div className="candidate-table-scroll">
                <table className="candidate-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Fecha de postulación</th>
                      <th>Hoja de vida</th>
                      <th className="align-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidatosFiltrados.length > 0 ? (
                      candidatosFiltrados.map((c) => (
                        <tr key={c.idCandidato}>
                          <td>
                            <div className="candidate-name-cell">
                              <div className="candidate-avatar">
                                <UserIcon />
                              </div>
                              <div>
                                <span className="cell-strong">
                                  Candidato #{c.idCandidato}
                                </span>
                                <span className="cell-id">
                                  {c.cargoAplicado || "Cargo no especificado"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>{formatearFecha(c.ultimaActualizacion)}</td>
                          <td>
                            <button
                              className="candidate-download-btn"
                              onClick={() => manejarDescarga(c.idCandidato, null)}
                              aria-label="Descargar hoja de vida"
                            >
                              <DownloadIcon />
                            </button>
                          </td>
                          <td className="align-center">
                            <button
                              className="candidate-row-action"
                              onClick={() => abrirDetalle(c.idCandidato)}
                              aria-label="Ver candidato"
                            >
                              <EyeIcon />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="candidate-empty">
                          No se encontraron candidatos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL: DETALLE DEL CANDIDATO */}
      <Modal abierto={modalAbierto} onCerrar={cerrarModal} ancho="380px">
        {cargandoDetalle ? (
          <div className="candidate-modal-state">
            <div className="candidate-spinner" />
            <p>Cargando...</p>
          </div>
        ) : errorDetalle ? (
          <div className="candidate-modal-state">
            <p className="candidate-error-text">{errorDetalle}</p>
          </div>
        ) : candidatoDetalle ? (
          <div className="candidate-modal-body">
            <div className="candidate-modal-hero">
              <div className="candidate-modal-avatar">
                <UserIcon />
              </div>
              <h4>Candidato #{candidatoDetalle.idCandidato}</h4>
              <p className="candidate-modal-subtitle">
                {candidatoDetalle.cargoAplicado || "Cargo no especificado"}
              </p>
            </div>

            <div className="candidate-modal-divider" />

            <div className="candidate-modal-row">
              <span className="candidate-modal-label">
                <CalendarIcon />
                Fecha de postulación
              </span>
              <span className="candidate-modal-value">
                {formatearFecha(candidatoDetalle.ultimaActualizacion)}
              </span>
            </div>

            <div className="candidate-modal-divider" />

            <div className="candidate-modal-row candidate-modal-row--resume">
              <span className="candidate-modal-label">
                <FileIcon />
                Hoja de vida
              </span>
              {candidatoDetalle.hojaDeVida ? (
                <button
                  className="candidate-modal-download"
                  onClick={() =>
                    descargarHojaDeVida(
                      candidatoDetalle.idCandidato,
                      candidatoDetalle.hojaDeVida as string
                    )
                  }
                >
                  <DownloadIcon />
                  Descargar
                </button>
              ) : (
                <span className="candidate-modal-value candidate-modal-value--muted">
                  No disponible
                </span>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default Candidate;