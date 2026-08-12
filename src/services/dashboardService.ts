import { apiFetch } from "./api";

export interface DashboardStats {
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

export interface EmpleadoReciente {
  idEmpleado: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  cargo: string;
  departamento: string | null;
  fechaContratacion: string;
}

export interface DepartamentoResumen {
  division: string;
  departamento: string;
  totalEmpleados: number;
}

export interface CandidatoReciente {
  idCandidato: number;
  nombre: string;
  cargoAplicado: string | null;
  etapa: string;
  tieneHojaDeVida: number;
  fechaRegistro: string;
}

export async function obtenerDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/dashboard/stats");
}

export async function obtenerEmpleadosRecientes(): Promise<EmpleadoReciente[]> {
  return apiFetch<EmpleadoReciente[]>("/dashboard/contrataciones-recientes");
}

export async function obtenerEmpleadosPorDepartamento(): Promise<
  DepartamentoResumen[]
> {
  return apiFetch<DepartamentoResumen[]>(
    "/dashboard/distribucion-departamentos"
  );
}

export async function obtenerCandidatosRecientes(): Promise<
  CandidatoReciente[]
> {
  return apiFetch<CandidatoReciente[]>("/dashboard/candidatos-recientes");
}