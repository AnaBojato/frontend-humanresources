// Wrapper genérico sobre fetch para hablar con el backend Express.
// Centraliza base URL, headers, token de auth y manejo de errores.

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const TOKEN_KEY = "aw_hrms_token";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RespuestaBackend<T> {
  exito: boolean;
  mensaje?: string;
  datos?: T;
  [clave: string]: unknown; // permite campos extra como "paginacion"
}

async function ejecutarFetch<T>(
  endpoint: string,
  options: RequestInit
): Promise<RespuestaBackend<T>> {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      "No se pudo conectar con el servidor. Verifica que el backend esté funcionando.",
      0
    );
  }

  const data: RespuestaBackend<T> | null = await response
    .json()
    .catch(() => null);

  if (!response.ok || data?.exito === false) {
    const mensaje =
      data?.mensaje || "Ocurrió un error inesperado. Intenta nuevamente.";

    throw new ApiError(mensaje, response.status);
  }

  return data ?? ({ exito: true } as RespuestaBackend<T>);
}

// Comportamiento original: devuelve directamente "datos". No se modifica.
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const data = await ejecutarFetch<T>(endpoint, options);
  return (data.datos ?? (data as unknown)) as T;
}

// Nuevo: para endpoints que devuelven campos extra junto a "datos"
// (ej. GET /api/empleados devuelve { datos, paginacion }).
export async function apiFetchFull<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<RespuestaBackend<T>> {
  return ejecutarFetch<T>(endpoint, options);
}