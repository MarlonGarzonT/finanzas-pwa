import { Block, Button, List, Page } from 'konsta/react';
import { useState, type FormEvent } from 'react';
import { CampoTexto } from '../components/CampoTexto';
import { IconoOjo, IconoOjoTachado } from '../components/Iconos';
import { useAuth } from './AuthContext';
import { traducirError } from './Login';

const LONGITUD_MINIMA = 8;

export function RestablecerPassword() {
  const { actualizarPassword, cancelarRecuperacion } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarEnvio(e: FormEvent) {
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
    try {
      const { error } = await actualizarPassword(password);
      if (error) setError(traducirError(error));
      // Si no hay error, modoRecuperacion pasa a false y la app entra normalmente.
    } catch {
      setError('No hay conexión. Revisa tu internet e intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  const botonOjo = (
    <button
      type="button"
      className="-mr-2 flex size-11 shrink-0 items-center justify-center text-secundario"
      onClick={() => setMostrarPassword((v) => !v)}
      aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      aria-pressed={mostrarPassword}
    >
      {mostrarPassword ? <IconoOjoTachado className="size-5" /> : <IconoOjo className="size-5" />}
    </button>
  );

  return (
    <Page className="pt-safe pb-safe">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center py-8">
        <header className="flex flex-col items-center gap-3 px-6 text-center">
          <img
            className="size-16 rounded-[18px]"
            src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
            alt=""
            width={64}
            height={64}
          />
          <h1 className="m-0 text-[28px] leading-tight font-bold tracking-tight">Elige tu nueva contraseña</h1>
          <p className="m-0 text-[15px] text-secundario">Escribe una contraseña nueva para tu cuenta.</p>
        </header>

        <form onSubmit={manejarEnvio}>
          <List strong inset className="mt-6 mb-2">
            <CampoTexto
              etiqueta="Contraseña nueva"
              type={mostrarPassword ? 'text' : 'password'}
              autoComplete="new-password"
              autoCapitalize="off"
              enterKeyHint="next"
              placeholder={`Mínimo ${LONGITUD_MINIMA} caracteres`}
              valor={password}
              onCambiar={setPassword}
              required
              autoFocus
              accion={botonOjo}
            />
            <CampoTexto
              etiqueta="Confirmar contraseña"
              type={mostrarPassword ? 'text' : 'password'}
              autoComplete="new-password"
              autoCapitalize="off"
              enterKeyHint="go"
              placeholder="Repite la contraseña"
              valor={confirmarPassword}
              onCambiar={setConfirmarPassword}
              required
            />
          </List>

          <Block className="my-3 flex flex-col gap-3">
            {error && (
              <p className="m-0 text-center text-[15px] text-alerta" role="alert">
                {error}
              </p>
            )}
            <Button large rounded type="submit" disabled={enviando}>
              {enviando ? 'Un momento…' : 'Guardar contraseña'}
            </Button>
            <Button large rounded clear type="button" onClick={cancelarRecuperacion} disabled={enviando}>
              Cancelar y volver a iniciar sesión
            </Button>
          </Block>
        </form>
      </div>
    </Page>
  );
}
