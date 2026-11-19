import type { ReactNode } from 'react';

interface Paso {
  clave: string;
  titulo: string;
  contenido: ReactNode;
}

interface PropsPasos {
  paso: number;
  pasos: Paso[];
}

// Pasos de un flujo con la transición "push" de iOS: el que entra llega desde
// la derecha y el que sale se retira un poco a la izquierda (paralaje) y se
// desvanece; al volver atrás, al revés. Los pasos están siempre montados (lo
// escrito en uno no se pierde), pero solo el actual ocupa espacio, es visible
// y recibe foco o lector de pantalla. Solo se animan transform y opacity
// (reglas `.paso-deslizante` en index.css).
export function PasosDeslizantes({ paso, pasos }: PropsPasos) {
  return (
    <div className="pasos-deslizantes relative min-h-72 overflow-x-clip">
      {pasos.map((p, indice) => {
        const estado = indice === paso ? 'actual' : indice < paso ? 'anterior' : 'siguiente';
        return (
          <section
            key={p.clave}
            aria-label={p.titulo}
            className="paso-deslizante"
            data-estado={estado}
            inert={estado !== 'actual'}
          >
            {p.contenido}
          </section>
        );
      })}
    </div>
  );
}

interface PropsProgreso {
  paso: number;
  etiquetas: readonly string[];
}

// Una barra por paso. La del paso actual y las anteriores se llenan con
// scaleX (transform), con la misma curva que el deslizamiento.
export function ProgresoPasos({ paso, etiquetas }: PropsProgreso) {
  return (
    <div
      role="progressbar"
      aria-label="Progreso del movimiento"
      aria-valuemin={1}
      aria-valuemax={etiquetas.length}
      aria-valuenow={paso + 1}
      aria-valuetext={`Paso ${paso + 1} de ${etiquetas.length}: ${etiquetas[paso]}`}
      className="flex gap-1.5 px-4 pb-3"
    >
      {etiquetas.map((etiqueta, indice) => (
        <span key={etiqueta} className="relative h-1 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
          <span
            className="progreso-paso absolute inset-0 origin-left rounded-full bg-primary"
            style={{ transform: `scaleX(${indice <= paso ? 1 : 0})` }}
          />
        </span>
      ))}
    </div>
  );
}
