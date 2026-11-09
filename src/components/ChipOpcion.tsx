import { Chip } from 'konsta/react';
import type { ReactNode } from 'react';

interface Props {
  activo: boolean;
  onClick: () => void;
  children: ReactNode;
  media?: ReactNode;
  onQuitar?: () => void;
}

// Chip seleccionable sobre el Chip de Konsta. Se ve de 36px para no
// recargar la fila, pero el área táctil se extiende con un pseudo-elemento
// hasta 44px (mitad del espacio entre filas arriba y abajo).
export function ChipOpcion({ activo, onClick, children, media, onQuitar }: Props) {
  return (
    <Chip
      component="button"
      role="button"
      aria-pressed={activo}
      onClick={onClick}
      media={media}
      deleteButton={Boolean(onQuitar)}
      onDelete={(e: React.MouseEvent) => {
        e.stopPropagation();
        onQuitar?.();
      }}
      className="relative h-9 shrink-0 cursor-pointer gap-1 px-3.5 text-[15px] transition-colors duration-150 before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] active:opacity-60"
      colors={
        activo
          ? { fillBgIos: 'bg-primary dark:bg-primary', fillTextIos: 'text-white font-semibold' }
          : { fillBgIos: 'bg-black/[0.06] dark:bg-white/12', fillTextIos: 'text-black dark:text-white' }
      }
    >
      {children}
    </Chip>
  );
}
