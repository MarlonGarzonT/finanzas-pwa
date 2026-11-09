import { useEffect, useState } from 'react';
import type { MesIngresosEgresos } from '../utils/estadisticasMes';
import { capitalizarPrimera, claveMesDeFecha, formatearMonto, formatearMontoCompacto, nombreMes } from '../utils/fechas';

interface Props {
  datos: MesIngresosEgresos[];
  seleccionado: Date;
  onSeleccionar: (mes: Date) => void;
}

// Últimos meses en columnas pareadas: entró (esmeralda) y salió (neutro,
// coral si superó lo que entró). Responde lo que una cifra sola no puede: si
// el mes va mejor o peor que los anteriores. Cada columna es un botón que
// abre ese mes en el resto de Reportes.
export function GraficoMensual({ datos, seleccionado, onSeleccionar }: Props) {
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const maximo = Math.max(1, ...datos.flatMap((d) => [d.ingresos, d.egresos]));
  const claveSeleccionada = claveMesDeFecha(seleccionado);
  const alto = (valor: number) => (montado && valor > 0 ? `${Math.max(4, (valor / maximo) * 100)}%` : '0%');

  return (
    <div>
      <div className="flex h-44 items-stretch gap-1.5">
        {datos.map((d, i) => {
          const activo = claveMesDeFecha(d.mes) === claveSeleccionada;
          const excedido = d.egresos > d.ingresos;
          const mesCorto = d.mes.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
          return (
            <button
              key={claveMesDeFecha(d.mes)}
              type="button"
              onClick={() => onSeleccionar(d.mes)}
              aria-pressed={activo}
              aria-label={`${capitalizarPrimera(nombreMes(d.mes))}: entró ${formatearMonto(d.ingresos)}, salió ${formatearMonto(d.egresos)}`}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-2xl px-1 pt-2 pb-1.5 transition-colors duration-200 active:scale-[0.97] ${
                activo ? 'bg-primary/10 dark:bg-primary/20' : ''
              }`}
            >
              <span className="flex w-full flex-1 items-end justify-center gap-1" aria-hidden="true">
                <span
                  className="w-2.5 rounded-full transition-[height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ height: alto(d.ingresos), background: 'var(--color-ingreso-relleno)', transitionDelay: `${i * 60}ms` }}
                />
                <span
                  className="w-2.5 rounded-full transition-[height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    height: alto(d.egresos),
                    background: excedido ? 'var(--color-alerta-relleno)' : 'var(--barra-neutra)',
                    transitionDelay: `${i * 60 + 40}ms`,
                  }}
                />
              </span>
              <span
                className={`text-[13px] leading-none capitalize ${activo ? 'font-semibold text-primary' : 'text-secundario'}`}
                aria-hidden="true"
              >
                {mesCorto}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-[13px] text-secundario" aria-hidden="true">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: 'var(--color-ingreso-relleno)' }} />
            Entró
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: 'var(--barra-neutra)' }} />
            Salió
          </span>
        </span>
        <span className="cifras">Máx. {formatearMontoCompacto(maximo)}</span>
      </div>
    </div>
  );
}
