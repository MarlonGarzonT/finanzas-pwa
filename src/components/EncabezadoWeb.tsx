import type { ReactNode } from 'react';

interface Props {
  titulo: string;
  // Controles de la pantalla (periodo, filtros, el botón de crear), a la derecha.
  acciones?: ReactNode;
}

// Encabezado de las pantallas en escritorio: título grande a la izquierda y las
// acciones de la pantalla a la derecha. En el celular no existe (ahí manda la
// barra superior de Konsta, con el título centrado).
export function EncabezadoWeb({ titulo, acciones }: Props) {
  return (
    <header className="mx-auto hidden w-full max-w-[1480px] items-end justify-between gap-6 px-8 pt-8 pb-6 lg:flex">
      <h1 className="m-0 text-[36px] leading-none font-bold tracking-[-0.03em]">{titulo}</h1>
      {acciones && <div className="flex items-center gap-3">{acciones}</div>}
    </header>
  );
}
