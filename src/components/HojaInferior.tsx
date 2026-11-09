import { Link, Sheet } from 'konsta/react';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
}

interface Contenido {
  children: ReactNode;
  cabecera: ReactNode;
  pie: ReactNode;
}

const DURACION_TRANSICION_MS = 400;

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
}: Props) {
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
    if (!abierto) return;
    function alPresionarTecla(e: KeyboardEvent) {
      if (e.key === 'Escape') cerrar();
    }
    document.addEventListener('keydown', alPresionarTecla);
    return () => document.removeEventListener('keydown', alPresionarTecla);
  });

  if (!montada) return null;

  const destino = document.getElementById('capa-hojas') ?? document.body;

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
              className="min-h-11 justify-self-start px-2 text-[17px] disabled:opacity-40"
              onClick={cerrar}
            >
              {textoCerrar}
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
          <div className="sticky bottom-0 z-10 flex flex-col gap-2 bg-ios-light-surface px-4 pt-2 pb-safe-4 dark:bg-ios-dark-surface-2">
            {vista.pie}
          </div>
        )}
      </div>
    </Sheet>,
    destino
  );
}
