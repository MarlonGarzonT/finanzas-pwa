import { useMemo } from 'react';
import type { Categoria } from '../types';
import { resumirMes, type ResumenContable } from '../utils/contabilidad';
import { claveMes, claveMesDeFecha } from '../utils/fechas';
import { mayoresGastos, repartoDelMes, serieMensual, tablaPorCategoria, type GastoGrande, type PuntoMensual, type Reparto, type TablaCategorias } from '../utils/tablero';
import { useCreditos } from './useCreditos';
import { useFinanzas } from './FinanzasContext';
import { usePrestamos } from './usePrestamos';

export interface DatosTablero {
  cargando: boolean;
  hayMovimientos: boolean;
  resumenDelMes: ResumenContable;
  // Ahorro apartado desde que se lleva la cuenta.
  ahorroTotal: number;
  ingresos: TablaCategorias;
  gastos: TablaCategorias;
  reparto: Reparto;
  mayoresGastos: GastoGrande[];
  serie: PuntoMensual[];
  // Lo que te deben y lo que debes (préstamos y créditos).
  prestamos: { pendiente: number; personas: number; vencidos: number };
  creditos: { porPagar: number; activos: number; vencidos: number };
}

// Todo lo que muestra el tablero para el mes elegido, calculado una sola vez
// por cambio de mes o de movimientos. Mismas reglas de contabilidad que el
// Resumen y Reportes: nada se recalcula distinto en el escritorio.
export function useTablero(mes: Date): DatosTablero {
  const { transacciones, categorias, cargando } = useFinanzas();
  const { resumen: resumenPrestamos } = usePrestamos();
  const { resumen: resumenCreditos } = useCreditos();

  const categoriaPorId = useMemo(() => {
    const mapa = new Map<string, Categoria>(categorias.map((c) => [c.id, c]));
    return (id: string) => mapa.get(id);
  }, [categorias]);

  return useMemo(() => {
    const clave = claveMesDeFecha(mes);
    const delMes = transacciones.filter((t) => claveMes(t.fecha) === clave);
    const resumenDelMes = resumirMes(delMes, categoriaPorId);
    return {
      cargando,
      hayMovimientos: transacciones.length > 0,
      resumenDelMes,
      ahorroTotal: resumirMes(transacciones, categoriaPorId).ahorro,
      ingresos: tablaPorCategoria(transacciones, categoriaPorId, mes, 'ingreso'),
      gastos: tablaPorCategoria(transacciones, categoriaPorId, mes, 'egreso'),
      reparto: repartoDelMes(resumenDelMes.ingresos, resumenDelMes.gastos),
      mayoresGastos: mayoresGastos(delMes, categoriaPorId, 5),
      serie: serieMensual(transacciones, categoriaPorId, mes, 12),
      prestamos: { pendiente: resumenPrestamos.pendiente, personas: resumenPrestamos.pendientes, vencidos: resumenPrestamos.vencidos },
      creditos: { porPagar: resumenCreditos.porPagar, activos: resumenCreditos.activos, vencidos: resumenCreditos.vencidos },
    };
  }, [transacciones, categoriaPorId, mes, cargando, resumenPrestamos, resumenCreditos]);
}
