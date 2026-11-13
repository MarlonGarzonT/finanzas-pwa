import { Block, Button, List, ListItem, Page, Toggle } from 'konsta/react';
import { lazy, Suspense, useState, useSyncExternalStore, type ComponentType, type FormEvent } from 'react';
import { CampoPortada } from '../components/CampoPortada';
import { CLASE_TITULO_PORTADA } from '../components/claseTituloPortada';
import { IconoCandado, IconoCorreo, IconoOjo, IconoOjoTachado } from '../components/Iconos';
import ClickSpark from '../components/reactbits/ClickSpark';
import { useAuth } from './AuthContext';

type Modo = 'login' | 'registro';

function TituloPlano({ texto, cargando = false }: { texto: string; cargando?: boolean }) {
  return <h1 className={`${CLASE_TITULO_PORTADA} ${cargando ? 'invisible' : ''}`}>{texto}</h1>;
}

// La portada (aurora + título animado, con GSAP) va en su propio chunk: solo
// lo descarga quien ve el login. Si no carga (sin conexión), queda el título
// plano y sin fondo: el formulario funciona igual.
const cargarPortada = () => import('../components/PortadaLogin');
function SinFondo() {
  return null;
}
const FondoAurora = lazy<ComponentType>(() =>
  cargarPortada()
    .then((m) => ({ default: m.FondoAurora }))
    .catch(() => ({ default: SinFondo }))
);
function LogoPlano({ src }: { src: string }) {
  return <img className="m-1 size-16 rounded-[18px] shadow-[0_8px_24px_-8px_rgb(0_0_0/0.35)]" src={src} alt="" width={64} height={64} />;
}
const LogoConAnillo = lazy(() =>
  cargarPortada()
    .then((m) => ({ default: m.LogoConAnillo }))
    .catch(() => ({ default: LogoPlano }))
);
function LemaPlano() {
  return <p className="m-0 text-[17px] text-secundario">Cuadra tus gastos, ingresos y préstamos.</p>;
}
const LemaAnimado = lazy<ComponentType>(() =>
  cargarPortada()
    .then((m) => ({ default: m.LemaAnimado }))
    .catch(() => ({ default: LemaPlano }))
);
const VitrinaProducto = lazy<ComponentType>(() =>
  cargarPortada()
    .then((m) => ({ default: m.VitrinaProducto }))
    .catch(() => ({ default: SinFondo }))
);

// En pantallas anchas el login va a dos columnas, con la vitrina de marca al
// lado. Se decide en JS (no solo con CSS) para no montar dos auroras a la vez.
const consultaEscritorio = window.matchMedia('(min-width: 1024px)');
function suscribirEscritorio(avisar: () => void) {
  consultaEscritorio.addEventListener('change', avisar);
  return () => consultaEscritorio.removeEventListener('change', avisar);
}
function useEsEscritorio(): boolean {
  return useSyncExternalStore(suscribirEscritorio, () => consultaEscritorio.matches);
}

// Chispas al tocar los botones principales: verdes azulados del logo.
const COLORES_CHISPA = ['#43af9c', '#16687c', '#7ee0c4'];

const TituloAnimado = lazy(() =>
  cargarPortada()
    .then((m) => ({ default: m.TituloAnimado }))
    .catch(() => ({ default: TituloPlano }))
);

const LONGITUD_MINIMA = 8;

const TEXTOS: Record<Modo, { titulo: string; cta: string }> = {
  login: {
    titulo: 'Bienvenido de nuevo',
    cta: 'Iniciar sesión',
  },
  registro: {
    titulo: 'Crea tu cuenta',
    cta: 'Crear cuenta',
  },
};

