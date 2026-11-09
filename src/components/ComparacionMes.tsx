import { formatearMonto } from '../utils/fechas';
import { IconoTendencia } from './Iconos';

interface Props {
  comparacion: { actual: number; anterior: number; deltaPorcentaje: number } | null;
  proyeccion: number | null;
}

export function ComparacionMes({ comparacion, proyeccion }: Props) {
  if (!comparacion && proyeccion === null) {
    return <p className="m-0 px-2 text-center text-[15px] text-secundario">Aún no hay historial suficiente para comparar.</p>;
  }

  const sube = comparacion ? comparacion.deltaPorcentaje > 0 : false;

  return (
    <div className="flex flex-col divide-y divide-black/10 dark:divide-white/10">
      {comparacion && (
        <div className="flex flex-col items-center gap-0.5 px-1 py-2 text-center">
          <span className={`flex items-center gap-1 text-[22px] leading-tight font-bold cifras ${sube ? 'text-alerta' : 'text-ingreso'}`}>
            <IconoTendencia sube={sube} className="size-5" />
            {Math.abs(Math.round(comparacion.deltaPorcentaje))}%
          </span>
          <span className="text-[13px] leading-snug text-secundario">
            {sube ? 'más' : 'menos'} gasto que el mes pasado
          </span>
        </div>
      )}
      {proyeccion !== null && (
        <div className="flex flex-col items-center gap-0.5 px-1 py-2 text-center">
          <span className="text-[17px] leading-tight font-bold cifras">{formatearMonto(proyeccion)}</span>
          <span className="text-[13px] leading-snug text-secundario">de gasto proyectado al cierre del mes</span>
        </div>
      )}
    </div>
  );
}
