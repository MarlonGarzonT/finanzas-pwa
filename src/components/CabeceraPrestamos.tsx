import { formatearMonto } from '../utils/fechas';
import type { ResumenPrestamos } from '../utils/prestamos';
import { MontoAnimado } from './MontoAnimado';
import { Segmentos, type Segmento } from './Segmentos';

interface Props {
  resumen: ResumenPrestamos;
}

// Lo primero que se lee en Préstamos: cuánta plata anda prestada. Debajo, en
// segmentos, cuántas personas deben, si alguna se pasó de fecha y cuánto ya
// volvió; y, cuando ya te han devuelto algo, una barra de cuánto de lo prestado
// ya regresó.
export function CabeceraPrestamos({ resumen }: Props) {
  const { pendiente, pendientes, vencidos, prestadoPendientes, devueltoPendientes } = resumen;
  const progreso = prestadoPendientes > 0 ? devueltoPendientes / prestadoPendientes : 0;

  const items: Segmento[] = [
    { etiqueta: pendientes === 1 ? 'Persona' : 'Personas', valor: String(pendientes) },
    { etiqueta: 'Se pasaron de fecha', valor: String(vencidos), tono: vencidos > 0 ? 'alerta' : 'normal' },
  ];
  if (devueltoPendientes > 0) items.push({ etiqueta: 'Ya te devolvieron', valor: formatearMonto(devueltoPendientes), tono: 'ingreso' });

  return (
    <section className="flex flex-col items-center gap-3 px-4 pt-1 pb-3 text-center lg:items-start lg:px-0 lg:pb-6 lg:text-left" aria-label="Lo que te deben">
      <div>
        <p className="m-0 text-[15px] text-secundario">Te deben en total</p>
        <p className="m-0 text-[48px] leading-[1.1] font-bold tracking-[-0.03em] cifras lg:text-[56px]">
          <MontoAnimado monto={pendiente} />
        </p>
      </div>

      {pendientes > 0 && (
        <div className="w-full max-w-md text-left">
          <Segmentos etiqueta="Resumen de lo que te deben" items={items} />
        </div>
      )}

      {devueltoPendientes > 0 && (
        <div
          role="progressbar"
          aria-label={`Te han devuelto ${formatearMonto(devueltoPendientes)} de ${formatearMonto(prestadoPendientes)}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progreso * 100)}
          className="h-2 w-full max-w-md overflow-hidden rounded-full bg-pista"
        >
          <div className="barra-progreso h-full origin-left rounded-full bg-ingreso-relleno" style={{ transform: `scaleX(${progreso})` }} />
        </div>
      )}
    </section>
  );
}
