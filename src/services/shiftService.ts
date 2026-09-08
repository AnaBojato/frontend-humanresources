const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:4000/api"
).replace(/\/$/, "");

const SHIFTS_URL = `${API_URL}/turnos`;

/* =========================================================
   TIPOS
   ========================================================= */

export interface Shift {
  idTurno: number;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  totalEmpleadosAsignados: number;
}

export interface ShiftFormData {
  nombre: string;
  horaInicio: string;
  horaFin: string;
}

interface ApiResponse<T> {
  exito: boolean;
  datos: T;
  mensaje?: string;
}

/* =========================================================
   FUNCIÓN GENERAL PARA LAS PETICIONES
   ========================================================= */

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  const data: ApiResponse<T> | null = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        `Request failed with status ${response.status}.`
    );
  }

  if (!data) {
    throw new Error(
      "The server returned an empty or invalid response."
    );
  }

  if (data.exito === false) {
    throw new Error(
      data.mensaje ||
        "The request could not be completed."
    );
  }

  return data;
}

/* =========================================================
   LISTAR TURNOS
   GET /api/turnos
   ========================================================= */

export async function listarTurnos(): Promise<Shift[]> {
  const response = await request<Shift[]>(SHIFTS_URL);

  return response.datos ?? [];
}

/* =========================================================
   OBTENER UN TURNO
   GET /api/turnos/:id
   ========================================================= */

export async function obtenerTurno(
  id: number
): Promise<Shift> {
  const response = await request<Shift>(
    `${SHIFTS_URL}/${id}`
  );

  return response.datos;
}

/* =========================================================
   CREAR TURNO
   POST /api/turnos
   ========================================================= */

export async function crearTurno(
  datos: ShiftFormData
): Promise<{ idTurno: number }> {
  const response = await request<{ idTurno: number }>(
    SHIFTS_URL,
    {
      method: "POST",
      body: JSON.stringify({
        nombre: datos.nombre,
        horaInicio: datos.horaInicio,
        horaFin: datos.horaFin,
      }),
    }
  );

  return response.datos;
}

/* =========================================================
   ACTUALIZAR TURNO
   PUT /api/turnos/:id
   ========================================================= */

export async function actualizarTurno(
  id: number,
  datos: ShiftFormData
): Promise<void> {
  await request<unknown>(
    `${SHIFTS_URL}/${id}`,
    {
      method: "PUT",
      body: JSON.stringify({
        nombre: datos.nombre,
        horaInicio: datos.horaInicio,
        horaFin: datos.horaFin,
      }),
    }
  );
}

/* =========================================================
   ELIMINAR TURNO
   DELETE /api/turnos/:id
   ========================================================= */

export async function eliminarTurno(
  id: number
): Promise<void> {
  await request<unknown>(
    `${SHIFTS_URL}/${id}`,
    {
      method: "DELETE",
    }
  );
}