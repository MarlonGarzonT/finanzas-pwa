import type { ReactNode } from 'react';
import { SuperficieVidrio } from './SuperficieVidrio';
import type { TonoSegmento } from './Segmentos';

interface Props {
  titulo: string;
  // El dato que resume el panel, en una ficha a la derecha del título.
  ficha?: { etiqueta: string; valor: string; tono?: TonoSegmento };
  // Retraso de entrada (ms): los paneles aparecen en orden de lectura, de
  // izquierda a derecha, y así la vista sigue el recorrido en vez de saltar.
  retraso?: number;
  className?: string;
  children: ReactNode;
}

const COLOR_FICHA: Record<TonoSegmento, string> = {
  normal: '',
  intereses: 'text-intereses',
  alerta: 'text-alerta',
  ingreso: 'text-ingreso',
};

// Panel de vidrio del tablero: título arriba, la cifra que lo resume en una
// ficha y debajo el contenido (tabla o gráfica). Entra con un desvanecido
// corto, escalonado según `retraso` (solo opacity y transform).
export function PanelTablero({ titulo, ficha, retraso = 0, className = '', children }: Props) {
  return (
    <section className={`aparecer-suave ${className}`} style={{ animationDelay: `${retraso}ms` }} aria-label={titulo}>
      <SuperficieVidrio className="flex h-full flex-col p-5">
        <header className="mb-4 flex items-center justify-between gap-3">
          <h2 className="m-0 text-[18px] leading-tight font-semibold tracking-[-0.01em]">{titulo}</h2>
          {ficha && (
            <span className="flex shrink-0 items-baseline gap-1.5 rounded-full bg-black/[0.05] px-3.5 py-1.5 dark:bg-white/[0.08]">
              <span className="text-[13px] text-secundario">{ficha.etiqueta}</span>
              <span className={`text-[16px] font-bold cifras ${COLOR_FICHA[ficha.tono ?? 'normal']}`}>{ficha.valor}</span>
            </span>
          )}
        </header>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </SuperficieVidrio>
    </section>
  );
}
