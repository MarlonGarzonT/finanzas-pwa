import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatearMonto } from '../utils/fechas';
import './Graficos.css';

interface Fila {
  categoria: string;
  total: number;
}

export function GraficoCategorias({ datos }: { datos: Fila[] }) {
  if (datos.length === 0) {
    return (
      <div className="grafico-card">
        <h3 className="grafico-card__titulo">Gastos del mes por categoría</h3>
        <p className="grafico-card__vacio">Aún no registras egresos este mes.</p>
      </div>
    );
  }

  const ordenados = [...datos].sort((a, b) => b.total - a.total).slice(0, 7);
  const alto = Math.max(160, ordenados.length * 42);

  return (
    <div className="grafico-card">
      <h3 className="grafico-card__titulo">Gastos del mes por categoría</h3>
      <div style={{ width: '100%', height: alto }}>
        <ResponsiveContainer>
          <BarChart data={ordenados} layout="vertical" margin={{ top: 4, right: 44, left: 0, bottom: 4 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="categoria"
              width={104}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--chart-muted)', fontSize: 13 }}
            />
            <Tooltip
              cursor={{ fill: 'var(--color-gray-fill)' }}
              formatter={(value) => formatearMonto(Number(value))}
              contentStyle={{
                borderRadius: 10,
                border: 'none',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                fontSize: 13,
              }}
            />
            <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={18} maxBarSize={18} isAnimationActive={false}>
              {ordenados.map((fila) => (
                <Cell key={fila.categoria} fill="var(--chart-blue)" />
              ))}
              <LabelList
                dataKey="total"
                position="right"
                fill="var(--text-secondary)"
                fontSize={12}
                formatter={(value: unknown) => formatearMonto(Number(value))}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
