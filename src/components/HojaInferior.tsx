import { Link, Sheet } from 'konsta/react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconoChevronIzquierda, IconoCerrar } from './Iconos';
import { useEsEscritorio } from './useEsEscritorio';
import { useBloqueoDeFondo, useGestosHoja } from './useComportamientoSheet';

interface Props {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
  // Contenido que debe quedar fijo bajo el título mientras el resto hace
  // scroll (ej. el monto, para que nunca quede tapado por el teclado).
  cabecera?: ReactNode;
  // Acción principal, anclada abajo al alcance del pulgar.
  pie?: ReactNode;
  textoCerrar?: string;
  cierreBloqueado?: boolean;
  // En un flujo por pasos: el botón de la izquierda pasa a ser "‹ Atrás" y
  // vuelve al paso anterior en vez de cerrar (se cierra con el asa o tocando
  // fuera). Sin esto, el botón es "Cancelar".
  onAtras?: () => void;
  // Cambia cuando el flujo cambia de paso: el contenido vuelve arriba.
  reiniciarScroll?: unknown;
}

interface Contenido {
  children: ReactNode;
  cabecera: ReactNode;
  pie: ReactNode;
}

const DURACION_TRANSICION_MS = 400;

// En el celular, un bottom sheet; en escritorio (desde 1024 px), un panel que
// entra por la derecha (patrón web), con la misma cabecera, contenido y pie.
// Bottom sheet de toda la app sobre el Sheet de Konsta. Agrega lo que el
// Sheet no trae: montaje diferido con animación de salida, asa para cerrar
// arrastrando, anclaje al teclado de iOS, cierre con Escape y semántica de
// diálogo. Se dibuja en un portal porque un Sheet anidado dentro de otro
// quedaría atrapado en el `translate` de su padre.
export function HojaInferior({
  abierto,
  titulo,
  onCerrar,
  children,
  cabecera,
  pie,
  textoCerrar = 'Cancelar',
  cierreBloqueado = false,
  onAtras,
  reiniciarScroll,
}: Props) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const esEscritorio = useEsEscritorio();
  const idTitulo = useId();
  const [montada, setMontada] = useState(abierto);
  const [visible, setVisible] = useState(false);
  const [ultimoAbierto, setUltimoAbierto] = useState<Contenido>({ children, cabecera, pie });

  // Mientras se anima la salida, el padre suele limpiar el estado que
  // alimenta el contenido; se sigue mostrando la última versión abierta
  // para que la hoja no se vacíe a mitad de camino. (Actualizar estado
  // durante el render es el patrón de React para "recordar el render
  // anterior"; como los elementos son los mismos objetos, el render extra
  // no vuelve a renderizar el contenido.)
  if (abierto && (ultimoAbierto.children !== children || ultimoAbierto.cabecera !== cabecera || ultimoAbierto.pie !== pie)) {
    setUltimoAbierto({ children, cabecera, pie });
  }
  if (abierto && !montada) setMontada(true);
  if (!abierto && visible) setVisible(false);
  const vista = abierto ? { children, cabecera, pie } : ultimoAbierto;

  function cerrar() {
    if (!cierreBloqueado) onCerrar();
  }

  useBloqueoDeFondo(abierto);
  const gestos = useGestosHoja(abierto, cerrar);

  useEffect(() => {
    if (abierto) {
      // Dos frames: el primero pinta la hoja abajo, el segundo dispara la
      // transición hacia arriba.
      let segundo = 0;
      const primero = requestAnimationFrame(() => {
        segundo = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(primero);
        cancelAnimationFrame(segundo);
      };
    }
    const id = window.setTimeout(() => setMontada(false), DURACION_TRANSICION_MS);
    return () => window.clearTimeout(id);
  }, [abierto]);

  useEffect(() => {
    contenedorRef.current?.scrollTo({ top: 0 });
  }, [reiniciarScroll]);

  useEffect(() => {
    if (!abierto) return;
    function alPresionarTecla(e: KeyboardEvent) {
      if (e.key === 'Escape') cerrar();
    }
    document.addEventListener('keydown', alPresionarTecla);
    return () => document.removeEventListener('keydown', alPresionarTecla);
  });

  if (!montada) return null;

  const destino = document.getElementById('capa-hojas') ?? document.body;

  if (esEscritorio) {
    return createPortal(
      <div className={`fixed inset-0 z-40 ${visible ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
          onClick={cerrar}
          aria-hidden="true"
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby={idTitulo}
          className={`absolute top-0 right-0 flex h-full w-[500px] max-w-full flex-col bg-ios-light-surface shadow-[-12px_0_40px_rgb(0_0_0/0.18)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] dark:bg-ios-dark-surface-2 ${
            visible ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <header className="flex h-16 shrink-0 items-center gap-1 px-3">
            {onAtras && (
              <Link
                component="button"
                linkProps={{ type: 'button', disabled: cierreBloqueado }}
                className="min-h-11 gap-0.5 px-2 text-[16px] disabled:opacity-40"
                onClick={onAtras}
              >
                <IconoChevronIzquierda className="-ml-1 size-5" />
                Atrás
              </Link>
            )}
            <h2 id={idTitulo} className="m-0 min-w-0 flex-1 truncate px-2 text-[19px] font-semibold tracking-[-0.01em]">
              {titulo}
            </h2>
            <button
              type="button"
              onClick={cerrar}
              disabled={cierreBloqueado}
              aria-label={`${textoCerrar === 'Cancelar' ? 'Cerrar' : textoCerrar}`}
              className="flex size-11 items-center justify-center rounded-full text-secundario transition-colors hover:bg-black/[0.06] focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40 dark:hover:bg-white/[0.1]"
            >
              <IconoCerrar className="size-5" />
            </button>
          </header>
          {vista.cabecera}
          <div ref={contenedorRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="flex flex-col gap-1 pb-4">{vista.children}</div>
          </div>
          {vista.pie && (
            <div className="flex shrink-0 flex-col gap-2 border-t border-black/[0.07] bg-ios-light-surface px-5 py-4 dark:border-white/10 dark:bg-ios-dark-surface-2">
              {vista.pie}
            </div>
          )}
        </aside>
      </div>,
      destino
    );
  }

  return createPortal(
    <Sheet
      opened={visible}
      onBackdropClick={cerrar}
      className="hoja-inferior w-full md:mx-auto md:max-w-lg"
      colors={{ bgIos: 'bg-ios-light-surface dark:bg-ios-dark-surface-2' }}
      style={gestos.estiloHoja}
      role="dialog"
      aria-modal="true"
      aria-labelledby={idTitulo}
    >
      <div
        ref={contenedorRef}
        className="flex flex-col overflow-y-auto overscroll-contain"
        style={{ maxHeight: gestos.alturaMaxima ?? '92dvh' }}
        onFocusCapture={gestos.onFocusCaptureHoja}
      >
        <header className="sticky top-0 z-10 bg-ios-light-surface dark:bg-ios-dark-surface-2">
          <div
            className="flex h-5 cursor-grab touch-none items-end justify-center"
            onPointerDown={gestos.onPointerDownAsa}
            onPointerMove={gestos.onPointerMoveAsa}
            onPointerUp={gestos.onPointerUpAsa}
            onPointerCancel={gestos.onPointerUpAsa}
            aria-hidden="true"
          >
            <span className="h-[5px] w-9 rounded-full bg-black/20 dark:bg-white/25" />
          </div>
          <div className="grid h-12 grid-cols-[1fr_auto_1fr] items-center px-2">
            <Link
              component="button"
              linkProps={{ type: 'button', disabled: cierreBloqueado }}
              className="min-h-11 items-center justify-self-start px-2 text-[17px] disabled:opacity-40"
              onClick={onAtras ?? cerrar}
            >
              {onAtras ? (
                <>
                  <IconoChevronIzquierda className="-ml-1 size-5" />
                  Atrás
                </>
              ) : (
                textoCerrar
              )}
            </Link>
            <h2 id={idTitulo} className="max-w-[60vw] truncate text-[17px] font-semibold">
              {titulo}
            </h2>
            <span />
          </div>
          {vista.cabecera}
        </header>

        <div className="flex flex-col gap-1 pb-2">{vista.children}</div>

        {vista.pie && (
          <div className="sticky bottom-0 z-10 flex flex-col gap-2 bg-ios-light-surface px-4 pt-2 pie-seguro dark:bg-ios-dark-surface-2">
            {vista.pie}
          </div>
        )}
      </div>
    </Sheet>,
    destino
  );
}
