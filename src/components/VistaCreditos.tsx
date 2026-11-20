import { useState } from 'react';
import { useFinanzas } from '../data/FinanzasContext';
import { useCreditos } from '../data/useCreditos';
import type { EstadoCredito } from '../utils/creditos';
import { BotonFlotante } from './BotonFlotante';
import { CabeceraCreditos } from './CabeceraCreditos';
import { Cargando } from './Cargando';
import { CreditosVacio } from './CreditosVacio';
import { DetalleCreditoSheet } from './DetalleCreditoSheet';
import { EditarCreditoSheet } from './EditarCreditoSheet';
import { NuevoCreditoSheet } from './NuevoCreditoSheet';
import { PagoCreditoSheet } from './PagoCreditoSheet';
import { TarjetaCredito } from './TarjetaCredito';

// Hoja abierta encima de la lista: crédito nuevo, edición o pago de cuota.
type Formulario = 'nuevo' | 'editar' | 'pago' | null;

interface Props {
  botonCompacto: boolean;
  // Si se llegó tocando el pago de una cuota en el historial, se abre ese crédito.
  idInicial: string | null;
}

// "Debes": los créditos que tú pagas. La app calcula los intereses y lleva la
// cuenta de las cuotas con cada pago que se registra.
export function VistaCreditos({ botonCompacto, idInicial }: Props) {
  const { cargando, crearCredito, actualizarCredito, eliminarCredito, registrarPagoCredito, eliminarMovimiento } = useFinanzas();
  const { activos, saldados, resumen, porId } = useCreditos();
  // Crédito sobre el que trabajan las hojas, y si su detalle está a la vista
  // (el pago rápido de la tarjeta usa el crédito sin abrir el detalle).
  const [activoId, setActivoId] = useState<string | null>(idInicial);
  const [detalleAbierto, setDetalleAbierto] = useState(idInicial !== null);
  const [formulario, setFormulario] = useState<Formulario>(null);

  const activo = activoId ? (porId(activoId) ?? null) : null;
  const hayCreditos = activos.length + saldados.length > 0;

  function abrirDetalle(c: EstadoCredito) {
    setActivoId(c.id);
    setDetalleAbierto(true);
  }

  function pagoRapido(c: EstadoCredito) {
    setActivoId(c.id);
    setDetalleAbierto(false);
    setFormulario('pago');
  }

  return (
    <>
      {cargando ? (
        <Cargando />
      ) : (
        <div className="aparecer-suave">
          {hayCreditos ? (
            <>
              <CabeceraCreditos resumen={resumen} />
              {activos.length > 0 && (
                <ul aria-label="Créditos activos" className="m-0 mt-4 flex list-none flex-col gap-4 px-4 py-0">
                  {activos.map((c, indice) => (
                    <TarjetaCredito key={c.id} credito={c} onAbrir={abrirDetalle} onRegistrarPago={pagoRapido} conEfectos={indice < 2} />
                  ))}
                </ul>
              )}
              {saldados.length > 0 && (
                <>
                  <h2 className="m-0 px-8 pt-6 pb-2 text-[13px] font-medium text-secundario">Ya terminados</h2>
                  <ul aria-label="Créditos pagados" className="m-0 flex list-none flex-col gap-4 px-4 py-0">
                    {saldados.map((c) => (
                      <TarjetaCredito key={c.id} credito={c} onAbrir={abrirDetalle} onRegistrarPago={pagoRapido} />
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : (
            <CreditosVacio onAgregar={() => setFormulario('nuevo')} />
          )}
        </div>
      )}

      <BotonFlotante
        etiqueta="Nuevo crédito"
        texto={botonCompacto ? undefined : 'Nuevo crédito'}
        onClick={() => setFormulario('nuevo')}
      />

      <DetalleCreditoSheet
        abierto={detalleAbierto && activo !== null}
        credito={activo}
        onCerrar={() => setDetalleAbierto(false)}
        onPagar={() => setFormulario('pago')}
        onEditar={() => setFormulario('editar')}
        onEliminar={async () => {
          if (!activo) return;
          await eliminarCredito(activo.id);
          setDetalleAbierto(false);
          setActivoId(null);
        }}
        onEliminarPago={(pago) => eliminarMovimiento(pago.id)}
      />

      <NuevoCreditoSheet abierto={formulario === 'nuevo'} onCerrar={() => setFormulario(null)} onGuardar={crearCredito} />

      <EditarCreditoSheet
        abierto={formulario === 'editar'}
        credito={activo}
        cuotasPagadas={activo?.cuotasPagadas ?? 0}
        onCerrar={() => setFormulario(null)}
        onGuardar={async (cambios) => {
          if (activo) await actualizarCredito(activo.id, cambios);
        }}
      />

      <PagoCreditoSheet
        abierto={formulario === 'pago'}
        credito={activo}
        onCerrar={() => setFormulario(null)}
        onGuardar={async (monto, fecha) => {
          if (activo) await registrarPagoCredito(activo, monto, fecha);
        }}
      />
    </>
  );
}
