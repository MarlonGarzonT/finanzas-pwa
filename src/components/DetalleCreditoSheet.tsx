import { BlockTitle, List, ListItem } from 'konsta/react';
import { useState } from 'react';
import type { Transaccion } from '../types';
import { colorCategoria } from '../utils/colorCategoria';
import {
  costoPorMil,
  describirProximaCuota,
  emojiCredito,
  formatearDiaConAnio,
  type EstadoCredito,
} from '../utils/creditos';
import { formatearFechaCorta, formatearMonto } from '../utils/fechas';
import type { TonoVencimiento } from '../utils/prestamos';
import { AvatarEmoji } from './AvatarEmoji';
import { BarraReparto } from './BarraReparto';
import { BotonPrincipal } from './BotonPrincipal';
import { DialogoConfirmar } from './DialogoConfirmar';
import { HojaInferior } from './HojaInferior';
import { IconoCheck, IconoPapelera } from './Iconos';
import { TiraCuotas } from './TiraCuotas';

interface Props {
  abierto: boolean;
  credito: EstadoCredito | null;
  onCerrar: () => void;
  onPagar: () => void;
  onEditar: () => void;
  onEliminar: () => Promise<void>;
  onEliminarPago: (pago: Transaccion) => Promise<void>;
}

const COLOR_ESTADO: Record<TonoVencimiento, string> = {
  tranquilo: 'text-secundario',
  pronto: 'text-black/75 dark:text-white/80',
  vencido: 'font-medium text-alerta',
  pagado: 'text-ingreso',
};

const COLOR_PUNTO: Record<TonoVencimiento, string> = {
  tranquilo: 'bg-black/25 dark:bg-white/30',
  pronto: 'bg-primary',
  vencido: 'bg-alerta',
  pagado: 'bg-ingreso',
};

const TARJETA_CLARA = 'rounded-[24px] bg-ios-light-surface-1 p-4 dark:bg-ios-dark-surface-1';

function porcentaje(valor: number, decimales: number): string {
  return `${valor.toLocaleString('es-CO', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })} %`;
}

