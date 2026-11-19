import { formatearMonto } from '../utils/fechas';
import { describirVencimiento, type EstadoPrestamo, type TonoVencimiento } from '../utils/prestamos';
import { AvatarPersona } from './AvatarPersona';
import { IconoCheck } from './Iconos';

interface Props {
  prestamo: EstadoPrestamo;
  onAbrir: (prestamo: EstadoPrestamo) => void;
  onRegistrarPago: (prestamo: EstadoPrestamo) => void;
}

// El estado se dice con palabras y un punto; el color solo lo refuerza.
const COLOR_ESTADO: Record<TonoVencimiento, string> = {
  tranquilo: 'text-secundario',
  pronto: 'text-black/75 dark:text-white/80',
  vencido: 'font-medium text-alerta',
  pagado: 'text-secundario',
};

const COLOR_PUNTO: Record<TonoVencimiento, string> = {
  tranquilo: 'bg-black/25 dark:bg-white/30',
  pronto: 'bg-primary',
  vencido: 'bg-alerta',
  pagado: 'bg-ingreso',
};

// Una persona que te debe: quién es, cuánto falta, para cuándo y cuánto ya
// pagó. Toda la parte de arriba abre el detalle; la acción más común (anotar
// que te pagaron) está a la vista abajo, sin tener que buscarla.
export function TarjetaPrestamo({ prestamo: p, onAbrir, onRegistrarPago }: Props) {
  const { texto, tono } = describirVencimiento(p);
  const progreso = p.monto > 0 ? p.abonado / p.monto : 0;
  return (
    <li className="overflow-hidden rounded-[20px] bg-ios-light-surface-1 dark:bg-ios-dark-surface-1">
      <button
        type="button"
        onClick={() => onAbrir(p)}
        aria-label={
          p.pagado
            ? `${p.persona}, te pagó ${formatearMonto(p.monto)}. Ver detalle`
            : `${p.persona}, te debe ${formatearMonto(p.saldo)}. ${texto}. Ver detalle`
        }
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-black/5 dark:active:bg-white/8"
      >
        <AvatarPersona persona={p.persona} id={p.id} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] font-semibold">{p.persona}</span>
          <span className={`mt-0.5 flex items-center gap-1.5 text-[14px] ${COLOR_ESTADO[tono]}`}>
            {tono === 'pagado' ? (
              <IconoCheck className="size-3.5 text-ingreso" />
            ) : (
              <span className={`size-1.5 shrink-0 rounded-full ${COLOR_PUNTO[tono]}`} aria-hidden="true" />
            )}
            <span className="truncate">{texto}</span>
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className={`block text-[17px] font-semibold cifras ${p.pagado ? 'text-secundario' : ''}`}>
            {formatearMonto(p.pagado ? p.monto : p.saldo)}
          </span>
          {!p.pagado && p.abonado > 0 && (
            <span className="block text-[13px] text-secundario cifras">de {formatearMonto(p.monto)}</span>
          )}
        </span>
      </button>

      {!p.pagado && p.abonado > 0 && (
        <div className="-mt-1 px-4 pb-3.5">
          <div
            role="progressbar"
            aria-label={`${p.persona} ya pagó ${formatearMonto(p.abonado)} de ${formatearMonto(p.monto)}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progreso * 100)}
            className="h-1.5 overflow-hidden rounded-full bg-pista"
          >
            <div className="barra-progreso h-full origin-left rounded-full bg-ingreso-relleno" style={{ transform: `scaleX(${progreso})` }} />
          </div>
        </div>
      )}

      {!p.pagado && (
        <button
          type="button"
          onClick={() => onRegistrarPago(p)}
          aria-label={`Registrar pago de ${p.persona}`}
          className="flex min-h-11 w-full items-center justify-center border-t border-black/[0.06] text-[16px] font-medium text-primary transition-colors active:bg-primary/10 dark:border-white/10"
        >
          Registrar pago
        </button>
      )}
    </li>
  );
}
