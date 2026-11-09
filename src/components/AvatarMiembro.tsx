import { colorCategoria } from '../utils/colorCategoria';

interface Props {
  id: string;
  nombre: string;
  tamano?: 'sm' | 'md' | 'lg';
}

const TAMANOS = {
  sm: 'size-7 text-xs',
  md: 'size-9 text-sm',
  lg: 'size-12 text-lg',
};

// Inicial sobre un tinte del color de la persona: con texto blanco sobre el
// color pleno, los tonos claros de la paleta (amarillo, menta) no llegaban
// al contraste mínimo.
export function AvatarMiembro({ id, nombre, tamano = 'md' }: Props) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-black/80 dark:text-white/90 ${TAMANOS[tamano]}`}
      style={{ background: `color-mix(in srgb, ${colorCategoria(id)} 35%, transparent)` }}
      aria-hidden="true"
    >
      {nombre.slice(0, 1).toUpperCase()}
    </span>
  );
}
