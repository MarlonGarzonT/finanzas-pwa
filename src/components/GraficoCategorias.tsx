import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatearMontoConSigno } from '../utils/fechas';
import './Graficos.css';

interface Fila {
  categoria: string;
  neto: number;
}

function colorNeto(neto: number): string {
  if (neto > 0) return 'var(--income)';
  if (neto < 0) return 'var(--expense)';
  return 'var(--chart-muted)';
}

export function GraficoCategorias({ datos }: { datos: Fila[] }) {
  if (datos.length === 0) {
    return (
      <div className="grafico-card">
        <h3 className="grafico-card__titulo">Movimientos del mes por categoría</h3>
        <p className="grafico-card__vacio">Aún no registras movimientos este mes.</p>
      </div>
    );
  }

  const ordenados = [...datos]
    .sort((a, b) => Math.abs(b.neto) - Math.abs(a.neto))
    .slice(0, 7)
    .map((fila) => ({ ...fila, magnitud: Math.abs(fila.neto) }));
  const alto = Math.max(160, ordenados.length * 42);
  const nombreMasLargo = Math.max(...ordenados.map((f) => f.categoria.length));
  const anchoEje = Math.min(132, Math.max(76, nombreMasLargo * 6.5 + 16));

  return (
    <div className="grafico-card">
      <h3 className="grafico-card__titulo">Movimientos del mes por categoría</h3>
      <div style={{ width: '100%', height: alto }}>
        <ResponsiveContainer>
          <BarChart data={ordenados} layout="vertical" margin={{ top: 4, right: 48, left: 0, bottom: 4 }}>
            <XAxis type="number" hide domain={[0, (max: number) => Math.ceil(max * 1.25)]} />
            <YAxis
              type="category"
              dataKey="categoria"
              width={anchoEje}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--chart-muted)', fontSize: 12.5 }}
            />
            <Tooltip
              cursor={{ fill: 'var(--surface-tertiary)' }}
              formatter={(_value, _name, entry) => formatearMontoConSigno(Number(entry?.payload?.neto ?? 0))}
              contentStyle={{
                background: 'var(--surface-elevated)',
                color: 'var(--label)',
                borderRadius: 10,
                border: 'none',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                fontSize: 13,
              }}
            />
            <Bar dataKey="magnitud" radius={[0, 4, 4, 0]} barSize={18} maxBarSize={18} isAnimationActive={false}>
              {ordenados.map((fila) => (
                <Cell key={fila.categoria} fill={colorNeto(fila.neto)} />
              ))}
              <LabelList
                dataKey="neto"
                position="right"
                fill="var(--label-secondary)"
                fontSize={12}
                formatter={(value: unknown) => formatearMontoConSigno(Number(value))}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
