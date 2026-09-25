import { useState } from 'react';
import { useAuth } from './AuthContext';
import './Login.css';

type Modo = 'login' | 'registro';

const LONGITUD_MINIMA = 8;

const TEXTOS: Record<Modo, { titulo: string; subtitulo: string; cta: string }> = {
  login: {
    titulo: 'Bienvenido de nuevo',
    subtitulo: 'Inicia sesión con tu correo y contraseña para seguir controlando tus finanzas.',
    cta: 'Iniciar sesión',
  },
  registro: {
    titulo: 'Crea tu cuenta',
    subtitulo: 'Regístrate con tu correo para empezar a controlar tus finanzas.',
    cta: 'Crear cuenta',
  },
};

export function Login() {
  const { registrar, iniciarSesion, iniciarSesionConProveedor, restablecerPassword } = useAuth();
  const [modo, setModo] = useState<Modo>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [proveedorEnCurso, setProveedorEnCurso] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const textos = TEXTOS[modo];

  function cambiarModo(nuevo: Modo) {
    setModo(nuevo);
    setError(null);
    setMensajeExito(null);
    setPassword('');
    setConfirmarPassword('');
    setAceptaTerminos(false);
  }

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMensajeExito(null);

    if (password.length < LONGITUD_MINIMA) {
      setError(`La contraseña debe tener al menos ${LONGITUD_MINIMA} caracteres.`);
      return;
    }
    if (modo === 'registro' && password !== confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (modo === 'registro' && !aceptaTerminos) {
      setError('Debes aceptar los Términos y la Política de Privacidad para continuar.');
      return;
    }

    setEnviando(true);
    const correo = email.trim();
    if (modo === 'login') {
      const { error } = await iniciarSesion(correo, password);
      if (error) setError(traducirError(error));
    } else {
      const { error, requiereConfirmacion } = await registrar(correo, password);
      if (error) {
        setError(traducirError(error));
      } else if (requiereConfirmacion) {
        // Sin este aviso, el formulario "no hace nada" visible: la cuenta sí
        // se crea, pero queda pendiente de confirmar por correo.
        setMensajeExito(`Te enviamos un correo a ${correo} para confirmar tu cuenta. Revísalo (y la carpeta de spam) antes de iniciar sesión.`);
        setPassword('');
        setConfirmarPassword('');
      }
    }
    setEnviando(false);
  }

  async function manejarProveedor(proveedor: 'google' | 'apple') {
    setError(null);
    setMensajeExito(null);
    setProveedorEnCurso(proveedor);
    const { error } = await iniciarSesionConProveedor(proveedor);
    if (error) {
      setError(traducirError(error));
      setProveedorEnCurso(null);
    }
    // Si no hay error, el navegador ya está siendo redirigido a Google/Apple.
  }

  async function manejarOlvidoPassword() {
    const correo = email.trim();
    if (!correo) {
      setError('Escribe tu correo arriba y vuelve a intentarlo.');
      return;
    }
    setError(null);
    setMensajeExito(null);
    setEnviando(true);
    const { error } = await restablecerPassword(correo);
    setEnviando(false);
    if (error) setError(traducirError(error));
    else setMensajeExito(`Te enviamos un correo a ${correo} con instrucciones para restablecer tu contraseña.`);
  }

  return (
    <div className="login">
      <div className="login__fondo" aria-hidden="true" />
      <div className="login__scroll">
        <div className="login__card">
          <img
            className="login__logo"
            src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
            alt="Mis Finanzas"
            width={192}
            height={192}
          />

          <div className="login__encabezado">
            <h1 className="login__titulo">{textos.titulo}</h1>
            <p className="login__subtitulo">{textos.subtitulo}</p>
          </div>

          <div className="login__social">
            <button
              type="button"
              className="login__social-boton"
              onClick={() => manejarProveedor('google')}
              disabled={proveedorEnCurso !== null || enviando}
            >
              <IconoGoogle />
              Google
            </button>
            <button
              type="button"
              className="login__social-boton"
              onClick={() => manejarProveedor('apple')}
              disabled={proveedorEnCurso !== null || enviando}
            >
              <IconoApple />
              Apple
            </button>
          </div>

          <div className="login__divisor">
            <span />
            <p>o</p>
            <span />
          </div>

          <form onSubmit={manejarEnvio} className="login__form">
            <label className="login__campo">
              <span>Correo electrónico</span>
              <input
                type="email"
                inputMode="email"
                autoCapitalize="off"
                autoComplete="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="login__campo">
              <span>Contraseña</span>
              <div className="login__campo-con-boton">
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="login__boton-ojo"
                  onClick={() => setMostrarPassword((v) => !v)}
                  aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarPassword ? <IconoOjoTachado /> : <IconoOjo />}
                </button>
              </div>
            </label>

            {modo === 'login' && (
              <button type="button" className="login__olvido" onClick={manejarOlvidoPassword}>
                ¿Olvidaste tu contraseña?
              </button>
            )}

            {modo === 'registro' && (
              <label className="login__campo">
                <span>Confirmar contraseña</span>
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  required
                />
              </label>
            )}

            {modo === 'registro' && (
              <label className="interruptor-fila">
                <span>Acepto los Términos y la Política de Privacidad</span>
                <span className="interruptor">
                  <input
                    type="checkbox"
                    checked={aceptaTerminos}
                    onChange={(e) => setAceptaTerminos(e.target.checked)}
                  />
                  <span className="interruptor__riel" />
                </span>
              </label>
            )}

            <button type="submit" className="login__cta" disabled={enviando}>
              {enviando ? 'Un momento…' : textos.cta}
            </button>
          </form>

          {error && <p className="login__error">{error}</p>}
          {mensajeExito && <p className="login__exito">{mensajeExito}</p>}

          <p className="login__pie">
            {modo === 'login' ? (
              <>
                ¿No tienes cuenta?{' '}
                <button type="button" onClick={() => cambiarModo('registro')}>
                  Crear cuenta
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <button type="button" onClick={() => cambiarModo('login')}>
                  Iniciar sesión
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function IconoGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.8-.4-4.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3 16.3 3 9.7 7.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 36.6 26.7 37.5 24 37.5c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 40.6 16.2 45 24 45z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.2 5.2C39.9 37 45 32.1 45 24c0-1.4-.1-2.8-.4-4.5z"
      />
    </svg>
  );
}

function IconoApple() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-3.014 1.57-.12 0-.23-.02-.3-.03-.014-.1-.04-.33-.04-.57 0-1.13.55-2.27 1.19-3.03.75-.85 2.04-1.5 3.02-1.53.015.15.03.32.03.51zm4.735 15.65c-.09.21-.5.94-1.23 2.02-.63.94-1.28 1.87-2.31 1.89-1 .02-1.32-.6-2.46-.6-1.14 0-1.5.58-2.44.62-.98.04-1.73-1.01-2.36-1.95C8.99 16.83 7.91 13.53 9.28 11.3c.68-1.12 1.9-1.83 3.23-1.85 1.07-.02 2.02.72 2.66.72.64 0 1.79-.89 3.02-.76.51.02 1.94.21 2.86 1.56-.07.05-1.71 1-1.69 2.98.02 2.37 2.08 3.16 2.1 3.17z" />
    </svg>
  );
}

function IconoOjo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconoOjoTachado() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a20.3 20.3 0 0 1-2.68 3.68M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function traducirError(mensaje: string): string {
  if (mensaje.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (mensaje.includes('User already registered')) return 'Ya existe una cuenta con ese correo.';
  if (mensaje.includes('Password should be at least')) return `La contraseña debe tener al menos ${LONGITUD_MINIMA} caracteres.`;
  if (mensaje.toLowerCase().includes('provider is not enabled') || mensaje.toLowerCase().includes('unsupported provider')) {
    return 'Este método de acceso todavía no está activado. Usa tu correo y contraseña por ahora.';
  }
  // Rate-limit de Supabase al reintentar un registro muy seguido con el
  // mismo correo (ej. "For security purposes, you can only request this
  // after 57 seconds."). Se intenta extraer los segundos si vienen en el
  // mensaje; si no, se muestra un aviso genérico igual de claro.
  if (mensaje.includes('security purposes')) {
    const segundos = mensaje.match(/(\d+)\s*seconds?/)?.[1];
    return segundos
      ? `Por seguridad, espera ${segundos} segundos antes de volver a intentarlo.`
      : 'Por seguridad, espera unos segundos antes de volver a intentarlo.';
  }
  return mensaje;
}
