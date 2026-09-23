import { apiFetch } from "./api";

/* =========================================================
   TIPOS
   ========================================================= */

export interface CandidatoPipelineItem {
  idCandidato: number;
  idEmpleadoReferido: number | null;
  cargoAplicado: string | null;
  calificacion: number | null;
  etapa: string;
  ultimaActualizacion: string;
}

export interface CandidatoDetalle {
  idCandidato: number;
  idEmpleadoReferido: number | null;
  cargoAplicado: string | null;
  calificacion: number | null;
  etapa: string;
  hojaDeVida: string | null;
  ultimaActualizacion: string;
}

/* =========================================================
   CANDIDATOS
   ========================================================= */

// GET /api/candidatos — el backend lo devuelve agrupado por etapa,
// aquí lo aplanamos en una sola lista ordenada por fecha.
export async function listarCandidatos(): Promise<CandidatoPipelineItem[]> {
  const agrupado = await apiFetch<Record<string, CandidatoPipelineItem[]>>(
    "/candidatos"
  );

  const plano = Object.values(agrupado || {}).flat();

  return plano.sort(
    (a, b) =>
      new Date(b.ultimaActualizacion).getTime() -
      new Date(a.ultimaActualizacion).getTime()
  );
}

// GET /api/candidatos/:id
export async function obtenerCandidato(id: number): Promise<CandidatoDetalle> {
  return apiFetch<CandidatoDetalle>(`/candidatos/${id}`);
}

// Convierte la hoja de vida (XML) en un archivo descargable en el navegador.
export function descargarHojaDeVida(idCandidato: number, xml: string): void {
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);

  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `hoja_de_vida_candidato_${idCandidato}.xml`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  URL.revokeObjectURL(url);
}