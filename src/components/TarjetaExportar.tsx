import { Glass, Preloader } from 'konsta/react';
import type { ExportacionExcel } from '../data/useExportarExcel';
import { IconoCheck, IconoDescargar, IconoHojaCalculo } from './Iconos';

interface Props {
  excel: ExportacionExcel;
  movimientos: number;
}

function textos(excel: ExportacionExcel, movimientos: number): { titulo: string; detalle: string } {
  if (excel.exportando) return { titulo: 'Generando tu Excel…', detalle: 'Un momento, armando hojas y gráficos' };
  if (excel.listo) return { titulo: 'Excel descargado', detalle: 'Búscalo en tus descargas' };
  if (movimientos === 0) return { titulo: 'Exportar a Excel', detalle: 'Aún no hay movimientos para exportar' };
  return {
    titulo: 'Exportar a Excel',
    detalle: `${movimientos} ${movimientos === 1 ? 'movimiento' : 'movimientos'} con gráficos, en .xlsx`,
  };
}

// Botón de exportar como tarjeta de vidrio (Glass de Konsta, iOS 26). Detrás
// del vidrio hay un brillo verde Excel que el desenfoque refracta (recortado
// a la tarjeta para que no manche el fondo): así el vidrio tiene algo que
// mostrar y la tarjeta se distingue de las filas de ajustes. En reposo, la flecha baja cada pocos segundos y un destello cruza
// la tarjeta; mientras exporta gira el indicador y al terminar aparece ✓.
export function TarjetaExportar({ excel, movimientos }: Props) {
  const { titulo, detalle } = textos(excel, movimientos);
  const sinDatos = movimientos === 0;
  const enReposo = !excel.exportando && !excel.listo && !sinDatos;

  return (
    <div className="relative mx-4 overflow-hidden rounded-[26px] [transform:translateZ(0)]">
      <span
        className="pointer-events-none absolute top-1/2 left-2 size-24 -translate-y-1/2 rounded-full bg-[var(--verde-excel)] opacity-40 blur-2xl dark:opacity-50"
        aria-hidden="true"
      />
      <Glass
        // El vidrio de Konsta trae touch-action: none (pensado para barras
        // fijas); en una tarjeta dentro de la página bloquearía el scroll.
        style={{ touchAction: 'manipulation' }}
        className={`relative overflow-hidden rounded-[26px] transition-transform duration-200 ease-out has-[button:enabled:active]:scale-[0.98] ${
          enReposo ? 'boton-brillo' : ''
        } ${sinDatos ? 'opacity-60' : ''}`}
      >
        <button
          type="button"
          onClick={excel.exportar}
          disabled={excel.exportando || sinDatos}
          aria-busy={excel.exportando}
          className="flex min-h-[76px] w-full items-center gap-3.5 rounded-[26px] p-3.5 pr-4 text-left"
        >
          <span
            className="relative flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-[var(--verde-excel)] text-white shadow-[0_4px_12px_-2px_rgb(16_124_65/0.45)]"
            aria-hidden="true"
          >
            {excel.exportando ? (
              <Preloader className="size-6" colors={{ iconIos: 'text-white' }} />
            ) : excel.listo ? (
              <IconoCheck key="listo" className="seleccion-pop size-7" />
            ) : (
              <IconoHojaCalculo className="size-7" />
            )}
          </span>

          <span className="flex min-w-0 flex-1 flex-col gap-0.5" aria-live="polite">
            <span className="truncate text-[17px] leading-tight font-semibold">{titulo}</span>
            <span className="truncate text-[13px] leading-tight text-secundario">{detalle}</span>
          </span>

          {!excel.exportando && !excel.listo && (
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--verde-excel)]/12 text-[var(--verde-excel-texto)]"
              aria-hidden="true"
            >
              <IconoDescargar className={`size-5 ${enReposo ? 'exportar-flecha' : ''}`} />
            </span>
          )}
        </button>
      </Glass>
    </div>
  );
}
