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

/* ICONOS */
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

const PlusIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="small-icon"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const EyeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="small-icon"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const DownloadIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="small-icon"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 10l5 5 5-5" />
    <path d="M12 15V3" />
  </svg>
);

const CalendarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="tiny-icon"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const FileIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="tiny-icon"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
);

const UserIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="candidate-avatar-icon"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
  </svg>
);

/* ICONOS DEL MODAL */
const UploadIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="candidate-upload-icon"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M12 16V4" />
    <path d="m7 9 5-5 5 5" />
    <path d="M5 20h14" />
  </svg>
);

const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="candidate-add-close-icon"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

/* HELPERS */
function formatearFecha(
  fecha: string | null | undefined
): string {
  if (!fecha) return "--/--/----";

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) {
    return "--/--/----";
  }

  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/* CANDIDATE */
const Candidate: React.FC = () => {
  const [candidatos, setCandidatos] = useState<
    CandidatoPipelineItem[]
  >([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  // Modal detalle
  const [modalAbierto, setModalAbierto] = useState(false);
  const [candidatoDetalle, setCandidatoDetalle] =
    useState<CandidatoDetalle | null>(null);
  const [cargandoDetalle, setCargandoDetalle] =
    useState(false);
  const [errorDetalle, setErrorDetalle] =
    useState<string | null>(null);

  // Modal agregar candidato
  const [agregarModalAbierto, setAgregarModalAbierto] =
    useState(false);

  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const [nuevoCargo, setNuevoCargo] = useState("");
  const [nuevaHojaDeVida, setNuevaHojaDeVida] =
    useState("");
  const [nombreArchivo, setNombreArchivo] =
    useState("");
  const [guardandoCandidato, setGuardandoCandidato] =
    useState(false);
  const [errorAgregar, setErrorAgregar] =
    useState<string | null>(null);

  /* CARGAR LISTA DE CANDIDATOS */
  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        setError(null);

        const lista = await listarCandidatos();

        setCandidatos(lista);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar los candidatos."
        );
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, []);

  /* FILTRAR CANDIDATOS */
  const candidatosFiltrados = useMemo(() => {
    if (!busqueda.trim()) {
      return candidatos;
    }

    const termino =
      busqueda.trim().toLowerCase();

    return candidatos.filter((c) => {
      const cargo = (
        c.cargoAplicado || ""
      ).toLowerCase();

      const idTexto = String(c.idCandidato);

      return (
        cargo.includes(termino) ||
        idTexto.includes(termino)
      );
    });
  }, [candidatos, busqueda]);

  /* ABRIR DETALLE */
  const abrirDetalle = async (id: number) => {
    setModalAbierto(true);
    setErrorDetalle(null);
    setCandidatoDetalle(null);
    setCargandoDetalle(true);

    try {
      const detalle = await obtenerCandidato(id);

      setCandidatoDetalle(detalle);
    } catch (err) {
      setErrorDetalle(
        err instanceof ApiError
          ? err.message
          : "No se pudo cargar el candidato."
      );
    } finally {
      setCargandoDetalle(false);
    }
  };

  /* CERRAR DETALLE */
  const cerrarModal = () => {
    setModalAbierto(false);
    setCandidatoDetalle(null);
  };

  /* DESCARGAR HOJA DE VIDA */
  const manejarDescarga = async (
    id: number,
    hojaDeVida: string | null
  ) => {
    if (hojaDeVida) {
      descargarHojaDeVida(id, hojaDeVida);
      return;
    }

    try {
      const detalle = await obtenerCandidato(id);

      if (detalle.hojaDeVida) {
        descargarHojaDeVida(
          id,
          detalle.hojaDeVida
        );
      } else {
        window.alert(
          "Este candidato no tiene hoja de vida registrada."
        );
      }
    } catch {
      window.alert(
        "No se pudo descargar la hoja de vida."
      );
    }
  };

  /* ABRIR MODAL AGREGAR */
  const abrirAgregarModal = () => {
    setErrorAgregar(null);
    setAgregarModalAbierto(true);
  };

  /* CERRAR MODAL AGREGAR */
  const cerrarAgregarModal = () => {
    if (guardandoCandidato) return;

    setAgregarModalAbierto(false);

    setNuevoNombre("");
    setNuevoCorreo("");
    setNuevoCargo("");
    setNuevaHojaDeVida("");
    setNombreArchivo("");
    setErrorAgregar(null);
  };

  /* LEER Y VALIDAR XML */
  const manejarArchivoXML = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const archivo = event.target.files?.[0];

    if (!archivo) return;

    const extension = archivo.name
      .toLowerCase()
      .split(".")
      .pop();

    if (extension !== "xml") {
      setErrorAgregar("Solo se permiten archivos XML.");
      setNombreArchivo("");
      setNuevaHojaDeVida("");
      event.target.value = "";
      return;
    }

    setErrorAgregar(null);
    setNombreArchivo(archivo.name);

    const lector = new FileReader();

    lector.onload = () => {
      const contenido = lector.result;

      if (typeof contenido !== "string") {
        setErrorAgregar("No se pudo leer el archivo XML.");
        setNuevaHojaDeVida("");
        return;
      }

      let xmlLimpio = contenido
        .replace(/^\uFEFF/, "")
        .trim();

      xmlLimpio = xmlLimpio.replace(
        /^<\?xml[\s\S]*?\?>\s*/i,
        ""
      );

      const parser = new DOMParser();

      const documento = parser.parseFromString(
        xmlLimpio,
        "application/xml"
      );

      const errorXML =
        documento.querySelector("parsererror");

      if (errorXML) {
        console.error(
          "ERROR AL VALIDAR XML:",
          errorXML.textContent
        );

        setErrorAgregar(
          "El archivo XML no es válido. Verifica que esté correctamente formado."
        );
        setNuevaHojaDeVida("");
        return;
      }

      if (!documento.documentElement) {
        setErrorAgregar(
          "El archivo XML está vacío o no tiene una estructura válida."
        );
        setNuevaHojaDeVida("");
        return;
      }

      console.log(
        "XML cargado correctamente:",
        xmlLimpio
      );

      setNuevaHojaDeVida(xmlLimpio);
      setErrorAgregar(null);
    };

    lector.onerror = () => {
      console.error("No se pudo leer el archivo XML.");
      setErrorAgregar("No se pudo leer el archivo XML.");
      setNuevaHojaDeVida("");
    };

    lector.readAsText(archivo);
  };

  /* AGREGAR CANDIDATO */
  const agregarCandidato = async () => {
    setErrorAgregar(null);

    if (!nuevoNombre.trim()) {
      setErrorAgregar(
        "Ingresa el nombre completo."
      );

      return;
    }

    if (!nuevoCorreo.trim()) {
      setErrorAgregar(
        "Ingresa el correo electrónico."
      );

      return;
    }

    if (!nuevoCargo.trim()) {
      setErrorAgregar(
        "Ingresa el cargo al que aplica."
      );

      return;
    }

    if (!nuevaHojaDeVida.trim()) {
      setErrorAgregar(
        "Debes subir una hoja de vida en formato XML."
      );

      return;
    }

    try {
      setGuardandoCandidato(true);

      /*
       * IMPORTANTE:
       * Se utiliza la URL del .env.
       * No se utiliza localhost.
       */
      const apiUrl =
        import.meta.env.VITE_API_URL;

      console.log(
        "URL utilizada:",
        `${apiUrl}/candidatos`
      );

      const respuesta = await fetch(
        `${apiUrl}/candidatos`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          /*
           * El backend actual solamente
           * utiliza estos dos campos.
           */
          body: JSON.stringify({
            cargoAplicado:
              nuevoCargo.trim(),

            hojaDeVida:
              nuevaHojaDeVida.trim(),
          }),
        }
      );

      /*
       * Leemos la respuesta como texto primero.
       * Esto permite detectar si Render devuelve
       * JSON, HTML u otro mensaje de error.
       */
      const textoRespuesta =
        await respuesta.text();

      console.log(
        "STATUS:",
        respuesta.status
      );

      console.log(
        "RESPUESTA DEL BACKEND:",
        textoRespuesta
      );

      let datos: {
        exito?: boolean;
        mensaje?: string;
        datos?: unknown;
      } = {};

      try {
        datos = textoRespuesta
          ? JSON.parse(textoRespuesta)
          : {};
      } catch {
        datos = {};
      }

      if (!respuesta.ok) {
        throw new Error(
          datos?.mensaje ||
            textoRespuesta ||
            `Error del servidor (${respuesta.status})`
        );
      }

      /*
       * Cerrar modal y limpiar formulario.
       */
      setAgregarModalAbierto(false);

      setNuevoNombre("");
      setNuevoCorreo("");
      setNuevoCargo("");
      setNuevaHojaDeVida("");
      setNombreArchivo("");
      setErrorAgregar(null);

      /*
       * Recargar candidatos.
       */
      const listaActualizada =
        await listarCandidatos();

      setCandidatos(listaActualizada);

    } catch (err) {
      console.error(
        "ERROR AL CREAR CANDIDATO:",
        err
      );

      setErrorAgregar(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el candidato."
      );

    } finally {
      setGuardandoCandidato(false);
    }
  };

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
              onChange={(e) =>
                setBusqueda(
                  e.target.value
                )
              }
            />

          </div>

          <div className="candidate-topnav-actions">

            <button
              className="candidate-icon-button"
              aria-label="Notificaciones"
            >
              <BellIcon />
            </button>

            <div className="candidate-user-avatar">
              AT
            </div>

          </div>

        </header>

        {/* MAIN */}
        <main className="candidate-main">

          <div className="candidate-header-row">

            <h2 className="candidate-page-title">
              Gestión de Candidatos
            </h2>

            <button
              className="candidate-btn-primary"
              onClick={
                abrirAgregarModal
              }
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

                <p>
                  Cargando candidatos...
                </p>

              </div>

            ) : error ? (

              <div className="candidate-state">

                <p className="candidate-error-text">
                  {error}
                </p>

              </div>

            ) : (

              <div className="candidate-table-scroll">

                <table className="candidate-table">

                  <thead>

                    <tr>
                      <th>Nombre</th>
                      <th>
                        Fecha de postulación
                      </th>
                      <th>
                        Hoja de vida
                      </th>
                      <th className="align-center">
                        Acciones
                      </th>
                    </tr>

                  </thead>

                  <tbody>

                    {candidatosFiltrados.length >
                    0 ? (

                      candidatosFiltrados.map(
                        (c) => (

                          <tr
                            key={
                              c.idCandidato
                            }
                          >

                            <td>

                              <div className="candidate-name-cell">

                                <div className="candidate-avatar">
                                  <UserIcon />
                                </div>

                                <div>

                                  <span className="cell-strong">
                                    Candidato #
                                    {
                                      c.idCandidato
                                    }
                                  </span>

                                  <span className="cell-id">
                                    {
                                      c.cargoAplicado ||
                                      "Cargo no especificado"
                                    }
                                  </span>

                                </div>

                              </div>

                            </td>

                            <td>
                              {formatearFecha(
                                c.ultimaActualizacion
                              )}
                            </td>

                            <td>

                              <button
                                className="candidate-download-btn"
                                onClick={() =>
                                  manejarDescarga(
                                    c.idCandidato,
                                    null
                                  )
                                }
                                aria-label="Descargar hoja de vida"
                              >
                                <DownloadIcon />
                              </button>

                            </td>

                            <td className="align-center">

                              <button
                                className="candidate-row-action"
                                onClick={() =>
                                  abrirDetalle(
                                    c.idCandidato
                                  )
                                }
                                aria-label="Ver candidato"
                              >
                                <EyeIcon />
                              </button>

                            </td>

                          </tr>

                        )
                      )

                    ) : (

                      <tr>

                        <td
                          colSpan={4}
                          className="candidate-empty"
                        >
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

      {/* MODAL DETALLE */}
      <Modal
        abierto={modalAbierto}
        onCerrar={cerrarModal}
        ancho="380px"
      >

        {cargandoDetalle ? (

          <div className="candidate-modal-state">

            <div className="candidate-spinner" />

            <p>
              Cargando...
            </p>

          </div>

        ) : errorDetalle ? (

          <div className="candidate-modal-state">

            <p className="candidate-error-text">
              {errorDetalle}
            </p>

          </div>

        ) : candidatoDetalle ? (

          <div className="candidate-modal-body">

            <div className="candidate-modal-hero">

              <div className="candidate-modal-avatar">
                <UserIcon />
              </div>

              <h4>
                Candidato #
                {
                  candidatoDetalle.idCandidato
                }
              </h4>

              <p className="candidate-modal-subtitle">
                {
                  candidatoDetalle.cargoAplicado ||
                  "Cargo no especificado"
                }
              </p>

            </div>

            <div className="candidate-modal-divider" />

            <div className="candidate-modal-row">

              <span className="candidate-modal-label">

                <CalendarIcon />

                Fecha de postulación

              </span>

              <span className="candidate-modal-value">

                {formatearFecha(
                  candidatoDetalle.ultimaActualizacion
                )}

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

      {/* MODAL AGREGAR CANDIDATO */}
      <Modal
        abierto={agregarModalAbierto}
        onCerrar={
          cerrarAgregarModal
        }
        ancho="480px"
      >

        <div className="candidate-add-modal">

          {/* HEADER */}
          <div className="candidate-add-modal-header">

            <div className="candidate-add-modal-title-container">

              <h3>
                Agregar candidato
              </h3>

            </div>

            <button
              type="button"
              className="candidate-add-close"
              onClick={
                cerrarAgregarModal
              }
              disabled={
                guardandoCandidato
              }
              aria-label="Cerrar"
            >
              <CloseIcon />
            </button>

          </div>

          <div className="candidate-add-modal-divider" />

          {/* CONTENIDO */}
          <div className="candidate-add-modal-content">

            <div className="candidate-add-form">

              {/* NOMBRE */}
              <div className="candidate-add-form-group">

                <label htmlFor="candidate-name">
                  Nombre completo
                </label>

                <input
                  id="candidate-name"
                  type="text"
                  placeholder="Ingresa el nombre completo"
                  value={nuevoNombre}
                  onChange={(e) =>
                    setNuevoNombre(
                      e.target.value
                    )
                  }
                  disabled={
                    guardandoCandidato
                  }
                />

              </div>

              {/* CORREO */}
              <div className="candidate-add-form-group">

                <label htmlFor="candidate-email">
                  Correo electrónico
                </label>

                <input
                  id="candidate-email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={nuevoCorreo}
                  onChange={(e) =>
                    setNuevoCorreo(
                      e.target.value
                    )
                  }
                  disabled={
                    guardandoCandidato
                  }
                />

              </div>

              {/* CARGO */}
              <div className="candidate-add-form-group">

                <label htmlFor="candidate-position">
                  Cargo al que aplica
                </label>

                <input
                  id="candidate-position"
                  type="text"
                  placeholder="Ingresa el cargo"
                  value={nuevoCargo}
                  onChange={(e) =>
                    setNuevoCargo(
                      e.target.value
                    )
                  }
                  disabled={
                    guardandoCandidato
                  }
                />

              </div>

              {/* HOJA DE VIDA XML */}
              <div className="candidate-add-form-group">

                <label>
                  Subir hoja de vida
                </label>

                <label
                  htmlFor="candidate-resume"
                  className="candidate-upload-box"
                >

                  <input
                    id="candidate-resume"
                    type="file"
                    accept=".xml,application/xml,text/xml"
                    onChange={
                      manejarArchivoXML
                    }
                    disabled={
                      guardandoCandidato
                    }
                    hidden
                  />

                  <div className="candidate-upload-circle">

                    <UploadIcon />

                  </div>

                  {nombreArchivo ? (

                    <>

                      <span className="candidate-upload-file-name">
                        {
                          nombreArchivo
                        }
                      </span>

                      <span className="candidate-upload-change">
                        Haz clic para cambiar el archivo
                      </span>

                    </>

                  ) : (

                    <span className="candidate-upload-text">
                      Haz clic para subir tu hoja de vida
                    </span>

                  )}

                  <span className="candidate-upload-format">
                    Soporta XML
                  </span>

                </label>

              </div>

              {/* ERROR */}
              {errorAgregar && (

                <p className="candidate-add-error">
                  {
                    errorAgregar
                  }
                </p>

              )}

            </div>

          </div>

          {/* BOTÓN GUARDAR */}
          <div className="candidate-add-submit-container">

            <button
              type="button"
              className="candidate-add-submit"
              onClick={
                agregarCandidato
              }
              disabled={
                guardandoCandidato
              }
            >

              {guardandoCandidato
                ? "Guardando..."
                : "Guardar candidato"}

            </button>

          </div>

        </div>

      </Modal>

    </div>
  );
};

export default Candidate;
