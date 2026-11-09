import { Block, BlockTitle, Fab, Navbar, Page } from 'konsta/react';
import { useMemo, useState } from 'react';
import { BalanceCard } from '../components/BalanceCard';
import { Cargando } from '../components/Cargando';
import { GraficoGastos } from '../components/GraficoGastos';
import { IconoMas } from '../components/Iconos';
import { NuevoMovimientoSheet } from '../components/NuevoMovimientoSheet';
import { SelectorMes } from '../components/SelectorMes';
import { UltimosMovimientos } from '../components/UltimosMovimientos';
import { useFinanzas } from '../data/FinanzasContext';
import type { NuevaTransaccion, Tipo, Transaccion } from '../types';
import { claveMes, claveMesDeFecha, fechaEnMesSeleccionado, nombreMes } from '../utils/fechas';

export function Resumen() {
  const {
    transacciones,
    categorias,
    cargando,
    crearMovimiento,
    actualizarMovimiento,
    eliminarMovimiento,
    crearCategoria,
  } = useFinanzas();
  const [sheetAbierto, setSheetAbierto] = useState(false);
  const [editando, setEditando] = useState<Transaccion | null>(null);
  const [filtroGrafico, setFiltroGrafico] = useState<Tipo>('egreso');
  // Cada mes es su propia contabilidad, independiente de los demás: el
  // Disponible arranca en $0 al cambiar de mes, no arrastra el saldo previo.
  const [mesSeleccionado, setMesSeleccionado] = useState(() => new Date());

  const categoriaPorId = useMemo(() => {
    const mapa = new Map(categorias.map((c) => [c.id, c]));
    return (id: string) => mapa.get(id);
  }, [categorias]);

  const transaccionesDelMes = useMemo(() => {
    const claveSeleccionada = claveMesDeFecha(mesSeleccionado);
    return transacciones.filter((t) => claveMes(t.fecha) === claveSeleccionada);
  }, [transacciones, mesSeleccionado]);

  const { totalIngresos, totalEgresos } = useMemo(() => {
    let ingresos = 0;
    let egresos = 0;
    for (const t of transaccionesDelMes) {
      if (t.tipo === 'ingreso') ingresos += t.monto;
      else egresos += t.monto;
    }
    return { totalIngresos: ingresos, totalEgresos: egresos };
  }, [transaccionesDelMes]);

  const datosGrafico = useMemo(() => {
    const totales = new Map<string, { categoriaId: string; categoria: string; emoji: string; monto: number }>();
    for (const t of transaccionesDelMes) {
      if (t.tipo !== filtroGrafico) continue;
      const cat = categoriaPorId(t.categoriaId);
      const existente = totales.get(t.categoriaId);
      if (existente) {
        existente.monto += t.monto;
      } else {
        totales.set(t.categoriaId, {
          categoriaId: t.categoriaId,
          categoria: cat?.nombre ?? 'Otros',
          emoji: cat?.emoji ?? '🏷️',
          monto: t.monto,
        });
      }
    }
    return Array.from(totales.values())
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 6);
  }, [transaccionesDelMes, categoriaPorId, filtroGrafico]);

  function cerrarSheet() {
    setSheetAbierto(false);
    setEditando(null);
  }

  async function manejarGuardar({ mes, ...datos }: NuevaTransaccion & { mes: Date }) {
    // Cada movimiento queda en el mes elegido en la hoja (por defecto, el mes
    // que se está viendo), no necesariamente en el mes real de hoy.
    const fecha = fechaEnMesSeleccionado(mes, editando ? new Date(editando.fecha) : new Date());
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
            disponible={totalIngresos - totalEgresos}
            totalIngresos={totalIngresos}
            totalEgresos={totalEgresos}
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
            onSeleccionar={setEditando}
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
