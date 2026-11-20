import { Block, BlockTitle, Button, List, ListItem } from 'konsta/react';
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
import { DialogoConfirmar } from './DialogoConfirmar';
import { HojaInferior } from './HojaInferior';
import { IconoCheck, IconoPapelera } from './Iconos';

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
  vencido: 'text-alerta',
  pagado: 'text-ingreso',
};

const COLOR_PUNTO: Record<TonoVencimiento, string> = {
  tranquilo: 'bg-black/25 dark:bg-white/30',
  pronto: 'bg-primary',
  vencido: 'bg-alerta',
  pagado: 'bg-ingreso',
};

function porcentaje(valor: number, decimales: number): string {
  return `${valor.toLocaleString('es-CO', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })} %`;
}

function Dato({ etiqueta, valor, destacado = false }: { etiqueta: string; valor: number; destacado?: boolean }) {
  return (
    <div className={`rounded-2xl px-4 py-3 ${destacado ? 'bg-primary/10' : 'bg-ios-light-surface-1 dark:bg-ios-dark-surface-1'}`}>
      <dt className="text-[13px] text-secundario">{etiqueta}</dt>
      <dd className="m-0 mt-0.5 text-[19px] font-bold cifras">{formatearMonto(Math.round(valor))}</dd>
    </div>
  );
}

// Todo sobre un crédito: en qué cuota va, cuánto ha pagado y cuánto falta,
// cuánto de eso son intereses (lo que más cuesta ver en el banco), el costo
// total, la tabla de cuotas y los pagos registrados.
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
              <Button large rounded onClick={onPagar} disabled={ocupado}>
                Registrar pago de la cuota {credito.cuotasPagadas + 1}
              </Button>
            )}
          </>
        }
      >
        {credito && estado && (
          <>
            <Block className="my-2 flex flex-col items-center gap-1 text-center">
              <span
                className="flex size-14 items-center justify-center rounded-full text-[28px]"
                style={{ background: `color-mix(in srgb, ${colorCategoria(credito.id)} 22%, transparent)` }}
                aria-hidden="true"
              >
                {emojiCredito(credito.nombre)}
              </span>
              <span className="mt-2 text-[15px] font-medium text-secundario">{credito.saldado ? 'Crédito pagado' : 'Vas en la cuota'}</span>
              <p className="m-0 text-[40px] leading-[1.1] font-bold tracking-[-0.03em] cifras">
                {credito.saldado ? credito.plazoMeses : credito.cuotasPagadas + 1}
                <span className="text-[24px] font-semibold text-secundario"> de {credito.plazoMeses}</span>
              </p>
              <p className={`m-0 mt-1 flex items-center justify-center gap-1.5 text-[15px] font-medium ${COLOR_ESTADO[estado.tono]}`}>
                <span className={`size-2 shrink-0 rounded-full ${COLOR_PUNTO[estado.tono]}`} aria-hidden="true" />
                {estado.texto}
                {!credito.saldado && <span className="font-normal text-secundario cifras"> · {formatearMonto(credito.cuota)}</span>}
              </p>
              <div className="mt-3 flex w-full flex-col gap-1.5">
                <div
                  role="progressbar"
                  aria-label={`${credito.cuotasPagadas} de ${credito.plazoMeses} cuotas pagadas`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(credito.progreso * 100)}
                  className="h-2 overflow-hidden rounded-full bg-pista"
                >
                  <div className="barra-progreso h-full origin-left rounded-full bg-primary" style={{ transform: `scaleX(${credito.progreso})` }} />
                </div>
                <p className="m-0 text-[13px] text-secundario">
                  {credito.saldado
                    ? `Terminaste el ${formatearDiaConAnio(credito.fechaFinal)}`
                    : `Llevas ${credito.cuotasPagadas} ${credito.cuotasPagadas === 1 ? 'cuota' : 'cuotas'} · faltan ${credito.cuotasRestantes} · terminas el ${formatearDiaConAnio(credito.fechaFinal)}`}
                </p>
              </div>
            </Block>

            <BlockTitle>Tu plata en este crédito</BlockTitle>
            <dl className="m-0 grid grid-cols-2 gap-3 px-4">
              <Dato etiqueta="Has pagado" valor={credito.totalPagado} />
              <Dato etiqueta="Te falta pagar" valor={credito.porPagar} />
              <Dato etiqueta="Intereses pagados" valor={credito.interesesPagados} destacado />
              <Dato etiqueta="Intereses que faltan" valor={credito.interesesPorPagar} destacado />
              <Dato etiqueta="Deuda que ya bajaste" valor={credito.capitalPagado} />
              <Dato etiqueta="Deuda que aún tienes" valor={credito.saldoCapital} />
            </dl>

            <BlockTitle>Lo que cuesta este crédito</BlockTitle>
            <Block strong inset className="mt-0 mb-2 text-[15px] leading-snug">
              <p className="m-0">
                Te prestaron <span className="font-semibold cifras">{formatearMonto(credito.montoFinanciado)}</span> y pagarás{' '}
                <span className="font-semibold cifras">{formatearMonto(credito.totalAPagar)}</span> en total:{' '}
                <span className="font-semibold cifras">{formatearMonto(Math.round(credito.interesesTotal))}</span> de intereses. Por cada{' '}
                <span className="cifras">$1.000</span> prestados pagas <span className="font-semibold cifras">{formatearMonto(costoPorMil(credito))}</span>.
              </p>
              <p className="m-0 mt-2 text-[14px] text-secundario cifras">
                Tasa aproximada: {porcentaje(credito.tasaMensual * 100, 2)} mensual · {porcentaje(credito.tasaEfectivaAnual, 1)} efectivo anual.
              </p>
              <p className="m-0 mt-1 text-[13px] text-secundario">
                La calculamos con tus cuotas: incluye también seguros u otros cobros que el banco sume a la cuota.
              </p>
            </Block>

            <div className="px-4 pb-1">
              <button
                type="button"
                aria-expanded={verTabla}
                onClick={() => setVerTabla((v) => !v)}
                className="flex min-h-11 w-full items-center justify-center rounded-2xl bg-ios-light-surface-1 text-[16px] font-medium text-primary active:opacity-60 dark:bg-ios-dark-surface-1"
              >
                {verTabla ? 'Ocultar las cuotas' : `Ver las ${credito.plazoMeses} cuotas`}
              </button>
            </div>
            {verTabla && (
              <List strong inset dividers className="mt-3 mb-2">
                {credito.tabla.map((fila) => {
                  const pagada = fila.numero <= credito.cuotasPagadas;
                  return (
                    <ListItem
                      key={fila.numero}
                      title={<span className={pagada ? 'text-secundario' : 'font-medium'}>Cuota {fila.numero} · {formatearDiaConAnio(fila.fecha)}</span>}
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
        mensaje={
          pagoPorEliminar
            ? `${formatearMonto(pagoPorEliminar.monto)} vuelve a tu Disponible y la cuota queda sin pagar.`
            : ''
        }
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
