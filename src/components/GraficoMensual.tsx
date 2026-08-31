import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatearMonto } from '../utils/fechas';
import './Graficos.css';

interface FilaMes {
  mes: string;
  ingresos: number;
  egresos: number;
}

export function GraficoMensual({ datos }: { datos: FilaMes[] }) {
  return (
    <div className="grafico-card">
      <h3 className="grafico-card__titulo">Ingresos vs. egresos</h3>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis
              dataKey="mes"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--chart-muted)', fontSize: 12 }}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: 'var(--surface-tertiary)' }}
              formatter={(value) => formatearMonto(Number(value))}
              contentStyle={{
                background: 'var(--surface-elevated)',
                color: 'var(--label)',
                borderRadius: 10,
                border: 'none',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                fontSize: 13,
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 13, color: 'var(--label-secondary)' }}
            />
            <Bar
              dataKey="ingresos"
              name="Ingresos"
              fill="var(--income)"
              radius={[4, 4, 0, 0]}
              barSize={16}
              isAnimationActive={false}
            />
            <Bar
              dataKey="egresos"
              name="Egresos"
              fill="var(--expense)"
              radius={[4, 4, 0, 0]}
              barSize={16}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
