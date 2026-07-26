import { apiFetch } from './api';

const TOKEN_KEY = 'aw_hrms_token';
const USER_KEY = 'aw_hrms_user';

export interface CredencialesLogin {
  loginId: string;
  password: string;
  mantenerSesion?: boolean;
}

export interface UsuarioAutenticado {
  id: number;
  nombre: string;
  loginId: string;
  rol?: string;
}

interface RespuestaAuth {
  token: string;
  usuario: UsuarioAutenticado;
}

// POST /api/auth/login
export async function iniciarSesion(credenciales: CredencialesLogin): Promise<UsuarioAutenticado> {
  const { mantenerSesion, ...body } = credenciales;
  const respuesta = await apiFetch<RespuestaAuth>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  localStorage.setItem(TOKEN_KEY, respuesta.token);
  localStorage.setItem(USER_KEY, JSON.stringify(respuesta.usuario));
  return respuesta.usuario;
}

export function cerrarSesion(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function obtenerToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function obtenerUsuarioActual(): UsuarioAutenticado | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as UsuarioAutenticado) : null;
}

export function estaAutenticado(): boolean {
  return !!obtenerToken();
}