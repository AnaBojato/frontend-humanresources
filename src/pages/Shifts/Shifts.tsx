import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import Modal from "../../components/Modal/Modal";

import {
  actualizarTurno,
  crearTurno,
  eliminarTurno,
  listarTurnos,
  type Shift,
  type ShiftFormData,
} from "../../services/shiftService";

import "./shifts.css";

const formularioInicial: ShiftFormData = {
  nombre: "",
  horaInicio: "",
  horaFin: "",
};

/*
 * Convierte cualquier formato de hora que pueda llegar
 * desde el backend a HH:mm para mostrarlo correctamente.
 *
 * Ejemplos:
 * 15:00
 * 15:00:00
 * 1970-01-01T15:00
 * 1970-01-01T15:00:00
 *
 * Todo termina visualmente como:
 * 15:00
 */
const formatearHora = (hora: string): string => {
  if (!hora) {
    return "--:--";
  }

  let horaNormalizada = hora;

  // Si viene como fecha + hora:
  // 1970-01-01T15:00
  if (horaNormalizada.includes("T")) {
    horaNormalizada = horaNormalizada.split("T")[1];
  }

  const partes = horaNormalizada.split(":");

  if (partes.length < 2) {
    return horaNormalizada;
  }

  const horas = partes[0].padStart(2, "0");
  const minutos = partes[1].padStart(2, "0");

  return `${horas}:${minutos}`;
};

/*
 * Prepara la hora que viene del backend para poder utilizarla
 * en <input type="time">.
 *
 * El input HTML solamente acepta:
 * HH:mm
 * HH:mm:ss
 *
 * Nosotros utilizamos HH:mm.
 */
const prepararHoraParaInput = (hora: string): string => {
  if (!hora) {
    return "";
  }

  let horaNormalizada = hora;

  // Ejemplo:
  // 1970-01-01T15:00
  if (horaNormalizada.includes("T")) {
    horaNormalizada = horaNormalizada.split("T")[1];
  }

  const partes = horaNormalizada.split(":");

  if (partes.length < 2) {
    return "";
  }

  const horas = partes[0].padStart(2, "0");
  const minutos = partes[1].padStart(2, "0");

  return `${horas}:${minutos}`;
};

/*
 * Convierte HH:mm a HH:mm:ss antes de enviarlo al backend.
 *
 * El usuario selecciona, por ejemplo:
 * 15:00
 *
 * Y enviamos:
 * 15:00:00
 *
 * No estamos inventando la hora.
 * Solamente estamos agregando los segundos requeridos
 * por el tipo TIME de SQL Server.
 */
const prepararHoraParaBackend = (hora: string): string => {
  if (!hora) {
    return "";
  }

  const horaNormalizada = prepararHoraParaInput(hora);

  if (!horaNormalizada) {
    return "";
  }

  return `${horaNormalizada}:00`;
};

