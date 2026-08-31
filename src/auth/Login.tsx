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

  function cambiarModo(nuevo: Modo) {
    setModo(nuevo);
    setError(null);
    setPassword('');
    setConfirmarPassword('');
  }

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < LONGITUD_MINIMA) {
      setError(`La contraseña debe tener al menos ${LONGITUD_MINIMA} caracteres.`);
      return;
    }
    if (modo === 'registro' && password !== confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setEnviando(true);
    const { error } =
      modo === 'login' ? await iniciarSesion(email.trim(), password) : await registrar(email.trim(), password);
    setEnviando(false);

    if (error) setError(traducirError(error));
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
      </div>
    </div>
  );
}

function traducirError(mensaje: string): string {
  if (mensaje.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (mensaje.includes('User already registered')) return 'Ya existe una cuenta con ese correo.';
  if (mensaje.includes('Password should be at least')) return `La contraseña debe tener al menos ${LONGITUD_MINIMA} caracteres.`;
  return mensaje;
}
