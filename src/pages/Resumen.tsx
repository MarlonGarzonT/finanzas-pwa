import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { BalanceCard } from '../components/BalanceCard';
import { GestionCategorias } from '../components/GestionCategorias';
import { GraficoGastos } from '../components/GraficoGastos';
import { NuevoMovimientoSheet } from '../components/NuevoMovimientoSheet';
import { SelectorPagina } from '../components/SelectorPagina';
import { Spinner } from '../components/Spinner';
import { UltimoMovimiento } from '../components/UltimoMovimiento';
import { useFinanzas } from '../data/FinanzasContext';
import type { Tipo, Transaccion } from '../types';
import './Resumen.css';

export function Resumen() {
  const {
    transacciones,
    categorias,
    cargando,
    crearMovimiento,
    actualizarMovimiento,
    eliminarMovimiento,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria,
  } = useFinanzas();
  const { cerrarSesion } = useAuth();
  const [sheetAbierto, setSheetAbierto] = useState(false);
  const [editando, setEditando] = useState<Transaccion | null>(null);
  const [categoriasAbierto, setCategoriasAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [filtroGrafico, setFiltroGrafico] = useState<Tipo>('egreso');

  const categoriaPorId = useMemo(() => {
    const mapa = new Map(categorias.map((c) => [c.id, c]));
    return (id: string) => mapa.get(id);
  }, [categorias]);

  const disponible = useMemo(
    () => transacciones.reduce((acc, t) => acc + (t.tipo === 'ingreso' ? t.monto : -t.monto), 0),
    [transacciones]
  );

  const { totalIngresos, totalEgresos } = useMemo(() => {
    let ingresos = 0;
    let egresos = 0;
    for (const t of transacciones) {
      if (t.tipo === 'ingreso') ingresos += t.monto;
      else egresos += t.monto;
    }
    return { totalIngresos: ingresos, totalEgresos: egresos };
  }, [transacciones]);

  const transaccionesDelMes = useMemo(() => {
    const ahora = new Date();
    const claveMesActual = `${ahora.getFullYear()}-${ahora.getMonth()}`;
    return transacciones.filter((t) => {
      const fecha = new Date(t.fecha);
      return `${fecha.getFullYear()}-${fecha.getMonth()}` === claveMesActual;
    });
  }, [transacciones]);

  const datosGastos = useMemo(() => {
    const totales = new Map<string, { categoria: string; emoji: string; monto: number }>();
    for (const t of transaccionesDelMes) {
      if (t.tipo !== filtroGrafico) continue;
      const cat = categoriaPorId(t.categoriaId);
      const existente = totales.get(t.categoriaId);
      if (existente) {
        existente.monto += t.monto;
      } else {
        totales.set(t.categoriaId, { categoria: cat?.nombre ?? 'Otros', emoji: cat?.emoji ?? '🏷️', monto: t.monto });
      }
    }
    return Array.from(totales.values())
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 6);
  }, [transaccionesDelMes, categoriaPorId, filtroGrafico]);

  const ultimoMovimiento = transacciones[0] ?? null;

  function cerrarSheet() {
    setSheetAbierto(false);
    setEditando(null);
  }

  async function manejarGuardar(datos: { item: string; categoriaId: string; tipo: 'ingreso' | 'egreso'; monto: number }) {
    setGuardando(true);
    if (editando) {
      await actualizarMovimiento(editando.id, datos);
    } else {
      await crearMovimiento(datos);
    }
    setGuardando(false);
    cerrarSheet();
  }

  async function manejarEliminar() {
    if (!editando) return;
    setGuardando(true);
    await eliminarMovimiento(editando.id);
    setGuardando(false);
    cerrarSheet();
  }

  return (
    <div className="resumen">
      <header className="resumen__header">
        <SelectorPagina />
        <div className="resumen__acciones">
          <button onClick={() => setCategoriasAbierto(true)} aria-label="Gestionar categorías">
            ⚙️
          </button>
          <button onClick={cerrarSesion} aria-label="Cerrar sesión">
            ⎋
          </button>
        </div>
      </header>

      {cargando ? (
        <div className="resumen__cargando">
          <Spinner />
        </div>
      ) : (
        <div className="resumen__contenido">
          <BalanceCard
            disponible={disponible}
            totalIngresos={totalIngresos}
            totalEgresos={totalEgresos}
            filtro={filtroGrafico}
            onFiltroChange={setFiltroGrafico}
          />
          <GraficoGastos
            datos={datosGastos}
            mensajeVacio={
              filtroGrafico === 'egreso'
                ? 'Aún no registras gastos este mes.'
                : 'Aún no registras ingresos este mes.'
            }
          />
          <UltimoMovimiento transaccion={ultimoMovimiento} categoriaPorId={categoriaPorId} onSeleccionar={setEditando} />
        </div>
      )}

      <button className="fab" onClick={() => setSheetAbierto(true)} aria-label="Nuevo movimiento">
        +
      </button>

      <NuevoMovimientoSheet
        abierto={sheetAbierto || editando !== null}
        categorias={categorias}
        transaccion={editando}
        guardando={guardando}
        onCerrar={cerrarSheet}
        onGuardar={manejarGuardar}
        onEliminar={editando ? manejarEliminar : undefined}
        onCrearCategoria={crearCategoria}
      />

      <GestionCategorias
        abierto={categoriasAbierto}
        categorias={categorias}
        onCerrar={() => setCategoriasAbierto(false)}
        onCrear={async (nombre, tipo) => {
          await crearCategoria(nombre, tipo);
        }}
        onActualizar={actualizarCategoria}
        onEliminar={eliminarCategoria}
      />
    </div>
  );
}
