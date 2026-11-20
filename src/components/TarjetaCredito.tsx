import { colorCategoria } from '../utils/colorCategoria';
import { describirProximaCuota, emojiCredito, formatearDiaConAnio, type EstadoCredito } from '../utils/creditos';
import { formatearMonto } from '../utils/fechas';
import type { TonoVencimiento } from '../utils/prestamos';
import { BotonPrincipal } from './BotonPrincipal';
import { RESPALDO } from './FondoVidrio';
import { IconoCheck } from './Iconos';
import { TiraCuotas } from './TiraCuotas';

interface Props {
  credito: EstadoCredito;
  onAbrir: (credito: EstadoCredito) => void;
  onRegistrarPago: (credito: EstadoCredito) => void;
  // Con luz en el botón (cada una es un lienzo animado): solo las primeras tarjetas.
  conEfectos?: boolean;
}

// El estado en una píldora con punto: las palabras mandan, el color refuerza.
const PILDORA: Record<TonoVencimiento, { fondo: string; texto: string; punto: string }> = {
  tranquilo: { fondo: 'rgb(255 255 255 / 0.1)', texto: 'rgb(255 255 255 / 0.85)', punto: 'rgb(255 255 255 / 0.5)' },
  pronto: { fondo: 'rgb(10 132 255 / 0.22)', texto: '#a9d2ff', punto: '#4aa3ff' },
  vencido: { fondo: 'rgb(255 112 128 / 0.2)', texto: '#ff9aa5', punto: '#ff7080' },
  pagado: { fondo: 'rgb(49 212 148 / 0.18)', texto: '#4ee0a8', punto: '#31d494' },
};

// Un crédito como tarjeta de vidrio oscuro (la misma de la brecha de Reportes,
// con el fondo quieto para no cargar un WebGL por crédito): qué es, en qué cuota
// va (en grande), las rayitas de las cuotas, cuánto se ha ido en intereses y el
// botón para anotar el pago.
export function TarjetaCredito({ credito: c, onAbrir, onRegistrarPago, conEfectos = false }: Props) {
  const { texto, tono } = describirProximaCuota(c);
  const pildora = PILDORA[tono];
  const color = colorCategoria(c.id);
  return (
    <li
      className="dark overflow-hidden rounded-[28px] bg-[#0a1522] text-white shadow-[0_8px_24px_rgb(0_0_0/0.18)] ring-1 ring-white/10"
      style={{ backgroundImage: RESPALDO }}
    >
      <button
        type="button"
        onClick={() => onAbrir(c)}
        aria-label={
          c.saldado
            ? `${c.nombre}, crédito pagado. Ver detalle`
            : `${c.nombre}, cuota ${c.cuotasPagadas + 1} de ${c.plazoMeses}, ${formatearMonto(c.cuota)} al mes. ${texto}. Ver detalle`
        }
        className="block w-full px-4 pt-4 pb-3 text-left transition-colors active:bg-white/5"
      >
        <span className="flex items-start gap-3">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-[22px]"
            style={{ background: `color-mix(in srgb, ${color} 30%, transparent)` }}
            aria-hidden="true"
          >
            {emojiCredito(c.nombre)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="line-clamp-2 block text-[18px] leading-tight font-semibold break-words">{c.nombre}</span>
            {c.entidad && <span className="block truncate text-[13px] text-white/60">{c.entidad}</span>}
          </span>
          <span
            className="flex max-w-[44%] shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] leading-tight font-semibold"
            style={{ background: pildora.fondo, color: pildora.texto }}
          >
            {tono === 'pagado' ? (
              <IconoCheck className="size-3.5" />
            ) : (
              <span className="size-1.5 rounded-full" style={{ background: pildora.punto }} aria-hidden="true" />
            )}
            {texto}
          </span>
        </span>

        <span className="mt-4 flex items-end justify-between gap-3">
          <span>
            <span className="block text-[13px] font-medium text-white/60">{c.saldado ? 'Cuotas pagadas' : 'Vas en la cuota'}</span>
            <span className="block text-[44px] leading-[1] font-bold tracking-[-0.03em] cifras">
              <span style={{ color: '#4ee0a8' }}>{c.saldado ? c.plazoMeses : c.cuotasPagadas + 1}</span>
              <span className="text-[24px] font-semibold text-white/50"> de {c.plazoMeses}</span>
            </span>
          </span>
          <span className="text-right">
            <span className="block text-[20px] leading-tight font-bold cifras">{formatearMonto(c.cuota)}</span>
            <span className="block text-[13px] text-white/60">por cuota</span>
          </span>
        </span>

        <span className="mt-3 block">
          <TiraCuotas plazo={c.plazoMeses} pagadas={c.cuotasPagadas} sobreOscuro atrasada={c.vencida} />
        </span>
        <span className="mt-2 block text-[13px] text-white/65">
          {c.saldado
            ? `Terminaste el ${formatearDiaConAnio(c.fechaFinal)}`
            : `Faltan ${c.cuotasRestantes} · terminas el ${formatearDiaConAnio(c.fechaFinal)}`}
        </span>

        <span className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
          <span>
            <span className="block text-[12px] text-white/55">Intereses pagados</span>
            <span className="block text-[16px] font-semibold cifras" style={{ color: '#ff8c99' }}>
              {formatearMonto(Math.round(c.interesesPagados))}
            </span>
          </span>
          <span>
            <span className="block text-[12px] text-white/55">Falta pagar</span>
            <span className="block text-[16px] font-semibold cifras">{formatearMonto(c.porPagar)}</span>
          </span>
        </span>
      </button>

      {!c.saldado && (
        <div className="px-4 pb-4">
          <BotonPrincipal
            texto={`Registrar pago de la cuota ${c.cuotasPagadas + 1}`}
            etiqueta={`Registrar el pago de la cuota ${c.cuotasPagadas + 1} de ${c.nombre}`}
            onClick={() => onRegistrarPago(c)}
            efectos={conEfectos}
          />
        </div>
      )}
    </li>
  );
}
