import { useState } from 'react';
import { useAuth } from './AuthContext';
import './Login.css';

type Modo = 'login' | 'registro';

const LONGITUD_MINIMA = 8;

export function Login() {
  const { registrar, iniciarSesion } = useAuth();
  const [modo, setModo] = useState<Modo>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  function cambiarModo(nuevo: Modo) {
    setModo(nuevo);
    setError(null);
    setMensajeExito(null);
    setPassword('');
    setConfirmarPassword('');
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

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__icono">$</div>
        <h1 className="login__titulo">Mis Finanzas</h1>
        <p className="login__subtitulo">Controla tus entradas y salidas de dinero al día.</p>

        <div className="login__tabs">
          <button
            type="button"
            className={`login__tab ${modo === 'login' ? 'login__tab--activo' : ''}`}
            onClick={() => cambiarModo('login')}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            className={`login__tab ${modo === 'registro' ? 'login__tab--activo' : ''}`}
            onClick={() => cambiarModo('registro')}
          >
            Crear cuenta
          </button>
        </div>

        <form onSubmit={manejarEnvio} className="login__form">
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
          <input
            type="password"
            autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {modo === 'registro' && (
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Confirmar contraseña"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              required
            />
          )}
          <button type="submit" disabled={enviando}>
            {enviando ? 'Un momento…' : modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </form>

        {error && <p className="login__error">{error}</p>}
        {mensajeExito && <p className="login__exito">{mensajeExito}</p>}
      </div>
    </div>
  );
}

function traducirError(mensaje: string): string {
  if (mensaje.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (mensaje.includes('User already registered')) return 'Ya existe una cuenta con ese correo.';
  if (mensaje.includes('Password should be at least')) return `La contraseña debe tener al menos ${LONGITUD_MINIMA} caracteres.`;
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
