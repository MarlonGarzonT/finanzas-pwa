import { lazy, Suspense } from 'react';
import { IconoMas } from './Iconos';

// Posición y forma del botón principal de cada pestaña (la altura y la
// posición sobre la barra son las de Konsta: 56px, `.fab-sobre-pestanas`).
export const CLASES_BOTON_FLOTANTE =
  'fab-sobre-pestanas right-4 z-20 flex h-14 select-none items-center justify-center gap-2 rounded-full text-white shadow-ios-light-glass-fab transition-transform duration-100 active:scale-95 dark:shadow-ios-dark-glass-fab';

const ConEfectos = lazy(() => import('./BotonFlotanteEfectos'));

interface Props {
  // Lo que lee el lector de pantalla (el texto visible puede faltar).
  etiqueta: string;
  // Sin texto queda solo el "+" redondo.
  texto?: string;
  onClick: () => void;
  // Con false, sin la luz: cuando otro botón de la pantalla ya es el que llama la atención.
  efectos?: boolean;
}

// Botón flotante de la pestaña (nuevo movimiento, nuevo préstamo). Mientras
// llega el chunk de los efectos se ve el mismo botón sin ellos, del mismo
// tamaño, así que no hay salto cuando aparecen.
export function BotonFlotante({ etiqueta, texto, onClick, efectos = true }: Props) {
  const plano = (
    <button
      type="button"
      aria-label={etiqueta}
      onClick={onClick}
      className={`${CLASES_BOTON_FLOTANTE} fixed bg-primary ${texto ? 'min-w-14 px-5' : 'size-14'}`}
    >
      <IconoMas className="size-7" />
      {texto && <span className="text-[16px] font-semibold">{texto}</span>}
    </button>
  );
  if (!efectos) return plano;
  return (
    <Suspense fallback={plano}>
      <ConEfectos etiqueta={etiqueta} texto={texto} onClick={onClick} />
    </Suspense>
  );
}
