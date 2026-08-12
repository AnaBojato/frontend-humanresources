import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Fingerprint,
} from 'lucide-react';
import BannerCarrusel from '../../components/BannerCarrusel/BannerCarrusel';
import { iniciarSesion } from '../../services/authService';
import { ApiError } from '../../services/api';
import './login.css';

// Placeholders de ambiente laboral (Unsplash, licencia libre de uso).
// Reemplázalas por tus propias fotos corporativas cuando las tengas.
const IMAGENES_CARRUSEL = [
  'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1600&auto=format&fit=crop',
];

export default function Login() {
  const navigate = useNavigate();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mantenerSesion, setMantenerSesion] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sacudir, setSacudir] = useState(false);

  const manejarError = (mensaje: string) => {
    setError(mensaje);
    setSacudir(true);
    setTimeout(() => setSacudir(false), 500);
  };

  const manejarSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginId.trim() || !password.trim()) {
      manejarError('Ingresa tu usuario y contraseña.');
      return;
    }

    setCargando(true);
    try {
      await iniciarSesion({ loginId: loginId.trim(), password, mantenerSesion });
      navigate('/dashboard');
    } catch (err) {
      const mensaje = err instanceof ApiError ? err.message : 'No se pudo iniciar sesión.';
      manejarError(mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page">
      <BannerCarrusel imagenes={IMAGENES_CARRUSEL} />

      <div className="login-tagline">
        <div className="login-tagline__badge">
          <Lock size={13} />
          <span>SSL · AES-256 BIT</span>
        </div>
        <h2 className="login-tagline__title">Infraestructura de talento segura</h2>
        <p className="login-tagline__text">
          Administra a todo tu equipo desde una plataforma confiable y lista para crecer.
        </p>
      </div>

      <div className="login-stage">
        <div className="login-card">
          <div className="login-card__brand">
            <div className="login-brand__icon">
              <ShieldCheck size={24} strokeWidth={2} />
            </div>
            <div>
              <h1 className="login-brand__title">AdventureWorks</h1>
              <p className="login-brand__subtitle">Acceso al sistema de talento humano</p>
            </div>
          </div>

          <form className="login-form" onSubmit={manejarSubmit} noValidate>
            <div className="login-field">
              <label className="login-label" htmlFor="login-id">
                <User size={14} />
                Usuario corporativo
              </label>
              <div className="login-input-wrap">
                <input
                  id="login-id"
                  name="login-id"
                  type="text"
                  placeholder="Ingresa tu Usuario"
                  autoComplete="username"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  disabled={cargando}
                />
              </div>
            </div>

            <div className="login-field">
              <div className="login-label-row">
                <label className="login-label" htmlFor="password">
                  <Lock size={14} />
                  Contraseña
                </label>
                <a className="login-link" href="#recuperar">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="login-input-wrap">
                <input
                  id="password"
                  name="password"
                  type={mostrarPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={cargando}
                />
                <button
                  type="button"
                  className="login-toggle-visibility"
                  onClick={() => setMostrarPassword((v) => !v)}
                  aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  {mostrarPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div className={`login-error ${sacudir ? 'login-error--shake' : ''}`} role="alert">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <div className="login-options">
              <label className="login-checkbox">
                <input
                  type="checkbox"
                  checked={mantenerSesion}
                  onChange={(e) => setMantenerSesion(e.target.checked)}
                />
                <span className="login-checkbox__box">
                  <svg viewBox="0 0 16 16" width="10" height="10" fill="none">
                    <path
                      d="M2 8.5L6 12L14 3"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                Mantener sesión iniciada
              </label>
            </div>

            <button type="submit" className="login-submit" disabled={cargando}>
              {cargando ? (
                <>
                  <Loader2 size={17} className="login-spin" />
                  Autenticando...
                </>
              ) : (
                <>
                  Iniciar sesión
                  <LogIn size={17} />
                </>
              )}
            </button>
          </form>

          <div className="login-sso">
            <div className="login-sso__badge">
              <Fingerprint size={13} />
              SSO habilitado
            </div>
            <button type="button" className="login-sso__button">
              <Building2 size={16} />
              Ingreso empresarial
            </button>
          </div>

          <p className="login-card__footer">
            <ShieldCheck size={13} />
            Seguridad certificada · © 2026 AdventureWorks Inc.
          </p>
        </div>
      </div>
    </div>
  );
}