export function Login() {
  const { registrar, iniciarSesion, iniciarSesionConGoogle, restablecerPassword } = useAuth();
  const [modo, setModo] = useState<Modo>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const escritorio = useEsEscritorio();
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviandoGoogle, setEnviandoGoogle] = useState(false);
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

  async function manejarEnvio(e: FormEvent) {
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
    try {
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
    } catch {
      setError('No hay conexión. Revisa tu internet e intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  async function manejarGoogle() {
    setError(null);
    setMensajeExito(null);
    setEnviandoGoogle(true);
    try {
      const { error } = await iniciarSesionConGoogle();
      if (error) {
        setError(traducirError(error));
        setEnviandoGoogle(false);
      }
      // Si no hay error, el navegador ya está siendo redirigido a Google.
    } catch {
      setError('No hay conexión. Revisa tu internet e intenta de nuevo.');
      setEnviandoGoogle(false);
    }
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
    try {
      const { error } = await restablecerPassword(correo);
      if (error) setError(traducirError(error));
      else setMensajeExito(`Te enviamos un correo a ${correo} con instrucciones para restablecer tu contraseña.`);
    } catch {
      setError('No hay conexión. Revisa tu internet e intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  const botonOjo = (
    <button
      type="button"
      className="flex size-11 shrink-0 items-center justify-center rounded-full text-secundario"
      onClick={() => setMostrarPassword((v) => !v)}
      aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      aria-pressed={mostrarPassword}
    >
      {mostrarPassword ? <IconoOjoTachado className="size-5" /> : <IconoOjo className="size-5" />}
    </button>
  );

  return (
    <Page className="pt-safe pb-safe">
      {!escritorio && (
        <Suspense fallback={null}>
          <FondoAurora />
        </Suspense>
      )}
      <div className="relative mx-auto flex min-h-full w-full max-w-md flex-col justify-center py-8 lg:max-w-6xl lg:flex-row lg:items-stretch lg:justify-center lg:gap-10 lg:p-6">
        {escritorio && (
          <Suspense fallback={<div className="flex-1" />}>
            <VitrinaProducto />
          </Suspense>
        )}
        <div className="flex flex-col justify-center lg:w-[440px] lg:shrink-0">
        <header className="flex flex-col items-center gap-3 px-6 text-center">
          <Suspense fallback={<LogoPlano src={`${import.meta.env.BASE_URL}icons/icon-192.png`} />}>
            <LogoConAnillo src={`${import.meta.env.BASE_URL}icons/icon-192.png`} />
          </Suspense>
          <Suspense fallback={<TituloPlano texto={textos.titulo} cargando />}>
            <TituloAnimado texto={textos.titulo} />
          </Suspense>
          <Suspense fallback={<LemaPlano />}>
            <LemaAnimado />
          </Suspense>
        </header>

        <Block className="my-6">
          <Button large rounded outline onClick={manejarGoogle} disabled={enviandoGoogle || enviando} className="gap-2 normal-case">
            <IconoGoogle />
            {enviandoGoogle ? 'Abriendo Google…' : 'Continuar con Google'}
          </Button>
        </Block>

        <div className="flex items-center gap-3 px-8 text-[13px] text-secundario" aria-hidden="true">
          <span className="h-px flex-1 bg-black/15 dark:bg-white/15" />o con tu correo
          <span className="h-px flex-1 bg-black/15 dark:bg-white/15" />
        </div>

        <form onSubmit={manejarEnvio}>
          <div className="mt-4 mb-2 flex flex-col gap-3 px-4">
            <CampoPortada
              etiqueta="Correo electrónico"
              icono={<IconoCorreo className="size-5" />}
              type="email"
              inputMode="email"
              autoComplete="email"
              enterKeyHint="next"
              placeholder="tu@correo.com"
              valor={email}
              onCambiar={setEmail}
              required
            />
            <CampoPortada
              etiqueta="Contraseña"
              icono={<IconoCandado className="size-5" />}
              type={mostrarPassword ? 'text' : 'password'}
              autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
              enterKeyHint={modo === 'login' ? 'go' : 'next'}
              placeholder={`Mínimo ${LONGITUD_MINIMA} caracteres`}
              valor={password}
              onCambiar={setPassword}
              required
              accion={botonOjo}
            />
            {modo === 'registro' && (
              <CampoPortada
                etiqueta="Confirmar contraseña"
                icono={<IconoCandado className="size-5" />}
                type={mostrarPassword ? 'text' : 'password'}
                autoComplete="new-password"
                enterKeyHint="go"
                placeholder="Repite la contraseña"
                valor={confirmarPassword}
                onCambiar={setConfirmarPassword}
                required
              />
            )}
          </div>
          <List strong inset className={modo === 'registro' ? 'mt-3 mb-2' : 'hidden'}>
            {modo === 'registro' && (
              <ListItem
                label
                title="Acepto los Términos y la Política de Privacidad"
                after={
                  <Toggle
                    checked={aceptaTerminos}
                    onChange={() => setAceptaTerminos((v) => !v)}
                    aria-label="Acepto los Términos y la Política de Privacidad"
                  />
                }
              />
            )}
          </List>

          {modo === 'login' && (
            <div className="flex justify-end px-4">
              <Button type="button" clear small inline rounded className="h-11 normal-case" onClick={manejarOlvidoPassword} disabled={enviando}>
                ¿Olvidaste tu contraseña?
              </Button>
            </div>
          )}

          <Block className="my-3 flex flex-col gap-3">
            {error && (
              <p className="m-0 text-center text-[15px] text-alerta" role="alert">
                {error}
              </p>
            )}
            {mensajeExito && (
              <p className="m-0 text-center text-[15px] text-ingreso" role="status">
                {mensajeExito}
              </p>
            )}
            <ClickSpark sparkColor={COLORES_CHISPA} sparkCount={10} sparkRadius={34} sparkSize={12} duration={520}>
              <Button large rounded type="submit" disabled={enviando}>
                {enviando ? 'Un momento…' : textos.cta}
              </Button>
            </ClickSpark>
          </Block>
        </form>

        <p className="m-0 flex items-center justify-center gap-1 text-[15px] text-secundario">
          {modo === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          <Button clear small inline rounded className="h-11 px-2 normal-case" onClick={() => cambiarModo(modo === 'login' ? 'registro' : 'login')}>
            {modo === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}
          </Button>
        </p>
        </div>
      </div>
    </Page>
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

export function traducirError(mensaje: string): string {
  if (mensaje.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (mensaje.includes('User already registered')) return 'Ya existe una cuenta con ese correo.';
  if (mensaje.includes('Password should be at least')) return `La contraseña debe tener al menos ${LONGITUD_MINIMA} caracteres.`;
  if (mensaje.includes('should be different from the old password')) {
    return 'La contraseña nueva debe ser distinta a la actual.';
  }
  if (mensaje.includes('Auth session missing')) {
    return 'El enlace ya expiró o ya se usó. Solicita uno nuevo desde "¿Olvidaste tu contraseña?".';
  }
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
