import { Fab, Navbar, Page } from 'konsta/react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AbonoSheet } from '../components/AbonoSheet';
import { AvisosPrestamos } from '../components/AvisosPrestamos';
import { Cargando } from '../components/Cargando';
import { DetallePrestamoSheet } from '../components/DetallePrestamoSheet';
import { EditarPrestamoSheet } from '../components/EditarPrestamoSheet';
import { IconoMas } from '../components/Iconos';
import { ListaPrestamos } from '../components/ListaPrestamos';
import { PrestamosVacio } from '../components/PrestamosVacio';
import type { EstadoNavegacionPrestamos } from '../components/useAbrirMovimiento';
import { useFinanzas } from '../data/FinanzasContext';
import { usePrestamos } from '../data/usePrestamos';
import { formatearMonto } from '../utils/fechas';

// Hoja abierta: el formulario (nuevo o edición) o el abono, encima del detalle.
type Formulario = { tipo: 'nuevo' } | { tipo: 'editar' } | { tipo: 'abono' } | null;

export function Prestamos() {
  const { cargando, crearPrestamo, actualizarPrestamo, eliminarPrestamo, registrarAbono, eliminarMovimiento } = useFinanzas();
  const { pendientes, pagados, resumen, porId } = usePrestamos();
  const ubicacion = useLocation();
  // Si se llegó tocando un movimiento de préstamo, se abre ese préstamo.
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(
    () => (ubicacion.state as EstadoNavegacionPrestamos | null)?.prestamoId ?? null
  );
  const [formulario, setFormulario] = useState<Formulario>(null);

  const seleccionado = seleccionadoId ? (porId(seleccionadoId) ?? null) : null;
  const hayPrestamos = pendientes.length + pagados.length > 0;

  return (
    <Page className="pagina-con-fab">
      <Navbar centerTitle title="Préstamos" />

      {cargando ? (
        <Cargando />
      ) : (
        <div className="aparecer-suave">
          <section className="flex flex-col items-center gap-0.5 px-4 pt-1 pb-2 text-center" aria-label="Lo que te deben">
            <span className="text-[15px] font-medium text-secundario">Te deben</span>
            <p className="m-0 text-[48px] leading-[1.1] font-bold tracking-[-0.03em] cifras">
              {formatearMonto(resumen.pendiente)}
            </p>
            <p className="m-0 text-[15px] text-secundario">
              {resumen.pendientes === 0
                ? 'Nadie te debe plata.'
                : `${resumen.pendientes} ${resumen.pendientes === 1 ? 'préstamo' : 'préstamos'} sin pagar`}
              {resumen.vencidos > 0 && (
                <span className="font-medium text-alerta">
                  {' · '}
                  {resumen.vencidos} {resumen.vencidos === 1 ? 'vencido' : 'vencidos'}
                </span>
              )}
            </p>
          </section>

          {hayPrestamos ? (
            <>
              <ListaPrestamos titulo="Por cobrar" prestamos={pendientes} onSeleccionar={(p) => setSeleccionadoId(p.id)} />
              <ListaPrestamos titulo="Pagados" prestamos={pagados} onSeleccionar={(p) => setSeleccionadoId(p.id)} />
            </>
          ) : (
            <PrestamosVacio onAgregar={() => setFormulario({ tipo: 'nuevo' })} />
          )}

          <div className="mt-8">
            <AvisosPrestamos />
          </div>
        </div>
      )}

      <Fab
        className="fab-sobre-pestanas fixed right-4 z-20 size-14"
        icon={<IconoMas className="size-7" />}
        onClick={() => setFormulario({ tipo: 'nuevo' })}
        aria-label="Nuevo préstamo"
      />

      <DetallePrestamoSheet
        abierto={seleccionado !== null}
        prestamo={seleccionado}
        onCerrar={() => setSeleccionadoId(null)}
        onAbonar={() => setFormulario({ tipo: 'abono' })}
        onEditar={() => setFormulario({ tipo: 'editar' })}
        onEliminar={async () => {
          if (!seleccionado) return;
          await eliminarPrestamo(seleccionado.id);
          setSeleccionadoId(null);
        }}
        onEliminarAbono={(abono) => eliminarMovimiento(abono.id)}
      />

      <EditarPrestamoSheet
        abierto={formulario?.tipo === 'nuevo' || formulario?.tipo === 'editar'}
        prestamo={formulario?.tipo === 'editar' ? seleccionado : null}
        onCerrar={() => setFormulario(null)}
        onGuardar={async (datos) => {
          if (formulario?.tipo === 'editar' && seleccionado) await actualizarPrestamo(seleccionado.id, datos);
          else await crearPrestamo(datos);
        }}
      />

      <AbonoSheet
        abierto={formulario?.tipo === 'abono'}
        prestamo={seleccionado}
        onCerrar={() => setFormulario(null)}
        onGuardar={async (monto) => {
          if (seleccionado) await registrarAbono(seleccionado, monto);
        }}
      />
    </Page>
  );
}
