import { Block, BlockTitle, Fab, Navbar, Page } from 'konsta/react';
import { useMemo, useState } from 'react';
import { BalanceCard } from '../components/BalanceCard';
import { Cargando } from '../components/Cargando';
import { GraficoGastos } from '../components/GraficoGastos';
import { IconoMas } from '../components/Iconos';
import { NuevoMovimientoSheet } from '../components/NuevoMovimientoSheet';
import { SelectorMes } from '../components/SelectorMes';
import { UltimosMovimientos } from '../components/UltimosMovimientos';
import { useAbrirMovimiento } from '../components/useAbrirMovimiento';
import { useFinanzas } from '../data/FinanzasContext';
import { useResumenMes } from '../data/useResumenMes';
import type { NuevaTransaccion, Tipo, Transaccion } from '../types';
import { desglosePorCategoria } from '../utils/estadisticasMes';
import { fechaConHora, nombreMes } from '../utils/fechas';

export function Resumen() {
  const {
    categorias,
    cargando,
    crearMovimiento,
    actualizarMovimiento,
    eliminarMovimiento,
    crearCategoria,
  } = useFinanzas();
  const [sheetAbierto, setSheetAbierto] = useState(false);
  const [editando, setEditando] = useState<Transaccion | null>(null);
  const abrirMovimiento = useAbrirMovimiento(setEditando);
  const [filtroGrafico, setFiltroGrafico] = useState<Tipo>('egreso');
  // Cada mes es su propia contabilidad, independiente de los demás: el
  // Disponible arranca en $0 al cambiar de mes, no arrastra el saldo previo.
  const [mesSeleccionado, setMesSeleccionado] = useState(() => new Date());

  const { transaccionesDelMes, categoriaPorId, resumen } = useResumenMes(mesSeleccionado);

  // "En qué se fue" no incluye ahorro ni pago de tarjeta, y "De dónde entró"
  // no incluye préstamos ni devoluciones: no son gasto ni ingreso.
  const datosGrafico = useMemo(
    () =>
      desglosePorCategoria(transaccionesDelMes, categoriaPorId, filtroGrafico)
        .slice(0, 6)
        .map(({ categoriaId, nombre, emoji, monto }) => ({ categoriaId, categoria: nombre, emoji, monto })),
    [transaccionesDelMes, categoriaPorId, filtroGrafico]
  );

  function cerrarSheet() {
    setSheetAbierto(false);
    setEditando(null);
  }

  async function manejarGuardar({ dia, ...datos }: NuevaTransaccion & { dia: string }) {
    // Cada movimiento queda en el día elegido en la hoja (por defecto, uno del
    // mes que se está viendo), con la hora en que se registró.
    const fecha = fechaConHora(dia, editando ? new Date(editando.fecha) : new Date());
    if (editando) await actualizarMovimiento(editando.id, datos, fecha);
    else await crearMovimiento(datos, fecha);
    cerrarSheet();
  }

  async function manejarEliminar() {
    if (!editando) return;
    await eliminarMovimiento(editando.id);
    cerrarSheet();
  }

  const mes = nombreMes(mesSeleccionado);

  return (
    <Page className="pagina-con-fab">
      <Navbar centerTitle title="Resumen" />

      {cargando ? (
        <Cargando />
      ) : (
        <div className="aparecer-suave">
          <SelectorMes mes={mesSeleccionado} onCambiar={setMesSeleccionado} />
          <BalanceCard
            disponible={resumen.disponible}
            totalIngresos={resumen.ingresos}
            totalEgresos={resumen.gastos}
            ahorro={resumen.ahorro}
            prestado={resumen.prestamosDados}
            devuelto={resumen.prestamosCobrados}
            filtro={filtroGrafico}
            onFiltroChange={setFiltroGrafico}
          />

          <BlockTitle>{filtroGrafico === 'egreso' ? 'En qué se fue' : 'De dónde entró'}</BlockTitle>
          <Block strong inset className="rounded-3xl">
            <GraficoGastos
              key={filtroGrafico}
              datos={datosGrafico}
              mensajeVacio={
                filtroGrafico === 'egreso' ? `Aún no registras gastos en ${mes}.` : `Aún no registras ingresos en ${mes}.`
              }
            />
          </Block>

          <UltimosMovimientos
            transacciones={transaccionesDelMes}
            categoriaPorId={categoriaPorId}
            onSeleccionar={abrirMovimiento}
            mensajeVacio={`Aún no registras movimientos en ${mes}. Toca + para agregar el primero.`}
          />
        </div>
      )}

      <Fab
        className="fab-sobre-pestanas fixed right-4 z-20 size-14"
        icon={<IconoMas className="size-7" />}
        onClick={() => setSheetAbierto(true)}
        aria-label="Nuevo movimiento"
      />

      <NuevoMovimientoSheet
        abierto={sheetAbierto || editando !== null}
        categorias={categorias}
        transaccion={editando}
        mesSeleccionado={mesSeleccionado}
        onCerrar={cerrarSheet}
        onGuardar={manejarGuardar}
        onEliminar={editando ? manejarEliminar : undefined}
        onCrearCategoria={crearCategoria}
      />
    </Page>
  );
}
