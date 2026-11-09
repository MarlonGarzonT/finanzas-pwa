import { useMemo } from 'react';
import type { Categoria, Transaccion } from '../types';
import { resumirMes, type ResumenContable } from '../utils/contabilidad';
import { claveMes, claveMesDeFecha } from '../utils/fechas';
import { useFinanzas } from './FinanzasContext';

export interface ResumenDelMes {
  transaccionesDelMes: Transaccion[];
  categoriaPorId: (id: string) => Categoria | undefined;
  resumen: ResumenContable;
}

// Movimientos del mes elegido y sus totales por naturaleza (ahorro y pago de
// tarjeta aparte de los gastos). Resumen y Reportes parten de aquí.
export function useResumenMes(mesSeleccionado: Date): ResumenDelMes {
  const { transacciones, categorias } = useFinanzas();

  const categoriaPorId = useMemo(() => {
    const mapa = new Map(categorias.map((c) => [c.id, c]));
    return (id: string) => mapa.get(id);
  }, [categorias]);

  const transaccionesDelMes = useMemo(() => {
    const clave = claveMesDeFecha(mesSeleccionado);
    return transacciones.filter((t) => claveMes(t.fecha) === clave);
  }, [transacciones, mesSeleccionado]);

  const resumen = useMemo(() => resumirMes(transaccionesDelMes, categoriaPorId), [transaccionesDelMes, categoriaPorId]);

  return { transaccionesDelMes, categoriaPorId, resumen };
}
