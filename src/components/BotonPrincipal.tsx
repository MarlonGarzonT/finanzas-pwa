import { lazy, Suspense } from 'react';

// Forma del botón principal de ancho completo (52px, píldora, azul de la app).
export const CLASES_BOTON_PRINCIPAL =
  'flex h-13 w-full select-none items-center justify-center rounded-full text-[17px] font-semibold text-white transition-transform duration-100 active:scale-[0.98]';

const ConEfectos = lazy(() => import('./BotonPrincipalEfectos'));

interface Props {
  texto: string;
  onClick: () => void;
  disabled?: boolean;
  // Lo que lee el lector de pantalla si el texto visible no basta.
  etiqueta?: string;
  // Con false queda el botón sin efectos (listas largas: cada luz es un lienzo animado).
  efectos?: boolean;
}

// Acción principal de una hoja o tarjeta con los efectos de React Bits del
// botón flotante: una luz que recorre el contorno (StarBorder) y un destello
// en las letras (ShinyText). Se carga con `lazy`; mientras llega, y siempre
// que esté desactivado, se ve el mismo botón sin efectos.
export function BotonPrincipal({ texto, onClick, disabled = false, etiqueta, efectos = true }: Props) {
  const plano = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={etiqueta}
      className={`${CLASES_BOTON_PRINCIPAL} bg-primary disabled:bg-black/10 disabled:text-black/40 disabled:active:scale-100 dark:disabled:bg-white/12 dark:disabled:text-white/40`}
    >
      {texto}
    </button>
  );
  if (!efectos || disabled) return plano;
  return (
    <Suspense fallback={plano}>
      <ConEfectos texto={texto} onClick={onClick} etiqueta={etiqueta} />
    </Suspense>
  );
}
