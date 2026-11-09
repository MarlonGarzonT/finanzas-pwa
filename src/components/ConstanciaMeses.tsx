import { Block } from 'konsta/react';
import { useEffect, useState } from 'react';
import type { MesActividad, Racha } from '../utils/antiguedad';
import { claveMesDeFecha } from '../utils/fechas';

interface Props {
  constancia: MesActividad[];
  racha: Racha;
  movimientos: number;
  mesesRegistrados: number;
}

function mesCorto(fecha: Date): string {
  return fecha.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
}

function mesLargo(fecha: Date): string {
  return fecha.toLocaleDateString('es-CO', { month: 'long' });
}

function fraseRacha({ meses, desde }: Racha): string {
  if (meses === 0 || !desde) return 'Registra un movimiento para empezar tu racha.';
  if (meses === 1) return 'Este mes ya cuenta. Registra el próximo para sumar.';
  return `Sin fallar un mes desde ${mesLargo(desde)}${desde.getFullYear() !== new Date().getFullYear() ? ` de ${desde.getFullYear()}` : ''}.`;
}

// Constancia de los últimos meses: la racha en grande y una barra por mes con
// cuántos movimientos se registraron. Las barras crecen con scaleY (solo
// transform) y el mes actual va en el color de acento.
export function ConstanciaMeses({ constancia, racha, movimientos, mesesRegistrados }: Props) {
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const maximo = Math.max(1, ...constancia.map((m) => m.movimientos));
  const actual = constancia.at(-1)?.mes;
  const promedio = mesesRegistrados ? Math.round(movimientos / mesesRegistrados) : 0;
  const descripcion = constancia.map((m) => `${mesLargo(m.mes)}: ${m.movimientos}`).join(', ');

  return (
    <Block strong inset className="rounded-3xl p-4">
      <p className="m-0 flex items-baseline gap-1.5 leading-none">
        <span className="text-[34px] font-bold tracking-[-0.02em] cifras">{racha.meses}</span>
        <span className="text-[17px] font-semibold">{racha.meses === 1 ? 'mes' : 'meses'} de racha</span>
      </p>
      <p className="m-0 mt-1.5 text-[13px] leading-snug text-secundario">{fraseRacha(racha)}</p>

      {movimientos > 0 && (
        <div className="mt-5 flex items-end gap-2" role="img" aria-label={`Movimientos por mes: ${descripcion}`}>
          {constancia.map((m, i) => {
            const esActual = actual && claveMesDeFecha(m.mes) === claveMesDeFecha(actual);
            const vacio = m.movimientos === 0;
            return (
              <div key={claveMesDeFecha(m.mes)} className="flex min-w-0 flex-1 flex-col items-center gap-1.5" aria-hidden="true">
                <span className={`text-[12px] cifras ${vacio ? 'text-secundario' : 'font-semibold'}`}>{m.movimientos}</span>
                <div className="flex h-20 w-full max-w-11 items-end">
                  {vacio ? (
                    <div className="h-1 w-full rounded-full bg-pista" />
                  ) : (
                    <div
                      className={`h-full w-full origin-bottom rounded-[8px] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        esActual ? 'bg-primary' : 'bg-primary/35 dark:bg-primary/45'
                      }`}
                      style={{
                        transform: `scaleY(${montado ? Math.max(0.08, m.movimientos / maximo) : 0})`,
                        transitionDelay: `${i * 60}ms`,
                      }}
                    />
                  )}
                </div>
                <span className={`text-[13px] ${esActual ? 'font-semibold text-primary' : 'text-secundario'}`}>{mesCorto(m.mes)}</span>
              </div>
            );
          })}
        </div>
      )}

      {movimientos > 0 && (
        <p className="m-0 mt-4 border-t border-black/[0.06] pt-3 text-[13px] leading-snug text-secundario dark:border-white/10">
          <span className="font-semibold text-black dark:text-white cifras">{movimientos}</span>{' '}
          {movimientos === 1 ? 'movimiento' : 'movimientos'} en total
          {promedio > 0 && (
            <>
              {' · '}
              <span className="cifras">{promedio}</span> al mes en promedio
            </>
          )}
        </p>
      )}
    </Block>
  );
}
