import { useMemo } from 'react';
import { estadosPrestamos, resumirPrestamos, type EstadoPrestamo, type ResumenPrestamos } from '../utils/prestamos';
import { useFinanzas } from './FinanzasContext';

export interface PrestamosOrdenados {
  // Vencidos primero (el más atrasado arriba) y después por fecha de pago.
  pendientes: EstadoPrestamo[];
  // El último que te pagaron arriba.
  pagados: EstadoPrestamo[];
  resumen: ResumenPrestamos;
  porId: (id: string) => EstadoPrestamo | undefined;
}

export function usePrestamos(): PrestamosOrdenados {
  const { prestamos, transacciones } = useFinanzas();

  return useMemo(() => {
    const estados = estadosPrestamos(prestamos, transacciones);
    const pendientes = estados
      .filter((e) => !e.pagado)
      .sort((a, b) => Number(b.vencido) - Number(a.vencido) || a.fechaDevolucion.localeCompare(b.fechaDevolucion));
    const pagados = estados
      .filter((e) => e.pagado)
      .sort((a, b) => (b.fechaPago ?? '').localeCompare(a.fechaPago ?? ''));
    const mapa = new Map(estados.map((e) => [e.id, e]));
    return { pendientes, pagados, resumen: resumirPrestamos(estados), porId: (id: string) => mapa.get(id) };
  }, [prestamos, transacciones]);
}
