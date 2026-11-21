import { useState } from 'react';
import { useFinanzas } from '../data/FinanzasContext';
import { useCreditos } from '../data/useCreditos';
import type { EstadoCredito } from '../utils/creditos';
import { BotonFlotante } from './BotonFlotante';
import { BotonPrincipal } from './BotonPrincipal';
import { Cargando } from './Cargando';
import { CreditosVacio } from './CreditosVacio';
import { DetalleCreditoSheet } from './DetalleCreditoSheet';
import { EditarCreditoSheet } from './EditarCreditoSheet';
import { NuevoCreditoSheet } from './NuevoCreditoSheet';
import { PagoCreditoSheet } from './PagoCreditoSheet';
import { ResumenInteresesCreditos } from './ResumenInteresesCreditos';
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
        <div className="aparecer-suave columna-web lg:mx-auto lg:max-w-[1480px] lg:px-8">
          {hayCreditos ? (
            // En escritorio: los créditos a la izquierda y, a la derecha, el botón
            // de crear y el total de todos juntos (siempre, aunque haya uno solo).
            <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-6">
              <div className="lg:col-span-8">
                {/* Lo primero son los créditos; solo el botón de pago del más urgente lleva luz. */}
                {activos.length > 0 && (
                  <ul aria-label="Créditos activos" className="m-0 flex list-none flex-col gap-4 px-4 py-0 lg:grid lg:grid-cols-2 lg:px-0">
                    {activos.map((c, indice) => (
                      <TarjetaCredito key={c.id} credito={c} onAbrir={abrirDetalle} onRegistrarPago={pagoRapido} conEfectos={indice === 0} />
                    ))}
                  </ul>
                )}
                {activos.length + saldados.length > 1 && (
                  <div className="mt-4 lg:hidden">
                    <ResumenInteresesCreditos resumen={resumen} />
                  </div>
                )}
                {saldados.length > 0 && (
                  <>
                    <h2 className="m-0 px-8 pt-6 pb-2 text-[13px] font-medium text-secundario lg:px-0">Ya terminados</h2>
                    <ul aria-label="Créditos pagados" className="m-0 flex list-none flex-col gap-4 px-4 py-0 lg:grid lg:grid-cols-2 lg:px-0">
                      {saldados.map((c) => (
                        <TarjetaCredito key={c.id} credito={c} onAbrir={abrirDetalle} onRegistrarPago={pagoRapido} />
                      ))}
                    </ul>
                  </>
                )}
              </div>
              <aside className="hidden flex-col gap-4 lg:col-span-4 lg:flex" aria-label="Resumen y acciones">
                <BotonPrincipal texto="Nuevo crédito" onClick={() => setFormulario('nuevo')} efectos={false} />
                <ResumenInteresesCreditos resumen={resumen} />
              </aside>
            </div>
          ) : (
            <div className="lg:mx-auto lg:max-w-2xl">
              <CreditosVacio onAgregar={() => setFormulario('nuevo')} />
            </div>
          )}
        </div>
      )}

      <BotonFlotante
        etiqueta="Nuevo crédito"
        texto={botonCompacto ? undefined : 'Nuevo crédito'}
        onClick={() => setFormulario('nuevo')}
        efectos={false}
        soloMovil
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
