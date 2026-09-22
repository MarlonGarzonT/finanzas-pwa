import { useEffect, useState } from 'react';
import type { SegmentoCategoria } from '../utils/estadisticasMes';
import { colorCategoria } from '../utils/colorCategoria';
import { formatearMonto } from '../utils/fechas';
import { useContarHasta } from './useContarHasta';
import './DonaCategorias.css';

const RADIO = 58;
const GROSOR = 20;
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
    return <p className="grafico-card__vacio">Nada que mostrar todavía.</p>;
  }

  const montoResto = segmentos.slice(6).reduce((acc, s) => acc + s.monto, 0);
  const visibles: { id: string; nombre: string; emoji: string; monto: number; color: string }[] = segmentos
    .slice(0, 6)
    .map((s) => ({ id: s.categoriaId, nombre: s.nombre, emoji: s.emoji, monto: s.monto, color: colorCategoria(s.categoriaId) }));
  if (montoResto > 0) {
    visibles.push({ id: '__resto', nombre: 'Otras', emoji: '🔹', monto: montoResto, color: 'var(--label-tertiary)' });
  }

  // Posición (fracción acumulada) donde empieza cada arco, calculada sin
  // mutar nada durante el render.
  const inicios = visibles.reduce<number[]>((acc, _s, i) => {
    const anterior = i === 0 ? 0 : acc[i - 1] + (total > 0 ? visibles[i - 1].monto / total : 0);
    acc.push(anterior);
    return acc;
  }, []);

  return (
    <div className="dona-categorias">
      <div className="dona-categorias__grafico">
        <svg width={TAMANO} height={TAMANO} viewBox={`0 0 ${TAMANO} ${TAMANO}`}>
          <circle cx={TAMANO / 2} cy={TAMANO / 2} r={RADIO} fill="none" stroke="var(--surface-tertiary)" strokeWidth={GROSOR} />
          {visibles.map((s, i) => {
            const frac = total > 0 ? s.monto / total : 0;
            const dash = montado ? frac * CIRCUNFERENCIA : 0;
            const offset = -inicios[i] * CIRCUNFERENCIA;
            return (
              <circle
                key={s.id}
                cx={TAMANO / 2}
                cy={TAMANO / 2}
                r={RADIO}
                fill="none"
                stroke={s.color}
                strokeWidth={GROSOR}
                strokeDasharray={`${dash} ${CIRCUNFERENCIA}`}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${TAMANO / 2} ${TAMANO / 2})`}
                className="dona-categorias__segmento"
                style={{ transitionDelay: `${i * 70}ms` }}
              />
            );
          })}
        </svg>
        <div className="dona-categorias__centro">
          <span className="dona-categorias__total">{formatearMonto(totalAnimado)}</span>
        </div>
      </div>

      <ul className="dona-categorias__leyenda">
        {visibles.map((s, i) => (
          <li key={s.id} className="dona-categorias__item" style={{ transitionDelay: `${i * 60}ms` }}>
            <span className="dona-categorias__punto" style={{ background: s.color }} aria-hidden />
            <span aria-hidden>{s.emoji}</span>
            <span className="dona-categorias__nombre">{s.nombre}</span>
            <span className="dona-categorias__porcentaje">{total > 0 ? Math.round((s.monto / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
