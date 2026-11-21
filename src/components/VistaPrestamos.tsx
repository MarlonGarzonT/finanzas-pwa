import { useRef, useState } from 'react';
import { useFinanzas } from '../data/FinanzasContext';
import { usePrestamos } from '../data/usePrestamos';
import type { EstadoPrestamo } from '../utils/prestamos';
import { AbonoSheet } from './AbonoSheet';
import { BotonFlotante } from './BotonFlotante';
import { BotonPrincipal } from './BotonPrincipal';
import { CabeceraPrestamos } from './CabeceraPrestamos';
import { Cargando } from './Cargando';
import { DetallePrestamoSheet, type DetallePrestamoHandle } from './DetallePrestamoSheet';
import { EditarPrestamoSheet } from './EditarPrestamoSheet';
import { ListaPrestamos } from './ListaPrestamos';
import { NuevoPrestamoSheet } from './NuevoPrestamoSheet';
import { PrestamosVacio } from './PrestamosVacio';
import { OpcionSelector, SelectorVidrio } from './SelectorVidrio';

// Hoja abierta encima de la lista: préstamo nuevo, edición o pago.
type Formulario = 'nuevo' | 'editar' | 'pago' | null;
type Filtro = 'por-cobrar' | 'pagados';

// Lo que tarda en bajar la hoja del pago: las chispas salen cuando ya se ve
// el detalle, no detrás de la hoja que se está cerrando.
const ESPERA_CIERRE_HOJA_MS = 450;

interface Props {
  // El botón flotante pierde el texto al bajar por la lista.
  botonCompacto: boolean;
  // Si se llegó tocando un movimiento de préstamo, se abre ese préstamo.
  idInicial: string | null;
}

// "Te deben": la plata que prestaste a otras personas.
export function VistaPrestamos({ botonCompacto, idInicial }: Props) {
  const { cargando, crearPrestamo, actualizarPrestamo, eliminarPrestamo, registrarAbono, eliminarMovimiento } = useFinanzas();
  const { pendientes, pagados, resumen, porId } = usePrestamos();
  // Préstamo sobre el que trabajan las hojas, y si su detalle está a la vista
  // (el pago rápido de la tarjeta usa el préstamo sin abrir el detalle).
  const [activoId, setActivoId] = useState<string | null>(idInicial);
  const [detalleAbierto, setDetalleAbierto] = useState(idInicial !== null);
  const [formulario, setFormulario] = useState<Formulario>(null);
  const [filtro, setFiltro] = useState<Filtro>('por-cobrar');
  const detalleRef = useRef<DetallePrestamoHandle>(null);

  const activo = activoId ? (porId(activoId) ?? null) : null;
  const hayPrestamos = pendientes.length + pagados.length > 0;
  // Sin pagados no hay nada que filtrar: el selector solo aparece cuando sirve.
  const vista: Filtro = pagados.length > 0 ? filtro : 'por-cobrar';
  const visibles = vista === 'por-cobrar' ? pendientes : pagados;

  function abrirDetalle(p: EstadoPrestamo) {
    setActivoId(p.id);
    setDetalleAbierto(true);
  }

  function pagoRapido(p: EstadoPrestamo) {
    setActivoId(p.id);
    setDetalleAbierto(false);
    setFormulario('pago');
  }

  return (
    <>
      {cargando ? (
        <Cargando />
      ) : (
        <div className="aparecer-suave columna-web lg:mx-auto lg:max-w-[1480px] lg:px-8">
          {hayPrestamos ? (
            <>
              {/* En escritorio la acción va junto al total, no en un botón flotante. */}
              <div className="lg:flex lg:items-start lg:justify-between lg:gap-6">
                <div className="lg:flex-1">
                  <CabeceraPrestamos resumen={resumen} />
                </div>
                <div className="hidden w-[230px] shrink-0 lg:block">
                  <BotonPrincipal texto="Nuevo préstamo" onClick={() => setFormulario('nuevo')} efectos={false} />
                </div>
              </div>

              {pagados.length > 0 && (
                <div className="px-4 pb-4 lg:max-w-[360px] lg:px-0">
                  <SelectorVidrio>
                    <OpcionSelector active={vista === 'por-cobrar'} onClick={() => setFiltro('por-cobrar')}>
                      Por cobrar · {pendientes.length}
                    </OpcionSelector>
                    <OpcionSelector active={vista === 'pagados'} onClick={() => setFiltro('pagados')}>
                      Pagados · {pagados.length}
                    </OpcionSelector>
                  </SelectorVidrio>
                </div>
              )}

              {visibles.length > 0 ? (
                <ListaPrestamos
                  etiqueta={vista === 'por-cobrar' ? 'Préstamos por cobrar' : 'Préstamos pagados'}
                  prestamos={visibles}
                  onAbrir={abrirDetalle}
                  onRegistrarPago={pagoRapido}
                />
              ) : (
                <p className="m-0 px-8 py-6 text-center text-[15px] text-secundario">
                  Todos tus préstamos están pagados. Cuando prestes de nuevo, aparecerá aquí.
                </p>
              )}
            </>
          ) : (
            <div className="lg:mx-auto lg:max-w-2xl">
              <PrestamosVacio onAgregar={() => setFormulario('nuevo')} />
            </div>
          )}
        </div>
      )}

      {/* Con texto, no solo "+": en esta pestaña el botón dice qué hace. */}
      <BotonFlotante
        etiqueta="Nuevo préstamo"
        texto={botonCompacto ? undefined : 'Nuevo préstamo'}
        onClick={() => setFormulario('nuevo')}
        soloMovil
      />

      <DetallePrestamoSheet
        ref={detalleRef}
        abierto={detalleAbierto && activo !== null}
        prestamo={activo}
        onCerrar={() => setDetalleAbierto(false)}
        onAbonar={() => setFormulario('pago')}
        onEditar={() => setFormulario('editar')}
        onEliminar={async () => {
          if (!activo) return;
          await eliminarPrestamo(activo.id);
          setDetalleAbierto(false);
          setActivoId(null);
        }}
        onEliminarAbono={(abono) => eliminarMovimiento(abono.id)}
      />

      <NuevoPrestamoSheet abierto={formulario === 'nuevo'} onCerrar={() => setFormulario(null)} onGuardar={crearPrestamo} />

      <EditarPrestamoSheet
        abierto={formulario === 'editar'}
        prestamo={activo}
        onCerrar={() => setFormulario(null)}
        onGuardar={async (datos) => {
          if (activo) await actualizarPrestamo(activo.id, datos);
        }}
      />

      <AbonoSheet
        abierto={formulario === 'pago'}
        prestamo={activo}
        onCerrar={() => setFormulario(null)}
        onGuardar={async (monto) => {
          if (!activo) return;
          const saldaLaDeuda = monto >= activo.saldo;
          await registrarAbono(activo, monto);
          if (saldaLaDeuda && detalleAbierto) window.setTimeout(() => detalleRef.current?.celebrarSaldado(), ESPERA_CIERRE_HOJA_MS);
        }}
      />
    </>
  );
}
