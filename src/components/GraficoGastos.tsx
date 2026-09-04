import { useEffect, useState } from 'react';
import { formatearMontoCompacto } from '../utils/fechas';
import './Graficos.css';

interface Fila {
  categoria: string;
  emoji: string;
  monto: number;
}

interface Props {
  datos: Fila[];
  mensajeVacio?: string;
}

export function GraficoGastos({ datos, mensajeVacio = 'Aún no registras gastos este mes.' }: Props) {
  // Las barras arrancan en 0 y crecen a su alto real tras montar, para que
  // el gráfico "aparezca" animado en vez de dibujarse ya completo.
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (datos.length === 0) {
    return <p className="gastos-barras__vacio">{mensajeVacio}</p>;
  }

  const max = Math.max(...datos.map((d) => d.monto));

  return (
    <div className="gastos-barras">
      {datos.map((d) => (
        <div key={d.categoria} className="gastos-barras__col">
          <div className="gastos-barras__pista">
            <div
              className="gastos-barras__barra"
              style={{ height: montado ? `${Math.max(6, (d.monto / max) * 100)}%` : '0%' }}
            />
          </div>
          <span className="gastos-barras__emoji" aria-hidden>
            {d.emoji}
          </span>
          <span className="gastos-barras__monto">{formatearMontoCompacto(d.monto)}</span>
        </div>
      ))}
    </div>
  );
}
