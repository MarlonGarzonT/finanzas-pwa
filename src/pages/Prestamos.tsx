import { Link, Navbar, Page } from 'konsta/react';
import { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AbonoSheet } from '../components/AbonoSheet';
import { AvisosPrestamosSheet } from '../components/AvisosPrestamosSheet';
import { CabeceraPrestamos } from '../components/CabeceraPrestamos';
import { Cargando } from '../components/Cargando';
import { DetallePrestamoSheet, type DetallePrestamoHandle } from '../components/DetallePrestamoSheet';
import { EditarPrestamoSheet } from '../components/EditarPrestamoSheet';
import { BotonFlotante } from '../components/BotonFlotante';
import { IconoCampana } from '../components/Iconos';
import { ListaPrestamos } from '../components/ListaPrestamos';
import { NuevoPrestamoSheet } from '../components/NuevoPrestamoSheet';
import { PrestamosVacio } from '../components/PrestamosVacio';
import { OpcionSelector, SelectorVidrio } from '../components/SelectorVidrio';
import type { EstadoPrestamo } from '../utils/prestamos';
import type { EstadoNavegacionPrestamos } from '../components/useAbrirMovimiento';
import { useFinanzas } from '../data/FinanzasContext';
import { useNotificacionesPush } from '../data/useNotificacionesPush';
import { usePrestamos } from '../data/usePrestamos';

// Hoja abierta encima de la lista: préstamo nuevo, edición o pago.
type Formulario = 'nuevo' | 'editar' | 'pago' | null;
type Vista = 'por-cobrar' | 'pagados';

// Lo que tarda en bajar la hoja del pago: las chispas salen cuando ya se ve
// el detalle, no detrás de la hoja que se está cerrando.
const ESPERA_CIERRE_HOJA_MS = 450;

const UMBRAL_BOTON_COMPACTO_PX = 48;

export function Prestamos() {
  const { cargando, crearPrestamo, actualizarPrestamo, eliminarPrestamo, registrarAbono, eliminarMovimiento } = useFinanzas();
  const { pendientes, pagados, resumen, porId } = usePrestamos();
  const ubicacion = useLocation();
  // Si se llegó tocando un movimiento de préstamo, se abre ese préstamo.
  const idInicial = (ubicacion.state as EstadoNavegacionPrestamos | null)?.prestamoId ?? null;
  // Préstamo sobre el que trabajan las hojas, y si su detalle está a la vista
  // (el pago rápido de la tarjeta usa el préstamo sin abrir el detalle).
  const [activoId, setActivoId] = useState<string | null>(idInicial);
  const [detalleAbierto, setDetalleAbierto] = useState(idInicial !== null);
  const [formulario, setFormulario] = useState<Formulario>(null);
  const [filtro, setFiltro] = useState<Vista>('por-cobrar');
  const [avisosAbierto, setAvisosAbierto] = useState(false);
  // Al bajar por una lista larga el botón flotante se queda solo con el "+":
  // con el texto tapaba el monto y el estado de las tarjetas que pasan por debajo.
  const [botonCompacto, setBotonCompacto] = useState(false);
  const push = useNotificacionesPush();
  const detalleRef = useRef<DetallePrestamoHandle>(null);

  const activo = activoId ? (porId(activoId) ?? null) : null;
  const hayPrestamos = pendientes.length + pagados.length > 0;
  // Sin pagados no hay nada que filtrar: el selector solo aparece cuando sirve.
  const vista: Vista = pagados.length > 0 ? filtro : 'por-cobrar';
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
    <Page className="pagina-con-fab" onScroll={(e: React.UIEvent<HTMLElement>) => setBotonCompacto(e.currentTarget.scrollTop > UMBRAL_BOTON_COMPACTO_PX)}>
      <Navbar
        centerTitle
        title="Préstamos"
        right={
          <Link
            iconOnly
            onClick={() => setAvisosAbierto(true)}
            aria-label={`Avisos de cobro, ${push.estado === 'encendido' ? 'activados' : 'apagados'}`}
            className="relative"
          >
            <IconoCampana className="size-7" />
            {/* Punto verde: los avisos están encendidos (el estado también se lee en la hoja). */}
            {push.estado === 'encendido' && (
              <span className="absolute top-2 right-2 size-2.5 rounded-full bg-ingreso-relleno ring-2 ring-ios-light-surface dark:ring-black" aria-hidden="true" />
            )}
          </Link>
        }
      />

      {cargando ? (
        <Cargando />
      ) : (
        <div className="aparecer-suave">
          {hayPrestamos ? (
            <>
              <CabeceraPrestamos resumen={resumen} />

              {pagados.length > 0 && (
                <div className="px-4 pb-4">
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
            <PrestamosVacio onAgregar={() => setFormulario('nuevo')} />
          )}
        </div>
      )}

      {/* Con texto, no solo "+": en esta pestaña el botón dice qué hace. */}
      <BotonFlotante
        etiqueta="Nuevo préstamo"
        texto={botonCompacto ? undefined : 'Nuevo préstamo'}
        onClick={() => setFormulario('nuevo')}
      />

      <AvisosPrestamosSheet abierto={avisosAbierto} onCerrar={() => setAvisosAbierto(false)} push={push} />

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
    </Page>
  );
}
