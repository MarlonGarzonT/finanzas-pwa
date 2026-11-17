import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import * as db from '../db';
import { edadCache, FRESCURA_MS, guardarTextoCache, marcarCacheAlDia, leerCache, leerTextoCache, serializar } from './cacheLocal';
import { conMovimientos } from '../utils/ordenMovimientos';
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

  // Último texto guardado/recibido: sirve para no volver a pintar (ni a
  // escribir) cuando el servidor devuelve exactamente lo que ya se veía.
  const textoVigente = useRef<string | null>(null);

  const cargarTodo = useCallback(async (forzar = false) => {
    if (!userId) return;
    // Con copia local la app se muestra ya y la actualización va por detrás,
    // sin spinner; sin copia (primera vez) se espera a los datos.
    const copia = leerCache(userId);
    if (copia) {
      textoVigente.current = leerTextoCache(userId);
      setCategorias(copia.categorias);
      setTransacciones(copia.transacciones);
      setGastosAnuales(copia.gastosAnuales);
      setPrestamos(copia.prestamos);
      setCargando(false);
      // Copia de hace instantes: no hay nada nuevo que pedir.
      if (!forzar && edadCache(userId) < FRESCURA_MS) return;
    } else {
      setCargando(true);
    }
    try {
      const [cats, trans, anuales, prest] = await Promise.all([
        db.obtenerCategorias(userId),
        db.obtenerTransacciones(),
        db.obtenerGastosAnuales(),
        db.obtenerPrestamos(),
      ]);
      const texto = serializar({ categorias: cats, transacciones: trans, gastosAnuales: anuales, prestamos: prest });
      if (texto !== textoVigente.current) {
        textoVigente.current = texto;
        setCategorias(cats);
        setTransacciones(trans);
        setGastosAnuales(anuales);
        setPrestamos(prest);
        guardarTextoCache(userId, texto);
      } else {
        marcarCacheAlDia(userId);
      }
    } catch (error) {
      // Sin red pero con copia: se sigue con lo guardado. Sin copia, el
      // error llega a quien lo muestre, como antes.
      if (!copia) throw error;
    } finally {
      setCargando(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) cargarTodo();
  }, [userId, cargarTodo]);

  // Al volver a la app después de un rato (el usuario también la usa desde
  // otro equipo) se actualiza en segundo plano; con la copia reciente no se pide nada.
  useEffect(() => {
    if (!userId) return;
    const alVolver = () => {
      if (document.visibilityState === 'visible' && edadCache(userId) >= FRESCURA_MS * 2.5) void cargarTodo(true);
    };
    document.addEventListener('visibilitychange', alVolver);
    return () => document.removeEventListener('visibilitychange', alVolver);
  }, [userId, cargarTodo]);

  // Cada cambio (crear, editar, borrar) actualiza la copia local, con una
  // pausa para agrupar varios cambios seguidos en una sola escritura.
  useEffect(() => {
    if (!userId || cargando) return;
    const id = window.setTimeout(() => {
      const texto = serializar({ categorias, transacciones, gastosAnuales, prestamos });
      if (texto === textoVigente.current) return;
      textoVigente.current = texto;
      guardarTextoCache(userId, texto);
    }, 800);
    return () => window.clearTimeout(id);
  }, [userId, cargando, categorias, transacciones, gastosAnuales, prestamos]);

  async function crearMovimiento(datos: NuevaTransaccion, fecha: Date) {
    if (!userId) return;
    const nueva = await db.crearTransaccion(userId, datos, fecha);
    setTransacciones((prev) => conMovimientos(prev, [nueva]));
  }

  async function actualizarMovimiento(id: string, datos: Partial<NuevaTransaccion>, fecha: Date) {
    const actualizada = await db.actualizarTransaccion(id, datos, fecha);
    setTransacciones((prev) => conMovimientos(prev, [actualizada]));
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
    setTransacciones((prev) => conMovimientos(prev, [salida]));
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
    setTransacciones((prev) => conMovimientos(prev, [abono]));
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
