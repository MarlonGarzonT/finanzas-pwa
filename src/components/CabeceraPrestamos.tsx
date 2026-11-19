import { formatearMonto } from '../utils/fechas';
import type { ResumenPrestamos } from '../utils/prestamos';
import { MontoAnimado } from './MontoAnimado';

interface Props {
  resumen: ResumenPrestamos;
}

// Lo primero que se lee en Préstamos: cuánta plata anda prestada. Debajo, en
// palabras, cuántos préstamos hay y si alguno se pasó de fecha; y, cuando ya
// te han devuelto algo, una barra de cuánto de lo prestado ya volvió.
export function CabeceraPrestamos({ resumen }: Props) {
  const { pendiente, pendientes, vencidos, prestadoPendientes, devueltoPendientes } = resumen;
  const progreso = prestadoPendientes > 0 ? devueltoPendientes / prestadoPendientes : 0;
  return (
    <section className="flex flex-col items-center gap-0.5 px-4 pt-1 pb-3 text-center" aria-label="Lo que te deben">
      <span className="text-[15px] font-medium text-secundario">Plata que tienes prestada</span>
      <p className="m-0 text-[48px] leading-[1.1] font-bold tracking-[-0.03em] cifras">
        <MontoAnimado monto={pendiente} />
      </p>
      <p className="m-0 text-[15px] text-secundario">
        {pendientes === 0
          ? 'Nadie te debe plata. Todo está al día.'
          : `${pendientes} ${pendientes === 1 ? 'persona te debe' : 'personas te deben'}`}
        {vencidos > 0 && (
          <span className="font-medium text-alerta">
            {' · '}
            {vencidos} {vencidos === 1 ? 'se pasó de fecha' : 'se pasaron de fecha'}
          </span>
        )}
      </p>

      {devueltoPendientes > 0 && (
        <div className="mt-4 flex w-full max-w-sm flex-col gap-1.5">
          <div
            role="progressbar"
            aria-label={`Te han devuelto ${formatearMonto(devueltoPendientes)} de ${formatearMonto(prestadoPendientes)}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progreso * 100)}
            className="h-2 overflow-hidden rounded-full bg-pista"
          >
            <div
              className="barra-progreso h-full origin-left rounded-full bg-ingreso-relleno"
              style={{ transform: `scaleX(${progreso})` }}
            />
          </div>
          <p className="m-0 text-[13px] text-secundario">
            Te han devuelto <span className="font-semibold text-ingreso cifras">{formatearMonto(devueltoPendientes)}</span> de{' '}
            <span className="cifras">{formatearMonto(prestadoPendientes)}</span>
          </p>
        </div>
      )}
    </section>
  );
}
