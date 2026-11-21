import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { formatearMonto } from '../utils/fechas';
import type { Reparto } from '../utils/tablero';
import { CORAL, VERDE } from './GraficosTablero';
import { MontoAnimado } from './MontoAnimado';
import { Segmentos } from './Segmentos';

interface Props {
  reparto: Reparto;
}

function porcentaje(fraccion: number): string {
  return `${Math.round(fraccion * 100)} %`;
}

// "Ingresos ahorrados" del Excel: de todo lo que entró este mes, qué parte
// quedó (menta) y qué parte se fue en gastos (coral). En el centro, lo que
// quedó en pesos, con los dígitos que ruedan; si se gastó más de lo que entró
// el centro dice cuánto faltó y la dona queda toda en coral.
export function DonaAhorroTablero({ reparto }: Props) {
  const sinIngresos = reparto.ingresos <= 0;
  const datos = sinIngresos
    ? [{ nombre: 'Sin ingresos', valor: 1, color: 'rgb(140 140 150 / 0.3)' }]
    : [
        { nombre: 'Te quedó', valor: reparto.fraccionQuedo, color: VERDE },
        { nombre: 'Gastaste', valor: reparto.fraccionGasto, color: CORAL },
      ].filter((d) => d.valor > 0);
  const reducir = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="my-auto">
      <div className="relative mx-auto h-[220px] max-w-[300px]" role="img" aria-label={`De lo que entró, ${porcentaje(reparto.fraccionQuedo)} te quedó y ${porcentaje(reparto.fraccionGasto)} se gastó`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={datos} dataKey="valor" nameKey="nombre" innerRadius="68%" outerRadius="96%" startAngle={90} endAngle={-270} paddingAngle={datos.length > 1 ? 3 : 0} cornerRadius={8} stroke="none" isAnimationActive={!reducir}>
              {datos.map((d) => (
                <Cell key={d.nombre} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[13px] text-secundario">{reparto.enRojo ? 'Te faltó' : 'Te quedó'}</span>
          <span className={`text-[26px] leading-tight font-bold tracking-[-0.02em] cifras ${reparto.enRojo ? 'text-alerta' : ''}`}>
            <MontoAnimado monto={Math.abs(reparto.quedo)} signo={reparto.enRojo ? '−' : ''} />
          </span>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <Segmentos
          etiqueta="Reparto de lo que entró"
          items={[
            { etiqueta: 'Te quedó', valor: sinIngresos ? '—' : porcentaje(reparto.fraccionQuedo), tono: 'ingreso' },
            { etiqueta: 'Gastaste', valor: sinIngresos ? '—' : porcentaje(reparto.fraccionGasto), tono: 'intereses' },
          ]}
        />
        <Segmentos
          items={[
            { etiqueta: 'Entró', valor: formatearMonto(Math.round(reparto.ingresos)) },
            { etiqueta: 'Salió', valor: formatearMonto(Math.round(reparto.gastos)) },
          ]}
        />
      </div>
    </div>
  );
}