const Shifts: React.FC = () => {
  const [turnos, setTurnos] = useState<Shift[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [modoEdicion, setModoEdicion] = useState<boolean>(false);

  const [turnoSeleccionado, setTurnoSeleccionado] =
    useState<Shift | null>(null);

  const [formulario, setFormulario] =
    useState<ShiftFormData>(formularioInicial);

  const [guardando, setGuardando] = useState<boolean>(false);
  const [eliminando, setEliminando] = useState<number | null>(null);

  /*
   * Carga los turnos directamente desde el backend.
   *
   * No hay datos escritos manualmente aquí.
   */
  const cargarTurnos = async (): Promise<void> => {
    try {
      setCargando(true);
      setError("");

      const datos = await listarTurnos();

      setTurnos(datos ?? []);
    } catch (err) {
      console.error("Error cargando turnos:", err);

      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar los turnos."
      );
    } finally {
      setCargando(false);
    }
  };

  /*
   * Al entrar a la página:
   * GET /api/turnos
   */
  useEffect(() => {
    void cargarTurnos();
  }, []);

  /*
   * Estos valores se calculan únicamente con los datos
   * que llegaron desde el backend.
   */
  const totalTurnos = turnos.length;

  const totalEmpleadosAsignados = useMemo(
    () =>
      turnos.reduce(
        (total, turno) =>
          total + Number(turno.totalEmpleadosAsignados || 0),
        0
      ),
    [turnos]
  );

  /*
   * Abrir modal para crear.
   *
   * Los campos comienzan vacíos porque todavía no existe
   * un turno creado.
   */
  const abrirCrear = (): void => {
    setModoEdicion(false);
    setTurnoSeleccionado(null);
    setFormulario(formularioInicial);
    setError("");
    setModalAbierto(true);
  };

  /*
   * Abrir modal para editar.
   *
   * Los valores vienen directamente del turno seleccionado,
   * que previamente fue obtenido desde el backend.
   */
  const abrirEditar = (turno: Shift): void => {
    setModoEdicion(true);
    setTurnoSeleccionado(turno);

    setFormulario({
      nombre: turno.nombre,
      horaInicio: prepararHoraParaInput(turno.horaInicio),
      horaFin: prepararHoraParaInput(turno.horaFin),
    });

    setError("");
    setModalAbierto(true);
  };

  /*
   * Cerrar modal.
   */
  const cerrarModal = (): void => {
    if (guardando) {
      return;
    }

    setModalAbierto(false);
    setModoEdicion(false);
    setTurnoSeleccionado(null);
    setFormulario(formularioInicial);
  };

  /*
   * Actualizar un campo del formulario.
   *
   * Estos valores son temporales mientras el usuario
   * está editando. No representan datos nuevos de la base
   * hasta que se envíe el formulario al backend.
   */
  const actualizarCampo = (
    campo: keyof ShiftFormData,
    valor: string
  ): void => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  /*
   * Crear o actualizar un turno.
   *
   * Los datos terminan siendo enviados al backend.
   */
  const guardarTurno = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (
      !formulario.nombre.trim() ||
      !formulario.horaInicio ||
      !formulario.horaFin
    ) {
      setError("Completa todos los campos.");
      return;
    }

    /*
     * Normalizamos las horas antes de enviarlas.
     *
     * Ejemplo:
     * 15:00 -> 15:00:00
     *
     * No estamos modificando la hora elegida.
     */
    const datosParaGuardar: ShiftFormData = {
      nombre: formulario.nombre.trim(),
      horaInicio: prepararHoraParaBackend(
        formulario.horaInicio
      ),
      horaFin: prepararHoraParaBackend(
        formulario.horaFin
      ),
    };

    try {
      setGuardando(true);
      setError("");

      if (modoEdicion && turnoSeleccionado) {
        /*
         * PUT /api/turnos/:id
         */
        await actualizarTurno(
          turnoSeleccionado.idTurno,
          datosParaGuardar
        );
      } else {
        /*
         * POST /api/turnos
         */
        await crearTurno(datosParaGuardar);
      }

      cerrarModal();

      /*
       * Volvemos a consultar el backend para mostrar
       * los datos reales y actualizados.
       */
      await cargarTurnos();
    } catch (err) {
      console.error("Error guardando turno:", err);

      setError(
        err instanceof Error
          ? err.message
          : "No fue posible guardar el turno."
      );
    } finally {
      setGuardando(false);
    }
  };

  /*
   * Eliminar turno.
   *
   * La eliminación realmente se hace en el backend.
   */
  const confirmarEliminar = async (
    turno: Shift
  ): Promise<void> => {
    const confirmado = window.confirm(
      `¿Estás seguro de que deseas eliminar el turno "${turno.nombre}"?`
    );

    if (!confirmado) {
      return;
    }

    try {
      setEliminando(turno.idTurno);
      setError("");

      /*
       * DELETE /api/turnos/:id
       */
      await eliminarTurno(turno.idTurno);

      /*
       * Volvemos a pedir la información al backend.
       */
      await cargarTurnos();
    } catch (err) {
      console.error("Error eliminando turno:", err);

      setError(
        err instanceof Error
          ? err.message
          : "No fue posible eliminar el turno."
      );
    } finally {
      setEliminando(null);
    }
  };

  return (
    <div className="shifts-page">
      <Sidebar activeItem="Shifts" />

      <main className="shifts-main">
        {/* ============================================================
            HEADER
           ============================================================ */}

        <section className="shifts-header">
          <div>
            <p className="shifts-eyebrow">
              HUMAN RESOURCES
            </p>

            <h1>Shifts</h1>

            <p className="shifts-description">
              Administra los horarios de trabajo de AdventureWorks.
            </p>
          </div>

          <button
            type="button"
            className="shifts-primary-button"
            onClick={abrirCrear}
          >
            <span className="shifts-button-icon">+</span>
            Nuevo turno
          </button>
        </section>

        {/* ============================================================
            ERROR GENERAL
           ============================================================ */}

        {error && !modalAbierto && (
          <div
            className="shifts-alert"
            role="alert"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Cerrar mensaje"
            >
              ×
            </button>
          </div>
        )}

        {/* ============================================================
            RESUMEN
           ============================================================ */}

        <section className="shifts-summary">
          <article className="shift-summary-card">
            <div className="shift-summary-icon">
              <span>◷</span>
            </div>

            <div>
              <span className="shift-summary-label">
                Total de turnos
              </span>

              <strong>{totalTurnos}</strong>
            </div>
          </article>

          <article className="shift-summary-card">
            <div className="shift-summary-icon">
              <span>♙</span>
            </div>

            <div>
              <span className="shift-summary-label">
                Empleados asignados
              </span>

              <strong>
                {totalEmpleadosAsignados}
              </strong>
            </div>
          </article>
        </section>

        {/* ============================================================
            TABLA
           ============================================================ */}

        <section className="shifts-table-card">
          <div className="shifts-table-header">
            <div>
              <h2>Work shifts</h2>

              <p>
                Horarios registrados en el sistema.
              </p>
            </div>

            <button
              type="button"
              className="shifts-refresh-button"
              onClick={() => void cargarTurnos()}
              disabled={cargando}
            >
              {cargando
                ? "Cargando..."
                : "Actualizar"}
            </button>
          </div>

          <div className="shifts-table-wrapper">
            <table className="shifts-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Hora de inicio</th>
                  <th>Hora de finalización</th>
                  <th>Empleados</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {/* ==================================================
                    CARGANDO
                   ================================================== */}

                {cargando ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="shifts-empty-cell"
                    >
                      Cargando turnos...
                    </td>
                  </tr>
                ) : turnos.length === 0 ? (
                  /* ================================================
                     SIN DATOS
                     ================================================ */

                  <tr>
                    <td
                      colSpan={6}
                      className="shifts-empty-cell"
                    >
                      No hay turnos registrados.
                    </td>
                  </tr>
                ) : (
                  /* ================================================
                     DATOS DEL BACKEND
                     ================================================ */

                  turnos.map((turno) => (
                    <tr key={turno.idTurno}>
                      <td>
                        <span className="shift-id">
                          #{turno.idTurno}
                        </span>
                      </td>

                      <td>
                        <span className="shift-name">
                          {turno.nombre}
                        </span>
                      </td>

                      <td>
                        <span className="shift-time">
                          {formatearHora(
                            turno.horaInicio
                          )}
                        </span>
                      </td>

                      <td>
                        <span className="shift-time">
                          {formatearHora(
                            turno.horaFin
                          )}
                        </span>
                      </td>

                      <td>
                        <span className="shift-employees">
                          {turno.totalEmpleadosAsignados ?? 0}
                        </span>
                      </td>

                      <td>
                        <div className="shift-actions">
                          <button
                            type="button"
                            className="shift-action-button shift-action-edit"
                            onClick={() =>
                              abrirEditar(turno)
                            }
                            title="Editar turno"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="shift-action-button shift-action-delete"
                            onClick={() =>
                              void confirmarEliminar(
                                turno
                              )
                            }
                            disabled={
                              eliminando ===
                              turno.idTurno
                            }
                            title="Eliminar turno"
                          >
                            {eliminando ===
                            turno.idTurno
                              ? "Eliminando..."
                              : "Eliminar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* ==============================================================
          MODAL
         ============================================================== */}

      {modalAbierto && (
        <Modal
          abierto={modalAbierto}
          onCerrar={cerrarModal}
          ancho="520px"
        >
          <form
            className="shift-form"
            onSubmit={(event) =>
              void guardarTurno(event)
            }
          >
            {/* ========================================================
                MODAL HEADER
               ======================================================== */}

            <div className="shift-form-header">
              <div>
                <p className="shift-form-eyebrow">
                  {modoEdicion
                    ? "EDIT SHIFT"
                    : "NEW SHIFT"}
                </p>

                <h2>
                  {modoEdicion
                    ? "Editar turno"
                    : "Crear nuevo turno"}
                </h2>

                <p>
                  {modoEdicion
                    ? "Actualiza la información del horario."
                    : "Registra un nuevo horario de trabajo."}
                </p>
              </div>
            </div>

            {/* ========================================================
                MODAL ERROR
               ======================================================== */}

            {error && (
              <div className="shifts-alert shifts-alert-form">
                <span>{error}</span>

                <button
                  type="button"
                  onClick={() => setError("")}
                  aria-label="Cerrar mensaje"
                >
                  ×
                </button>
              </div>
            )}

            {/* ========================================================
                FORMULARIO
               ======================================================== */}

            <div className="shift-form-fields">
              {/* NOMBRE */}

              <div className="shift-form-group">
                <label htmlFor="shift-name">
                  Nombre del turno
                </label>

                <input
                  id="shift-name"
                  type="text"
                  value={formulario.nombre}
                  onChange={(event) =>
                    actualizarCampo(
                      "nombre",
                      event.target.value
                    )
                  }
                  placeholder="Nombre del turno"
                  maxLength={50}
                  disabled={guardando}
                  autoComplete="off"
                />
              </div>

              {/* HORAS */}

              <div className="shift-form-row">
                <div className="shift-form-group">
                  <label htmlFor="shift-start">
                    Hora de inicio
                  </label>

                  <input
                    id="shift-start"
                    type="time"
                    value={formulario.horaInicio}
                    onChange={(event) =>
                      actualizarCampo(
                        "horaInicio",
                        event.target.value
                      )
                    }
                    disabled={guardando}
                  />
                </div>

                <div className="shift-form-group">
                  <label htmlFor="shift-end">
                    Hora de finalización
                  </label>

                  <input
                    id="shift-end"
                    type="time"
                    value={formulario.horaFin}
                    onChange={(event) =>
                      actualizarCampo(
                        "horaFin",
                        event.target.value
                      )
                    }
                    disabled={guardando}
                  />
                </div>
              </div>
            </div>

            {/* ========================================================
                FOOTER
               ======================================================== */}

            <div className="shift-form-actions">
              <button
                type="button"
                className="shift-form-cancel"
                onClick={cerrarModal}
                disabled={guardando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="shift-form-submit"
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : modoEdicion
                  ? "Guardar cambios"
                  : "Crear turno"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Shifts;