// Todo sobre un crédito. De arriba abajo, lo que más importa primero: en qué
// cuota vas (en grande y con una rayita por cuota), cómo se reparte lo que
// pagaste y lo que falta entre deuda e intereses, cuánto cuesta el crédito en
// total, y al final el detalle: tabla de cuotas, pagos registrados y acciones.
export function DetalleCreditoSheet({ abierto, credito, onCerrar, onPagar, onEditar, onEliminar, onEliminarPago }: Props) {
  const [verTabla, setVerTabla] = useState(false);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [pagoPorEliminar, setPagoPorEliminar] = useState<Transaccion | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ejecutar(accion: () => Promise<void>, mensajeError: string) {
    setOcupado(true);
    setError(null);
    try {
      await accion();
    } catch {
      setError(mensajeError);
    } finally {
      setOcupado(false);
    }
  }

  const estado = credito ? describirProximaCuota(credito) : null;

  return (
    <>
      <HojaInferior
        abierto={abierto && credito !== null}
        titulo={credito?.nombre ?? 'Crédito'}
        onCerrar={onCerrar}
        textoCerrar="Cerrar"
        cierreBloqueado={ocupado}
        pie={
          <>
            {error && (
              <p className="m-0 text-center text-[15px] text-alerta" role="alert">
                {error}
              </p>
            )}
            {credito && !credito.saldado && (
              <BotonPrincipal texto={`Registrar pago de la cuota ${credito.cuotasPagadas + 1}`} onClick={onPagar} disabled={ocupado} />
            )}
          </>
        }
      >
        {credito && estado && (
          <>
            {/* 1 · En qué cuota vas */}
            <section className={`mx-4 mt-1 ${TARJETA_CLARA}`} aria-label={`Avance del crédito ${credito.nombre}`}>
              <div className="flex items-center gap-3">
                <AvatarEmoji emoji={emojiCredito(credito.nombre)} color={colorCategoria(credito.id)} />
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-[17px] font-semibold">
                    {credito.nombre}
                    {credito.entidad && <span className="font-normal text-secundario"> · {credito.entidad}</span>}
                  </p>
                  <p className={`m-0 mt-0.5 flex items-center gap-1.5 text-[14px] ${COLOR_ESTADO[estado.tono]}`}>
                    {estado.tono === 'pagado' ? (
                      <IconoCheck className="size-3.5" />
                    ) : (
                      <span className={`size-1.5 shrink-0 rounded-full ${COLOR_PUNTO[estado.tono]}`} aria-hidden="true" />
                    )}
                    {estado.texto}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between gap-3">
                <p className="m-0 text-[48px] leading-none font-bold tracking-[-0.03em] cifras">
                  {credito.saldado ? credito.plazoMeses : credito.cuotasPagadas + 1}
                  <span className="text-[24px] font-semibold text-secundario"> de {credito.plazoMeses}</span>
                </p>
                <div className="pb-1 text-right">
                  <p className="m-0 text-[19px] leading-tight font-semibold cifras">{formatearMonto(credito.cuota)}</p>
                  <p className="m-0 text-[13px] text-secundario">por cuota</p>
                </div>
              </div>

              <div className="mt-4">
                <TiraCuotas plazo={credito.plazoMeses} pagadas={credito.cuotasPagadas} atrasada={credito.vencida} />
              </div>
              <p className="m-0 mt-2 text-[13px] text-secundario">
                {credito.saldado
                  ? `Terminaste el ${formatearDiaConAnio(credito.fechaFinal)}`
                  : `Llevas ${credito.cuotasPagadas} · faltan ${credito.cuotasRestantes} · terminas el ${formatearDiaConAnio(credito.fechaFinal)}`}
              </p>
            </section>

            {/* 2 · Cómo se reparte tu plata */}
            <BlockTitle className="mt-6!">Cómo se reparte tu plata</BlockTitle>
            <div className={`mx-4 flex flex-col gap-5 ${TARJETA_CLARA}`}>
              <div>
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h3 className="m-0 text-[16px] font-semibold">Lo que ya pagaste</h3>
                  <span className="text-[22px] font-bold cifras">{formatearMonto(Math.round(credito.capitalPagado + credito.interesesPagados))}</span>
                </div>
                <BarraReparto capital={credito.capitalPagado} intereses={credito.interesesPagados} />
              </div>
              {!credito.saldado && (
                <div className="border-t border-black/[0.07] pt-5 dark:border-white/10">
                  <div className="mb-3 flex items-baseline justify-between gap-3">
                    <h3 className="m-0 text-[16px] font-semibold">Lo que te falta</h3>
                    <span className="text-[22px] font-bold cifras">{formatearMonto(Math.round(credito.saldoCapital + credito.interesesPorPagar))}</span>
                  </div>
                  <BarraReparto
                    capital={credito.saldoCapital}
                    intereses={credito.interesesPorPagar}
                    etiquetaCapital="Aún debes"
                    etiquetaIntereses="En intereses"
                  />
                </div>
              )}
              {credito.totalPagado !== Math.round(credito.capitalPagado + credito.interesesPagados) && (
                <p className="m-0 text-[13px] text-secundario">
                  Hasta hoy pagaste <span className="cifras">{formatearMonto(credito.totalPagado)}</span> en total; el reparto usa la cuota de {formatearMonto(credito.cuota)} de cada mes.
                </p>
              )}
            </div>

            {/* 3 · Cuánto cuesta */}
            <BlockTitle className="mt-6!">Lo que cuesta este crédito</BlockTitle>
            <div className={`mx-4 ${TARJETA_CLARA}`}>
              <p className="m-0 text-[15px] text-secundario">Por cada $1.000 que te prestaron pagas</p>
              <p className="m-0 mt-0.5 text-[40px] leading-[1.05] font-bold tracking-[-0.03em] cifras">{formatearMonto(costoPorMil(credito))}</p>
              <dl className="m-0 mt-4 grid grid-cols-2 gap-3 border-t border-black/[0.07] pt-4 dark:border-white/10">
                <div>
                  <dt className="text-[13px] text-secundario">Te prestaron</dt>
                  <dd className="m-0 text-[17px] font-semibold cifras">{formatearMonto(credito.montoFinanciado)}</dd>
                </div>
                <div>
                  <dt className="text-[13px] text-secundario">Pagarás en total</dt>
                  <dd className="m-0 text-[17px] font-semibold cifras">{formatearMonto(credito.totalAPagar)}</dd>
                </div>
                <div className="col-span-2 rounded-2xl bg-intereses/10 px-3.5 py-3">
                  <dt className="text-[13px] text-secundario">De eso, solo en intereses</dt>
                  <dd className="m-0 text-[24px] leading-tight font-bold text-intereses cifras">
                    {formatearMonto(Math.round(credito.interesesTotal))}
                  </dd>
                </div>
              </dl>
              <p className="m-0 mt-3 text-[13px] leading-snug text-secundario cifras">
                Tasa aproximada: {porcentaje(credito.tasaMensual * 100, 2)} mensual · {porcentaje(credito.tasaEfectivaAnual, 1)} efectivo anual. La
                calculamos con tus cuotas, así que incluye seguros u otros cobros que el banco sume a la cuota.
              </p>
            </div>

            {/* 4 · Detalle */}
            <div className="px-4 pt-5 pb-1">
              <button
                type="button"
                aria-expanded={verTabla}
                onClick={() => setVerTabla((v) => !v)}
                className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-primary/10 text-[16px] font-semibold text-primary transition-transform active:scale-[0.98]"
              >
                {verTabla ? 'Ocultar las cuotas' : `Ver las ${credito.plazoMeses} cuotas, una por una`}
              </button>
            </div>
            {verTabla && (
              <List strong inset dividers className="mt-3 mb-2">
                {credito.tabla.map((fila) => {
                  const pagada = fila.numero <= credito.cuotasPagadas;
                  return (
                    <ListItem
                      key={fila.numero}
                      title={
                        <span className={pagada ? 'text-secundario' : 'font-medium'}>
                          Cuota {fila.numero} · {formatearDiaConAnio(fila.fecha)}
                        </span>
                      }
                      text={
                        <span className="cifras">
                          Intereses {formatearMonto(Math.round(fila.interes))} · Deuda −{formatearMonto(Math.round(fila.capital))}
                        </span>
                      }
                      after={pagada ? <IconoCheck className="size-5 text-ingreso" /> : undefined}
                    />
                  );
                })}
              </List>
            )}

            {credito.pagos.length > 0 && (
              <>
                <BlockTitle>Pagos registrados</BlockTitle>
                <List strong inset dividers>
                  {credito.pagos.map((p) => (
                    <ListItem
                      key={p.id}
                      title={<span className="font-semibold cifras">{formatearMonto(p.monto)}</span>}
                      text={formatearFechaCorta(p.fecha)}
                      after={
                        <button
                          type="button"
                          className="-mr-2 flex size-11 items-center justify-center rounded-full text-alerta active:opacity-60 disabled:opacity-40"
                          aria-label={`Eliminar el pago de ${formatearMonto(p.monto)} del ${formatearFechaCorta(p.fecha)}`}
                          onClick={() => setPagoPorEliminar(p)}
                          disabled={ocupado}
                        >
                          <IconoPapelera className="size-5" />
                        </button>
                      }
                    />
                  ))}
                </List>
              </>
            )}

            <List strong inset className="mt-6">
              <ListItem
                link
                linkComponent="button"
                linkProps={{ type: 'button', disabled: ocupado }}
                onClick={onEditar}
                title="Editar crédito"
                contentClassName="w-full text-left"
              />
              <ListItem
                link
                chevron={false}
                linkComponent="button"
                linkProps={{ type: 'button', disabled: ocupado }}
                onClick={() => setConfirmandoEliminar(true)}
                title={<span className="block w-full text-center font-medium text-alerta">Eliminar crédito</span>}
                contentClassName="w-full [&_.shrink]:flex-1"
              />
            </List>
          </>
        )}
      </HojaInferior>

      <DialogoConfirmar
        abierto={confirmandoEliminar}
        titulo={`¿Eliminar el crédito ${credito?.nombre ?? ''}?`}
        mensaje="Se borran el crédito y los pagos que registraste: desaparecen también de tu historial y de los gastos de sus meses. No se puede deshacer."
        textoConfirmar="Eliminar"
        onConfirmar={() => {
          setConfirmandoEliminar(false);
          void ejecutar(onEliminar, 'No se pudo eliminar. Intenta de nuevo.');
        }}
        onCancelar={() => setConfirmandoEliminar(false)}
      />

      <DialogoConfirmar
        abierto={pagoPorEliminar !== null}
        titulo="¿Eliminar este pago?"
        mensaje={pagoPorEliminar ? `${formatearMonto(pagoPorEliminar.monto)} vuelve a tu Disponible y la cuota queda sin pagar.` : ''}
        textoConfirmar="Eliminar"
        onConfirmar={() => {
          const pago = pagoPorEliminar;
          setPagoPorEliminar(null);
          if (pago) void ejecutar(() => onEliminarPago(pago), 'No se pudo eliminar el pago. Intenta de nuevo.');
        }}
        onCancelar={() => setPagoPorEliminar(null)}
      />
    </>
  );
}
