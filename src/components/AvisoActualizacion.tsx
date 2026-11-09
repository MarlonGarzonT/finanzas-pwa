import { Button, Glass } from 'konsta/react';
import { useEffect, useState } from 'react';
import { useActualizacionApp } from '../data/useActualizacionApp';
import { IconoCerrar, IconoFlechaArriba, IconoRecargar } from './Iconos';

const DURACION_SALIDA_MS = 280;

// Cápsula de vidrio que baja desde arriba (como la isla dinámica) cuando hay
// una versión nueva lista. No bloquea nada: se puede seguir usando la app y
// actualizar cuando convenga, o descartarla hasta la próxima vez que se abra.
export function AvisoActualizacion() {
  const { hayVersionNueva, actualizando, actualizar, descartar } = useActualizacionApp();
  const [montado, setMontado] = useState(hayVersionNueva);

  // Se queda montado mientras corre la animación de salida.
  if (hayVersionNueva && !montado) setMontado(true);
  useEffect(() => {
    if (hayVersionNueva || !montado) return;
    const id = window.setTimeout(() => setMontado(false), DURACION_SALIDA_MS);
    return () => window.clearTimeout(id);
  }, [hayVersionNueva, montado]);

  if (!montado) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-3 pt-[calc(var(--k-safe-area-top)+8px)]">
      <Glass
        className={`pointer-events-auto flex w-full max-w-md items-center gap-2.5 rounded-[28px] py-2 pr-1 pl-2 ${
          hayVersionNueva ? 'aviso-entra' : 'aviso-sale'
        }`}
        role="status"
        aria-live="polite"
      >
        <span className="relative flex size-10 shrink-0 items-center justify-center" aria-hidden="true">
          {!actualizando && <span className="aviso-halo absolute inset-0 rounded-full bg-primary" />}
          <span className="relative flex size-10 items-center justify-center rounded-full bg-primary text-white">
            {actualizando ? (
              <IconoRecargar className="aviso-girar size-5" />
            ) : (
              <IconoFlechaArriba className="aviso-flotar size-5" />
            )}
          </span>
        </span>

        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[15px] leading-tight font-semibold">
            {actualizando ? 'Actualizando…' : 'Nueva versión'}
          </span>
          <span className="truncate text-[13px] leading-tight text-secundario">
            {actualizando ? 'Un momento' : 'Lista para instalar'}
          </span>
        </span>

        {/* Mientras actualiza, el texto ya lo dice: los botones sobran. */}
        {!actualizando && (
          <Button
            rounded
            inline
            onClick={actualizar}
            className="boton-brillo h-10 shrink-0 px-4 text-[15px] font-semibold normal-case"
          >
            Actualizar
          </Button>
        )}

        {!actualizando && (
          <Button
            clear
            rounded
            inline
            onClick={descartar}
            aria-label="Ahora no"
            className="size-11 shrink-0 p-0 text-black/45 dark:text-white/50"
          >
            <IconoCerrar className="size-4" />
          </Button>
        )}
      </Glass>
    </div>
  );
}
