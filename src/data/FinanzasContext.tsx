import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import * as db from '../db';
import type {
  CambiosCategoria,
  Categoria,
  GastoAnual,
  NuevaTransaccion,
  NuevoGastoAnual,
  NuevoPrestamo,
  Prestamo,
  Tipo,
  Transaccion,
} from '../types';

interface FinanzasContextValue {
  transacciones: Transaccion[];
  categorias: Categoria[];
  gastosAnuales: GastoAnual[];
  prestamos: Prestamo[];
  cargando: boolean;
  crearMovimiento: (datos: NuevaTransaccion, fecha: Date) => Promise<void>;
  actualizarMovimiento: (id: string, datos: Partial<NuevaTransaccion>, fecha: Date) => Promise<void>;
  eliminarMovimiento: (id: string) => Promise<void>;
  crearCategoria: (nombre: string, tipo: Tipo) => Promise<Categoria>;
  actualizarCategoria: (id: string, cambios: CambiosCategoria) => Promise<void>;
  eliminarCategoria: (id: string) => Promise<void>;
  crearGastoAnual: (nuevo: NuevoGastoAnual) => Promise<void>;
  actualizarGastoAnual: (id: string, cambios: Partial<NuevoGastoAnual>) => Promise<void>;
  eliminarGastoAnual: (id: string) => Promise<void>;
  crearPrestamo: (nuevo: NuevoPrestamo) => Promise<void>;
  actualizarPrestamo: (id: string, cambios: Pick<NuevoPrestamo, 'persona' | 'fechaDevolucion' | 'nota'>) => Promise<void>;
  eliminarPrestamo: (id: string) => Promise<void>;
  registrarAbono: (prestamo: Prestamo, monto: number) => Promise<void>;
}

const FinanzasContext = createContext<FinanzasContextValue | undefined>(undefined);

export function FinanzasProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [gastosAnuales, setGastosAnuales] = useState<GastoAnual[]>([]);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarTodo = useCallback(async () => {
    if (!userId) return;
    setCargando(true);
    try {
      const [cats, trans, anuales, prest] = await Promise.all([
        db.obtenerCategorias(userId),
        db.obtenerTransacciones(),
        db.obtenerGastosAnuales(),
        db.obtenerPrestamos(),
      ]);
      setCategorias(cats);
      setTransacciones(trans);
      setGastosAnuales(anuales);
      setPrestamos(prest);
    } finally {
      setCargando(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) cargarTodo();
  }, [userId, cargarTodo]);

  async function crearMovimiento(datos: NuevaTransaccion, fecha: Date) {
    if (!userId) return;
    const nueva = await db.crearTransaccion(userId, datos, fecha);
    setTransacciones((prev) => [nueva, ...prev]);
  }

  async function actualizarMovimiento(id: string, datos: Partial<NuevaTransaccion>, fecha: Date) {
    const actualizada = await db.actualizarTransaccion(id, datos, fecha);
    setTransacciones((prev) => prev.map((t) => (t.id === id ? actualizada : t)));
  }

  async function eliminarMovimiento(id: string) {
    await db.eliminarTransaccion(id);
    setTransacciones((prev) => prev.filter((t) => t.id !== id));
  }

  async function crearCategoria(nombre: string, tipo: Tipo) {
    if (!userId) throw new Error('Sin sesión');
    const nueva = await db.crearCategoria(userId, nombre, tipo);
    setCategorias((prev) => [...prev, nueva].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return nueva;
  }

  async function actualizarCategoria(id: string, cambios: CambiosCategoria) {
    const actualizada = await db.actualizarCategoria(id, cambios);
    setCategorias((prev) => prev.map((c) => (c.id === id ? actualizada : c)));
  }

  async function eliminarCategoria(id: string) {
    await db.eliminarCategoria(id);
    setCategorias((prev) => prev.filter((c) => c.id !== id));
  }

  async function crearGastoAnual(nuevo: NuevoGastoAnual) {
    const creado = await db.crearGastoAnual(nuevo);
    setGastosAnuales((prev) => [...prev, creado].sort((a, b) => a.mesVencimiento - b.mesVencimiento));
  }

  async function actualizarGastoAnual(id: string, cambios: Partial<NuevoGastoAnual>) {
    const actualizado = await db.actualizarGastoAnual(id, cambios);
    setGastosAnuales((prev) =>
      prev.map((g) => (g.id === id ? actualizado : g)).sort((a, b) => a.mesVencimiento - b.mesVencimiento)
    );
  }

  async function eliminarGastoAnual(id: string) {
    await db.eliminarGastoAnual(id);
    setGastosAnuales((prev) => prev.filter((g) => g.id !== id));
  }

  async function crearPrestamo(nuevo: NuevoPrestamo) {
    const { prestamo, salida } = await db.crearPrestamo(nuevo);
    setPrestamos((prev) => [...prev, prestamo]);
    setTransacciones((prev) => [salida, ...prev]);
  }

  async function actualizarPrestamo(id: string, cambios: Pick<NuevoPrestamo, 'persona' | 'fechaDevolucion' | 'nota'>) {
    const actualizado = await db.actualizarPrestamo(id, cambios);
    setPrestamos((prev) => prev.map((p) => (p.id === id ? actualizado : p)));
    setTransacciones((prev) =>
      prev.map((t) => (t.prestamoId === id && t.tipo === 'egreso' ? { ...t, item: `Préstamo a ${actualizado.persona}` } : t))
    );
  }

  // La base borra en cascada la salida y los abonos; aquí se refleja igual.
  async function eliminarPrestamo(id: string) {
    await db.eliminarPrestamo(id);
    setPrestamos((prev) => prev.filter((p) => p.id !== id));
    setTransacciones((prev) => prev.filter((t) => t.prestamoId !== id));
  }

  async function registrarAbono(prestamo: Prestamo, monto: number) {
    const abono = await db.registrarAbono(prestamo, monto);
    setTransacciones((prev) => [abono, ...prev]);
  }

  return (
    <FinanzasContext.Provider
      value={{
        transacciones,
        categorias,
        gastosAnuales,
        prestamos,
        cargando,
        crearMovimiento,
        actualizarMovimiento,
        eliminarMovimiento,
        crearCategoria,
        actualizarCategoria,
        eliminarCategoria,
        crearGastoAnual,
        actualizarGastoAnual,
        eliminarGastoAnual,
        crearPrestamo,
        actualizarPrestamo,
        eliminarPrestamo,
        registrarAbono,
      }}
    >
      {children}
    </FinanzasContext.Provider>
  );
}

export function useFinanzas() {
  const ctx = useContext(FinanzasContext);
  if (!ctx) throw new Error('useFinanzas debe usarse dentro de FinanzasProvider');
  return ctx;
}
