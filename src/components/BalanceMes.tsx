import { Block } from 'konsta/react';
import { useEffect, useState } from 'react';
import type { EstadoGasto, ResumenMovimientos } from '../utils/estadisticasMes';
import { formatearMonto } from '../utils/fechas';
import { LineaApartes } from './LineaApartes';
import { MontoAnimado } from './MontoAnimado';

interface Props {
  resumen: ResumenMovimientos;
  periodo: string;
  cantidad: number;
}

interface Apariencia {
  etiqueta: string;
  claseEtiqueta: string;
}

// El estado siempre va en texto (etiqueta + frase), no solo en el color.
const APARIENCIA: Record<EstadoGasto, Apariencia> = {
  bien: { etiqueta: 'Vas bien', claseEtiqueta: 'bg-ingreso/15 text-ingreso' },
  atento: { etiqueta: 'Ojo', claseEtiqueta: 'bg-[var(--categoria-naranja)]/18 text-[#a85a00] dark:text-[#ffb340]' },
  excedido: { etiqueta: 'Te pasaste', claseEtiqueta: 'bg-alerta/15 text-alerta' },
  'sin-ingresos': { etiqueta: 'Sin ingresos', claseEtiqueta: 'bg-alerta/15 text-alerta' },
  'sin-movimientos': { etiqueta: 'Sin datos', claseEtiqueta: 'bg-pista text-secundario' },
};

function frase({ estado, proporcionGastada, neto }: ResumenMovimientos): string {
  const porcentaje = Math.round((proporcionGastada ?? 0) * 100);
  switch (estado) {
    case 'bien':
      return `Gastaste el ${porcentaje}% de lo que entró.`;
    case 'atento':
      return `Ya se fue el ${porcentaje}% de lo que entró.`;
    case 'excedido':
      return `Gastaste ${formatearMonto(Math.abs(neto))} más de lo que entró.`;
    case 'sin-ingresos':
      return 'Hay gastos pero ningún ingreso este mes.';
    case 'sin-movimientos':
      return 'No hay gastos ni ingresos este mes.';
  }
}

// Balance del mes al inicio de Reportes. Dos barras en la misma escala
// (Entró y Salió) responden de un vistazo si se gasta más de lo que entra:
// basta ver cuál es más larga. La frase y la etiqueta dicen lo mismo en texto.
export function BalanceMes({ resumen, periodo, cantidad }: Props) {
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const apariencia = APARIENCIA[resumen.estado];
  const escala = Math.max(resumen.ingresos, resumen.egresos, 1);
  const positivo = resumen.neto > 0;
  const negativo = resumen.neto < 0;
  const excedido = resumen.estado === 'excedido' || resumen.estado === 'sin-ingresos';

  const barras = [
    {
      etiqueta: 'Entró',
      monto: `+${formatearMonto(resumen.ingresos)}`,
      claseMonto: 'text-ingreso',
      valor: resumen.ingresos,
      color: 'var(--color-ingreso-relleno)',
    },
    {
      etiqueta: 'Salió',
      monto: `−${formatearMonto(resumen.egresos)}`,
      claseMonto: excedido ? 'text-alerta' : '',
      valor: resumen.egresos,
      // Gastar es lo normal (neutro); solo se pinta de alerta si superó lo que entró.
      color: excedido ? 'var(--color-alerta-relleno)' : 'var(--barra-neutra)',
    },
  ];

  return (
    <Block strong inset className="mt-4 mb-0 rounded-3xl p-4" aria-label={`Balance de ${periodo}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-[13px] font-medium text-secundario">
          {periodo} · {cantidad} movimiento{cantidad === 1 ? '' : 's'}
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[13px] font-semibold ${apariencia.claseEtiqueta}`}>
          {apariencia.etiqueta}
        </span>
      </div>

      <p
        className={`m-0 mt-1 text-[34px] leading-tight font-bold tracking-[-0.02em] cifras ${
          positivo ? 'text-ingreso' : negativo ? 'text-alerta' : ''
        }`}
      >
        <span className="sr-only">Balance: </span>
        <MontoAnimado monto={resumen.neto} signo={positivo ? '+' : negativo ? '−' : ''} intro />
      </p>
      <p className="m-0 mt-0.5 text-[15px] leading-snug text-secundario">{frase(resumen)}</p>
      {/* El ahorro y los préstamos no son gasto ni ingreso, pero sí mueven el
          balance: sin esta línea no cuadraría con las dos barras de abajo. */}
      <LineaApartes ahorro={resumen.ahorro} prestado={resumen.prestado} devuelto={resumen.devuelto} className="mt-0.5" />

      <div className="mt-4 flex flex-col gap-3" role="img" aria-label={`Entró ${formatearMonto(resumen.ingresos)}, salió ${formatearMonto(resumen.egresos)}`}>
        {barras.map((b, i) => (
          <div key={b.etiqueta} className="flex flex-col gap-1.5" aria-hidden="true">
            <div className="flex items-baseline justify-between text-[15px]">
              <span className="text-secundario">{b.etiqueta}</span>
              <span className={`font-semibold cifras ${b.claseMonto}`}>{b.monto}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-pista">
              <div
                className="h-full rounded-full transition-[width] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  width: montado ? `${(b.valor / escala) * 100}%` : '0%',
                  background: b.color,
                  transitionDelay: `${i * 120}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Block>
  );
}
