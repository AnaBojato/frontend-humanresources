import { apiFetch, apiFetchFull } from "./api";

/* =========================================================
   TIPOS
   ========================================================= */

export interface EmpleadoListado {
  idEmpleado: number;
  nombre: string;
  apellido: string;
  loginId: string;
  cargo: string;
  departamento: string | null;
  turno: string | null;
  fechaContratacion: string;
  numeroIdentificacion: string;
  estado: "ACTIVE" | "TERMINATED";
}

export interface HistorialPago {
  fechaCambio: string;
  tarifa: number;
  frecuenciaPago: number;
}

export interface EmpleadoDetalle {
  idEmpleado: number;
  nombre: string;
  apellido: string;
  loginId: string;
  cargo: string;
  numeroIdentificacion: string;
  fechaNacimiento: string;
  estadoCivil: "S" | "M";
  genero: "M" | "F";
  fechaContratacion: string;
  asalariado: boolean;
  horasVacaciones: number;
  horasIncapacidad: number;
  estado: "ACTIVE" | "TERMINATED";
  idDepartamento: number | null;
  departamento: string | null;
  idTurno: number | null;
  turno: string | null;
  historialPagos: HistorialPago[];
}

export interface Paginacion {
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface FiltrosEmpleados {
  departamento?: string;
  turno?: string;
  estado?: "activo" | "inactivo" | "";
  busqueda?: string;
  pagina?: number;
  limite?: number;
}

export interface DatosActualizarEmpleado {
  cargo?: string;
  numeroIdentificacion?: string;
  estadoCivil?: "S" | "M";
  genero?: "M" | "F";
  asalariado?: boolean;
  horasVacaciones?: number;
  horasIncapacidad?: number;
}

export interface DepartamentoOpcion {
  idDepartamento: number;
  nombre: string;
  division: string;
}

interface DepartamentoDivisionItem {
  idDepartamento: number;
  nombre: string;
  totalEmpleados: number;
  turnosActivos: string[];
}

interface DepartamentosAgrupados {
  resumen: {
    totalHeadcount: number;
    turnosActivos: number;
    presupuestoMensualEstimado: number;
  };
  divisiones: {
    [division: string]: DepartamentoDivisionItem[];
  };
}

export interface Turno {
  idTurno: number;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  totalEmpleadosAsignados: number;
}

/* =========================================================
   EMPLEADOS (directorio)
   ========================================================= */

// GET /api/empleados
export async function listarEmpleados(
  filtros: FiltrosEmpleados = {}
): Promise<{ empleados: EmpleadoListado[]; paginacion: Paginacion }> {
  const params = new URLSearchParams();

  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== "") {
      params.append(clave, String(valor));
    }
  });

  const query = params.toString();
  const respuesta = await apiFetchFull<EmpleadoListado[]>(
    `/empleados${query ? `?${query}` : ""}`
  );

  const paginacionPorDefecto: Paginacion = {
    total: 0,
    pagina: 1,
    limite: 8,
    totalPaginas: 1,
  };

  return {
    empleados: respuesta.datos || [],
    paginacion: (respuesta.paginacion as Paginacion) || paginacionPorDefecto,
  };
}

// GET /api/empleados/:id
export async function obtenerEmpleado(id: number): Promise<EmpleadoDetalle> {
  return apiFetch<EmpleadoDetalle>(`/empleados/${id}`);
}

// PUT /api/empleados/:id
export async function actualizarEmpleado(
  id: number,
  datos: DatosActualizarEmpleado
): Promise<void> {
  await apiFetch(`/empleados/${id}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

// DELETE /api/empleados/:id (baja lógica)
export async function desactivarEmpleado(id: number): Promise<void> {
  await apiFetch(`/empleados/${id}`, { method: "DELETE" });
}

/* =========================================================
   DEPARTAMENTOS (para filtros y reasignación)
   ========================================================= */

// GET /api/departamentos — aplanado, útil para selects
export async function obtenerDepartamentosParaFiltro(): Promise<DepartamentoOpcion[]> {
  const resultado = await apiFetch<DepartamentosAgrupados>("/departamentos");
  const planos: DepartamentoOpcion[] = [];

  const divisiones = resultado.divisiones || {};

  Object.keys(divisiones).forEach((division) => {
    const departamentos = divisiones[division] || [];

    departamentos.forEach((dep) => {
      planos.push({
        idDepartamento: dep.idDepartamento,
        nombre: dep.nombre,
        division: division,
      });
    });
  });

  return planos;
}

// POST /api/departamentos/:id/asignaciones
export async function reasignarEmpleado(
  idDepartamento: number,
  idEmpleado: number,
  idTurno: number
): Promise<void> {
  await apiFetch(`/departamentos/${idDepartamento}/asignaciones`, {
    method: "POST",
    body: JSON.stringify({ idEmpleado, idTurno }),
  });
}

/* =========================================================
   TURNOS (para filtros y reasignación)
   ========================================================= */

// GET /api/turnos
export async function obtenerTurnos(): Promise<Turno[]> {
  return apiFetch<Turno[]>("/turnos");
}