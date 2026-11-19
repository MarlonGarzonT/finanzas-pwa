import { colorCategoria } from '../utils/colorCategoria';
import { iniciales } from '../utils/prestamos';

interface Props {
  persona: string;
  // Con el id del préstamo el color de la persona es siempre el mismo.
  id: string;
  grande?: boolean;
}

// Círculo con las iniciales de la persona sobre un tinte de su color, igual
// que el emoji de las categorías en las listas de movimientos.
export function AvatarPersona({ persona, id, grande = false }: Props) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${
        grande ? 'size-14 text-[20px]' : 'size-11 text-[16px]'
      }`}
      style={{ background: `color-mix(in srgb, ${colorCategoria(id)} 26%, transparent)` }}
      aria-hidden="true"
    >
      {iniciales(persona)}
    </span>
  );
}
