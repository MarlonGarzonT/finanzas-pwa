import { useState } from 'react';
import { useAuth } from './AuthContext';
import { traducirError } from './Login';
import './Login.css';

const LONGITUD_MINIMA = 8;

export function RestablecerPassword() {
  const { actualizarPassword, cancelarRecuperacion } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < LONGITUD_MINIMA) {
      setError(`La contraseña debe tener al menos ${LONGITUD_MINIMA} caracteres.`);
      return;
    }
    if (password !== confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setEnviando(true);
    const { error } = await actualizarPassword(password);
    setEnviando(false);
    if (error) setError(traducirError(error));
    // Si no hay error, modoRecuperacion pasa a false y la app entra normalmente.
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
            <h1 className="login__titulo">Elige tu nueva contraseña</h1>
            <p className="login__subtitulo">Escribe una contraseña nueva para tu cuenta.</p>
          </div>

          <form onSubmit={manejarEnvio} className="login__form">
            <label className="login__campo">
              <span>Contraseña nueva</span>
              <div className="login__campo-con-boton">
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  className="login__boton-ojo"
                  onClick={() => setMostrarPassword((v) => !v)}
                  aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </label>

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

            <button type="submit" className="login__cta" disabled={enviando}>
              {enviando ? 'Un momento…' : 'Guardar contraseña'}
            </button>
          </form>

          {error && <p className="login__error">{error}</p>}

          <p className="login__pie">
            <button type="button" onClick={cancelarRecuperacion}>
              Cancelar y volver a iniciar sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
