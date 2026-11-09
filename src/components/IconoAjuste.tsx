import type { ReactNode } from 'react';

interface Props {
  color: string;
  children: ReactNode;
}

// Cuadro de color con ícono blanco a la izquierda de cada ajuste, como en la
// app Ajustes de iOS: identifica la fila de un vistazo sin leerla.
export function IconoAjuste({ color, children }: Props) {
  return (
    <span
      className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] text-white"
      style={{ background: color }}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}
