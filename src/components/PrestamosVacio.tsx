import { Block, Button } from 'konsta/react';
import type { ReactNode } from 'react';
import { IconoCampana, IconoCheck, IconoMas, IconoPerfil, IconoPrestamos } from './Iconos';

interface Props {
  onAgregar: () => void;
}

const BENEFICIOS: { icono: ReactNode; texto: string }[] = [
  { icono: <IconoPerfil className="size-[18px]" />, texto: 'Quién te debe y cuánto' },
  { icono: <IconoCheck className="size-[18px]" />, texto: 'Sus abonos, hasta saldar la deuda' },
  { icono: <IconoCampana className="size-[18px]" />, texto: 'Un aviso si se pasa la fecha' },
];

// Primera vez en Préstamos: en vez de un párrafo largo, qué gana la persona
// en tres líneas cortas y la acción para empezar a mano (el + sigue abajo).
export function PrestamosVacio({ onAgregar }: Props) {
  return (
    <Block strong inset className="rounded-3xl p-5">
      <span className="flex size-12 items-center justify-center rounded-[14px] bg-primary/12 text-primary" aria-hidden="true">
        <IconoPrestamos className="size-7" />
      </span>

      <h2 className="m-0 mt-4 text-[20px] leading-tight font-semibold tracking-[-0.01em]">Aún no registras préstamos</h2>
      <p className="m-0 mt-1.5 text-[15px] leading-snug text-secundario">
        Anota la plata que prestas y la app lleva la cuenta por ti.
      </p>

      <ul className="m-0 mt-5 flex list-none flex-col gap-3 p-0">
        {BENEFICIOS.map(({ icono, texto }) => (
          <li key={texto} className="flex items-center gap-3 text-[15px]">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-pista text-secundario"
              aria-hidden="true"
            >
              {icono}
            </span>
            {texto}
          </li>
        ))}
      </ul>

      <Button large rounded onClick={onAgregar} className="mt-6 gap-2 normal-case">
        <IconoMas className="size-5" />
        Registrar un préstamo
      </Button>
    </Block>
  );
}
