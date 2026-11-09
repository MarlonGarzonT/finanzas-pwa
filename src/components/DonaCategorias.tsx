import { useEffect, useState } from 'react';
import type { SegmentoCategoria } from '../utils/estadisticasMes';
import { colorCategoria } from '../utils/colorCategoria';
import { formatearMonto } from '../utils/fechas';
import { useContarHasta } from './useContarHasta';

const RADIO = 54;
const GROSOR = 18;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;
const TAMANO = (RADIO + GROSOR) * 2;

interface Props {
  segmentos: SegmentoCategoria[];
  total: number;
}

export function DonaCategorias({ segmentos, total }: Props) {
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const totalAnimado = useContarHasta(montado ? total : 0);

  if (segmentos.length === 0) {
    return <p className="m-0 py-6 text-center text-[15px] text-secundario">Nada que mostrar en este mes todavía.</p>;
  }

  const montoResto = segmentos.slice(6).reduce((acc, s) => acc + s.monto, 0);
  const visibles: { id: string; nombre: string; emoji: string; monto: number; color: string }[] = segmentos
    .slice(0, 6)
    .map((s) => ({ id: s.categoriaId, nombre: s.nombre, emoji: s.emoji, monto: s.monto, color: colorCategoria(s.categoriaId) }));
  if (montoResto > 0) {
    visibles.push({ id: '__resto', nombre: 'Otras', emoji: '', monto: montoResto, color: 'var(--color-pista)' });
  }

  // Posición (fracción acumulada) donde empieza cada arco, calculada sin
  // mutar nada durante el render.
  const inicios = visibles.reduce<number[]>((acc, _s, i) => {
    const anterior = i === 0 ? 0 : acc[i - 1] + (total > 0 ? visibles[i - 1].monto / total : 0);
    acc.push(anterior);
    return acc;
  }, []);

  const porcentaje = (monto: number) => (total > 0 ? Math.round((monto / total) * 100) : 0);

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex shrink-0 items-center justify-center" aria-hidden="true">
        <svg width={TAMANO} height={TAMANO} viewBox={`0 0 ${TAMANO} ${TAMANO}`}>
          <circle cx={TAMANO / 2} cy={TAMANO / 2} r={RADIO} fill="none" stroke="var(--color-pista)" strokeWidth={GROSOR} />
          {visibles.map((s, i) => {
            const frac = total > 0 ? s.monto / total : 0;
            return (
              <circle
                key={s.id}
                cx={TAMANO / 2}
                cy={TAMANO / 2}
                r={RADIO}
                fill="none"
                stroke={s.color}
                strokeWidth={GROSOR}
                strokeDasharray={`${montado ? frac * CIRCUNFERENCIA : 0} ${CIRCUNFERENCIA}`}
                strokeDashoffset={-inicios[i] * CIRCUNFERENCIA}
                transform={`rotate(-90 ${TAMANO / 2} ${TAMANO / 2})`}
                className="transition-[stroke-dasharray] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ transitionDelay: `${i * 70}ms` }}
              />
            );
          })}
        </svg>
        <span className="absolute inset-0 flex items-center justify-center px-6 text-center text-[15px] font-bold cifras">
          {formatearMonto(totalAnimado)}
        </span>
      </div>

      <ul className="m-0 flex min-w-0 flex-1 list-none flex-col gap-2 p-0">
        <li className="sr-only">Total {formatearMonto(total)}</li>
        {visibles.map((s, i) => (
          <li
            key={s.id}
            className="aparecer-suave flex items-center gap-1.5 text-[15px]"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden="true" />
            {s.emoji && <span aria-hidden="true">{s.emoji}</span>}
            <span className="min-w-0 flex-1 truncate">{s.nombre}</span>
            <span className="shrink-0 font-semibold text-secundario cifras">{porcentaje(s.monto)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
