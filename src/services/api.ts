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
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
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
      data?.mensaje ||
      "Ocurrió un error inesperado. Intenta nuevamente.";

    throw new ApiError(mensaje, response.status);
  }

  return (data?.datos ?? (data as unknown)) as T;
}