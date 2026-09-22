import { formatearMonto } from '../utils/fechas';
import './ComparacionMes.css';

interface Props {
  comparacion: { actual: number; anterior: number; deltaPorcentaje: number } | null;
  proyeccion: number | null;
}

export function ComparacionMes({ comparacion, proyeccion }: Props) {
  if (!comparacion && proyeccion === null) {
    return <p className="grafico-card__vacio">Aún no hay suficiente historial para comparar.</p>;
  }

  return (
    <div className="comparacion-mes">
      {comparacion && (
        <div className={`comparacion-mes__tarjeta ${comparacion.deltaPorcentaje > 0 ? 'comparacion-mes__tarjeta--sube' : 'comparacion-mes__tarjeta--baja'}`}>
          <span className="comparacion-mes__flecha">{comparacion.deltaPorcentaje > 0 ? '▲' : '▼'}</span>
          <span className="comparacion-mes__numero">{Math.abs(Math.round(comparacion.deltaPorcentaje))}%</span>
          <span className="comparacion-mes__detalle">
            {comparacion.deltaPorcentaje > 0 ? 'más' : 'menos'} que el mes pasado
          </span>
        </div>
      )}
      {proyeccion !== null && (
        <div className="comparacion-mes__tarjeta comparacion-mes__tarjeta--proyeccion">
          <span className="comparacion-mes__flecha" aria-hidden>
            🔮
          </span>
          <span className="comparacion-mes__numero">{formatearMonto(proyeccion)}</span>
          <span className="comparacion-mes__detalle">proyectados a fin de mes</span>
        </div>
      )}
    </div>
  );
}
