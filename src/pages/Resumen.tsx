import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { BalanceCard } from '../components/BalanceCard';
import { GestionCategorias } from '../components/GestionCategorias';
import { GraficoCategorias } from '../components/GraficoCategorias';
import { GraficoMensual } from '../components/GraficoMensual';
import { NuevoMovimientoSheet } from '../components/NuevoMovimientoSheet';
import { useFinanzas } from '../data/FinanzasContext';
import './Resumen.css';

export function Resumen() {
  const { transacciones, categorias, cargando, crearMovimiento, crearCategoria, eliminarCategoria } = useFinanzas();
  const { cerrarSesion } = useAuth();
  const [sheetAbierto, setSheetAbierto] = useState(false);
  const [categoriasAbierto, setCategoriasAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const nombrePorId = useMemo(() => {
    const mapa = new Map(categorias.map((c) => [c.id, c.nombre]));
    return (id: string) => mapa.get(id) ?? 'Otros';
  }, [categorias]);

  const disponible = useMemo(
    () =>
      transacciones.reduce((acc, t) => acc + (t.tipo === 'ingreso' ? t.monto : -t.monto), 0),
    [transacciones]
  );

  const datosCategorias = useMemo(() => {
    const ahora = new Date();
    const claveMesActual = `${ahora.getFullYear()}-${ahora.getMonth()}`;
    const totales = new Map<string, number>();
    for (const t of transacciones) {
      if (t.tipo !== 'egreso') continue;
      const fecha = new Date(t.fecha);
      const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
      if (clave !== claveMesActual) continue;
      const nombre = nombrePorId(t.categoriaId);
      totales.set(nombre, (totales.get(nombre) ?? 0) + t.monto);
    }
    return Array.from(totales, ([categoria, total]) => ({ categoria, total }));
  }, [transacciones, nombrePorId]);

  const datosMensuales = useMemo(() => {
    const ahora = new Date();
    const meses: { clave: string; mes: string; ingresos: number; egresos: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      meses.push({
        clave: `${d.getFullYear()}-${d.getMonth()}`,
        mes: d.toLocaleDateString('es-CO', { month: 'short' }),
        ingresos: 0,
        egresos: 0,
      });
    }
    const porClave = new Map(meses.map((m) => [m.clave, m]));
    for (const t of transacciones) {
      const fecha = new Date(t.fecha);
      const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
      const fila = porClave.get(clave);
      if (!fila) continue;
      if (t.tipo === 'ingreso') fila.ingresos += t.monto;
      else fila.egresos += t.monto;
    }
    return meses;
  }, [transacciones]);

  async function manejarGuardar(datos: { item: string; categoriaId: string; tipo: 'ingreso' | 'egreso'; monto: number }) {
    setGuardando(true);
    await crearMovimiento(datos);
    setGuardando(false);
    setSheetAbierto(false);
  }

  return (
    <div className="resumen">
      <header className="resumen__header">
        <h1>Resumen</h1>
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
        <p className="resumen__cargando">Cargando…</p>
      ) : (
        <div className="resumen__contenido">
          <BalanceCard disponible={disponible} />
          <GraficoMensual datos={datosMensuales} />
          <GraficoCategorias datos={datosCategorias} />
        </div>
      )}

      <button className="fab" onClick={() => setSheetAbierto(true)} aria-label="Nuevo movimiento">
        +
      </button>

      <NuevoMovimientoSheet
        abierto={sheetAbierto}
        categorias={categorias}
        guardando={guardando}
        onCerrar={() => setSheetAbierto(false)}
        onGuardar={manejarGuardar}
        onCrearCategoria={crearCategoria}
      />

      <GestionCategorias
        abierto={categoriasAbierto}
        categorias={categorias}
        onCerrar={() => setCategoriasAbierto(false)}
        onCrear={async (nombre) => {
          await crearCategoria(nombre);
        }}
        onEliminar={eliminarCategoria}
      />
    </div>
  );
}
