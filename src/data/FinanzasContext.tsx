import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import * as db from '../db';
import type { CambiosCategoria, Categoria, NuevaTransaccion, Tipo, Transaccion } from '../types';

interface FinanzasContextValue {
  transacciones: Transaccion[];
  categorias: Categoria[];
  cargando: boolean;
  crearMovimiento: (datos: NuevaTransaccion) => Promise<void>;
  actualizarMovimiento: (id: string, datos: Partial<NuevaTransaccion>) => Promise<void>;
  eliminarMovimiento: (id: string) => Promise<void>;
  crearCategoria: (nombre: string, tipo: Tipo) => Promise<Categoria>;
  actualizarCategoria: (id: string, cambios: CambiosCategoria) => Promise<void>;
  eliminarCategoria: (id: string) => Promise<void>;
}

const FinanzasContext = createContext<FinanzasContextValue | undefined>(undefined);

export function FinanzasProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarTodo = useCallback(async () => {
    if (!userId) return;
    setCargando(true);
    const [cats, trans] = await Promise.all([db.obtenerCategorias(userId), db.obtenerTransacciones()]);
    setCategorias(cats);
    setTransacciones(trans);
    setCargando(false);
  }, [userId]);

  useEffect(() => {
    if (userId) cargarTodo();
  }, [userId, cargarTodo]);

  async function crearMovimiento(datos: NuevaTransaccion) {
    if (!userId) return;
    const nueva = await db.crearTransaccion(userId, datos);
    setTransacciones((prev) => [nueva, ...prev]);
  }

  async function actualizarMovimiento(id: string, datos: Partial<NuevaTransaccion>) {
    const actualizada = await db.actualizarTransaccion(id, datos);
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

  return (
    <FinanzasContext.Provider
      value={{
        transacciones,
        categorias,
        cargando,
        crearMovimiento,
        actualizarMovimiento,
        eliminarMovimiento,
        crearCategoria,
        actualizarCategoria,
        eliminarCategoria,
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
