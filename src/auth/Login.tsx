import { useState } from 'react';
import { useAuth } from './AuthContext';
import './Login.css';

export function Login() {
  const { enviarEnlaceMagico } = useAuth();
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setEnviando(true);
    setError(null);
    const { error } = await enviarEnlaceMagico(email.trim());
    setEnviando(false);
    if (error) setError(error);
    else setEnviado(true);
  }

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__icono">$</div>
        <h1 className="login__titulo">Mis Finanzas</h1>
        <p className="login__subtitulo">Controla tus entradas y salidas de dinero al día.</p>

        {enviado ? (
          <p className="login__enviado">
            Te enviamos un enlace a <strong>{email}</strong>. Ábrelo desde este mismo dispositivo para iniciar
            sesión.
          </p>
        ) : (
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
            <button type="submit" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviarme el enlace mágico'}
            </button>
          </form>
        )}

        {error && <p className="login__error">{error}</p>}
      </div>
    </div>
  );
}
